#!/bin/bash

EXTRA_CONF_FLAGS=(
  --disable-thread
)

if [[ ! -z "$FFMPEG_MT" ]]; then
  EXTRA_CONF_FLAGS=()
fi

emconfigure ./configure \
      --prefix=$INSTALL_DIR \
      --host=x86-gnu \
      --enable-static \
      --disable-cli \
      --disable-asm \
      --extra-cflags="$CFLAGS" \
      ${EXTRA_CONF_FLAGS[@]}

emmake make install-lib-static -j
