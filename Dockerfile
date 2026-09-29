# syntax=docker/dockerfile:1.10@sha256:865e5dd094beca432e8c0a1d5e1c465db5f998dca4e439981029b3b81fb39ed5

# Every input is pinned (image digests, git commits, tarball checksums) so a
# release can't change underneath us. The comments name the pinned versions.

# Base emsdk image with environment variables.
FROM emscripten/emsdk:6.0.10@sha256:e077d54e2b8970575ebc4f185ac1de0b95c05f2b266134d4ba27449af7aebf65 AS emsdk-base
ARG EXTRA_CFLAGS
ARG EXTRA_LDFLAGS
# FFMPEG_ST=yes: single-threaded core; FFMPEG_MT=yes: multi-threaded core.
ARG FFMPEG_ST
ARG FFMPEG_MT
ENV FFMPEG_ST=$FFMPEG_ST
ENV FFMPEG_MT=$FFMPEG_MT
ENV INSTALL_DIR=/opt
# zimg reports errors with C++ exceptions it catches itself, so everything is
# built with exception support (and the matching setjmp/longjmp), chosen per
# core by the Makefile: JavaScript exceptions for the Asyncify core, which
# doesn't support wasm ones, wasm exceptions for the others (JSPI can't
# suspend through the JavaScript frames of JavaScript exceptions).
ARG FFMPEG_EXCEPTIONS
ENV CFLAGS="-I$INSTALL_DIR/include ${FFMPEG_MT:+-pthread} $FFMPEG_EXCEPTIONS $EXTRA_CFLAGS"
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
# stable branch
ADD https://code.videolan.org/videolan/x264.git#b35605ace3ddf7c1a5d67a2eb553f034aef41d55 /src
COPY build/x264.sh /src/build.sh
RUN bash -x /src/build.sh

# Build x265
FROM emsdk-base AS x265-builder
# 4.2
ADD https://bitbucket.org/multicoreware/x265_git.git#e444744c03978c1fb4e037168967020cf2648427 /src
COPY build/x265.sh /src/build.sh
RUN bash -x /src/build.sh

# Build libvpx
FROM emsdk-base AS libvpx-builder
# v1.17.0
ADD https://github.com/webmproject/libvpx.git#6df3ec34557879fff673706f4a1d9fbd0f3a6f0e /src
COPY build/libvpx.sh /src/build.sh
RUN bash -x /src/build.sh

# Build lame (3.100, the latest release; there is no upstream git repository)
FROM emsdk-base AS lame-builder
# 3.100
ADD https://github.com/ffmpegwasm/lame.git#2badea1974ae36cb8312afe99cff1e6b3b5decee /src
COPY build/lame.sh /src/build.sh
RUN bash -x /src/build.sh

# Build ogg
FROM emsdk-base AS ogg-builder
# v1.3.6
ADD https://github.com/xiph/ogg.git#be05b13e98b048f0b5a0f5fa8ce514d56db5f822 /src
COPY build/ogg.sh /src/build.sh
RUN bash -x /src/build.sh

# Build theora
FROM emsdk-base AS theora-builder
COPY --from=ogg-builder $INSTALL_DIR $INSTALL_DIR
# v1.2.0
ADD https://github.com/xiph/theora.git#8e4808736e9c181b971306cc3f05df9e61354004 /src
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
# v1.3.7
ADD https://github.com/xiph/vorbis.git#0657aee69dec8508a0011f47f3b69d7538e9d262 /src
COPY build/vorbis.sh /src/build.sh
RUN bash -x /src/build.sh

# Build zlib
FROM emsdk-base AS zlib-builder
# v1.3.2
ADD https://github.com/madler/zlib.git#da607da739fa6047df13e66a2af6b8bec7c2a498 /src
COPY build/zlib.sh /src/build.sh
RUN bash -x /src/build.sh

# Build libwebp
FROM emsdk-base AS libwebp-builder
COPY --from=zlib-builder $INSTALL_DIR $INSTALL_DIR
# v1.6.0
ADD https://github.com/webmproject/libwebp.git#4fa21912338357f89e4fd51cf2368325b59e9bd9 /src
COPY build/libwebp.sh /src/build.sh
RUN bash -x /src/build.sh

