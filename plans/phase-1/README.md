# Phase 1: Critical Mass Reduction

**Goal:** Achieve 75-85% size reduction through audio-only build
**Duration:** 3-5 days
**Prerequisites:** Phase 0 complete with baseline metrics

---

## 📋 Overview

This is the **most impactful phase** of the optimization. We'll remove all video, subtitle, and image processing capabilities to create a pure audio conversion library.

### Expected Gains
- **Bundle size:** 75-85% smaller
- **Load time:** 5-10x faster on 3G
- **Memory footprint:** 50-70% lower
- **Mobile compatibility:** Poor → Excellent

---

## 🎯 What We'll Remove

### Video Codecs (~9-10MB savings)
- x264 (H.264 encoder) - ~2.5MB
- x265 (HEVC encoder) - ~3.8MB
- libvpx (VP8/VP9) - ~1.2MB
- theora (Theora video) - ~400KB
- aom (AV1) - ~1.5MB (if present)

### Subtitle & Font Rendering (~3-5MB savings)
- freetype2 (font rendering) - ~800KB
- fribidi (bidirectional text) - ~200KB
- harfbuzz (text shaping) - ~600KB
- libass (subtitle rendering) - ~500KB

### Image Processing (~1-2MB savings)
- libwebp (WebP images) - ~600KB
- zimg (image scaling) - ~300KB

### FFmpeg Internal Components (~2-4MB savings)
- All video decoders/encoders
- All video filters
- Subtitle parsers
- Hardware acceleration
- Postprocessing

---

## 🎯 What We'll Keep & Add

### Keep (Audio Codecs)
- ✅ lame (MP3 encoding)
- ✅ opus (Opus encoding)
- ✅ ogg (Ogg container)
- ✅ vorbis (Vorbis encoding)
- ✅ FFmpeg built-in (FLAC, PCM, ALAC, AAC)

### Add (Missing Audio)
- ✅ WavPack (.wv files) - ~200KB
- ✅ Speex (voice codec) - ~150KB

### Optimize
- ✅ Replace custom zlib with Emscripten's built-in - saves ~200-300KB
- ✅ Optimize memory settings for audio workloads

---

## 📝 Steps in This Phase

### Step 1: Remove Video Codecs
**File:** `STEP_01_remove_video.md`
**Savings:** ~9-10MB
**Duration:** 20-30 minutes

### Step 2: Remove Subtitle/Font Libraries
**File:** `STEP_02_remove_subtitles.md`
**Savings:** ~3-5MB
**Duration:** 15-20 minutes

### Step 3: Remove Image Processing
**File:** `STEP_03_remove_images.md`
**Savings:** ~1-2MB
**Duration:** 10-15 minutes

### Step 4: Configure FFmpeg for Audio-Only
**File:** `STEP_04_audio_only_config.md`
**Savings:** ~2-4MB
**Duration:** 30-45 minutes
**⚠️ Most complex step**

### Step 5: Replace zlib with Emscripten's Built-in
**File:** `STEP_05_replace_zlib.md`
**Savings:** ~200-300KB
**Duration:** 15-20 minutes

### Step 6: Add WavPack Support
**File:** `STEP_06_add_wavpack.md`
**Cost:** ~200KB
**Duration:** 20-30 minutes

### Step 7: Add Speex Support
**File:** `STEP_07_add_speex.md`
**Cost:** ~150KB
**Duration:** 25-35 minutes
**⚠️ Requires creating new build script**

### Step 8: Optimize Memory Configuration
**File:** `STEP_08_memory_config.md`
**Benefit:** 50-70% less initial memory
**Duration:** 15-20 minutes

### Step 9: Build, Validate, Compare
**File:** `STEP_09_validate.md`
**Duration:** 60-90 minutes
**Output:** Phase 1 metrics vs baseline

---

## ⚠️ Important Notes

### Build After Each Step?
**No.** The build will be **broken** after step 4 (audio-only config) until all library removals are complete.

**Recommended approach:**
- Steps 1-5: Make all changes (build will be broken)
- Steps 6-7: Add new codecs
- Step 8: Memory optimization
- Step 9: First build attempt after all changes

### Test After Each Step?
- Steps 1-8: Changes only (no testing)
- Step 9: Full build and testing

### Reverting if Needed
If something goes wrong:
```bash
# Revert to baseline
git checkout phase-0-complete

# Create new attempt branch
git checkout -b feat/audio-optimization-v2
```

---

## 🔍 Files You'll Edit

### Dockerfile
- Remove builder stages (x264, x265, libvpx, etc.)
- Remove COPY --from statements
- Add WavPack builder
- Add Speex builder
- Update ffmpeg-builder --enable flags

### build/ffmpeg.sh
- Complete rewrite of configure flags
- --disable-everything
- Selectively enable audio components

### build/ffmpeg-wasm.sh
- Update FFMPEG_LIBS
- Add -sUSE_ZLIB=1
- Update memory flags

### build/speex.sh (new file)
- Create build script for Speex

### Makefile
- Update memory flags (optional, can be done in ffmpeg-wasm.sh)

---

## 📊 Expected Results

### Before (Phase 0 Baseline)
- ST WASM: ~25-35MB raw, ~8-12MB gzipped
- MT WASM: ~28-38MB raw, ~9-13MB gzipped
- Load time: 2-4s (4G), 5-12s (3G)
- Memory: 60-120MB idle

### After (Phase 1 Complete)
- ST WASM: ~4-6MB raw, ~1.2-1.8MB gzipped
- MT WASM: ~5-7MB raw, ~1.5-2MB gzipped
- Load time: 0.4-0.8s (4G), 1-2s (3G)
- Memory: 16-60MB idle

**Size reduction:** 75-85%
**Load time improvement:** 5-10x on 3G

---

## ✅ Success Criteria

Phase 1 is complete when:
- [x] Build completes successfully (ST and MT)
- [x] Size reduced by at least 70%
- [x] All audio formats work (MP3, FLAC, Opus, Vorbis, WAV, ALAC, WavPack, Speex)
- [x] No video codecs remain
- [x] Test suite passes (audio tests)
- [x] Phase 1 metrics documented

---

## 🚀 Getting Started

**Next:** Open `STEP_01_remove_video.md` and begin removing video codecs.

**Remember:** The build will be broken until step 9, so don't attempt to build until all changes are complete!
