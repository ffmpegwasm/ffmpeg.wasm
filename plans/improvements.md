# COMPREHENSIVE IMPROVEMENT RECOMMENDATIONS

Sorted by Impact for Audio-Only Web Conversion App

---
## 🎯 TIER 0: BASELINE & VALIDATION (Must Do First - Before Any Changes)

**0. Establish Current Metrics**

**Impact:** Essential foundation for measuring success

**Why Critical:**
- Can't measure improvement without baseline
- May discover current build is different than expected
- Validates assumptions about current state
- Provides rollback reference

**Tasks:**

1. **Build and measure current version:**
```bash
# Build production versions
make prd && make prd-mt

# Measure raw sizes
ls -lh packages/core/dist/umd/*.wasm
ls -lh packages/core-mt/dist/umd/*.wasm
du -sh packages/core/dist/ packages/core-mt/dist/

# Measure compressed sizes (what users actually download)
gzip -c packages/core/dist/umd/ffmpeg-core.wasm | wc -c
brotli -c packages/core/dist/umd/ffmpeg-core.wasm | wc -c
```

2. **Document current codec support:**
```bash
# If FFmpeg binary is available in build
docker run -it --rm $(docker build -q .) ffmpeg -codecs 2>&1 | grep -E "DEA|D.A|.EA"

# Or test via Node.js after build
node tests/test-helper-st.js
# Then manually test codec support
```

3. **Benchmark performance:**
```typescript
// Create tests/benchmarks/baseline.bench.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';

const BENCHMARK_FILES = {
  small: 1 * 1024 * 1024,   // 1MB
  medium: 10 * 1024 * 1024, // 10MB
  large: 50 * 1024 * 1024,  // 50MB
};

// Measure:
// - Load time (cold cache): performance.now() to ffmpeg.load() complete
// - Load time (warm cache): second load
// - Conversion speed: 1MB, 5MB, 10MB files (MP3→FLAC, WAV→MP3)
// - Memory usage: Chrome DevTools → Performance Monitor
```

4. **Test on target devices:**
- iPhone 12+ (Safari) - Mobile metrics
- Android mid-range (Chrome) - Budget mobile
- Desktop (Chrome/Firefox) - Desktop baseline

5. **Document in `BASELINE_METRICS.md`:**
```markdown
# Current State (as of YYYY-MM-DD)

## Build Sizes
- ST WASM raw: XXX MB
- ST WASM gzipped: XXX MB
- MT WASM raw: XXX MB
- MT WASM gzipped: XXX MB

## Performance
- Load time (4G): XXX ms
- Load time (3G): XXX ms
- Conversion (1MB MP3→FLAC): XXX ms
- Memory usage (idle): XXX MB
- Memory usage (converting 10MB): XXX MB

## Codecs Supported
[List from ffmpeg -codecs output]
```

---
## 🏆 TIER 1: MASSIVE GAINS (Critical - 70-85% improvement)

### **1. Custom Audio-Only Build - Remove ALL Video/Image/Subtitle Components**

**Size Impact:** 70-85% reduction
- Current: 31MB WASM uncompressed (10MB gzipped)
- Target: 3-5MB WASM uncompressed (800KB-1.5MB gzipped)

**Remove from Dockerfile entirely:**

```dockerfile
# ❌ DELETE these builder stages:
# - x264-builder (H.264 encoder) - saves ~2.5MB
# - x265-builder (HEVC encoder) - saves ~3.8MB
# - libvpx-builder (VP8/VP9) - saves ~1.2MB
# - theora-builder (Theora video) - saves ~400KB
# - libwebp-builder (WebP images) - saves ~600KB
# - freetype2-builder (fonts) - saves ~800KB
# - fribidi-builder (bidirectional text) - saves ~200KB
# - harfbuzz-builder (text shaping) - saves ~600KB
# - libass-builder (subtitle rendering) - saves ~500KB
# - zimg-builder (image scaling) - saves ~300KB

# ⚠️ KEEP but modify:
# - zlib: Use Emscripten's built-in instead (needed for FLAC compression)
#   Remove zlib-builder stage, add -sUSE_ZLIB to ffmpeg-wasm.sh
```

**Keep and add:**
```dockerfile
# ✅ KEEP these audio codecs:
# - lame-builder (MP3 encoding) ✓
# - opus-builder (Opus encoding) ✓
# - ogg-builder (Ogg container) ✓
# - vorbis-builder (Vorbis encoding) ✓

# ✅ ADD these:
# - wavpack-builder (WavPack .wv support) ✓
# - speex-builder (Speex .spx support) ✓
```

**FFmpeg configure changes (build/ffmpeg.sh):**

