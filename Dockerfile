# syntax=docker/dockerfile-upstream:master-labs

# Base emsdk image with environment variables.
FROM emscripten/emsdk:3.1.18 AS emsdk-base
ARG EXTRA_CFLAGS
ARG EXTRA_LDFLAGS
ARG FFMPEG_ST
ARG FFMPEG_MT
ENV INSTALL_DIR=/src/build
ENV FFMPEG_VERSION=n5.1
ENV X264_BRANCH=4-cores
ENV CFLAGS="$CFLAGS $EXTRA_CFLAGS"
ENV LDFLAGS="$LDFLAGS $CFLAGS $EXTRA_LDFLAGS"
ENV EM_PKG_CONFIG_PATH=$EM_PKG_CONFIG_PATH:$INSTALL_DIR/lib/pkgconfig:/emsdk/upstream/emscripten/system/lib/pkgconfig
ENV PKG_CONFIG_PATH=$PKG_CONFIG_PATH:$EM_PKG_CONFIG_PATH
ENV FFMPEG_ST=$FFMPEG_ST
ENV FFMPEG_MT=$FFMPEG_MT

# Build x264
FROM emsdk-base AS x264-builder
ADD https://github.com/ffmpegwasm/x264.git#$X264_BRANCH /src
COPY build/x264.sh /src/build.sh
RUN bash -x /src/build.sh

# Base ffmpeg image with dependencies and source code populated.
FROM emsdk-base AS ffmpeg-base
RUN apt-get update && \
      apt-get install -y pkg-config
RUN embuilder build sdl2 sdl2-mt
ADD https://github.com/FFmpeg/FFmpeg.git#$FFMPEG_VERSION /src
COPY --from=x264-builder $INSTALL_DIR $INSTALL_DIR

# Build ffmpeg
FROM ffmpeg-base AS ffmpeg-builder
COPY build/ffmpeg.sh /src/build.sh
RUN bash -x /src/build.sh

# Build ffmpeg.wasm
FROM ffmpeg-builder AS ffmpeg-wasm-builder
COPY src/bind /src/wasm/bind
COPY src/fftools /src/wasm/fftools
COPY build/ffmpeg-wasm.sh build.sh
RUN mkdir -p /src/dist/commonjs
RUN bash -x /src/build.sh -o dist/commonjs/ffmpeg.js
RUN mkdir -p /src/dist/esm
RUN bash -x /src/build.sh -sEXPORT_ES6 -o dist/esm/ffmpeg.js

# Export ffmpeg-core.wasm to dist/, use `docker buildx build -o . .` to get assets
FROM scratch AS exportor
COPY --from=ffmpeg-wasm-builder /src/dist /dist
