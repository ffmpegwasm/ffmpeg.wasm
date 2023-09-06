#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR  # install library in a build directory for FFmpeg to include
  --host=i686-gnu        # use i686 linux
  --disable-shared       # build static libraries
  --enable-static        # enable static libraries
  # Add any other libzimg specific flags here
)

# Build and install libzimg
emconfigure ./autogen.sh
emconfigure ./configure "${CONF_FLAGS[@]}"
emmake make install -j