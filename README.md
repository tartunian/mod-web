# Mono Audio Signal Pipeline

This project extracts instrument-like control signals from a mono recording.

It supports two paths:
- Proxy-only (fast, no stem model required)
- Optional Demucs stems + proxy blending (higher quality when available)

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Optional stems support:

```bash
pip install demucs
```

If Demucs reports as unavailable, also install PyTorch explicitly:

```bash
pip install torch demucs
```

## Run (Proxy-Only)

```bash
python scripts/extract_signals.py \
  --input path/to/recording.wav \
  --output signals/output/signals.json
```

## Run (With Demucs Stems + Blending)

```bash
python scripts/extract_signals.py \
  --input path/to/recording.wav \
  --output signals/output/signals.json \
  --run-demucs \
  --demucs-device cpu
```

## Run With Custom Instrument Lanes (keys/guitar/brass)

This creates additional pseudo-stems and control lanes from the `other` stem (or from the mix if stems are unavailable).
Core Demucs stems are still produced and kept (`drums`, `bass`, `vocals`, `other`).

```bash
python scripts/extract_signals.py \
  --input path/to/recording.wav \
  --output signals/output/signals.json \
  --run-demucs \
  --instruments keys,guitar,brass
```

By default custom pseudo-stem WAV files are written to `signals/stems/custom`.
To skip writing audio files and only emit lanes in JSON:

```bash
python scripts/extract_signals.py --input path/to/recording.wav --output signals/output/signals.json --instruments keys,guitar,brass --no-custom-stem-audio
```

Notes:
- Demucs logs are streamed live; you should see progress in terminal.
- First run may take a while because model weights are downloaded.

## Output

The script writes a JSON file containing:
- `timelineSec`: frame timestamps
- `signals.bands`: bass/mid/high energy
- `signals.proxies`: kick/snare/hat/bass/vocal proxy lanes
- `signals.stems`: optional per-stem features if Demucs ran successfully
- `signals.customInstruments`: optional custom instrument lanes (e.g. keys/guitar/brass)
- `signals.blended`: final instrument-like signals for UI mapping

## Troubleshooting Demucs

If you run with `--run-demucs` and stems are not produced, check:

```bash
python3 -c "import demucs, torch; print('ok')"
```

The extractor now includes `metadata.demucsStatus` in the JSON and prints a detailed status line.

If a run appears stuck, try explicitly forcing CPU:

```bash
python scripts/extract_signals.py --input path/to/recording.wav --output signals/output/signals.json --run-demucs --demucs-device cpu
```

Suggested UI mappings:
- `blended.kick` -> impacts/shockwaves
- `blended.snare` -> outline spikes/flash accents
- `blended.hat` -> shimmer/fine particles
- `blended.bass` -> macro deformation and drift
- `blended.vocal` -> text glow/color behavior
