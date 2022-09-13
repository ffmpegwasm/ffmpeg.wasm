#!/bin/bash

EXTRA_CONF_FLAGS=(
  --disable-pthreads
  --disable-w32threads
  --disable-os2threads
)

if [[ ! -z "$FFMPEG_MT" ]]; then
  EXTRA_CONF_FLAGS=()
fi

emconfigure ./configure \
  --target-os=none \
  --arch=x86_32 \
  --enable-cross-compile \
  --disable-asm \
  --disable-stripping \
  --disable-programs \
  --disable-doc \
  --disable-debug \
  --disable-runtime-cpudetect \
  --disable-autodetect \
  --extra-cflags="$CFLAGS" \
  --extra-cxxflags="$CFLAGS" \
  --nm="llvm-nm" \
  --ar=emar \
  --ranlib=emranlib \
  --cc=emcc \
  --cxx=em++ \
  --objcc=emcc \
  --dep-cc=emcc \
  ${EXTRA_CONF_FLAGS[@]} \
  --enable-gpl \
  --enable-libx264

emmake make -j
