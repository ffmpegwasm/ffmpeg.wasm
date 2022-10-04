#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR                               # install library in a build directory for FFmpeg to include
  --host=i686-linux                                   # use i686 linux
  --disable-shared                                    # disable shared library
  --disable-frontend                                  # exclude lame executable
  --disable-analyzer-hooks                            # exclude analyzer hooks
  --disable-dependency-tracking                       # speed up one-time build
  --disable-gtktest
)
CFLAGS=$CFLAGS emconfigure ./configure "${CONF_FLAGS[@]}"
emmake make install -j
