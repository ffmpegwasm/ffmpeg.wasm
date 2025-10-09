# Phase 0, Step 2: Measure and Document Baseline

**Duration:** 60-90 minutes
**Prerequisites:** Completed STEP_01 (builds exist)

---

## 🎯 Objective

Create a comprehensive baseline metrics document that captures the current state of ffmpeg.wasm. This will be our reference point for measuring all future improvements.

---

## 📋 Prerequisites Check

```bash
# Verify builds exist
ls packages/core/dist/umd/ffmpeg-core.wasm
ls packages/core-mt/dist/umd/ffmpeg-core.wasm

# Both commands should show the files
```

---

## 📏 Part 1: Size Measurements

### Raw Sizes

```bash
# ST build raw sizes
echo "=== ST Build Raw Sizes ==="
ls -lh packages/core/dist/umd/ffmpeg-core.wasm
ls -lh packages/core/dist/umd/ffmpeg-core.js
du -sh packages/core/dist/

# MT build raw sizes
echo "=== MT Build Raw Sizes ==="
ls -lh packages/core-mt/dist/umd/ffmpeg-core.wasm
ls -lh packages/core-mt/dist/umd/ffmpeg-core.js
ls -lh packages/core-mt/dist/umd/ffmpeg-core.worker.js
du -sh packages/core-mt/dist/
```

**Record these numbers** - you'll add them to `BASELINE_METRICS.md`

### Gzipped Sizes (what users actually download)

```bash
# ST gzipped
gzip -c packages/core/dist/umd/ffmpeg-core.wasm | wc -c
gzip -c packages/core/dist/umd/ffmpeg-core.js | wc -c

# MT gzipped
gzip -c packages/core-mt/dist/umd/ffmpeg-core.wasm | wc -c
gzip -c packages/core-mt/dist/umd/ffmpeg-core.js | wc -c
gzip -c packages/core-mt/dist/umd/ffmpeg-core.worker.js | wc -c
```

### Brotli Sizes (if available)

```bash
# Install brotli if not present
which brotli || sudo apt-get install -y brotli

# ST brotli
brotli -c packages/core/dist/umd/ffmpeg-core.wasm | wc -c
brotli -c packages/core/dist/umd/ffmpeg-core.js | wc -c

# MT brotli
brotli -c packages/core-mt/dist/umd/ffmpeg-core.wasm | wc -c
brotli -c packages/core-mt/dist/umd/ffmpeg-core.js | wc -c
brotli -c packages/core-mt/dist/umd/ffmpeg-core.worker.js | wc -c
```

---

## 🔍 Part 2: Codec Support Inventory

### Method 1: Via Docker (if ffmpeg binary accessible)

```bash
# Try to get codec list from Docker build
docker build -q -t ffmpeg-wasm-baseline .

# List audio codecs (decoders)
docker run --rm ffmpeg-wasm-baseline ffmpeg -codecs 2>&1 | grep -E " D.A" | head -20

# List audio codecs (encoders)
docker run --rm ffmpeg-wasm-baseline ffmpeg -codecs 2>&1 | grep -E " .EA" | head -20
```

### Method 2: Via Test Suite Observation

```bash
# Run tests and observe which formats are tested
npm test 2>&1 | grep -i "format\|codec"
```

### Method 3: Manual Inspection

Check the Dockerfile to see what's currently built:

```bash
# See what libraries are currently built
grep -E "FROM.*AS.*-builder" Dockerfile
grep -E "enable-lib" Dockerfile
```

**Document:** List of currently supported codecs and containers

---

## ⚡ Part 3: Performance Benchmarks

### Create Baseline Benchmark Script

Create `tests/benchmarks/baseline-measure.js`:

```javascript
#!/usr/bin/env node

const { FFmpeg } = require('../../packages/ffmpeg/dist/umd/ffmpeg.js');
const fs = require('fs');

async function measureBaseline() {
  console.log('=== FFmpeg.wasm Baseline Measurements ===\n');

  // Measure load time (cold)
  console.log('Measuring load time...');
  const ffmpeg = new FFmpeg();

  const loadStart = Date.now();
  await ffmpeg.load({
    coreURL: '../../packages/core/dist/umd/ffmpeg-core.js'
  });
  const loadEnd = Date.now();
  const loadTime = loadEnd - loadStart;

  console.log(`Load time (cold cache): ${loadTime}ms`);

  // Measure memory after load
  if (process.memoryUsage) {
    const mem = process.memoryUsage();
    console.log(`Memory after load: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
  }

  // Create test file (1MB of silence)
  console.log('\nCreating test file (1MB WAV)...');
  const testSize = 1024 * 1024; // 1MB
  const testData = Buffer.alloc(testSize);
  await ffmpeg.writeFile('test.wav', testData);

  // Measure conversion time
  console.log('Measuring conversion time (WAV to MP3)...');
  const convertStart = Date.now();
  await ffmpeg.exec(['-i', 'test.wav', '-codec:a', 'libmp3lame', '-b:a', '192k', 'test.mp3']);
  const convertEnd = Date.now();
  const convertTime = convertEnd - convertStart;

  console.log(`Conversion time (1MB): ${convertTime}ms`);

  // Read output to verify it worked
  const output = await ffmpeg.readFile('test.mp3');
  console.log(`Output size: ${output.length} bytes`);

  ffmpeg.terminate();

  console.log('\n=== Baseline Measurement Complete ===');
  console.log(`\nSummary:`);
  console.log(`- Load time: ${loadTime}ms`);
  console.log(`- Conversion time: ${convertTime}ms`);
  console.log(`- Output produced: ${output.length > 0 ? 'Yes' : 'No'}`);
}