```bash
CONF_FLAGS=(
  --target-os=none
  --arch=x86_32
  --enable-cross-compile
  --disable-asm
  --disable-stripping
  --disable-programs
  --disable-doc
  --disable-debug
  --disable-runtime-cpudetect
  --disable-autodetect

  # AUDIO-ONLY CONFIGURATION
  --disable-everything

  # Protocols
  --enable-protocol=file
  --enable-protocol=pipe
  --disable-network
  --disable-devices

  # Demuxers (input containers)
  --enable-demuxer=wav,aiff,flac,ogg,matroska,webm,mov,mp4,mp3,aac,tta,tak,ape,wv,caf

  # Muxers (output containers)
  --enable-muxer=wav,aiff,flac,ogg,opus,mp3,mp4,ipod,caf,matroska,null

  # Decoders (input codecs)
  --enable-decoder=mp3*,aac*,opus,vorbis,flac,alac,pcm_*,wavpack,speex,tta,ape,tak,ac3,eac3,dts,truehd

  # Encoders (output codecs)
  --enable-encoder=libmp3lame,libopus,libvorbis,flac,alac,pcm_*

  # Parsers
  --enable-parser=vorbis,opus,mpegaudio,flac,aac

  # Audio filters only
  --enable-filter=aresample,aformat,volume,channelmap,channelsplit,pan,loudnorm,equalizer,highpass,lowpass,atrim,aconcat,concat,apad,anull

  # Resampler
  --enable-swresample

  # BSF (bitstream filters)
  --disable-bsfs
  --enable-bsf=aac_adtstoasc,mp3_header_decompress

  # Hardware acceleration (disable all)
  --disable-hwaccels
  --disable-videotoolbox
  --disable-audiotoolbox

  # Postprocessing (not needed for audio)
  --disable-postproc

  # External libraries
  --enable-gpl
  --enable-libmp3lame
  --enable-libopus
  --enable-libvorbis
  --enable-libwavpack
  --enable-libspeex

  # Toolchain (same as before)
  --nm=emnm
  --ar=emar
  --ranlib=emranlib
  --cc=emcc
  --cxx=em++
  --objcc=emcc
  --dep-cc=emcc
  --extra-cflags="$CFLAGS"
  --extra-cxxflags="$CXXFLAGS"

  # Threading
  ${FFMPEG_ST:+ --disable-pthreads --disable-w32threads --disable-os2threads}
)
```

**FFMPEG_LIBS update (build/ffmpeg-wasm.sh):**

```bash
ENV FFMPEG_LIBS \
  -lmp3lame \
  -logg \
  -lvorbis \
  -lvorbisenc \
  -lvorbisfile \
  -lopus \
  -lwavpack \
  -lspeex
# Note: zlib removed, use -sUSE_ZLIB instead
```

**Expected Gains:**
- Bundle size: 75-85% smaller
- Load time: 3-10s → 0.5-1.5s (5-10x faster on 3G)
- Initialization: 1-3s → 0.2-0.5s
- Memory footprint: 40-60% lower
- Mobile compatibility: Poor → Excellent
- User retention: +40-60% (critical for mobile)

---
### **2. Dual Build Strategy: Micro vs Full**

**Impact:** 60-75% faster initial load for common formats

**Create two variants:**

**Micro Build (~600-800KB gzipped):**
- MP3 (LAME)
- Opus
- Vorbis
- FLAC (built-in)
- WAV/AIFF (built-in)
- Targets 80% of conversions

**Full Build (~1-1.5MB gzipped):**
- Everything above PLUS:
- ALAC
- WavPack
- Speex
- TTA, TAK, APE
- Targets power users

**Implementation:**

```typescript
// packages/ffmpeg/src/variants.ts
export enum FFmpegVariant {
  MICRO = 'micro',
  FULL = 'full'
}

export const MICRO_FORMATS = ['mp3', 'opus', 'ogg', 'flac', 'wav', 'aiff'];

// Auto-detect and load appropriate build
export async function loadFFmpegAuto(
  sourceFormat?: string,
  targetFormat?: string
): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  // Check if micro build supports both formats
  const needsMicro =
    (!sourceFormat || MICRO_FORMATS.includes(sourceFormat)) &&
    (!targetFormat || MICRO_FORMATS.includes(targetFormat));

  const variant = needsMicro ? FFmpegVariant.MICRO : FFmpegVariant.FULL;

  await ffmpeg.load({
    coreURL: `/dist/${variant}/ffmpeg-core.js`
  });

  return ffmpeg;
}
```

**User experience:**
- 80% of users: Load only 600-800KB
- First conversion: < 1s load time
- Subsequent: Instant (cached)

---
### **3. Optimize Memory Configuration for Audio**

**Impact:** 50-70% less initial memory, better mobile support

**Current MT build:**
```bash
-sINITIAL_MEMORY=1024MB    # Excessive for audio!
-sPTHREAD_POOL_SIZE=32     # Wasteful!
```

**Optimized for audio:**

```bash
# Multi-threaded build
${FFMPEG_MT:+ -sINITIAL_MEMORY=128MB}
${FFMPEG_MT:+ -sMAXIMUM_MEMORY=2GB}
${FFMPEG_MT:+ -sALLOW_MEMORY_GROWTH=1}
${FFMPEG_MT:+ -sPTHREAD_POOL_SIZE=4}
${FFMPEG_MT:+ -sPTHREAD_POOL_DELAY_LOAD=1}

# Single-threaded build
${FFMPEG_ST:+ -sINITIAL_MEMORY=16MB}
${FFMPEG_ST:+ -sMAXIMUM_MEMORY=512MB}
${FFMPEG_ST:+ -sALLOW_MEMORY_GROWTH=1}
${FFMPEG_ST:+ -sSTACK_SIZE=2MB}
```

**Gains:**
- Startup time: 50% faster on low-end devices
- Can handle multiple tabs/conversions
- Mobile Safari: Works on 2GB devices
- Lower memory pressure = fewer crashes

---
## 🥈 TIER 2: HIGH VALUE (Important - 20-50% improvement)

