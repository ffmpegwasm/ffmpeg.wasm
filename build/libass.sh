#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR                               # install library in a build directory for FFmpeg to include
  --host=i686-gnu                                     # use i686 linux
  --disable-shared
  --enable-static
  --disable-asm                                       # disable asm optimization
  --disable-fontconfig
  --disable-require-system-font-provider
)

./autogen.sh && emconfigure ./configure "${CONF_FLAGS[@]}"
emmake make install -j
