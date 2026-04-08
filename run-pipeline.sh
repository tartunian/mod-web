#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./run-pipeline.sh [input-audio] [instruments]
# Example:
#   ./run-pipeline.sh mod-demolition-live.mp3 keys,guitar,brass

INPUT_FILE="${1:-mod-demolition-live.mp3}"
INSTRUMENTS="${2:-keys,guitar,brass}"

source .venv/bin/activate

# --run-demucs keeps the core stems (drums, bass, vocals, other).
# --instruments adds extra pseudo-stem lanes without replacing core stems.
python scripts/extract_signals.py \
  --input "$INPUT_FILE" \
  --output signals/output/signals.json \
  --run-demucs \
  --demucs-device cpu \
  --instruments "$INSTRUMENTS"

echo "Done. Core stems at signals/stems (including drums and bass)."
echo "Custom pseudo-stems at signals/stems/custom (if requested)."
echo "Signals JSON at signals/output/signals.json"