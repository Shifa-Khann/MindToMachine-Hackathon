#!/usr/bin/env bash
# Usage: scripts/package.sh   -> dist/eventmind-<date>.zip without out/, inbox/, .env, __pycache__
set -e
cd "$(dirname "$0")/.."
python scripts/package.py
