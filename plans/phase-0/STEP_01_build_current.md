# Phase 0, Step 1: Build Current Production Versions

**Duration:** 30-60 minutes
**Prerequisites:** Docker installed and running in WSL2

---

## 🎯 Objective

Build the current production versions (ST and MT) to establish a baseline. This gives us the "before" state to compare against after optimizations.

---

## 📋 Prerequisites Check

Before starting, verify:

```bash
# 1. Docker is running in WSL2
docker info

# 2. You're in the repo root
pwd  # Should show: /home/raul/repos/ffmpeg.wasm

# 3. Repository is clean (or changes are stashed)
git status

# 4. You're on the correct branch
git checkout -b feat/audio-optimization
```

---

## 🔨 Build Commands

### Option 1: Production Builds (Recommended for Baseline)

```bash
# Build single-threaded production version
make prd

# Build multi-threaded production version
make prd-mt
```

**Note:** Production builds take 30-60 minutes depending on your machine. They use:
- `-O3` optimization
- `-msimd128` SIMD support
- No debug symbols

### Option 2: Development Builds (Faster, but not representative)

If you just want to verify the build process works:

```bash
# Development builds (~15-20 minutes)
make dev      # Single-threaded
make dev-mt   # Multi-threaded
```

**⚠️ For accurate baseline metrics, use production builds!**

---

## ✅ Verification

After builds complete, verify the outputs:

```bash
# Check ST build
ls -lh packages/core/dist/umd/
# Expected files:
# - ffmpeg-core.js
# - ffmpeg-core.wasm

# Check MT build
ls -lh packages/core-mt/dist/umd/
# Expected files:
# - ffmpeg-core.js
# - ffmpeg-core.wasm
# - ffmpeg-core.worker.js

# Check ESM builds too
ls -lh packages/core/dist/esm/
ls -lh packages/core-mt/dist/esm/
```

**Expected output:** You should see `.js` and `.wasm` files in each directory.

---

## 🧪 Test the Builds

Verify the builds work correctly:

```bash
# Run the test suite
npm test
```

**Expected result:** All tests should pass. If any fail, note them but continue (we'll compare against this baseline).

---

## 📝 Document Any Issues

If you encounter problems:

1. **Docker build fails:**
   - Check Docker is running: `docker info`
   - Check disk space: `df -h`
   - Note the error message

2. **Tests fail:**
   - Note which tests failed
   - This is okay - we'll compare phase 1 tests against this baseline

3. **Build takes very long:**
   - Note the duration
   - Check Docker resource allocation (CPU/RAM)

---

## 💾 Save Build Artifacts (Optional but Recommended)

To preserve exact baseline builds:

```bash
# Create baseline backup directory
mkdir -p .baseline-builds

# Copy ST build
cp -r packages/core/dist .baseline-builds/core-st

# Copy MT build
cp -r packages/core-mt/dist .baseline-builds/core-mt

# Record build timestamp
date > .baseline-builds/BUILD_DATE.txt
```

---

## 📊 Quick Size Check

Get a quick preview of sizes:

```bash
# ST build size
du -sh packages/core/dist/
ls -lh packages/core/dist/umd/ffmpeg-core.wasm

# MT build size
du -sh packages/core-mt/dist/
ls -lh packages/core-mt/dist/umd/ffmpeg-core.wasm
```

**Note:** Write these down! You'll need them in the next step.

---

## ✅ Completion Checklist

- [ ] Docker verified working in WSL2
- [ ] Created `feat/audio-optimization` branch
- [ ] ST production build completed successfully
- [ ] MT production build completed successfully
- [ ] Build artifacts exist in `packages/core/dist/` and `packages/core-mt/dist/`
- [ ] Test suite executed (pass/fail noted)
- [ ] Quick size check performed
- [ ] (Optional) Baseline builds backed up to `.baseline-builds/`

---

## 🎯 Success Criteria

✅ **This step is complete when:**
- Both ST and MT builds exist and contain `.wasm` and `.js` files
- You've noted the approximate sizes
- Tests have been run (even if some fail)

---

## 📝 Git Commit

Once complete, commit the baseline documentation:

```bash
# Stage any documentation you created
git add .baseline-builds/  # If you created backups

# Commit
git commit -m "chore: establish baseline build for audio optimization

- Built ST production version
- Built MT production version
- Verified build artifacts
- Ran test suite
- Documented sizes for baseline comparison"
```

---

## ➡️ Next Step

**Proceed to:** `STEP_02_measure_baseline.md`

You'll now measure these builds in detail and create the official `BASELINE_METRICS.md` document.