### **4. Update Critical Libraries (Bug fixes + 15-30% performance)**

**Library Versions to Update:**

| Library    | Current           | Target                | Risk   | Impact | Priority |
|------------|-------------------|-----------------------|--------|--------|----------|
| Emscripten | 3.1.40 (Aug 2023) | 3.1.71 (Jan 2025)     | LOW    | HIGH   | CRITICAL |
| FFmpeg     | n5.1.4 (Jul 2022) | n6.1.2 LTS (Sep 2024) | MEDIUM | HIGH   | HIGH     |
| Opus       | 1.3.1 (Apr 2019)  | 1.5.2 (Feb 2024)      | LOW    | MEDIUM | HIGH     |
| Vorbis     | 1.3.3 (2012!)     | 1.3.7 (Jul 2020)      | LOW    | MEDIUM | MEDIUM   |
| Ogg        | 1.3.4 (Aug 2019)  | 1.3.5 (Jun 2021)      | LOW    | LOW    | MEDIUM   |
| LAME       | master            | 3.100 (Oct 2017)      | LOW    | LOW    | LOW      |

**Critical updates:**

**Emscripten 3.1.40 → 3.1.71:**
- 17 months of improvements
- Better SIMD codegen
- Improved pthread performance (20-30% faster)
- Smaller WASM output (5-10% smaller)
- Better browser compatibility
- Security fixes

**FFmpeg n5.1.4 → n6.1.2:**
- FLAC encoder: 20-30% faster (native improvements)
- Better Opus integration
- AAC decoder improvements (important for MP4 audio extraction)
- Memory leak fixes
- 2.5 years of bug fixes
- Note: Skip n7.x for now (too bleeding edge for production)

**Opus 1.3.1 → 1.5.2:**
- 10-15% encoding performance boost
- DRED (Deep REDundancy) support
- Better music quality at low bitrates
- ARM NEON optimizations (benefits SIMD builds)
- 5 years of improvements!

**Vorbis 1.3.3 → 1.3.7:**
- Security fixes (12 years old!)
- Encoding quality improvements
- Bug fixes

**Implementation order:**
1. Emscripten (safest, biggest impact)
2. Opus (safe, good gains)
3. Vorbis (security-critical)
4. FFmpeg n6.1.2 (test thoroughly)
5. Ogg, LAME (minor)

---
### **5. Add Missing Codecs**

**Missing from your supported formats:**

✅ **WavPack (.wv)** - Need libwavpack
- Add to Dockerfile, configure flags
- ~200KB size increase

✅ **Speex (.spx)** - Need libspeex
- Add to Dockerfile, configure flags
- ~150KB size increase

✅ **TTA, TAK, APE** - Built-in to FFmpeg
- Just enable in configure:
```bash
--enable-decoder=tta,tak,ape
--enable-demuxer=tta,tak,ape
```

⚠️ **MIDI** - Complex
- Requires soundfont rendering (FluidSynth or TiMidity)
- Adds 500KB-2MB + soundfont files
- Recommendation: Document limitation, add later if demanded

---
### **6. Aggressive Compiler Optimizations**

**Current production flags:**
```makefile
PROD_CFLAGS := -O3 -msimd128
```

**Enhanced optimization:**
```makefile
PROD_CFLAGS := -O3 -msimd128 -flto -ffast-math -fno-rtti -fno-exceptions -DNDEBUG
PROD_LDFLAGS := -flto
```

**Emscripten link flags (build/ffmpeg-wasm.sh):**
```bash
--closure 1 \
-sAGGRESSIVE_VARIABLE_ELIMINATION=1 \
-sASSERTIONS=0 \
-sSTACK_OVERFLOW_CHECK=0 \
-sSUPPORT_BIG_ENDIAN=0 \
-sAUTO_NATIVE_LIBRARIES=0 \
-sDYNAMIC_EXECUTION=0 \
-sTEXTDECODER=2
```

**New flags explained:**
- `-flto`: Link-time optimization (5-10% smaller, 5-10% faster)
- `-ffast-math`: Safe for audio processing (2-5% faster)
- `--closure 1`: Advanced closure compiler (10-15% smaller JS)
- `-sAGGRESSIVE_VARIABLE_ELIMINATION=1`: Smaller WASM (2-5%)
- `-sDYNAMIC_EXECUTION=0`: No eval/Function constructor (smaller, safer)

**Expected gain:** 10-20% performance, 15-25% size reduction

---
### **7. Smart Threading Strategy**

**Impact:** Better UX + smaller default bundle

**Current problem:**
- Always loads 32-thread MT build (larger)
- Requires COOP/COEP headers (hosting limitation)
- Overkill for small files

**Smart strategy:**

```typescript
// packages/ffmpeg/src/utils.ts
export async function selectOptimalBuild(options: {
  fileSize?: number;
  isMobile?: boolean;
  preferMT?: boolean;
}): Promise<'st' | 'mt'> {
  const { fileSize, isMobile, preferMT } = options;

  // Check if MT is available
  const hasSAB = typeof SharedArrayBuffer !== 'undefined';
  const isCrossOriginIsolated = crossOriginIsolated ?? false;

  if (!hasSAB || !isCrossOriginIsolated) {
    return 'st'; // MT not available
  }

  // Small files don't benefit from MT
  if (fileSize && fileSize < 50 * 1024 * 1024) { // < 50MB
    return 'st';
  }

  // Mobile: be conservative
  if (isMobile) {
    return fileSize && fileSize > 100 * 1024 * 1024 ? 'mt' : 'st';
  }

  // Desktop: use MT if preferred or large file
  return preferMT ? 'mt' : 'st';
}
```

