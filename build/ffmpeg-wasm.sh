#!/bin/bash
# `-o <OUTPUT_FILE_NAME>` must be provided when using this build script.
# ex:
#     bash ffmpeg-wasm.sh -o ffmpeg.js

set -euo pipefail

EXPORT_NAME="createFFmpegCore"

CONF_FLAGS=(
  -I. 
  -I./src/fftools 
  -I$INSTALL_DIR/include 
  -L$INSTALL_DIR/lib 
  -Llibavcodec 
  -Llibavdevice 
  -Llibavfilter 
  -Llibavformat 
  -Llibavutil 
  -Llibpostproc 
  -Llibswresample 
  -Llibswscale 
  -lavcodec 
  -lavdevice 
  -lavfilter 
  -lavformat 
  -lavutil 
  -lpostproc 
  -lswresample 
  -lswscale 
  -Wno-deprecated-declarations 
  $LDFLAGS 
  -sENVIRONMENT=web,worker,node           # node: the core tests run in Node.js
  -sWASM_BIGINT                            # enable big int support
  -sDEFAULT_TO_CXX                         # x265, zimg and harfbuzz are C++
  -sUSE_SDL=2                              # use emscripten SDL2 lib port
  -sSTACK_SIZE=5MB                         # increase stack size to support libopus
  -sMODULARIZE                             # modularized to use as a library
  ${FFMPEG_MT:+ -sINITIAL_MEMORY=1024MB -sALLOW_MEMORY_GROWTH -sMAXIMUM_MEMORY=2GB} # start large as growth is slower with threads, but allow it for 4K (#946)
  ${FFMPEG_MT:+ -sPTHREAD_POOL_SIZE=32}    # use 32 threads
  ${FFMPEG_MT:+ -sDEFAULT_PTHREAD_STACK_SIZE=2MB} # the 64KB default overflows in x264 and decoder threads
  ${FFMPEG_MT:+ -sPTHREAD_POOL_SIZE_STRICT=2} # fail instead of hanging when the pool runs out
  ${FFMPEG_ST:+ -sINITIAL_MEMORY=32MB -sALLOW_MEMORY_GROWTH} # Use just enough memory as memory usage can grow
  -sINCOMING_MODULE_JS_API=locateFile,mainScriptUrlOrBlob,print,printErr # mainScriptUrlOrBlob: the script pthread workers load
  -sEXPORT_NAME="$EXPORT_NAME"             # required in browser env, so that user can access this module from window object
  -sEXPORTED_FUNCTIONS=$(node src/bind/ffmpeg/export.js) # exported functions
  -sEXPORTED_RUNTIME_METHODS=$(node src/bind/ffmpeg/export-runtime.js) # exported built-in functions
  -lworkerfs.js
  --pre-js src/bind/ffmpeg/bind.js        # extra bindings, contains most of the ffmpeg.wasm javascript code
  --js-library src/bind/ffmpeg/library.js # overrides of emscripten library functions
  # ffmpeg source code
  src/fftools/cmdutils.c 
  src/fftools/ffmpeg.c 
  src/fftools/ffmpeg_filter.c 
  src/fftools/ffmpeg_hw.c 
  src/fftools/ffmpeg_mux.c 
  src/fftools/ffmpeg_opt.c 
  src/fftools/opt_common.c 
  src/fftools/ffprobe.c 
)

emcc "${CONF_FLAGS[@]}" $@
