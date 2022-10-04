#!/bin/bash

set -euo pipefail

CFLAGS="$CFLAGS -DHB_NO_PRAGMA_GCC_DIAGNOSTIC_ERROR"

# A hacky way to disable pthread
if [[ "$FFMPEG_ST" == "yes" ]]; then
  sed -i 's#\[have_pthread=true\]#\[have_pthread=false\]#g' configure.ac
else
  sed -i 's#\[have_pthread=false\]#\[have_pthread=true\]#g' configure.ac
fi
CXXFLAGS=$CFLAGS
CONF_FLAGS=(
  --prefix=$INSTALL_DIR                                 # install library in a build directory for FFmpeg to include
  --host=i686-gnu                                     # use i686 linux
  --enable-shared=no                                  # not to build shared library
  --enable-static 
)

emconfigure ./autogen.sh "${CONF_FLAGS[@]}"
emmake make install -j