**MT build optimization:**
```bash
# Reduce from 32 to 4 threads for audio
-sPTHREAD_POOL_SIZE=4
```

**Gains:**
- 70% of users: Faster load (ST is smaller)
- No COOP/COEP requirement for most users
- Better hosting flexibility

---
## 🔧 TIER 2.5: USER EXPERIENCE SAFETY (15-25% UX improvement)

### **8. Comprehensive Error Handling System**

**Impact:** 80% reduction in user confusion, better debugging

**Current issue:**
- Generic error messages from FFmpeg stderr
- No recovery suggestions
- Users don't know what went wrong

**Implementation:**

```typescript
// packages/ffmpeg/src/errors.ts
export enum FFmpegErrorCode {
  NOT_LOADED = 'NOT_LOADED',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
  INVALID_ARGUMENTS = 'INVALID_ARGUMENTS',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  TIMEOUT = 'TIMEOUT',
  CORRUPTED_FILE = 'CORRUPTED_FILE',
}

export class FFmpegError extends Error {
  constructor(
    public code: FFmpegErrorCode,
    message: string,
    public recoverable: boolean = false,
    public suggestion?: string,
    public technicalDetails?: string
  ) {
    super(message);
    this.name = 'FFmpegError';
  }
}

// Parse FFmpeg stderr into user-friendly errors
export function parseFFmpegError(stderr: string): FFmpegError {
  if (stderr.includes('Invalid data found')) {
    return new FFmpegError(
      FFmpegErrorCode.UNSUPPORTED_FORMAT,
      'File format not supported or file is corrupted',
      false,
      'Please check the file format. Supported: MP3, FLAC, WAV, Opus, Vorbis, ALAC, WavPack',
      stderr
    );
  }

  if (stderr.includes('Cannot allocate memory')) {
    return new FFmpegError(
      FFmpegErrorCode.OUT_OF_MEMORY,
      'Insufficient memory to process this file',
      true,
      'Try using a smaller file, or close other browser tabs to free up memory',
      stderr
    );
  }

  if (stderr.includes('No such file')) {
    return new FFmpegError(
      FFmpegErrorCode.FILE_NOT_FOUND,
      'Input file not found',
      false,
      'The file may not have been written to the virtual filesystem correctly',
      stderr
    );
  }

  // Generic fallback
  return new FFmpegError(
    FFmpegErrorCode.CONVERSION_FAILED,
    'Conversion failed',
    false,
    'Check the console for technical details',
    stderr
  );
}
```

**Benefits:**
- Users understand what went wrong
- Actionable recovery suggestions
- Better support requests (error codes)
- Reduced confusion and frustration

---
### **9. Memory Pre-checks & Warnings**

**Impact:** 50% reduction in OOM crashes

**Current issue:**
- Users start conversion, then crash halfway through
- No warning before attempting large file
- Poor mobile experience

**Implementation:**

```typescript
// packages/ffmpeg/src/classes.ts
export class FFmpeg {
  private checkMemoryAvailable(requiredMB: number): boolean {
    const available = (performance as any).memory?.jsHeapSizeLimit;
    if (!available) return true; // Can't determine, proceed cautiously

    const availableMB = available / (1024 * 1024);
    return availableMB >= requiredMB * 1.5; // 50% safety margin
  }

  private async estimateMemoryNeeded(files: string[]): Promise<number> {
    let totalSize = 0;
    for (const file of files) {
      try {
        const data = await this.readFile(file);
        totalSize += data.length;
      } catch {
        // File not yet written, skip
      }
    }
    // Audio conversion typically needs 2-3x input size
    // (input buffer + output buffer + working memory)
    return (totalSize / (1024 * 1024)) * 2.5;
  }

  public async exec(
    args: string[],
    timeout?: number,
    { signal }: FFMessageOptions = {}
  ): Promise<number> {
    // Extract input files from args
    const inputFiles: string[] = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-i' && i + 1 < args.length) {
        inputFiles.push(args[i + 1]);
      }
    }

    // Estimate memory needed
    const estimatedMB = await this.estimateMemoryNeeded(inputFiles);

    // Check if we have enough memory
    if (!this.checkMemoryAvailable(estimatedMB)) {
      const availableMB = (performance as any).memory?.jsHeapSizeLimit
        ? Math.floor((performance as any).memory.jsHeapSizeLimit / (1024 * 1024))
        : 0;

      throw new FFmpegError(
        FFmpegErrorCode.OUT_OF_MEMORY,
        `This file requires approximately ${Math.ceil(estimatedMB)}MB of memory, but only ${availableMB}MB is available`,
        true,
        'Try closing other tabs/applications, or use a smaller file'
      );
    }

    // Proceed with conversion
    return super.exec(args, timeout, { signal });
  }

  // Public API for apps to check before user selects file
  public async canProcessFile(sizeBytes: number): Promise<{
    canProcess: boolean;
    reason?: string;
    suggestion?: string;
  }> {
    const neededMB = (sizeBytes / (1024 * 1024)) * 2.5;

    if (this.checkMemoryAvailable(neededMB)) {
      return { canProcess: true };
    }

    const availableMB = (performance as any).memory?.jsHeapSizeLimit
      ? Math.floor((performance as any).memory.jsHeapSizeLimit / (1024 * 1024))
      : 0;

    return {
      canProcess: false,
      reason: `File too large (needs ~${Math.ceil(neededMB)}MB, have ${availableMB}MB)`,
      suggestion: 'Use a smaller file or try on a device with more memory'
    };
  }
}
```

