#!/bin/bash

set -euo pipefail

# Remove this flag as clang doesn't recognize
sed -i 's#-mno-ieee-fp##g' configure.ac

CONF_FLAGS=(
  --prefix=$INSTALL_DIR                               # install library in a build directory for FFmpeg to include
  --host=i686-linux                                   # use i686 linux
  --enable-shared=no                                  # disable shared library
  --enable-docs=no
  --enable-examples=no
  --enable-fast-install=no
  --disable-oggtest                                   # disable oggtests
  --disable-dependency-tracking                       # speed up one-time build
)

emconfigure ./autogen.sh "${CONF_FLAGS[@]}"
emmake make install -j
