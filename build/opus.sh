#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR                               # install library in a build directory for FFmpeg to include
  --host=i686-none                                 # use i686 unknown
  --enable-shared=no                                  # not to build shared library
  --disable-asm                                       # not to use asm
  --disable-rtcd                                      # not to detect cpu capabilities
  --disable-intrinsics                                # not to use intrinsics
  --disable-doc                                       # not to build docs
  --disable-extra-programs                            # not to build demo and tests
  --disable-stack-protector
)

emconfigure ./autogen.sh
CFLAGS=$CFLAGS emconfigure ./configure "${CONF_FLAGS[@]}"
emmake make install -j
