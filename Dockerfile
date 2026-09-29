# syntax=docker/dockerfile-upstream:master-labs

# Base emsdk image with environment variables.
FROM emscripten/emsdk:6.0.10 AS emsdk-base
ARG EXTRA_CFLAGS
ARG EXTRA_LDFLAGS
# FFMPEG_ST=yes: single-threaded core; FFMPEG_MT=yes: multi-threaded core.
ARG FFMPEG_ST
ARG FFMPEG_MT
ENV FFMPEG_ST=$FFMPEG_ST
ENV FFMPEG_MT=$FFMPEG_MT
ENV INSTALL_DIR=/opt
ENV FFMPEG_VERSION=n9.0.2
ENV CFLAGS="-I$INSTALL_DIR/include ${FFMPEG_MT:+-pthread} $EXTRA_CFLAGS"
ENV CXXFLAGS="$CFLAGS"
ENV LDFLAGS="-L$INSTALL_DIR/lib $CFLAGS $EXTRA_LDFLAGS"
ENV EM_PKG_CONFIG_PATH=$INSTALL_DIR/lib/pkgconfig:/emsdk/upstream/emscripten/system/lib/pkgconfig
ENV EM_TOOLCHAIN_FILE=$EMSDK/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake
ENV PKG_CONFIG_PATH=$EM_PKG_CONFIG_PATH
RUN apt-get update && \
      apt-get install -y pkg-config autoconf automake libtool ragel meson ninja-build
COPY build/meson-cross.ini /meson-cross.ini

# Build x264
FROM emsdk-base AS x264-builder
ADD https://code.videolan.org/videolan/x264.git#b35605ace3ddf7c1a5d67a2eb553f034aef41d55 /src
COPY build/x264.sh /src/build.sh
RUN bash -x /src/build.sh

# Build x265
FROM emsdk-base AS x265-builder
ADD https://bitbucket.org/multicoreware/x265_git.git#4.2 /src
COPY build/x265.sh /src/build.sh
RUN bash -x /src/build.sh

# Build libvpx
FROM emsdk-base AS libvpx-builder
ADD https://github.com/webmproject/libvpx.git#v1.17.0 /src
COPY build/libvpx.sh /src/build.sh
RUN bash -x /src/build.sh

# Build lame (3.100, the latest release; there is no upstream git repository)
FROM emsdk-base AS lame-builder
ADD https://github.com/ffmpegwasm/lame.git#master /src
COPY build/lame.sh /src/build.sh
RUN bash -x /src/build.sh

# Build ogg
FROM emsdk-base AS ogg-builder
ADD https://github.com/xiph/ogg.git#v1.3.6 /src
COPY build/ogg.sh /src/build.sh
RUN bash -x /src/build.sh

# Build theora
FROM emsdk-base AS theora-builder
COPY --from=ogg-builder $INSTALL_DIR $INSTALL_DIR
ADD https://github.com/xiph/theora.git#v1.2.0 /src
COPY build/theora.sh /src/build.sh
RUN bash -x /src/build.sh

# Build opus. The release tarball ships the DNN model data that the git
# checkout would download while building.
FROM emsdk-base AS opus-builder
ADD --checksum=sha256:6ffcb593207be92584df15b32466ed64bbec99109f007c82205f0194572411a1 \
      https://downloads.xiph.org/releases/opus/opus-1.6.1.tar.gz /tmp/opus.tar.gz
RUN mkdir -p /src && tar xzf /tmp/opus.tar.gz -C /src --strip-components=1
COPY build/opus.sh /src/build.sh
RUN bash -x /src/build.sh

# Build vorbis
FROM emsdk-base AS vorbis-builder
COPY --from=ogg-builder $INSTALL_DIR $INSTALL_DIR
ADD https://github.com/xiph/vorbis.git#v1.3.7 /src
COPY build/vorbis.sh /src/build.sh
RUN bash -x /src/build.sh

# Build zlib
FROM emsdk-base AS zlib-builder
ADD https://github.com/madler/zlib.git#v1.3.2 /src
COPY build/zlib.sh /src/build.sh
RUN bash -x /src/build.sh

