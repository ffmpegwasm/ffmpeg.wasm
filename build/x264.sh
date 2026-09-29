#!/bin/bash

set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR           # lib installation dir
  --host=x86-gnu                  # use x86 linux host
  --enable-static                 # build static library
  --disable-cli                   # disable cli build
  --disable-asm                   # disable assembly
  --extra-cflags="$CFLAGS"        # add extra cflags
  ${FFMPEG_ST:+ --disable-thread} # disable thread when FFMPEG_ST is defined
)

# slicetype_slice_cost returns void but is called as void *(*)(void *), which traps in wasm
sed -i 's/^static void slicetype_slice_cost(/static void *slicetype_slice_cost(/; /s->do_search, s->w, s->output_inter, s->output_intra );/a\    return NULL;' encoder/slicetype.c

emconfigure ./configure "${CONF_FLAGS[@]}"
emmake make install-lib-static -j
