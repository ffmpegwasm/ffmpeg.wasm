# Phase 1, Step 1: Remove Video Codecs

**Duration:** 20-30 minutes
**Impact:** ~9-10MB savings
**Build Status:** Will be broken after this step (expected)

---

## 🎯 Objective

Remove all video codec libraries from the Docker build. Since we're building an audio-only library, video codecs (x264, x265, libvpx, theora, aom) are unnecessary bloat.

---

## 📝 Changes Required

### Edit: `Dockerfile`

#### 1. Remove Video Codec Builder Stages

Find and **DELETE** these entire builder stages (each `FROM ... AS ... builder` block through its `RUN bash -x /src/build.sh` line):

```dockerfile
# ❌ DELETE THIS ENTIRE BLOCK
FROM emsdk-base AS x264-builder
ENV X264_BRANCH=4-cores
ADD https://github.com/ffmpegwasm/x264.git#$X264_BRANCH /src
COPY build/x264.sh /src/build.sh
RUN bash -x /src/build.sh
```

```dockerfile
# ❌ DELETE THIS ENTIRE BLOCK
FROM emsdk-base AS x265-builder
ENV X265_BRANCH=3.4
ADD https://github.com/ffmpegwasm/x265.git#$X265_BRANCH /src
COPY build/x265.sh /src/build.sh
RUN bash -x /src/build.sh
```

```dockerfile
# ❌ DELETE THIS ENTIRE BLOCK
FROM emsdk-base AS libvpx-builder
ENV LIBVPX_BRANCH=v1.13.1
ADD https://github.com/ffmpegwasm/libvpx.git#$LIBVPX_BRANCH /src
COPY build/libvpx.sh /src/build.sh
RUN bash -x /src/build.sh
```

```dockerfile
# ❌ DELETE THIS ENTIRE BLOCK
FROM emsdk-base AS theora-builder
COPY --from=ogg-builder $INSTALL_DIR $INSTALL_DIR
ENV THEORA_BRANCH=v1.1.1
ADD https://github.com/ffmpegwasm/theora.git#$THEORA_BRANCH /src
COPY build/theora.sh /src/build.sh
RUN bash -x /src/build.sh
```

If present, also delete:
```dockerfile
# ❌ DELETE IF PRESENT
FROM emsdk-base AS aom-builder
...
```

#### 2. Remove Video Library Copies from ffmpeg-base

Find the `FROM emsdk-base AS ffmpeg-base` section and **DELETE** these COPY lines:

```dockerfile
# In the ffmpeg-base section, DELETE these lines:
COPY --from=x264-builder $INSTALL_DIR $INSTALL_DIR      # ❌ DELETE
COPY --from=x265-builder $INSTALL_DIR $INSTALL_DIR      # ❌ DELETE
COPY --from=libvpx-builder $INSTALL_DIR $INSTALL_DIR    # ❌ DELETE
COPY --from=theora-builder $INSTALL_DIR $INSTALL_DIR    # ❌ DELETE
COPY --from=aom-builder $INSTALL_DIR $INSTALL_DIR       # ❌ DELETE (if present)
```

**Keep these audio library copies:**
```dockerfile
# ✅ KEEP these audio libraries:
COPY --from=lame-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=opus-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=vorbis-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=libwebp-builder $INSTALL_DIR $INSTALL_DIR   # Remove in step 3
COPY --from=libass-builder $INSTALL_DIR $INSTALL_DIR    # Remove in step 2
COPY --from=zimg-builder $INSTALL_DIR $INSTALL_DIR      # Remove in step 3
```

#### 3. Remove Video Codec Flags from ffmpeg-builder

Find the `FROM ffmpeg-base AS ffmpeg-builder` section and **DELETE** these configure flags:

