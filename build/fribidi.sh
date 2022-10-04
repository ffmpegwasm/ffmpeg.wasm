#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR                               # install library in a build directory for FFmpeg to include
  --host=x86_64-linux
  --enable-shared=no                                  # not to build shared library
  --enable-static=yes
  --disable-dependency-tracking
  --disable-debug
)
emconfigure ./autogen.sh "${CONF_FLAGS[@]}"
# A hacky to fix "Too many symbolic links" error
emmake make install -j || true
mkdir -p $INSTALL_DIR/lib/pkgconfig && cp fribidi.pc $INSTALL_DIR/lib/pkgconfig/
