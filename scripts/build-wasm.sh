#!/usr/bin/env bash
# Builds @ffmpeg/core and @ffmpeg/core-mt with Docker, then the JS packages.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1 && [ "$(uname -s)" = Darwin ]; then
  open -a Docker
  for _ in $(seq 60); do docker info >/dev/null 2>&1 && break; sleep 2; done
fi

make "${1:-prd}"
make "${1:-prd}-mt"
pnpm build
