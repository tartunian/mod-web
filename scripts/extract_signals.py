#!/usr/bin/env python3
import argparse
import datetime as dt
import importlib.util
import json
import os
import subprocess
import sys
from typing import Dict, List, Optional, Tuple

import librosa
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfiltfilt


INSTRUMENT_PRESETS: Dict[str, Dict[str, object]] = {
    "keys": {
        "aliases": ["keys", "keyboard", "piano", "synth"],
        "bands": [(60, 250, 0.5), (250, 2000, 0.9), (2000, 7000, 0.5)],
        "mix": (0.6, 0.1, 0.3),  # harmonic, onset, rms
    },
    "guitar": {
        "aliases": ["guitar", "guitars"],
        "bands": [(90, 350, 0.5), (350, 3000, 1.0), (3000, 6000, 0.4)],
        "mix": (0.65, 0.2, 0.15),
    },
    "brass": {
        "aliases": ["brass", "horn", "horns", "trumpet", "trombone", "sax"],
        "bands": [(120, 600, 0.9), (600, 2200, 1.0), (2200, 4500, 0.4)],
        "mix": (0.45, 0.35, 0.2),
    },
}


def normalize(x: np.ndarray, eps: float = 1e-8) -> np.ndarray:
    x = np.asarray(x, dtype=np.float32)
    mn = float(np.min(x))
    mx = float(np.max(x))
    if mx - mn < eps:
        return np.zeros_like(x)
    return (x - mn) / (mx - mn)


def ema(x: np.ndarray, alpha: float) -> np.ndarray:
    y = np.zeros_like(x, dtype=np.float32)
    if len(x) == 0:
        return y
    y[0] = x[0]
    for i in range(1, len(x)):
        y[i] = y[i - 1] + alpha * (x[i] - y[i - 1])
    return y


def to_len(x: np.ndarray, target_len: int) -> np.ndarray:
    if len(x) == target_len:
        return np.asarray(x, dtype=np.float32)
    if len(x) == 0:
        return np.zeros(target_len, dtype=np.float32)
    xp = np.linspace(0.0, 1.0, num=len(x), dtype=np.float32)
    fp = np.asarray(x, dtype=np.float32)
    xnew = np.linspace(0.0, 1.0, num=target_len, dtype=np.float32)
    return np.interp(xnew, xp, fp).astype(np.float32)


def band_power(power_spec: np.ndarray, freqs: np.ndarray, f0: float, f1: float) -> np.ndarray:
    mask = (freqs >= f0) & (freqs < f1)
    if not np.any(mask):
        return np.zeros(power_spec.shape[1], dtype=np.float32)
    return np.mean(power_spec[mask, :], axis=0).astype(np.float32)


def extract_features(y: np.ndarray, sr: int, n_fft: int, hop: int) -> Dict[str, np.ndarray]:
    s = np.abs(librosa.stft(y=y, n_fft=n_fft, hop_length=hop, win_length=n_fft))
    power = (s ** 2) + 1e-10
    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)

    rms = librosa.feature.rms(S=s, frame_length=n_fft, hop_length=hop)[0].astype(np.float32)
    onset = librosa.onset.onset_strength(S=s, sr=sr, hop_length=hop).astype(np.float32)
    centroid = librosa.feature.spectral_centroid(S=s, sr=sr)[0].astype(np.float32)
    rolloff = librosa.feature.spectral_rolloff(S=s, sr=sr, roll_percent=0.85)[0].astype(np.float32)
    zcr = librosa.feature.zero_crossing_rate(y, frame_length=n_fft, hop_length=hop)[0].astype(np.float32)

    h, p = librosa.decompose.hpss(s)
    harmonic_rms = librosa.feature.rms(S=h, frame_length=n_fft, hop_length=hop)[0].astype(np.float32)
    percussive_rms = librosa.feature.rms(S=p, frame_length=n_fft, hop_length=hop)[0].astype(np.float32)

    low = band_power(power, freqs, 40, 250)
    mid = band_power(power, freqs, 250, 4000)
    high = band_power(power, freqs, 4000, 12000)

    low_kick = band_power(power, freqs, 40, 120)
    low_snare = band_power(power, freqs, 140, 260)
    upper_snare = band_power(power, freqs, 1200, 4000)
    hat_band = band_power(power, freqs, 6000, 13000)
    vocal_band = band_power(power, freqs, 300, 3500)

    frame_count = len(rms)
    times = librosa.frames_to_time(np.arange(frame_count), sr=sr, hop_length=hop).astype(np.float32)

    return {
        "times": times,
        "rms": normalize(rms),
        "onset": normalize(onset),
        "centroid": normalize(centroid),
        "rolloff": normalize(rolloff),
        "zcr": normalize(zcr),
        "harmonic": normalize(harmonic_rms),
        "percussive": normalize(percussive_rms),
        "band_low": normalize(low),
        "band_mid": normalize(mid),
        "band_high": normalize(high),
        "low_kick": normalize(low_kick),
        "low_snare": normalize(low_snare),
        "upper_snare": normalize(upper_snare),
        "hat_band": normalize(hat_band),
        "vocal_band": normalize(vocal_band),
    }


