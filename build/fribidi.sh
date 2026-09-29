#!/bin/bash

set -euo pipefail

meson setup build --cross-file=/meson-cross.ini \
  --prefix=$INSTALL_DIR --default-library=static --buildtype=release \
  -Dc_args="$CFLAGS" -Ddocs=false -Dbin=false -Dtests=false
ninja -C build install
