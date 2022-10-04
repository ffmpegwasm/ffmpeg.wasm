#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR                               # install library in a build directory for FFmpeg to include
  --host=x86_64-gnu                                   # use i686 linux
  --enable-shared=no                                  # not to build shared library
  --without-harfbuzz                                  # disable harfbuzz as incompatible
)
emconfigure ./autogen.sh
emconfigure ./configure "${CONF_FLAGS[@]}"
# build apinames manually to prevent it built by emcc
gcc -o objs/apinames src/tools/apinames.c
emmake make install -j