# Build libwebp
FROM emsdk-base AS libwebp-builder
COPY --from=zlib-builder $INSTALL_DIR $INSTALL_DIR
ADD https://github.com/webmproject/libwebp.git#v1.6.0 /src
COPY build/libwebp.sh /src/build.sh
RUN bash -x /src/build.sh

# Build freetype2
FROM emsdk-base AS freetype2-builder
ADD https://github.com/freetype/freetype.git#VER-2-14-3 /src
COPY build/freetype2.sh /src/build.sh
RUN bash -x /src/build.sh

# Build fribidi
FROM emsdk-base AS fribidi-builder
ADD https://github.com/fribidi/fribidi.git#v1.0.17 /src
COPY build/fribidi.sh /src/build.sh
RUN bash -x /src/build.sh

# Build harfbuzz (with FreeType, for FFmpeg's drawtext)
FROM emsdk-base AS harfbuzz-builder
COPY --from=freetype2-builder $INSTALL_DIR $INSTALL_DIR
ADD https://github.com/harfbuzz/harfbuzz.git#14.5.0 /src
COPY build/harfbuzz.sh /src/build.sh
RUN bash -x /src/build.sh

# Build libass
FROM emsdk-base AS libass-builder
COPY --from=freetype2-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=fribidi-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=harfbuzz-builder $INSTALL_DIR $INSTALL_DIR
ADD https://github.com/libass/libass.git#0.17.5 /src
COPY build/libass.sh /src/build.sh
RUN bash -x /src/build.sh

# Build zimg
FROM emsdk-base AS zimg-builder
ADD https://github.com/sekrit-twc/zimg.git#release-3.0.6 /src
COPY build/zimg.sh /src/build.sh
RUN bash -x /src/build.sh

# Base ffmpeg image with dependencies and source code populated.
FROM emsdk-base AS ffmpeg-base
ADD https://github.com/FFmpeg/FFmpeg.git#$FFMPEG_VERSION /src
COPY --from=x264-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=x265-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=libvpx-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=lame-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=opus-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=theora-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=vorbis-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=libwebp-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=libass-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=zimg-builder $INSTALL_DIR $INSTALL_DIR

# Build ffmpeg
FROM ffmpeg-base AS ffmpeg-builder
COPY build/ffmpeg.sh /src/build.sh
RUN bash -x /src/build.sh \
      --enable-gpl \
      --enable-libx264 \
      ${FFMPEG_MT:+--enable-libx265} \
      --enable-libvpx \
      --enable-libmp3lame \
      --enable-libtheora \
      --enable-libvorbis \
      --enable-libopus \
      --enable-zlib \
      --enable-libwebp \
      --enable-libfreetype \
      --enable-libfribidi \
      --enable-libharfbuzz \
      --enable-libass \
      --enable-libzimg

# Build ffmpeg.wasm: patch FFmpeg's fftools (patches/ffmpeg) and link them
# with the libraries.
FROM ffmpeg-builder AS ffmpeg-wasm-builder
COPY patches/ffmpeg /patches
RUN git apply /patches/*.patch
COPY src/green /src/src/green
COPY src/bind /src/src/bind
COPY build/ffmpeg-wasm.sh build.sh
ENV FFMPEG_LIBS="-lx264 ${FFMPEG_MT:+-lx265} -lvpx -lmp3lame -logg -ltheora -lvorbis -lvorbisenc -lvorbisfile -lopus -lz -lwebpmux -lwebp -lsharpyuv -lfreetype -lfribidi -lharfbuzz -lass -lzimg"
RUN mkdir -p /src/dist/umd && bash -x /src/build.sh \
      ${FFMPEG_LIBS} \
      -o dist/umd/ffmpeg-core.js
RUN mkdir -p /src/dist/esm && bash -x /src/build.sh \
      ${FFMPEG_LIBS} \
      -sEXPORT_ES6 \
      -o dist/esm/ffmpeg-core.js && \
    echo '{"type": "module"}' > dist/esm/package.json

# Export ffmpeg-core.wasm to dist/, use `docker buildx build -o . .` to get assets
FROM scratch AS exportor
COPY --from=ffmpeg-wasm-builder /src/dist /dist
