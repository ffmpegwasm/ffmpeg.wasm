# FFmpeg.wasm Audio Optimization - Master TODO

**Branch:** `feat/audio-optimization`
**Start Date:** 2025-10-09
**Current Phase:** Phase 0 - Baseline & Validation

---

## 🎯 Overall Progress

- [x] **Phase 0:** Baseline & Validation (2/2 steps) ✅
- [ ] **Phase 1:** Critical Mass Reduction (0/9 steps)
- [ ] **Phase 2:** Library Updates & Optimization (0/7 steps)
- [ ] **Phase 3:** Safety & UX (0/7 steps)
- [ ] **Phase 4:** Build Strategy & Polish (0/5 steps)
- [ ] **Phase 5:** Delivery & Scale (0/4 steps)

**Total:** 2/34 steps complete

---

## 📋 Phase 0: Baseline & Validation

**Goal:** Establish current state metrics before any changes
**Duration:** 1-2 days
**Directory:** `plans/phase-0/`

- [x] **STEP_01:** Build current production versions (ST & MT) ✅
  - File: `plans/phase-0/STEP_01_build_current.md`
  - Output: Working `packages/core/dist/` and `packages/core-mt/dist/`
  - Commit: `chore: establish baseline build for audio optimization` (b8560fe)

- [x] **STEP_02:** Measure and document baseline metrics ✅
  - File: `plans/phase-0/STEP_02_measure_baseline.md`
  - Output: `plans/phase-0/BASELINE_METRICS.md`
  - Commit: `docs: add baseline metrics for audio optimization` (f9f5b45)

**Phase 0 Complete:** [x] ✅
**Checkpoint branch:** `phase-0-complete`

---

## 🏆 Phase 1: Critical Mass Reduction

**Goal:** 75-85% size reduction via audio-only build
**Duration:** 3-5 days
**Directory:** `plans/phase-1/`

- [ ] **STEP_01:** Remove video codec libraries (x264, x265, libvpx, theora)
  - File: `plans/phase-1/STEP_01_remove_video.md`
  - Savings: ~9-10MB
  - Commit: `feat: remove video codecs for audio-only build`

- [ ] **STEP_02:** Remove subtitle/font rendering (freetype2, fribidi, harfbuzz, libass)
  - File: `plans/phase-1/STEP_02_remove_subtitles.md`
  - Savings: ~2-3MB
  - Commit: `feat: remove subtitle libraries for audio-only build`

- [ ] **STEP_03:** Remove image processing (libwebp, zimg)
  - File: `plans/phase-1/STEP_03_remove_images.md`
  - Savings: ~1-2MB
  - Commit: `feat: remove image processing libraries for audio-only build`

- [ ] **STEP_04:** Configure FFmpeg for audio-only (--disable-everything + enable audio)
  - File: `plans/phase-1/STEP_04_audio_only_config.md`
  - Savings: ~2-4MB
  - Commit: `feat: configure ffmpeg with audio-only flags`

- [ ] **STEP_05:** Replace custom zlib with Emscripten's built-in
  - File: `plans/phase-1/STEP_05_replace_zlib.md`
  - Savings: ~200-300KB
  - Commit: `feat: use Emscripten's built-in zlib`

- [ ] **STEP_06:** Add WavPack codec support
  - File: `plans/phase-1/STEP_06_add_wavpack.md`
  - Cost: ~200KB
  - Commit: `feat: add WavPack codec support`

- [ ] **STEP_07:** Add Speex codec support
  - File: `plans/phase-1/STEP_07_add_speex.md`
  - Cost: ~150KB
  - Commit: `feat: add Speex codec support`

- [ ] **STEP_08:** Optimize memory configuration for audio workloads
  - File: `plans/phase-1/STEP_08_memory_config.md`
  - Benefit: 50-70% less initial memory
  - Commit: `perf: optimize memory settings for audio processing`

- [ ] **STEP_09:** Build, validate, and compare to baseline
  - File: `plans/phase-1/STEP_09_validate.md`
  - Output: Phase 1 metrics comparison
  - Commit: `test: validate phase 1 audio-only build`

**Phase 1 Complete:** [ ]
**Checkpoint branch:** `phase-1-complete`

---

## 🥈 Phase 2: Library Updates & Optimization

