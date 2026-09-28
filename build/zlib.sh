#!/bin/bash

set -euo pipefail

CM_FLAGS=(
  -DCMAKE_INSTALL_PREFIX=$INSTALL_DIR
  -DCMAKE_TOOLCHAIN_FILE=$EM_TOOLCHAIN_FILE
  -DBUILD_SHARED_LIBS=OFF
  -DSKIP_INSTALL_FILES=ON
)

mkdir -p build
cd build
emmake cmake .. -DCMAKE_C_FLAGS="$CXXFLAGS" ${CM_FLAGS[@]}
emmake make clean
emmake make install
# zlib 1.2.11 always builds a shared library too, which emsdk 6 would link dynamically.
rm -f $INSTALL_DIR/lib/libz.so*