```dockerfile
# In the ffmpeg-builder RUN bash -x /src/build.sh section, DELETE:
      --enable-libx264 \      # ❌ DELETE
      --enable-libx265 \      # ❌ DELETE
      --enable-libvpx \       # ❌ DELETE
      --enable-libtheora \    # ❌ DELETE
      --enable-libaom \       # ❌ DELETE (if present)
```

**Keep these audio flags:**
```dockerfile
# ✅ KEEP these audio codec flags:
      --enable-libmp3lame \
      --enable-libvorbis \
      --enable-libopus \
      --enable-zlib \         # Will be removed in step 5
      --enable-libwebp \      # Will be removed in step 3
      --enable-libfreetype \  # Will be removed in step 2
      --enable-libfribidi \   # Will be removed in step 2
      --enable-libass \       # Will be removed in step 2
      --enable-libzimg        # Will be removed in step 3
```

---

## 📝 Edit: `build/ffmpeg-wasm.sh`

#### Remove Video Libraries from Linking

Find the `FFMPEG_LIBS` section and **DELETE** these libraries:

```bash
# In the ENV FFMPEG_LIBS section, DELETE:
      -lx264 \          # ❌ DELETE
      -lx265 \          # ❌ DELETE
      -lvpx \           # ❌ DELETE
      -ltheora \        # ❌ DELETE
      -laom \           # ❌ DELETE (if present)
```

**Keep these audio libraries:**
```bash
# ✅ KEEP these:
      -lmp3lame \
      -logg \
      -lvorbis \
      -lvorbisenc \
      -lvorbisfile \
      -lopus \
      -lz \             # Will be removed in step 5
      -lwebpmux \       # Will be removed in step 3
      -lwebp \          # Will be removed in step 3
      -lsharpyuv \      # Will be removed in step 3
      -lfreetype \      # Will be removed in step 2
      -lfribidi \       # Will be removed in step 2
      -lharfbuzz \      # Will be removed in step 2
      -lass \           # Will be removed in step 2
      -lzimg            # Will be removed in step 3
```

---

## ✅ Verification

After making changes, verify:

```bash
# Check that video codec stages are removed
grep -E "x264-builder|x265-builder|libvpx-builder|theora-builder|aom-builder" Dockerfile
# Should return nothing (empty)

# Check that video library copies are removed from ffmpeg-base
grep -A 20 "FROM emsdk-base AS ffmpeg-base" Dockerfile | grep -E "x264|x265|libvpx|theora|aom"
# Should return nothing (empty)

# Check that video codec flags are removed
grep -E "enable-libx264|enable-libx265|enable-libvpx|enable-libtheora|enable-libaom" Dockerfile
# Should return nothing (empty)

# Check that video libs are removed from linking
grep -E "\\-lx264|\\-lx265|\\-lvpx|\\-ltheora|\\-laom" build/ffmpeg-wasm.sh
# Should return nothing (empty)
```

---

## 📊 Expected Savings

- x264: ~2.5MB
- x265: ~3.8MB
- libvpx: ~1.2MB
- theora: ~400KB
- aom: ~1.5MB (if present)

**Total:** ~9-10MB

---

## ⚠️ Important Notes

- **Build will NOT work** after this step - this is expected!
- We're removing dependencies that are still referenced in FFmpeg configure
- The build will work again after Step 4 (audio-only configuration)
- Don't attempt to build yet!

---

## 📝 Git Commit

```bash
# Stage changes
git add Dockerfile build/ffmpeg-wasm.sh

# Commit
git commit -m "feat: remove video codecs for audio-only build

Removed video codec libraries to reduce bundle size:
- x264 (H.264 encoder) - ~2.5MB
- x265 (HEVC encoder) - ~3.8MB
- libvpx (VP8/VP9) - ~1.2MB
- theora (Theora video) - ~400KB

Expected savings: ~9-10MB

Note: Build is broken until audio-only FFmpeg config
is applied (Step 4). This is expected."
```

---

## ➡️ Next Step

**Proceed to:** `STEP_02_remove_subtitles.md`

Remove subtitle and font rendering libraries.