**Goal:** 20-30% performance improvement + security fixes
**Duration:** 3-5 days
**Directory:** `plans/phase-2/`

- [ ] **STEP_01:** Update Emscripten 3.1.40 → 3.1.71
  - File: `plans/phase-2/STEP_01_update_emscripten.md`
  - Benefit: 5-10% smaller, 20-30% faster pthreads
  - Commit: `build: update Emscripten to 3.1.71`

- [ ] **STEP_02:** Update Opus 1.3.1 → 1.5.2
  - File: `plans/phase-2/STEP_02_update_opus.md`
  - Benefit: 10-15% encoding performance
  - Commit: `build: update Opus to 1.5.2`

- [ ] **STEP_03:** Update Vorbis 1.3.3 → 1.3.7 (SECURITY)
  - File: `plans/phase-2/STEP_03_update_vorbis.md`
  - Benefit: Security fixes (12 years old!)
  - Commit: `security: update Vorbis to 1.3.7`

- [ ] **STEP_04:** Update FFmpeg n5.1.4 → n6.1.2 LTS
  - File: `plans/phase-2/STEP_04_update_ffmpeg.md`
  - Benefit: 20-30% faster FLAC, bug fixes
  - Commit: `build: update FFmpeg to n6.1.2 LTS`

- [ ] **STEP_05:** Add aggressive compiler optimizations
  - File: `plans/phase-2/STEP_05_compiler_opts.md`
  - Benefit: 10-20% perf, 15-25% size
  - Commit: `perf: add aggressive compiler optimizations`

- [ ] **STEP_06:** Enable missing decoders (TTA, TAK, APE)
  - File: `plans/phase-2/STEP_06_enable_decoders.md`
  - Cost: 0 (built-in to FFmpeg)
  - Commit: `feat: enable TTA, TAK, APE decoders`

- [ ] **STEP_07:** Build, validate, and benchmark performance
  - File: `plans/phase-2/STEP_07_validate.md`
  - Output: Phase 2 performance comparison
  - Commit: `test: validate phase 2 optimizations`

**Phase 2 Complete:** [ ]
**Checkpoint branch:** `phase-2-complete`

---

## 🛡️ Phase 3: Safety & UX

**Goal:** 80% reduction in user errors, better mobile experience
**Duration:** 3-4 days
**Directory:** `plans/phase-3/`

- [ ] **STEP_01:** Implement comprehensive error handling system
  - File: `plans/phase-3/STEP_01_error_handling.md`
  - Files: `packages/ffmpeg/src/errors.ts`
  - Commit: `feat: add comprehensive error handling with user-friendly messages`

- [ ] **STEP_02:** Add memory pre-checks and warnings
  - File: `plans/phase-3/STEP_02_memory_checks.md`
  - Update: `packages/ffmpeg/src/classes.ts`
  - Commit: `feat: add memory pre-checks to prevent OOM crashes`

- [ ] **STEP_03:** Implement magic number format detection
  - File: `plans/phase-3/STEP_03_format_detection.md`
  - Files: `packages/util/src/detector.ts`
  - Commit: `feat: add instant format detection via magic numbers`

- [ ] **STEP_04:** Add better progress reporting with ETA
  - File: `plans/phase-3/STEP_04_progress_api.md`
  - Update: `packages/ffmpeg/src/classes.ts`
  - Commit: `feat: add progress reporting with ETA and speed`

- [ ] **STEP_05:** Create format presets API
  - File: `plans/phase-3/STEP_05_presets_api.md`
  - Files: `packages/ffmpeg/src/presets.ts`
  - Commit: `feat: add encoder presets API for common use cases`

- [ ] **STEP_06:** Ensure metadata preservation by default
  - File: `plans/phase-3/STEP_06_metadata.md`
  - Update: `src/bind/ffmpeg/bind.js`
  - Commit: `feat: preserve metadata by default in conversions`

- [ ] **STEP_07:** Validate all UX improvements
  - File: `plans/phase-3/STEP_07_validate.md`
  - Output: UX validation report
  - Commit: `test: validate phase 3 UX improvements`

**Phase 3 Complete:** [ ]
**Checkpoint branch:** `phase-3-complete`

---

## 🎨 Phase 4: Build Strategy & Polish