def build_proxy_signals(feat: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
    onset = feat["onset"]
    kick = normalize(onset * (0.7 * feat["low_kick"] + 0.3 * feat["band_low"]))
    snare = normalize(onset * (0.5 * feat["low_snare"] + 0.5 * feat["upper_snare"]))
    hat = normalize(onset * feat["hat_band"])
    bass = normalize(ema(feat["band_low"], alpha=0.18))
    vocal = normalize(feat["harmonic"] * (0.65 * feat["vocal_band"] + 0.35 * feat["band_mid"]))

    return {
        "kick": kick,
        "snare": snare,
        "hat": hat,
        "bass": bass,
        "vocal": vocal,
    }


def try_demucs(input_path: str, out_dir: str, model: str, device: str) -> Tuple[bool, str]:
    if importlib.util.find_spec("demucs") is None:
        return False, "Python package 'demucs' is not installed in this environment."

    cmd = [
        sys.executable,
        "-m",
        "demucs.separate",
        "-n",
        model,
        "-d",
        device,
        "--out",
        out_dir,
        input_path,
    ]
    try:
        print(f"Running Demucs model={model} device={device} ...", flush=True)
        # Stream output live so long runs don't look stuck.
        subprocess.run(cmd, check=True)
        return True, "ok"
    except subprocess.CalledProcessError as e:
        details = e.stderr.strip() if e.stderr else str(e)
        return False, f"demucs.separate failed: {details}"
    except Exception as e:
        return False, f"Failed to launch demucs.separate: {e}"


def find_stems(out_dir: str) -> Dict[str, str]:
    wanted = {"drums.wav", "bass.wav", "vocals.wav", "other.wav"}
    found: Dict[str, str] = {}
    for root, _, files in os.walk(out_dir):
        names = set(files)
        if wanted.issubset(names):
            found = {
                "drums": os.path.join(root, "drums.wav"),
                "bass": os.path.join(root, "bass.wav"),
                "vocals": os.path.join(root, "vocals.wav"),
                "other": os.path.join(root, "other.wav"),
            }
            break
    return found


def stem_features(stem_paths: Dict[str, str], sr: int, n_fft: int, hop: int, target_len: int) -> Dict[str, Dict[str, np.ndarray]]:
    out: Dict[str, Dict[str, np.ndarray]] = {}
    for name, path in stem_paths.items():
        y, _ = librosa.load(path, sr=sr, mono=True)
        f = extract_features(y, sr=sr, n_fft=n_fft, hop=hop)
        out[name] = {
            "rms": to_len(f["rms"], target_len),
            "onset": to_len(f["onset"], target_len),
            "centroid": to_len(f["centroid"], target_len),
        }
    return out


def blend_signals(proxy: Dict[str, np.ndarray], stems: Dict[str, Dict[str, np.ndarray]], feat: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
    has_stems = bool(stems)

    if has_stems:
        drums_onset = stems["drums"]["onset"]
        drums_cent = stems["drums"]["centroid"]
        bass_rms = stems["bass"]["rms"]
        vocal_rms = stems["vocals"]["rms"]
        other_rms = stems["other"]["rms"]

        kick = normalize(0.7 * drums_onset + 0.3 * proxy["kick"])
        snare = normalize(0.5 * (drums_onset * (0.3 + 0.7 * drums_cent)) + 0.5 * proxy["snare"])
        hat = normalize(0.3 * drums_onset + 0.7 * proxy["hat"])
        bass = normalize(0.75 * bass_rms + 0.25 * proxy["bass"])
        vocal = normalize(0.7 * vocal_rms + 0.3 * proxy["vocal"])
        melodic = normalize(0.6 * other_rms + 0.4 * feat["harmonic"])
    else:
        kick = proxy["kick"]
        snare = proxy["snare"]
        hat = proxy["hat"]
        bass = proxy["bass"]
        vocal = proxy["vocal"]
        melodic = normalize(0.5 * feat["harmonic"] + 0.5 * feat["band_mid"])

    return {
        "kick": kick,
        "snare": snare,
        "hat": hat,
        "bass": bass,
        "vocal": vocal,
        "melodic": melodic,
    }


def arr(x: np.ndarray, digits: int = 6) -> List[float]:
    return np.round(np.asarray(x, dtype=np.float32), digits).tolist()


def parse_instruments(spec: str) -> List[str]:
    if not spec:
        return []
    requested = [s.strip().lower() for s in spec.split(",") if s.strip()]
    canonical: List[str] = []
    for name in requested:
        mapped = None
        for key, preset in INSTRUMENT_PRESETS.items():
            aliases = preset.get("aliases", [])
            if name == key or name in aliases:
                mapped = key
                break
        if mapped and mapped not in canonical:
            canonical.append(mapped)
    return canonical


def _sos_filter(y: np.ndarray, sr: int, low_hz: float, high_hz: float) -> np.ndarray:
    nyq = sr * 0.5
    low = max(0.0, float(low_hz))
    high = min(float(high_hz), nyq * 0.999)
    if high <= 0:
        return np.zeros_like(y, dtype=np.float32)
    if low <= 0:
        sos = butter(4, high / nyq, btype="lowpass", output="sos")
    elif high >= nyq * 0.999:
        sos = butter(4, low / nyq, btype="highpass", output="sos")
    else:
        sos = butter(4, [low / nyq, high / nyq], btype="bandpass", output="sos")
    return sosfiltfilt(sos, y).astype(np.float32)


def build_custom_instrument_signals(
    y_source: np.ndarray,
    sr: int,
    n_fft: int,
    hop: int,
    target_len: int,
    instruments: List[str],
    stems_out_dir: str,
    write_audio: bool = True,
) -> Tuple[Dict[str, np.ndarray], Dict[str, str]]:
    signals: Dict[str, np.ndarray] = {}
    paths: Dict[str, str] = {}

    if write_audio:
        os.makedirs(stems_out_dir, exist_ok=True)

    for inst in instruments:
        preset = INSTRUMENT_PRESETS.get(inst)
        if not preset:
            continue
        bands = preset["bands"]
        h_w, o_w, r_w = preset["mix"]

        y_inst = np.zeros_like(y_source, dtype=np.float32)
        for low, high, w in bands:
            y_inst += float(w) * _sos_filter(y_source, sr, low, high)

        peak = float(np.max(np.abs(y_inst)))
        if peak > 1e-8:
            y_inst = y_inst / peak

        if write_audio:
            out_path = os.path.join(stems_out_dir, f"{inst}.wav")
            sf.write(out_path, y_inst, sr)
            paths[inst] = out_path

        feat = extract_features(y_inst, sr=sr, n_fft=n_fft, hop=hop)
        lane = normalize(
            float(h_w) * feat["harmonic"]
            + float(o_w) * feat["onset"]
            + float(r_w) * feat["rms"]
        )
        signals[inst] = to_len(lane, target_len)

    return signals, paths


def main() -> None:
    p = argparse.ArgumentParser(description="Extract mono audio control signals for reactive UI.")
    p.add_argument("--input", required=True, help="Path to mono audio file")
    p.add_argument("--output", default="signals/output/signals.json", help="Output JSON path")
    p.add_argument("--sr", type=int, default=22050, help="Target sample rate")
    p.add_argument("--n-fft", type=int, default=2048, help="FFT window size")
    p.add_argument("--hop-length", type=int, default=512, help="Hop length")
    p.add_argument("--run-demucs", action="store_true", help="Run demucs for optional stems")
    p.add_argument("--demucs-out", default="signals/stems", help="Demucs output directory")
    p.add_argument("--demucs-model", default="htdemucs", help="Demucs model name")
    p.add_argument("--demucs-device", default="cpu", choices=["cpu", "cuda", "mps"], help="Demucs device")
    p.add_argument("--instruments", default="", help="Comma-separated custom instruments (e.g. keys,guitar,brass)")
    p.add_argument("--custom-stems-out", default="signals/stems/custom", help="Output folder for custom pseudo-stem WAVs")
    p.add_argument("--no-custom-stem-audio", action="store_true", help="Compute custom lanes but do not write custom stem WAV files")
    args = p.parse_args()

    os.makedirs(os.path.dirname(args.output), exist_ok=True)

    y, sr = librosa.load(args.input, sr=args.sr, mono=True)
    feat = extract_features(y, sr=sr, n_fft=args.n_fft, hop=args.hop_length)
    proxy = build_proxy_signals(feat)

    stems_ok = False
    stem_paths: Dict[str, str] = {}
    stems: Dict[str, Dict[str, np.ndarray]] = {}
    demucs_status = "not requested"
    custom_instruments = parse_instruments(args.instruments)
    custom_signals: Dict[str, np.ndarray] = {}
    custom_stem_paths: Dict[str, str] = {}
    custom_source = "mix"

    if args.run_demucs:
        os.makedirs(args.demucs_out, exist_ok=True)
        stems_ok, demucs_status = try_demucs(args.input, args.demucs_out, args.demucs_model, args.demucs_device)
        if stems_ok:
            stem_paths = find_stems(args.demucs_out)
            if stem_paths:
                stems = stem_features(
                    stem_paths,
                    sr=sr,
                    n_fft=args.n_fft,
                    hop=args.hop_length,
                    target_len=len(feat["times"]),
                )
            else:
                stems_ok = False
                demucs_status = "Demucs ran but no expected stems were found (drums/bass/vocals/other)."

    if not args.run_demucs:
        demucs_status = "not requested"

    if custom_instruments:
        y_custom = y
        if stem_paths.get("other"):
            y_custom, _ = librosa.load(stem_paths["other"], sr=sr, mono=True)
            custom_source = "demucs:other"
        custom_signals, custom_stem_paths = build_custom_instrument_signals(
            y_source=y_custom,
            sr=sr,
            n_fft=args.n_fft,
            hop=args.hop_length,
            target_len=len(feat["times"]),
            instruments=custom_instruments,
            stems_out_dir=args.custom_stems_out,
            write_audio=not args.no_custom_stem_audio,
        )

    blended = blend_signals(proxy, stems, feat)

    payload = {
        "metadata": {
            "generatedAt": dt.datetime.utcnow().isoformat() + "Z",
            "inputFile": os.path.abspath(args.input),
            "sampleRate": sr,
            "nFft": args.n_fft,
            "hopLength": args.hop_length,
            "durationSec": float(len(y) / sr),
            "frames": int(len(feat["times"])),
            "usedDemucs": bool(stems_ok and stem_paths),
            "stemPaths": stem_paths,
            "demucsStatus": demucs_status,
            "customInstruments": custom_instruments,
            "customInstrumentSource": custom_source,
            "customStemPaths": custom_stem_paths,
        },
        "timelineSec": arr(feat["times"]),
        "signals": {
            "global": {
                "rms": arr(feat["rms"]),
                "onset": arr(feat["onset"]),
                "centroid": arr(feat["centroid"]),
                "rolloff": arr(feat["rolloff"]),
                "zcr": arr(feat["zcr"]),
            },
            "bands": {
                "bass": arr(feat["band_low"]),
                "mid": arr(feat["band_mid"]),
                "high": arr(feat["band_high"]),
            },
            "proxies": {k: arr(v) for k, v in proxy.items()},
            "stems": {
                name: {
                    "rms": arr(vals["rms"]),
                    "onset": arr(vals["onset"]),
                    "centroid": arr(vals["centroid"]),
                }
                for name, vals in stems.items()
            },
            "customInstruments": {k: arr(v) for k, v in custom_signals.items()},
            "blended": {k: arr(v) for k, v in blended.items()},
        },
    }

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(payload, f)

    print(f"Wrote: {args.output}")
    print(f"Frames: {payload['metadata']['frames']}")
    print(f"Demucs stems used: {payload['metadata']['usedDemucs']}")
    if args.run_demucs:
        print(f"Demucs status: {payload['metadata']['demucsStatus']}")
    if custom_instruments:
        print(f"Custom instruments: {', '.join(custom_instruments)} (source={custom_source})")


if __name__ == "__main__":
    main()
