# FFmpeg.wasm Audio Optimization - Implementation Plan

**Target:** Audio-only conversion with 75-85% size reduction and 5-10x performance improvement
**Timeline:** 5-6 weeks
**Branch:** `feat/audio-optimization`

---

## 📋 Implementation Strategy

This plan is organized into **sequential, testable steps**. Each step:
- Has clear success criteria
- Includes verification tests
- Requires a git commit checkpoint
- Can be rolled back independently

---

## 🗂️ Plan Organization

```
plans/
├── IMPLEMENTATION_PLAN.md          (this file - overview)
├── TODO.md                         (master checklist - track overall progress)
├── phase-0/
│   ├── README.md                   (Phase 0 overview)
│   ├── STEP_01_build_current.md    (Build baseline)
│   ├── STEP_02_measure_baseline.md (Measurements)
│   └── BASELINE_METRICS.md         (Results - to be generated)
├── phase-1/
│   ├── README.md                   (Phase 1 overview)
│   ├── STEP_01_remove_video.md     (Remove video codecs)
│   ├── STEP_02_remove_subtitles.md (Remove subtitle libs)
│   ├── STEP_03_remove_images.md    (Remove image libs)
│   ├── STEP_04_audio_only_config.md (FFmpeg audio-only flags)
│   ├── STEP_05_replace_zlib.md     (Use Emscripten zlib)
│   ├── STEP_06_add_wavpack.md      (Add WavPack codec)
│   ├── STEP_07_add_speex.md        (Add Speex codec)
│   ├── STEP_08_memory_config.md    (Optimize memory settings)
│   └── STEP_09_validate.md         (Build & test)
├── phase-2/
│   ├── README.md
│   ├── STEP_01_update_emscripten.md
│   ├── STEP_02_update_opus.md
│   ├── STEP_03_update_vorbis.md
│   ├── STEP_04_update_ffmpeg.md
│   ├── STEP_05_compiler_opts.md
│   ├── STEP_06_enable_decoders.md
│   └── STEP_07_validate.md
├── phase-3/
│   ├── README.md
│   ├── STEP_01_error_handling.md
│   ├── STEP_02_memory_checks.md
│   ├── STEP_03_format_detection.md
│   ├── STEP_04_progress_api.md
│   ├── STEP_05_presets_api.md
│   ├── STEP_06_metadata.md
│   └── STEP_07_validate.md
├── phase-4/
│   ├── README.md
│   ├── STEP_01_micro_build.md
│   ├── STEP_02_smart_loading.md
│   ├── STEP_03_capabilities.md
│   ├── STEP_04_testing_framework.md
│   └── STEP_05_validate.md
└── phase-5/
    ├── README.md
    ├── STEP_01_service_worker.md
    ├── STEP_02_brotli.md
    ├── STEP_03_streaming_api.md
    └── STEP_04_deployment.md
```

---

## 🎯 Success Criteria

### Phase 0 (Baseline)
- ✅ Current builds compile successfully
- ✅ Size measurements documented
- ✅ Performance baseline established
- ✅ Test suite passes

### Phase 1 (Mass Reduction)
- ✅ Build size reduced by 70-85%
- ✅ All audio formats work (MP3, FLAC, Opus, Vorbis, WAV, AIFF, ALAC, WavPack, Speex)
- ✅ Memory footprint reduced by 50-70%
- ✅ Existing tests pass

### Phase 2 (Performance)
- ✅ Conversion speed improved by 20-30%
- ✅ All library updates applied
- ✅ No regressions in functionality
- ✅ Security vulnerabilities patched (Vorbis)

### Phase 3 (UX & Safety)
- ✅ User-friendly error messages
- ✅ Memory pre-checks prevent OOM crashes
- ✅ Instant format detection
- ✅ Progress reporting with ETA

### Phase 4 (Build Strategy)
- ✅ Micro build (<800KB gzipped)
- ✅ Full build (~1.2MB gzipped)
- ✅ Auto-select optimal build
- ✅ Comprehensive test coverage

### Phase 5 (Production)
- ✅ Service worker caching
- ✅ Brotli compression
- ✅ CDN-ready assets
- ✅ Staged rollout complete

---

## 🔄 Workflow Per Step

For each `STEP_XX_*.md`:

1. **Read** the step file
2. **Execute** the changes described
3. **Verify** using the validation section
4. **Test** with provided commands
5. **Commit** with the suggested message
6. **Update** `TODO.md` to mark step complete
7. **Proceed** to next step

---

## 🚨 Rollback Strategy

Each phase builds on the previous:
- **Phase 1 breaks:** Revert to baseline branch
- **Phase 2 breaks:** Revert to end of Phase 1
- **Phase 3+ breaks:** Revert to last working commit

Keep phase branches:
```bash
git branch phase-0-complete  # After Phase 0
git branch phase-1-complete  # After Phase 1
git branch phase-2-complete  # After Phase 2
# etc.
```

---

## 📊 Progress Tracking

**Master checklist:** `plans/TODO.md`
**Current phase:** Check `TODO.md` for active phase
**Current step:** Check `TODO.md` for current step

---

## 🚀 Getting Started

1. **Read:** `plans/TODO.md` for current status
2. **Navigate:** To current phase directory
3. **Execute:** Current step following the workflow above
4. **Report:** Update `TODO.md` after each step

---

## ⚠️ Important Notes

- **Never skip steps** - Each builds on the previous
- **Always test** - Don't commit broken builds
- **Keep baselines** - Branch after each phase
- **Document issues** - Note any deviations in commit messages
- **Ask before major changes** - If step seems unclear

---

## 📞 Support

If stuck on a step:
1. Re-read the step file carefully
2. Check the validation section
3. Review error messages
4. Check if previous steps were completed correctly
5. Ask for clarification

---

**Ready to begin?** → Open `plans/TODO.md`
