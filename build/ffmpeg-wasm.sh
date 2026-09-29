#!/bin/bash
# `-o <OUTPUT_FILE_NAME>` must be provided when using this build script.
# ex:
#     bash ffmpeg-wasm.sh -o ffmpeg.js

set -euo pipefail

EXPORT_NAME="createFFmpegCore"

# ffmpeg and ffprobe, compiled with FFmpeg's own rules and flags.
FFTOOLS=(
  cmdutils opt_common
  ffmpeg ffmpeg_dec ffmpeg_demux ffmpeg_enc ffmpeg_filter ffmpeg_hw ffmpeg_mux
  ffmpeg_mux_init ffmpeg_opt ffmpeg_sched sync_queue thread_queue graph/graphprint
  textformat/avtextformat textformat/tf_compact textformat/tf_default textformat/tf_flat
  textformat/tf_ini textformat/tf_json textformat/tf_mermaid textformat/tf_xml
  textformat/tw_avio textformat/tw_buffer textformat/tw_stdout
  resources/resman resources/graph.html resources/graph.css
  ffprobe
)
OBJS=("${FFTOOLS[@]/#/fftools/}")
OBJS=("${OBJS[@]/%/.o}")
emmake make -j "${OBJS[@]}"

CONF_FLAGS=(
  -I.
  -L$INSTALL_DIR/lib
  -Llibavcodec
  -Llibavdevice
  -Llibavfilter
  -Llibavformat
  -Llibavutil
  -Llibswresample
  -Llibswscale
  -lavdevice
  -lavfilter
  -lavformat
  -lavcodec
  -lswresample
  -lswscale
  -lavutil
  $LDFLAGS
  -sDEFAULT_TO_CXX                         # x265, zimg and harfbuzz are C++
  -sENVIRONMENT=web,worker,node           # node: @ffmpeg/ffmpeg's node export, and the core tests
  -sSTACK_SIZE=5MB                         # increase stack size to support libopus
  -sMODULARIZE                             # modularized to use as a library
  -sALLOW_MEMORY_GROWTH -sMAXIMUM_MEMORY=4GB # grow as needed, up to wasm32's 4 GB (#946, #623)
  -sINCOMING_MODULE_JS_API=locateFile,mainScriptUrlOrBlob,print,printErr # mainScriptUrlOrBlob: the script pthread workers load
  -sEXPORT_NAME="$EXPORT_NAME"             # required in browser env, so that user can access this module from window object
  -sEXPORTED_FUNCTIONS=$(node src/bind/ffmpeg/export.js) # exported functions
  -sEXPORTED_RUNTIME_METHODS=$(node src/bind/ffmpeg/export-runtime.js) # exported built-in functions
  -lworkerfs.js
  -lnodefs.js                              # mount host directories in Node.js
  --pre-js src/bind/ffmpeg/bind.js        # extra bindings, contains most of the ffmpeg.wasm javascript code
  --js-library src/bind/ffmpeg/library.js # overrides of emscripten library functions
  "${OBJS[@]}"
  src/bind/ffmpeg/run.c                    # ffmpeg() and ffprobe() for bind.js
  src/bind/ffmpeg/threads.c                # the thread count FFmpeg sees
)

MT_FLAGS=(
  -sINITIAL_MEMORY=1024MB                  # start large as growth is slower with threads
  -sDEFAULT_PTHREAD_STACK_SIZE=2MB         # the 64KB default overflows in x264 and decoder threads
  -sPTHREAD_POOL_SIZE=64                   # workers started with the module; FFmpeg 9 runs a thread per demuxer, decoder, filter, encoder and muxer
  -sPTHREAD_POOL_SIZE_STRICT=2             # fail instead of hanging when the pool runs out
  '-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=$holdRuntime,$checkIsolation,$stackSave,$stackRestore,$stackAlloc,$stringToUTF8OnStack,$setValue' # library.js, and what bind.js uses
)

# FFmpeg's threads take turns on the main thread (src/green), so the core
# needs no SharedArrayBuffer and no cross-origin isolation.
ST_FLAGS=(
  -sINITIAL_MEMORY=32MB
  -sASYNCIFY                               # green threads switch stacks with Asyncify
  -Wl,--allow-multiple-definition          # src/green's pthread functions replace libc's single-threaded stubs
  '-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=$stackSave,$stackRestore,$stackAlloc,$stringToUTF8OnStack,$setValue' # what bind.js uses
  src/green/pthread.c
)

if [[ -n "${FFMPEG_MT:-}" ]]; then
  emcc "${CONF_FLAGS[@]}" "${MT_FLAGS[@]}" "$@"
else
  emcc "${CONF_FLAGS[@]}" "${ST_FLAGS[@]}" "$@"
fi