**Benefits:**
- Prevent OOM crashes before they happen
- Clear warning to users
- Better mobile experience
- Apps can check limits before upload

---
### **10. Magic Number Format Detection (Fast Pre-validation)**

**Impact:** Instant format validation, no FFmpeg load needed

**Current issue:**
- Must load full FFmpeg just to detect format
- Slow user feedback
- Can't validate before conversion

**Implementation:**

```typescript
// packages/util/src/detector.ts
const MAGIC_NUMBERS: Record<string, {
  offset: number;
  bytes: number[];
}> = {
  mp3: { offset: 0, bytes: [0xFF, 0xFB] }, // or 0xFF, 0xFA
  mp3_id3: { offset: 0, bytes: [0x49, 0x44, 0x33] }, // "ID3"
  flac: { offset: 0, bytes: [0x66, 0x4C, 0x61, 0x43] }, // "fLaC"
  ogg: { offset: 0, bytes: [0x4F, 0x67, 0x67, 0x53] }, // "OggS"
  wav: { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
  aiff: { offset: 0, bytes: [0x46, 0x4F, 0x52, 0x4D] }, // "FORM"
  m4a: { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // "ftyp" at offset 4
  wv: { offset: 0, bytes: [0x77, 0x76, 0x70, 0x6B] }, // "wvpk"
};

export function detectFormatFast(data: Uint8Array): string | null {
  // Check magic numbers
  for (const [format, magic] of Object.entries(MAGIC_NUMBERS)) {
    const { offset, bytes } = magic;

    if (data.length < offset + bytes.length) continue;

    let match = true;
    for (let i = 0; i < bytes.length; i++) {
      if (data[offset + i] !== bytes[i]) {
        match = false;
        break;
      }
    }

    if (match) return format;
  }

  return null;
}

// Async version for Blob/File
export async function detectFormatFastAsync(
  blob: Blob | File
): Promise<string | null> {
  const header = await blob.slice(0, 16).arrayBuffer();
  return detectFormatFast(new Uint8Array(header));
}

// Export validation function
export function isFormatSupported(format: string | null): boolean {
  const supported = [
    'mp3', 'mp3_id3', 'flac', 'ogg', 'wav', 'aiff',
    'm4a', 'wv', 'opus', 'vorbis', 'alac'
  ];
  return format ? supported.includes(format) : false;
}
```

**Usage in app:**
```typescript
import { detectFormatFast, isFormatSupported } from '@ffmpeg/util';

// Instant feedback when user selects file
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const format = await detectFormatFastAsync(file);

  if (!isFormatSupported(format)) {
    alert(`Unsupported format. Detected: ${format || 'unknown'}`);
    return;
  }

  // Proceed with conversion
});
```

**Benefits:**
- Instant validation (<1ms)
- No FFmpeg load needed
- Better UX
- Prevent wasted time on unsupported files

---
## 🥉 TIER 3: GOOD OPTIMIZATIONS (Nice to Have - 10-20% improvement)

### **11. Better Progress Reporting**

**Current issue:**
- Progress based on time (inaccurate for audio)
- No duration pre-scan
- No ETA

**Implementation:**

```typescript
// packages/ffmpeg/src/classes.ts
class FFmpeg {
  async convertWithProgress(
    input: string,
    output: string,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<number> {
    // 1. Pre-scan with ffprobe to get duration
    const probeResult = await this.ffprobe([
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      input
    ]);

    const duration = parseFloat(JSON.parse(probeResult).format.duration);

    // 2. Convert with accurate progress
    let startTime = Date.now();

    this.on('progress', ({ time }) => {
      const elapsed = (Date.now() - startTime) / 1000;
      const percent = (time / 1000000) / duration * 100;
      const speed = elapsed > 0 ? (time / 1000000) / elapsed : 0;
      const eta = speed > 0 ? (duration - (time / 1000000)) / speed : 0;

      onProgress?.({
        percent: Math.min(percent, 100),
        elapsed,
        eta: Math.max(eta, 0),
        speed
      });
    });

    return await this.exec(['-i', input, output]);
  }
}
```

---
### **12. Format Presets API**

**Impact:** Better UX, optimal quality/size

