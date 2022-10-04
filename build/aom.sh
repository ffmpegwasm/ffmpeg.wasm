#!/bin/bash

set -euo pipefail

CM_FLAGS=(
  -DCMAKE_INSTALL_PREFIX=$INSTALL_DIR           # assign lib and include install path
  -DCMAKE_TOOLCHAIN_FILE=$EM_TOOLCHAIN_FILE     # use emscripten toolchain file
  -DBUILD_SHARED_LIBS=0                         # disable shared library build
  -DAOM_TARGET_CPU=generic                      # use generic cpu
  -DENABLE_DOCS=0                               # disable docs
  -DENABLE_TESTS=0                              # disable tests
  -DENABLE_EXAMPLES=0                           # disable examples
  -DENABLE_TOOLS=0                              # disable tools
  -DCONFIG_RUNTIME_CPU_DETECT=0                 # disable cpu detect
  -DCONFIG_WEBM_IO=0                            # disable libwebm support
)

CMBUILD_DIR=cmbuild
rm -rf $CMBUILD_DIR
mkdir -p $CMBUILD_DIR
cd $CMBUILD_DIR

emmake cmake .. \
  -DAOM_EXTRA_C_FLAGS="$CFLAGS" \
  -DAOM_EXTRA_CXX_FLAGS="$CFLAGS" \
  ${CM_FLAGS[@]}
emmake make install -j
