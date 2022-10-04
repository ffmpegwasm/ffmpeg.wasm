#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR                                # install library in a build directory for FFmpeg to include
  --host=x86-linux-gnu                                 # use x86 linux as host
  --disable-asm                                        # disable asm optimization
  --disable-man                                        # disable docs
  --disable-tests                                      # disable tests
  --disable-apps                                       # disable wavpack apps
  --disable-dsd                                        # disalbe legacy
  --enable-legacy                                      # enable compability for old version of wav
  --disable-shared                                     # enable building static library
  --disable-dependency-tracking                        # speed up one-time build
  --disable-maintainer-mode
)
CFLAGS=$CFLAGS emconfigure ./autogen.sh "${CONF_FLAGS[@]}"
emmake make install -j