```typescript
// packages/ffmpeg/src/presets.ts
export const ENCODER_PRESETS = {
  mp3: {
    highest: ['-codec:a', 'libmp3lame', '-q:a', '0'],      // VBR ~245kbps
    high: ['-codec:a', 'libmp3lame', '-q:a', '2'],         // VBR ~190kbps
    medium: ['-codec:a', 'libmp3lame', '-b:a', '192k'],    // CBR 192kbps
    small: ['-codec:a', 'libmp3lame', '-b:a', '128k']      // CBR 128kbps
  },
  opus: {
    music: ['-codec:a', 'libopus', '-b:a', '128k', '-application', 'audio'],
    speech: ['-codec:a', 'libopus', '-b:a', '32k', '-application', 'voip'],
    hifi: ['-codec:a', 'libopus', '-b:a', '256k', '-application', 'audio']
  },
  vorbis: {
    high: ['-codec:a', 'libvorbis', '-q:a', '8'],          // ~256kbps
    medium: ['-codec:a', 'libvorbis', '-q:a', '5'],        // ~160kbps
    low: ['-codec:a', 'libvorbis', '-q:a', '3']            // ~112kbps
  },
  flac: {
    best: ['-codec:a', 'flac', '-compression_level', '12'],
    fast: ['-codec:a', 'flac', '-compression_level', '5'],
    fastest: ['-codec:a', 'flac', '-compression_level', '0']
  }
};

// Usage
export class FFmpeg {
  async convertWithPreset(
    inputFile: string,
    outputFile: string,
    preset: string,
    quality: string = 'medium'
  ): Promise<number> {
    const presetConfig = ENCODER_PRESETS[preset]?.[quality];
    if (!presetConfig) {
      throw new Error(`Unknown preset: ${preset}/${quality}`);
    }

    return this.exec([
      '-i', inputFile,
      ...presetConfig,
      '-map_metadata', '0', // Preserve metadata
      outputFile
    ]);
  }
}
```

---
### **13. Metadata Preservation**

**Ensure ID3/Vorbis comments are preserved:**

```javascript
// src/bind/ffmpeg/bind.js
// Add -map_metadata 0 to default args
const DEFAULT_ARGS = ["./ffmpeg", "-nostdin", "-y", "-map_metadata", "0"];
```

This ensures metadata is automatically preserved in all conversions.

---
### **14. Format Detection API**

```typescript
// packages/ffmpeg/src/classes.ts
class FFmpeg {
  async detectFormat(file: Uint8Array): Promise<FormatInfo> {
    await this.writeFile('probe.tmp', file);

    const result = await this.ffprobe([
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      'probe.tmp'
    ]);

    await this.deleteFile('probe.tmp');
    return JSON.parse(result);
  }

  getSupportedFormats(): string[] {
    // Return compile-time known formats
    return [
      'mp3', 'opus', 'ogg', 'flac', 'wav', 'aiff',
      'alac', 'wv', 'spx', 'tta', 'tak', 'ape'
    ];
  }

  validateFormat(format: string): boolean {
    return this.getSupportedFormats().includes(format.toLowerCase());
  }
}
```

---
## 📱 TIER 4: ECOSYSTEM IMPROVEMENTS (5-15% overall gain)

### **15. Service Worker Caching**

```typescript
// public/sw.js
const CACHE_NAME = 'ffmpeg-wasm-v0.13.0';
const ASSETS = [
  '/dist/micro/ffmpeg-core.wasm',
  '/dist/micro/ffmpeg-core.js',
  '/dist/micro/ffmpeg-core.worker.js',
  '/dist/full/ffmpeg-core.wasm',
  '/dist/full/ffmpeg-core.js',
  '/dist/full/ffmpeg-core.worker.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('ffmpeg-core')) {
    e.respondWith(
      caches.match(e.request).then((response) => {
        return response || fetch(e.request);
      })
    );
  }
});
```

---
### **16. Browser Compatibility Detection**

```typescript
// packages/ffmpeg/src/capabilities.ts
export interface BrowserCapabilities {
  sharedArrayBuffer: boolean;
  crossOriginIsolated: boolean;
  wasmSIMD: boolean;
  canUseMT: boolean;
  recommendedBuild: 'st' | 'mt';
  deviceMemory?: number;
  hardwareConcurrency: number;
}

export function detectCapabilities(): BrowserCapabilities {
  const hasSAB = typeof SharedArrayBuffer !== 'undefined';
  const isCOI = crossOriginIsolated ?? false;

  // WASM SIMD detection
  const wasmSIMD = WebAssembly.validate(
    new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])
  );

  const deviceMemory = (navigator as any).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;

  const canUseMT = hasSAB && isCOI;
  const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);

  const recommendedBuild =
    canUseMT && !isMobile && hardwareConcurrency >= 4 ? 'mt' : 'st';

  return {
    sharedArrayBuffer: hasSAB,
    crossOriginIsolated: isCOI,
    wasmSIMD,
    canUseMT,
    recommendedBuild,
    deviceMemory,
    hardwareConcurrency
  };
}
```

---
### **17. Streaming API for Large Files**

```typescript
// packages/ffmpeg/src/classes.ts
class FFmpeg {
  async convertLargeFile(
    inputBlob: Blob,
    outputFormat: string,
    onProgress?: (chunk: Uint8Array, progress: number) => void
  ): Promise<Blob> {
    // Mount WORKERFS for direct Blob access (avoids loading entire file into MEMFS)
    await this.mount('WORKERFS', {
      files: [new File([inputBlob], 'input.tmp')]
    }, '/work');

    // Use segment muxer for chunked output
    await this.exec([
      '-i', '/work/input.tmp',
      '-f', 'segment',
      '-segment_time', '10', // 10 second chunks
      '-c', 'copy',
      '/output_%03d.' + outputFormat
    ]);

    // Collect chunks and combine
    const chunks: Uint8Array[] = [];
    // ... collect output segments

    await this.unmount('/work');

    return new Blob(chunks);
  }
}
```

---
## 📊 TIER 4.5: QUALITY ASSURANCE & TESTING

### **18. Performance Benchmarking Framework**

