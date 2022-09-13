#!/bin/bash

EXTRA_CONF_FLAGS=(
  -sINITIAL_MEMORY=32MB
  -sALLOW_MEMORY_GROWTH
)

if [[ ! -z "$FFMPEG_MT" ]]; then
  EXTRA_CONF_FLAGS=(
    -sINITIAL_MEMORY=1024MB
  )
fi

emcc \
  -I. \
  -I./wasm/fftools \
  -I$INSTALL_DIR/include \
  -L$INSTALL_DIR/lib \
  -Llibavcodec \
  -Llibavdevice \
  -Llibavfilter \
  -Llibavformat \
  -Llibavutil \
  -Llibpostproc \
  -Llibswresample \
  -Llibswscale \
  -lavcodec \
  -lavdevice \
  -lavfilter \
  -lavformat \
  -lavutil \
  -lpostproc \
  -lswresample \
  -lswscale \
  -lx264 \
  -Wno-deprecated-declarations \
  $LDFLAGS \
  -sUSE_SDL=2 \
  -sMODULARIZE \
  -sEXPORT_NAME="createFFmpegCore" \
  -sEXPORTED_FUNCTIONS=$(node wasm/bind/export.js) \
  -sEXPORTED_RUNTIME_METHODS=$(node wasm/bind/export-runtime.js) \
  --pre-js wasm/bind/bind.js \
  wasm/fftools/ffmpeg.c \
  wasm/fftools/ffmpeg_filter.c \
  wasm/fftools/ffmpeg_hw.c \
  wasm/fftools/ffmpeg_mux.c \
  wasm/fftools/ffmpeg_opt.c \
  wasm/fftools/cmdutils.c \
  wasm/fftools/opt_common.c \
  ${EXTRA_CONF_FLAGS[@]} \
  $@
