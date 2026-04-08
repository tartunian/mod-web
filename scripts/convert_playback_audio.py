#!/usr/bin/env python3
"""Batch-convert per-track WAV sources to compressed MP3 playback files.

Usage:
  python scripts/convert_playback_audio.py
  python scripts/convert_playback_audio.py --bitrate 160k
  python scripts/convert_playback_audio.py --force
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert track WAV files to MP3 playback files")
    parser.add_argument(
        "--tracks-root",
        default="library/tracks",
        help="Root directory that contains track folders (default: library/tracks)",
    )
    parser.add_argument(
        "--source-name",
        default="source.wav",
        help="Input audio filename inside each track audio dir (default: source.wav)",
    )
    parser.add_argument(
        "--output-name",
        default="playback.mp3",
        help="Output audio filename inside each track audio dir (default: playback.mp3)",
    )
    parser.add_argument(
        "--bitrate",
        default="192k",
        help="MP3 bitrate passed to ffmpeg (default: 192k)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing output files",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be converted without running ffmpeg",
    )
    return parser.parse_args()


def ensure_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None:
        raise SystemExit(
            "ffmpeg is required but was not found in PATH. "
            "Install ffmpeg, then re-run this script."
        )


def convert_track(source: Path, output: Path, bitrate: str, force: bool, dry_run: bool) -> None:
    if output.exists() and not force:
        print(f"skip  {output} (already exists)")
        return

    cmd = [
        "ffmpeg",
        "-y" if force else "-n",
        "-i",
        str(source),
        "-vn",
        "-c:a",
        "libmp3lame",
        "-b:a",
        bitrate,
        str(output),
    ]

    if dry_run:
        print("dry   " + " ".join(cmd))
        return

    print(f"build {output}")
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed for {source}:\n{proc.stderr[-2000:]}")


def main() -> None:
    args = parse_args()
    tracks_root = Path(args.tracks_root)
    if not tracks_root.exists():
        raise SystemExit(f"tracks root not found: {tracks_root}")

    ensure_ffmpeg()

    track_dirs = sorted([p for p in tracks_root.iterdir() if p.is_dir()])
    if not track_dirs:
        raise SystemExit(f"no track directories under: {tracks_root}")

    converted = 0
    for track_dir in track_dirs:
        audio_dir = track_dir / "audio"
        source = audio_dir / args.source_name
        output = audio_dir / args.output_name
        if not source.exists():
            print(f"skip  {source} (missing)")
            continue

        convert_track(source, output, args.bitrate, args.force, args.dry_run)
        if not args.dry_run and (output.exists()):
            converted += 1

    print(f"done  converted={converted} tracks={len(track_dirs)}")


if __name__ == "__main__":
    main()
