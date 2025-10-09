# Phase 0: Baseline & Validation

**Goal:** Establish current state metrics before making any changes
**Duration:** 1-2 days
**Prerequisites:** None (starting point)

---

## 📋 Overview

This phase is **mandatory** before any optimization work. You cannot measure improvement without knowing where you started.

### What We'll Do
1. Build current production versions (ST & MT)
2. Measure file sizes (raw and compressed)
3. Benchmark performance
4. Test on target devices
5. Document everything in `BASELINE_METRICS.md`

### Why This Matters
- Provides rollback reference point
- Validates assumptions about current state
- Enables accurate impact measurement
- May reveal unexpected current state

---

## 🎯 Success Criteria

- [x] Both ST and MT builds compile successfully
- [x] Size measurements documented (raw, gzipped, brotli)
- [x] Performance baseline established (load time, conversion speed)
- [x] Current codec support documented
- [x] All existing tests pass
- [x] `BASELINE_METRICS.md` created with all data

---

## 📝 Steps in This Phase

### Step 1: Build Current Production Versions
**File:** `STEP_01_build_current.md`
**Duration:** 30-60 minutes (depending on machine)
**Output:** Working builds in `packages/core/dist/` and `packages/core-mt/dist/`

### Step 2: Measure and Document Baseline
**File:** `STEP_02_measure_baseline.md`
**Duration:** 60-90 minutes
**Output:** `BASELINE_METRICS.md` with comprehensive measurements

---

## 🔍 What We'll Measure

### Build Artifacts
- ST WASM raw size
- ST WASM gzipped size
- ST WASM brotli size
- MT WASM raw size
- MT WASM gzipped size
- MT WASM brotli size
- Total dist/ directory sizes

### Performance
- Load time (cold cache) - 4G connection
- Load time (cold cache) - 3G connection
- Load time (warm cache)
- Conversion speed for different file sizes (1MB, 5MB, 10MB, 25MB, 50MB)
- Memory usage (idle after load)
- Memory usage (during conversion)

### Functionality
- Supported audio codecs (input)
- Supported audio codecs (output)
- Supported containers (input)
- Supported containers (output)
- Test suite results

---

## 📊 Expected Baseline (Approximate)

Based on similar FFmpeg WASM builds:

| Metric | Expected Value |
|--------|---------------|
| ST WASM raw | ~25-35 MB |
| ST WASM gzipped | ~8-12 MB |
| MT WASM raw | ~28-38 MB |
| MT WASM gzipped | ~9-13 MB |
| Load time (4G) | 2-4 seconds |
| Load time (3G) | 5-12 seconds |
| Memory (idle) | 60-120 MB |
| Memory (converting 10MB) | 150-300 MB |

*Note: Your actual measurements may vary.*

---

## ⚠️ Important Notes

- **Don't skip this phase** - It's critical for measuring success
- **Take accurate measurements** - Future decisions depend on this data
- **Document everything** - Include environment details (OS, browser versions, etc.)
- **Run multiple times** - Average results for better accuracy
- **Keep builds** - Don't delete these for comparison later

---

## 🚀 Getting Started

**Next:** Open `STEP_01_build_current.md` and follow the instructions.