**Impact:** Continuous quality monitoring

```typescript
// tests/benchmarks/performance.bench.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';

const BENCHMARK_FILES = {
  small: 1 * 1024 * 1024,   // 1MB
  medium: 10 * 1024 * 1024, // 10MB
  large: 50 * 1024 * 1024,  // 50MB
};

describe('Performance Benchmarks', () => {
  test('Load time (cold cache)', async () => {
    const start = performance.now();
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    const duration = performance.now() - start;

    console.log(`Load time: ${duration}ms`);
    expect(duration).toBeLessThan(3000); // Target: <3s
  });

  test('Conversion speed (MP3 to FLAC)', async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();

    for (const [size, bytes] of Object.entries(BENCHMARK_FILES)) {
      const testData = new Uint8Array(bytes);
      await ffmpeg.writeFile('input.mp3', testData);

      const start = performance.now();
      await ffmpeg.exec(['-i', 'input.mp3', 'output.flac']);
      const duration = performance.now() - start;

      console.log(`${size}: ${duration}ms`);
    }
  });
});
```

---
### **19. Memory Leak Testing**

```typescript
// tests/memory.test.ts
describe('Memory Management', () => {
  test('No memory leaks after 10 conversions', async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();

    const testData = new Uint8Array(1024 * 1024); // 1MB
    const initial = (performance as any).memory?.usedJSHeapSize;

    // Run 10 conversions
    for (let i = 0; i < 10; i++) {
      await ffmpeg.writeFile('input.wav', testData);
      await ffmpeg.exec(['-i', 'input.wav', 'output.mp3']);
      await ffmpeg.deleteFile('input.wav');
      await ffmpeg.deleteFile('output.mp3');
    }

    // Force GC if available
    if (global.gc) global.gc();

    const final = (performance as any).memory?.usedJSHeapSize;
    const growth = final - initial;

    console.log(`Memory growth: ${growth / 1024 / 1024}MB`);

    // Allow max 10MB growth
    expect(growth).toBeLessThan(10 * 1024 * 1024);
  });
});
```

---
### **20. Comprehensive Format Testing**

```typescript
// tests/formats.test.ts
const REQUIRED_CONVERSIONS = [
  { from: 'wav', to: 'mp3', name: 'WAV to MP3' },
  { from: 'flac', to: 'opus', name: 'FLAC to Opus' },
  { from: 'mp3', to: 'flac', name: 'MP3 to FLAC (lossy to lossless)' },
  { from: 'ogg', to: 'wav', name: 'Ogg Vorbis to WAV' },
  { from: 'm4a', to: 'mp3', name: 'M4A/ALAC to MP3' },
  { from: 'wv', to: 'flac', name: 'WavPack to FLAC' },
  { from: 'opus', to: 'mp3', name: 'Opus to MP3' },
];

describe('Format Support', () => {
  let ffmpeg: FFmpeg;

  beforeAll(async () => {
    ffmpeg = new FFmpeg();
    await ffmpeg.load();
  });

  afterAll(() => {
    ffmpeg.terminate();
  });

  test.each(REQUIRED_CONVERSIONS)(
    '$name',
    async ({ from, to }) => {
      // Use real test files
      const inputData = await fetchFile(`/test-files/sample.${from}`);
      await ffmpeg.writeFile(`input.${from}`, inputData);

      const exitCode = await ffmpeg.exec([
        '-i', `input.${from}`,
        `output.${to}`
      ]);

      expect(exitCode).toBe(0);

      const outputData = await ffmpeg.readFile(`output.${to}`);
      expect(outputData.length).toBeGreaterThan(0);
    }
  );
});
```

---
## 🚀 TIER 5: DELIVERY OPTIMIZATION

### **21. Brotli Compression Support**

**Impact:** Additional 15-20% size reduction over gzip

**Build process addition:**

```bash
# Add to Makefile or build script
# After building
cd packages/core/dist/umd
brotli -q 11 ffmpeg-core.wasm -o ffmpeg-core.wasm.br
brotli -q 11 ffmpeg-core.js -o ffmpeg-core.js.br
gzip -9 ffmpeg-core.wasm -c > ffmpeg-core.wasm.gz
gzip -9 ffmpeg-core.js -c > ffmpeg-core.js.gz

# Compare sizes
echo "Compression comparison:"
ls -lh ffmpeg-core.wasm*
```

**Expected compression:**
- Raw: 5MB
- Gzip: 1.5MB (70% reduction)
- Brotli: 1.2MB (76% reduction)

**Server config (nginx):**

```nginx
location ~* \.(wasm|js)$ {
    # Try brotli first, fall back to gzip
    brotli_static on;
    gzip_static on;

    # Long cache for versioned files
    expires 1y;
    add_header Cache-Control "public, immutable";

    # CORS for WASM
    add_header Cross-Origin-Embedder-Policy "require-corp";
    add_header Cross-Origin-Opener-Policy "same-origin";
    add_header Cross-Origin-Resource-Policy "cross-origin";
}
```

---
### **22. CDN & Delivery Best Practices**

**Recommendations for optimal delivery:**

1. **CDN Selection:**
   - Use CDN with Brotli support (Cloudflare, Fastly, CloudFront)
   - Enable HTTP/2 or HTTP/3 for multiplexing
   - Edge caching with long TTLs

