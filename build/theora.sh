#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR                               # install library in a build directory for FFmpeg to include
  --host=i686-linux                                   # use i686 linux
  --enable-shared=no                                  # disable shared library
  --enable-docs=no
  --enable-fast-install=no
  --disable-spec
  --disable-asm
  --disable-examples
  --disable-oggtest                                   # disable ogg tests
  --disable-vorbistest                                # disable vorbis tests
  --disable-sdltest                                   # disable sdl tests
)

emconfigure ./autogen.sh "${CONF_FLAGS[@]}"
emmake make install -j