**Goal:** 60-75% faster perceived load for 80% of users
**Duration:** 3-4 days
**Directory:** `plans/phase-4/`

- [ ] **STEP_01:** Create micro build variant
  - File: `plans/phase-4/STEP_01_micro_build.md`
  - Files: `Dockerfile.micro`, Makefile updates
  - Commit: `feat: add micro build variant (~600-800KB gzipped)`

- [ ] **STEP_02:** Implement smart build loading
  - File: `plans/phase-4/STEP_02_smart_loading.md`
  - Files: `packages/ffmpeg/src/variants.ts`, `packages/ffmpeg/src/utils.ts`
  - Commit: `feat: add smart build selection (micro vs full, ST vs MT)`

- [ ] **STEP_03:** Add browser capabilities detection
  - File: `plans/phase-4/STEP_03_capabilities.md`
  - Files: `packages/ffmpeg/src/capabilities.ts`
  - Commit: `feat: add browser capabilities detection`

- [ ] **STEP_04:** Implement comprehensive testing framework
  - File: `plans/phase-4/STEP_04_testing_framework.md`
  - Files: `tests/benchmarks/`, `tests/formats.test.ts`, `tests/memory.test.ts`
  - Commit: `test: add comprehensive testing framework`

- [ ] **STEP_05:** Validate all builds and run full test suite
  - File: `plans/phase-4/STEP_05_validate.md`
  - Output: Full build validation report
  - Commit: `test: validate phase 4 build strategy`

**Phase 4 Complete:** [ ]
**Checkpoint branch:** `phase-4-complete`

---

## 🚀 Phase 5: Delivery & Scale

**Goal:** Production-ready deployment with optimal delivery
**Duration:** 2-3 days
**Directory:** `plans/phase-5/`

- [ ] **STEP_01:** Implement service worker caching
  - File: `plans/phase-5/STEP_01_service_worker.md`
  - Files: `public/sw.js`, registration helpers
  - Commit: `feat: add service worker for offline support`

- [ ] **STEP_02:** Add Brotli compression to build process
  - File: `plans/phase-5/STEP_02_brotli.md`
  - Update: Makefile, build scripts
  - Commit: `build: add Brotli compression (15-20% better than gzip)`

- [ ] **STEP_03:** Implement streaming API for large files
  - File: `plans/phase-5/STEP_03_streaming_api.md`
  - Update: `packages/ffmpeg/src/classes.ts`
  - Commit: `feat: add streaming API for large file processing`

- [ ] **STEP_04:** Production deployment and monitoring
  - File: `plans/phase-5/STEP_04_deployment.md`
  - Output: Deployment guide, monitoring setup
  - Commit: `docs: add production deployment guide`

**Phase 5 Complete:** [ ]
**Checkpoint branch:** `phase-5-complete`

---

## 🎉 Project Complete!

**Expected Outcomes:**
- 📦 Bundle size: 10MB → 800KB gzipped (92% reduction)
- ⚡ Load time: 5-10s → 0.5-1s on 3G (90% faster)
- 💾 Memory: 1024MB → 16-128MB (87-98% less)
- 🚀 Conversion speed: +30% faster
- 📱 Mobile support: Transformative improvement
- ✅ Error clarity: +80% improvement

---

## 📝 Notes Section

Use this space to track deviations, issues, or decisions:

```
[Date] [Phase-Step] [Note]
---
Example:
2025-10-09 Phase-0-01 Docker build took 45 minutes on this machine
2025-10-10 Phase-1-04 Had to adjust --enable-demuxer list for CAF format
```

---

---

**Notes Added:**

```
2025-10-09 Phase-0-01 Docker buildx build took ~32 minutes for ST, ~32 minutes for MT
2025-10-09 Phase-0-01 Baseline sizes: ST 9.79MB gzipped, MT 9.84MB gzipped
2025-10-09 Phase-0-02 npm install failed (esbuild conflict), but builds successful
2025-10-09 Phase-0-02 Baseline documented in BASELINE_METRICS.md
```

---

**Last Updated:** 2025-10-09 21:19 CEST
**Current Phase:** Phase 1 - Critical Mass Reduction
**Current Step:** Phase 1, Step 1
**Status:** Phase 0 complete ✅ - Ready to begin Phase 1