# Build freetype2
FROM emsdk-base AS freetype2-builder
# VER-2-14-3
ADD https://github.com/freetype/freetype.git#0a0221a1347e2f1e07c395263540026e9a0aa7c7 /src
COPY build/freetype2.sh /src/build.sh
RUN bash -x /src/build.sh

# Build fribidi
FROM emsdk-base AS fribidi-builder
# v1.0.17
ADD https://github.com/fribidi/fribidi.git#b93119f5fdc7ea47672cc304c1455ffa6dfe7536 /src
COPY build/fribidi.sh /src/build.sh
RUN bash -x /src/build.sh

# Build harfbuzz (with FreeType, for FFmpeg's drawtext)
FROM emsdk-base AS harfbuzz-builder
COPY --from=freetype2-builder $INSTALL_DIR $INSTALL_DIR
# 14.5.0
ADD https://github.com/harfbuzz/harfbuzz.git#863d3f7787c6df18d20e4535c5906bf3eb803bd5 /src
COPY build/harfbuzz.sh /src/build.sh
RUN bash -x /src/build.sh

# Build libass
FROM emsdk-base AS libass-builder
COPY --from=freetype2-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=fribidi-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=harfbuzz-builder $INSTALL_DIR $INSTALL_DIR
# 0.17.5
ADD https://github.com/libass/libass.git#4a05d8127f525943ebf45fdc6497c9e665947f0d /src
COPY build/libass.sh /src/build.sh
RUN bash -x /src/build.sh

# Build zimg
FROM emsdk-base AS zimg-builder
# release-3.0.6
ADD https://github.com/sekrit-twc/zimg.git#f819b14e8f39d1282400b0d9543e8ef73c1b2bbd /src
COPY build/zimg.sh /src/build.sh
RUN bash -x /src/build.sh

# Build dav1d (AV1 decoder)
FROM emsdk-base AS dav1d-builder
# 1.5.4
ADD https://code.videolan.org/videolan/dav1d.git#54706fc6bc0cdecab7e9593974a4039cc038fca7 /src
COPY build/dav1d.sh /src/build.sh
RUN bash -x /src/build.sh

# Base ffmpeg image with dependencies and source code populated.
FROM emsdk-base AS ffmpeg-base
# n9.0.2
ADD https://github.com/FFmpeg/FFmpeg.git#946fcce07b6dcd0331c8cc609192aeff5e1924f8 /src
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
COPY --from=dav1d-builder $INSTALL_DIR $INSTALL_DIR

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
      --enable-libzimg \
      --enable-libdav1d

# Build ffmpeg.wasm: patch FFmpeg's fftools (patches/ffmpeg) and link them
# with the libraries.
FROM ffmpeg-builder AS ffmpeg-wasm-builder
COPY patches/ffmpeg /patches
RUN git apply /patches/*.patch
COPY src/green /src/src/green
COPY src/bind /src/src/bind
COPY build/ffmpeg-wasm.sh build.sh
ENV FFMPEG_LIBS="-lx264 ${FFMPEG_MT:+-lx265} -lvpx -lmp3lame -logg -ltheora -lvorbis -lvorbisenc -lvorbisfile -lopus -lz -lwebpmux -lwebp -lsharpyuv -lfreetype -lfribidi -lharfbuzz -lass -lzimg -ldav1d"
# FFMPEG_JSPI=yes (with FFMPEG_ST=yes): the single-threaded core with JSPI,
# built next to it as ffmpeg-core-jspi.js.
ARG FFMPEG_JSPI
ENV FFMPEG_JSPI=$FFMPEG_JSPI
RUN mkdir -p /src/dist/umd && bash -x /src/build.sh \
      ${FFMPEG_LIBS} \
      -o dist/umd/ffmpeg-core${FFMPEG_JSPI:+-jspi}.js
RUN mkdir -p /src/dist/esm && bash -x /src/build.sh \
      ${FFMPEG_LIBS} \
      -sEXPORT_ES6 \
      -o dist/esm/ffmpeg-core${FFMPEG_JSPI:+-jspi}.js && \
    echo '{"type": "module"}' > dist/esm/package.json

# Export ffmpeg-core.wasm to dist/, use `docker buildx build -o . .` to get assets
FROM scratch AS exportor
COPY --from=ffmpeg-wasm-builder /src/dist /dist
