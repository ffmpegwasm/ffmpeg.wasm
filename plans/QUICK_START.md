# Quick Start Guide

Get started with the audio optimization implementation in 5 minutes.

---

## ⚡ TL;DR

```bash
# 1. Read the plan
cat plans/README.md

# 2. Create branches
git checkout -b feat/audio-optimization
git checkout -b phase-0-baseline

# 3. Follow Phase 0
cat plans/phase-0-baseline.md

# 4. Execute step-by-step
# ... work through each step ...

# 5. Update progress
# Edit plans/PROGRESS.md after each step
```

---

## 📋 Pre-flight Checklist

Before starting Phase 0:

- [ ] WSL2 Ubuntu environment ready
- [ ] Docker Desktop installed with WSL2 integration
- [ ] Git repository cloned
- [ ] Read `plans/IMPLEMENTATION_PLAN.md`
- [ ] Read `plans/phase-0-baseline.md`
- [ ] Understand the goal: 31MB → 3-5MB

---

## 🎯 Phase 0 Quick Guide

**Goal:** Establish baseline before making changes

**Time:** 2 days

**Key Steps:**

1. **Verify environment** (30 min)
   ```bash
   mise --version
   docker info
   pnpm --version
   ```

2. **Build current version** (45 min)
   ```bash
   pnpm install
   make build-st
   ```

3. **Measure sizes** (15 min)
   ```bash
   ls -lh packages/core/dist/umd/ffmpeg-core.wasm
   gzip -c packages/core/dist/umd/ffmpeg-core.wasm | wc -c
   ```

4. **Create benchmarks** (2 hours)
   - Create benchmark script
   - Run performance tests
   - Document results

5. **Document baseline** (1 hour)
   - Complete `BASELINE_METRICS.md`
   - Commit all changes
   - Tag baseline: `baseline-v1`

**Exit Criteria:**
- ✅ Build system works
- ✅ Current sizes documented
- ✅ Benchmarks running
- ✅ Ready for Phase 1

---

## 🚀 Phase 1 Quick Guide

**Goal:** Remove video/subtitle/image code

**Time:** 5 days

**Expected:** 70-85% size reduction

**High-Level Steps:**

1. **Remove video codecs** from Dockerfile
2. **Remove subtitle stack** from Dockerfile
3. **Remove image processing** from Dockerfile
4. **Update FFmpeg configure** with audio-only flags
5. **Build and test**
6. **Measure and celebrate** 🎉

**Exit Criteria:**
- ✅ Build succeeds
- ✅ Size reduced by 70-85%
- ✅ All audio tests pass
- ✅ Video operations fail (as expected)

---

## 📊 Critical Metrics to Track

Update after each phase:

| Phase | Size (MB) | Reduction | Load Time | Status |
|-------|-----------|-----------|-----------|--------|
| Baseline | ? | - | ? | Phase 0 |
| Phase 1 | ? | ?% | ? | Not Started |
| Phase 2 | ? | ?% | ? | Not Started |
| Phase 3 | ? | ?% | ? | Not Started |
| Final | 3-5MB | 84-90% | <3s | Target |

---

## 🎬 Your First Session

**Day 1 Morning: Setup** (4 hours)

```bash
# 1. Environment check (30 min)
mise install
pnpm install
docker info

# 2. First build attempt (1 hour)
make build-st
# If it fails, debug Docker/WSL integration

# 3. Size measurement (30 min)
cd packages/core/dist/umd
ls -lh *.wasm
gzip -c ffmpeg-core.wasm | wc -c
brotli -c ffmpeg-core.wasm | wc -c

# 4. Document findings (1 hour)
# Start filling in plans/BASELINE_METRICS.md

# 5. Commit progress (30 min)
git add plans/BASELINE_METRICS.md
git commit -m "phase-0: initial size measurements"
```

**Day 1 Afternoon: Benchmarks** (4 hours)

```bash
# 1. Create benchmark script (2 hours)
# Copy from plans/phase-0-baseline.md Step 0.5

# 2. Run benchmarks (1 hour)
pnpm run benchmark:baseline

# 3. Document results (1 hour)
# Update BASELINE_METRICS.md with performance data

# 4. Commit
git add tests/benchmarks/ plans/BASELINE_METRICS.md
git commit -m "phase-0: add baseline benchmarks"
```

---

## 💡 Pro Tips

1. **Commit Often**
   - After each step
   - Use clear messages: `phase-N: step-M: description`

2. **Test Before Committing**
   ```bash
   npm test  # Should pass
   ```

3. **Update Progress Daily**
   ```bash
   # Edit plans/PROGRESS.md
   # Check off completed steps
   # Add notes about any issues
   ```

4. **Document Unexpected Issues**
   - Add to risk log in PROGRESS.md
   - Document the solution
   - Help future contributors

5. **Celebrate Wins**
   - Tag major milestones
   - Document impressive metrics
   - Share progress

---

## 🆘 Common Issues

### Issue: Docker build fails

**Solution:**
```bash
# Check Docker is running
docker ps

# Check WSL integration
docker info | grep "Operating System"

# Restart Docker Desktop
# Enable WSL integration for your distro
```

### Issue: Build succeeds but output is huge

**Solution:**
- You might be looking at debug build
- Use production build: `make prd`
- Check compression: `gzip -c file.wasm | wc -c`

### Issue: Benchmarks fail to load ffmpeg

**Solution:**
```bash
# Make sure package is built
ls packages/core/dist/umd/

# Check if built correctly
file packages/core/dist/umd/ffmpeg-core.wasm
# Should show: "WebAssembly (wasm) binary module"
```

---

## 📞 Need Help?

1. **Review detailed plans:**
   - `phase-0-baseline.md` for current phase
   - `improvements.md` for technical details

2. **Check progress tracker:**
   - `PROGRESS.md` for known issues
   - Risk log for similar problems

3. **Rollback if needed:**
   ```bash
   git checkout phase-N-branch
   git reset --hard <last-good-commit>
   ```

---

## ✅ Daily Workflow

```bash
# Morning:
# 1. Review today's steps in phase plan
cat plans/phase-N-name.md

# 2. Check progress
cat plans/PROGRESS.md

# During work:
# 3. Execute steps
# 4. Test after each step
# 5. Commit

# End of day:
# 6. Update PROGRESS.md
# 7. Push changes
git push origin phase-N-branch
```

---

## 🎯 Remember

- **Phase 0 is critical** - Get accurate baseline
- **Phase 1 is the big win** - 70-85% reduction
- **Test everything** - Don't skip validation
- **Document as you go** - Future you will thank you
- **It's okay to take longer** - Correctness > speed

---

## 🏁 Ready?

**Start with:**
```bash
cat plans/phase-0-baseline.md
```

**Track progress in:**
```bash
plans/PROGRESS.md
```

**Ask questions via:**
- Review `improvements.md`
- Check phase-specific plans
- Document new issues in PROGRESS.md

**Good luck! You've got this! 🚀**

---

**Last Updated:** 2025-10-09
