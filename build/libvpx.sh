#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR                              # install library in a build directory for FFmpeg to include
  --target=generic-gnu                               # target with miminal features
  --disable-install-bins                             # not to install bins
  --disable-examples                                 # not to build examples
  --disable-tools                                    # not to build tools
  --disable-docs                                     # not to build docs
  --disable-unit-tests                               # not to do unit tests
  --disable-dependency-tracking                      # speed up one-time build
  --extra-cflags="$CFLAGS"                           # flags to use pthread and code optimization
  --extra-cxxflags="$CXXFLAGS"                       # flags to use pthread and code optimization
  ${FFMPEG_ST:+ --disable-multithread}
)

emconfigure ./configure "${CONF_FLAGS[@]}"
emmake make install -j
# Fix ffmpeg configure error: "libvpx enabled but no supported decoders found"
emranlib $INSTALL_DIR/lib/libvpx.a
