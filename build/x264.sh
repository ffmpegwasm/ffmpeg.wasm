#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR           # lib installation dir
  --host=x86-gnu                  # use x86 linux host
  --enable-static                 # build static library
  --disable-cli                   # disable cli build
  --disable-asm                   # disable assembly
  --extra-cflags="$CFLAGS"        # add extra cflags
  ${FFMPEG_ST:+ --disable-thread} # disable thread when FFMPEG_ST is defined
)

emconfigure ./configure "${CONF_FLAGS[@]}"
emmake make install-lib-static -j
