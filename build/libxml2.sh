#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR                               # install library in a build directory for FFmpeg to include
  --without-python                                    # configure will raise error if pyhton ot found
  --enable-static                                     # enable static libs
  --with-http
  --without-ftp
  --without-modules
  --without-python
  --without-zlib
  --without-lzma
  --without-threads
  --host=i686-gnu
)
emconfigure ./autogen.sh
emconfigure ./configure "${CONF_FLAGS[@]}"
emmake make install -j