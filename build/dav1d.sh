#!/bin/bash

set -euo pipefail

meson setup build --cross-file=/meson-cross.ini \
  --prefix=$INSTALL_DIR --default-library=static --buildtype=release \
  -Dc_args="$CFLAGS" -Denable_asm=false -Denable_tools=false \
  -Denable_examples=false -Denable_tests=false -Denable_docs=false
ninja -C build install