2. **Versioning Strategy:**
   ```
   https://cdn.example.com/ffmpeg-core-v0.13.0-micro.wasm
   https://cdn.example.com/ffmpeg-core-v0.13.0-full.wasm
   ```

3. **CORS Headers:**
   ```
   Access-Control-Allow-Origin: *
   Cross-Origin-Resource-Policy: cross-origin
   ```

4. **Cache Strategy:**
   - WASM files: Cache for 1 year (immutable)
   - JS files: Cache for 1 year (immutable)
   - Use query strings or path versioning for updates

---
## 🎯 RECOMMENDED IMPLEMENTATION ROADMAP

### **Phase 0: Baseline (Week 1 - Days 1-2)**

**Before any changes:**
1. ✅ Establish baseline metrics
2. ✅ Document current state
3. ✅ Verify SharedArrayBuffer support in production
4. ✅ Create test files for benchmarking

**Deliverable:** `BASELINE_METRICS.md`

---
### **Phase 1: Critical Mass Reduction (Week 1 - Days 3-7)**

1. ✅ Custom audio-only build
2. ✅ Remove video/subtitle/image libraries
3. ✅ Fix zlib (use Emscripten's built-in)
4. ✅ Optimize memory settings
5. ✅ Add WavPack + Speex support
6. ✅ Build and validate

**Expected gains:** 75-85% size reduction, 5-10x load time improvement

---
### **Phase 2: Library Updates & Optimization (Week 2)**

7. ✅ Update Emscripten to 3.1.71
8. ✅ Update Opus to 1.5.2
9. ✅ Update Vorbis to 1.3.7 (security!)
10. ✅ Update FFmpeg to n6.1.2 (test thoroughly)
11. ✅ Add aggressive optimization flags
12. ✅ Add missing decoders (TTA, TAK, APE)

**Expected gains:** 20-30% faster conversions, better quality, security fixes

---
### **Phase 3: Safety & UX (Week 3)**

13. ✅ Comprehensive error handling
14. ✅ Memory pre-checks & warnings
15. ✅ Magic number format detection
16. ✅ Better progress reporting
17. ✅ Format presets API
18. ✅ Metadata preservation

**Expected gains:** 80% reduction in errors, better UX

---
### **Phase 4: Build Strategy & Polish (Week 4)**

19. ✅ Micro/Full build split
20. ✅ Smart ST/MT selection
21. ✅ Format detection API
22. ✅ Browser compatibility detection
23. ✅ Testing framework

**Expected gains:** 60-75% faster perceived load

---
### **Phase 5: Delivery & Scale (Week 5-6)**

24. ✅ Service Worker caching
25. ✅ Brotli compression
26. ✅ CDN optimization
27. ✅ Streaming API for large files
28. ✅ Production deployment

**Expected gains:** Offline support, large file handling, optimal delivery

---
## 💰 COMBINED EXPECTED IMPACT

| Metric           | Current      | After Phase 1 | After All Phases  | Improvement    |
|------------------|--------------|---------------|-------------------|----------------|
| Bundle Size      | 10MB gzipped | 1.2MB gzipped | 800KB gzipped     | 92% smaller    |
| Load Time (3G)   | 5-10s        | 1-2s          | 0.5-1s            | 90% faster     |
| Load Time (4G)   | 2-3s         | 0.5-1s        | 0.2-0.5s          | 85% faster     |
| Initial Memory   | 1024MB (MT)  | 128MB (MT)    | 16-128MB (smart)  | 87-98% less    |
| Conversion Speed | Baseline     | +20% (libs)   | +30% (all opts)   | 30% faster     |
| Mobile Support   | Poor         | Good          | Excellent         | Transformative |
| Largest File     | ~300MB       | ~500MB        | ~2GB+ (streaming) | 6x+ larger     |
| Error Clarity    | Poor         | Good          | Excellent         | +80% clarity   |

---
## 🔑 KEY TAKEAWAYS

1. **TIER 0 is mandatory** - Establish baseline before any optimization work
2. **Custom audio-only build is THE game-changer** - 75-85% size reduction alone
3. **Library updates are critical** - Vorbis is 12 years old! Security + performance gains
4. **Error handling transforms UX** - Users need to understand what went wrong
5. **Micro/Full split serves 80% optimally** - Most don't need exotic codecs
6. **Smart MT strategy avoids hosting issues** - Not everyone can set COOP/COEP headers
7. **Testing framework prevents regressions** - Automate quality assurance
8. **Mobile support goes from marginal to excellent** - Critical for user base growth

**The combination of Phase 1 changes alone would make this a completely different product for your users.**

---
## 📝 NEXT STEPS

**Immediate Actions:**

1. ✅ Review and approve this roadmap
2. ⬜ Run Phase 0 baseline measurements
3. ⬜ Create tracking issues for each phase
4. ⬜ Set up development branch: `feat/audio-optimization`
5. ⬜ Generate test files for benchmarking

**Questions to Answer:**

1. Is 3-5MB acceptable, or do we need <2MB? **→ 3-5MB is fine**
2. Should we create `@ffmpeg/audio` or update `@ffmpeg/core`? **→ Create @ffmpeg/audio**
3. What's the timeline for SharedArrayBuffer headers? **→ TBD**
4. Do we need legacy browser support (<2 years old)? **→ No**
5. Should micro build be default with lazy-load for full? **→ Yes**

Ready to proceed with Phase 0!
