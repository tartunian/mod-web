#!/usr/bin/env python3
"""Split a full-length audio file into named tracks from fixed cue points.

Usage:
  python scripts/split_setlist.py --input mod-demolition-live.mp3 --output-dir tracks
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import librosa
import soundfile as sf


CUES = [
    ("0:00", "Red Barron"),
    ("7:36", "The Wind Jammer"),
    ("13:29", "Cantaloupe Island"),
    ("19:35", "Jan Jan"),
    ("25:28", "Stratus"),
]


def parse_mmss(ts: str) -> float:
    m = re.fullmatch(r"(\d+):(\d{2})", ts.strip())
    if not m:
        raise ValueError(f"Invalid timestamp '{ts}' (expected M:SS)")
    minutes, seconds = int(m.group(1)), int(m.group(2))
    return minutes * 60 + seconds


def main() -> None:
    parser = argparse.ArgumentParser(description="Split audio into named tracks from cue points")
    parser.add_argument("--input", required=True, help="Input audio file")
    parser.add_argument("--output-dir", default="tracks", help="Output folder for split tracks")
    args = parser.parse_args()

    in_path = Path(args.input)
    out_dir = Path(args.output_dir)
    if not in_path.exists():
        raise SystemExit(f"Input not found: {in_path}")

    out_dir.mkdir(parents=True, exist_ok=True)

    # Keep native sample rate for clean frame indexing.
    audio, sr = librosa.load(in_path.as_posix(), sr=None, mono=False)
    if audio.ndim == 1:
        total_samples = audio.shape[0]
    else:
        total_samples = audio.shape[1]

    cue_seconds = [parse_mmss(ts) for ts, _ in CUES]
    cue_samples = [min(int(sec * sr), total_samples) for sec in cue_seconds]

    for i, ((_, title), start) in enumerate(zip(CUES, cue_samples), start=1):
        end = cue_samples[i] if i < len(cue_samples) else total_samples
        if end <= start:
            continue

        if audio.ndim == 1:
            segment = audio[start:end]
        else:
            segment = audio[:, start:end].T

        file_name = f"{i:02d} - {title}.wav"
        out_path = out_dir / file_name
        sf.write(out_path.as_posix(), segment, sr, subtype="PCM_16")
        print(f"Wrote: {out_path}")


if __name__ == "__main__":
    main()
