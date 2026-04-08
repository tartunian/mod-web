#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
echo "Serving $(pwd) at http://localhost:8000"
python3 -m http.server 8000