measureBaseline().catch(console.error);
```

### Run Benchmark

```bash
# Run baseline measurement
node tests/benchmarks/baseline-measure.js
```

**Record:** Load time and conversion time

---

## 📄 Part 4: Create BASELINE_METRICS.md

Create `plans/phase-0/BASELINE_METRICS.md` with this template:

```markdown
# Baseline Metrics - FFmpeg.wasm Audio Optimization

**Date:** [Current Date]
**Branch:** main
**Commit:** [Current commit hash]
**Build Command:** `make prd && make prd-mt`
**Environment:**
- OS: [OS version]
- Docker: [Docker version]
- Emscripten: 3.1.40
- FFmpeg: n5.1.4

---

## Build Sizes

### Single-Threaded (ST) Build

| File | Raw Size | Gzipped | Brotli |
|------|----------|---------|--------|
| ffmpeg-core.wasm | [XX MB] | [XX MB] | [XX MB] |
| ffmpeg-core.js | [XX KB] | [XX KB] | [XX KB] |
| **Total dist/** | [XX MB] | - | - |

### Multi-Threaded (MT) Build

| File | Raw Size | Gzipped | Brotli |
|------|----------|---------|--------|
| ffmpeg-core.wasm | [XX MB] | [XX MB] | [XX MB] |
| ffmpeg-core.js | [XX KB] | [XX KB] | [XX KB] |
| ffmpeg-core.worker.js | [XX KB] | [XX KB] | [XX KB] |
| **Total dist/** | [XX MB] | - | - |

---

## Performance Metrics

### Load Performance

| Metric | Value |
|--------|-------|
| Load time (cold cache) | [XX]ms |
| Load time (warm cache) | [XX]ms |
| Initial memory usage | [XX]MB |

### Conversion Performance

**Test:** 1MB WAV → MP3 (192kbps)

| Metric | Value |
|--------|-------|
| Conversion time | [XX]ms |
| Memory during conversion | [XX]MB |
| Output size | [XX]KB |

---

## Codec Support

### Decoders (Input)

- [ ] MP3
- [ ] AAC
- [ ] Opus
- [ ] Vorbis
- [ ] FLAC
- [ ] ALAC
- [ ] WavPack (if present)
- [ ] Speex (if present)
- [ ] PCM variants

### Encoders (Output)

- [ ] MP3 (libmp3lame)
- [ ] Opus (libopus)
- [ ] Vorbis (libvorbis)
- [ ] FLAC (built-in)
- [ ] PCM variants

### Current Libraries Built

From Dockerfile analysis:
- x264 (video - will be removed)
- x265 (video - will be removed)
- libvpx (video - will be removed)
- lame (MP3)
- opus
- vorbis
- ogg
- theora (video - will be removed)
- libwebp (image - will be removed)
- freetype2 (fonts - will be removed)
- fribidi (text - will be removed)
- harfbuzz (text - will be removed)
- libass (subtitles - will be removed)
- zimg (image - will be removed)
- zlib (will be replaced with Emscripten's)

---

## Test Results

```
[Paste output of: npm test]
```

**Tests Passing:** [X/Y]
**Tests Failing:** [List any failures]

---

## Notes

- [Any observations about current state]
- [Any unexpected findings]
- [Any issues encountered]
```

Fill in the template with your measurements.

---

## ✅ Completion Checklist

- [ ] Measured all ST build sizes (raw, gzipped, brotli)
- [ ] Measured all MT build sizes (raw, gzipped, brotli)
- [ ] Documented current codec support
- [ ] Ran performance benchmarks
- [ ] Created `BASELINE_METRICS.md` with all data
- [ ] Documented test suite results
- [ ] Added environment details (OS, Docker version, etc.)

---

## 📊 Success Criteria

✅ **This step is complete when:**
- `BASELINE_METRICS.md` exists with all sections filled
- You have concrete numbers for sizes, load time, and conversion time
- Current codec support is documented

---

## 📝 Git Commit

```bash
# Add the baseline metrics
git add plans/phase-0/BASELINE_METRICS.md

# Commit
git commit -m "docs: add baseline metrics for audio optimization

Baseline measurements (before optimization):
- ST WASM: [X]MB raw, [X]MB gzipped
- MT WASM: [X]MB raw, [X]MB gzipped
- Load time: [X]ms
- Conversion time: [X]ms
- All current codecs documented

This establishes the reference point for measuring
the impact of audio-only optimizations."
```

---

## 🎉 Phase 0 Complete!

You've successfully established the baseline. Create a checkpoint:

```bash
# Create phase 0 complete branch
git branch phase-0-complete

# Update TODO.md to mark Phase 0 complete
# Then proceed to Phase 1
```

---

## ➡️ Next Phase

**Proceed to:** `plans/phase-1/README.md`

Phase 1 will remove all video, subtitle, and image processing libraries to achieve 70-85% size reduction.
