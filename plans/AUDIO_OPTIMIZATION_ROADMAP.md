# FFmpeg.wasm Audio-Only Optimization Roadmap

**Target:** Audio conversion web app with 70% mobile users
**Current State:** 31MB WASM (~10MB gzipped), poor mobile performance
**Goal:** 3-5MB WASM (~800KB-1.5MB gzipped), <3s load on 4G mobile
**Timeline:** 5-6 weeks
**Package:** Create `@ffmpeg/audio` (separate from `@ffmpeg/core`)

---

## 🎯 Phase 0: Baseline & Validation (Week 1, Days 1-2)

**Critical:** Must establish baseline before ANY code changes.

### Tasks

**1. Build and Measure Current Version**

```bash
# Build production builds
make prd && make prd-mt

# Measure sizes
ls -lh packages/core/dist/umd/*.wasm
ls -lh packages/core-mt/dist/umd/*.wasm
du -sh packages/core/dist/ packages/core-mt/dist/

# Measure compressed sizes (what users actually download)
gzip -c packages/core/dist/umd/ffmpeg-core.wasm | wc -c
brotli -c packages/core/dist/umd/ffmpeg-core.wasm | wc -c
```

**2. Document Current Codec Support**

```bash
# Get codec list from Docker build
docker run -it --rm $(docker build -q .) ffmpeg -codecs 2>&1 | grep -E "DEA|D.A|.EA"
```

**3. Performance Benchmarks**

Create `tests/benchmarks/baseline.bench.ts`:

```typescript
import { FFmpeg } from '@ffmpeg/ffmpeg';

const SIZES = [1, 5, 10, 25, 50]; // MB

// Measure:
// - Load time (cold cache)
// - Load time (warm cache)
// - Conversion speed (MP3→FLAC, WAV→MP3, FLAC→Opus)
// - Memory usage (Chrome DevTools → Performance Monitor)
```

**4. Test on Target Devices**

- iPhone 12+ (Safari) - Mobile baseline
- Android mid-range (Chrome) - Budget mobile
- Desktop Chrome/Firefox - Desktop baseline

Document hardware specs, OS versions, and browser versions used for testing.

**5. Document Results**

Create `BASELINE_METRICS.md`:

```markdown
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
[List from ffmpeg -codecs]
```

**6. Verify SharedArrayBuffer Availability**

```javascript
console.log('SAB available:', typeof SharedArrayBuffer !== 'undefined');
console.log('crossOriginIsolated:', crossOriginIsolated);
```

Check headers: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`

**Deliverable:** `BASELINE_METRICS.md` with all measurements

---

## 🏆 Phase 1: Critical Mass Reduction (Week 1, Days 3-7)

**Goal:** 75-85% size reduction
**Target:** 31MB → 5-8MB WASM
**Items:** TIER 1 improvements #1, #2, #3

### 1.1 Remove Video Codec Libraries

**Edit `Dockerfile`:**

```dockerfile
# ❌ DELETE these builder stages:
# FROM emsdk-base AS x264-builder      # ~2.5MB savings
# FROM emsdk-base AS x265-builder      # ~3.8MB savings
# FROM emsdk-base AS libvpx-builder    # ~1.2MB savings
# FROM emsdk-base AS theora-builder    # ~400KB savings
# FROM emsdk-base AS aom-builder       # ~1.5MB savings (if present)

# Remove from ffmpeg-base stage:
# COPY --from=x264-builder $INSTALL_DIR $INSTALL_DIR
# COPY --from=x265-builder $INSTALL_DIR $INSTALL_DIR
# etc...
```

**Edit `Dockerfile` - ffmpeg-builder configure:**

```dockerfile
# Remove these flags:
# --enable-libx264
# --enable-libx265
# --enable-libvpx
# --enable-libtheora
# --enable-libaom
```

**Edit `build/ffmpeg-wasm.sh`:**

```bash
# Remove from FFMPEG_LIBS:
#   -lx264 \
#   -lx265 \
#   -lvpx \
#   -ltheora \
#   -laom \
```

**Savings:** ~15-18MB

### 1.2 Remove Subtitle/Font Rendering

**Edit `Dockerfile`:**

```dockerfile
# ❌ DELETE these stages:
# FROM emsdk-base AS freetype2-builder  # ~800KB
# FROM emsdk-base AS fribidi-builder    # ~200KB
# FROM emsdk-base AS harfbuzz-builder   # ~600KB
# FROM emsdk-base AS libass-builder     # ~500KB

# Remove from ffmpeg-base:
# COPY --from=libass-builder $INSTALL_DIR $INSTALL_DIR
# etc...
```

**Edit `Dockerfile` - ffmpeg-builder:**

```dockerfile
# Remove:
# --enable-libfreetype
# --enable-libfribidi
# --enable-libass
```

**Edit `build/ffmpeg-wasm.sh`:**

```bash
# Remove:
#   -lfreetype \
#   -lfribidi \
#   -lharfbuzz \
#   -lass \
```

**Savings:** ~3-5MB

### 1.3 Remove Image Processing

**Edit `Dockerfile`:**

```dockerfile
# ❌ DELETE:
# FROM emsdk-base AS libwebp-builder  # ~600KB
# FROM emsdk-base AS zimg-builder     # ~300KB
```

**Edit `build/ffmpeg-wasm.sh`:**

```bash
# Remove:
#   -lwebpmux \
#   -lwebp \
#   -lsharpyuv \
#   -lzimg \
```

**Savings:** ~2-3MB

### 1.4 Audio-Only FFmpeg Configuration

**Edit `build/ffmpeg.sh` - Replace configure flags:**

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

  # ⚡ AUDIO-ONLY CONFIGURATION
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

  # Disable all hardware/video stuff
  --disable-hwaccels
  --disable-videotoolbox
  --disable-audiotoolbox
  --disable-postproc

  # External libraries
  --enable-gpl
  --enable-libmp3lame
  --enable-libopus
  --enable-libvorbis
  --enable-libwavpack
  --enable-libspeex

  # Toolchain
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

**Savings:** ~2-4MB

### 1.4.1 Replace Custom zlib with Emscripten Built-in

**Edit `Dockerfile`:**

```dockerfile
# ❌ DELETE zlib-builder stage:
# FROM emsdk-base AS zlib-builder
# ...

# Remove from ffmpeg-base:
# COPY --from=zlib-builder $INSTALL_DIR $INSTALL_DIR
```

**Edit `build/ffmpeg-wasm.sh`:**

```bash
# Remove from FFMPEG_LIBS:
#   -lz \

# Add to Emscripten flags instead:
-sUSE_ZLIB=1 \
```

**Why:** Emscripten's built-in zlib is smaller and better optimized for WASM. FLAC still gets compression support.

**Savings:** ~200-300KB

### 1.5 Add Missing Codecs

**WavPack (build script already exists at `build/wavpack.sh`):**

**Edit `Dockerfile` - Add builder:**

```dockerfile
FROM emsdk-base AS wavpack-builder
ENV WAVPACK_BRANCH=5.6.0
ADD https://github.com/dbry/WavPack.git#$WAVPACK_BRANCH /src
COPY build/wavpack.sh /src/build.sh
RUN bash -x /src/build.sh

# Add to ffmpeg-base (after ogg/vorbis builders):
COPY --from=wavpack-builder $INSTALL_DIR $INSTALL_DIR
```

**Cost:** ~200KB

**Speex (new build script needed):**

**Create `build/speex.sh`:**

```bash
#!/bin/bash
set -euo pipefail

CONF_FLAGS=(
  --prefix=$INSTALL_DIR
  --host=x86-linux-gnu
  --disable-shared
  --enable-static
  --disable-examples
  --disable-oggtest
  --disable-valgrind
)

CFLAGS=$CFLAGS emconfigure ./configure "${CONF_FLAGS[@]}"
emmake make install -j
```

**Edit `Dockerfile` - Add speex builder:**

```dockerfile
FROM emsdk-base AS speex-builder
COPY --from=ogg-builder $INSTALL_DIR $INSTALL_DIR
ENV SPEEX_BRANCH=Speex-1.2.1
ADD https://github.com/xiph/speex.git#$SPEEX_BRANCH /src
COPY build/speex.sh /src/build.sh
RUN bash -x /src/build.sh

# Add to ffmpeg-base:
COPY --from=speex-builder $INSTALL_DIR $INSTALL_DIR
```

**Edit `build/ffmpeg-wasm.sh` - Update libs:**

```bash
FFMPEG_LIBS=(
  -lmp3lame
  -logg
  -lvorbis
  -lvorbisenc
  -lvorbisfile
  -lopus
  -lwavpack    # NEW
  -lspeex      # NEW
  # Note: -lz removed, using -sUSE_ZLIB=1 instead
)
```

**Cost:** WavPack ~200KB + Speex ~150KB = ~350KB total

### 1.6 Optimize Memory Settings

**Edit `build/ffmpeg-wasm.sh` - Memory configuration:**

```bash
# Single-threaded build
${FFMPEG_ST:+ -sINITIAL_MEMORY=16MB}
${FFMPEG_ST:+ -sMAXIMUM_MEMORY=512MB}
${FFMPEG_ST:+ -sALLOW_MEMORY_GROWTH=1}
${FFMPEG_ST:+ -sSTACK_SIZE=2MB}

# Multi-threaded build (reduced from 1024MB/32 threads!)
${FFMPEG_MT:+ -sINITIAL_MEMORY=128MB}
${FFMPEG_MT:+ -sMAXIMUM_MEMORY=2GB}
${FFMPEG_MT:+ -sALLOW_MEMORY_GROWTH=1}
${FFMPEG_MT:+ -sPTHREAD_POOL_SIZE=4}           # Was 32!
${FFMPEG_MT:+ -sPTHREAD_POOL_DELAY_LOAD=1}     # Faster startup
```

### 1.7 Build and Validate

```bash
make clean
make prd

# Measure
ls -lh packages/core/dist/umd/*.wasm
gzip -c packages/core/dist/umd/ffmpeg-core.wasm | wc -c

# Test
npm test
```

**Expected Result:** ~5-8MB WASM, ~1.2-2MB gzipped

**Expected Gains:**
- Bundle size: 75-85% smaller ✓
- Load time: 5-10x faster on 3G
- Memory footprint: 50-70% lower
- Mobile compatibility: Poor → Excellent

---

## 🔄 Phase 2: Library Updates & Optimization (Week 2)

**Goal:** 20-30% faster conversions, security fixes, better quality
**Items:** TIER 2 improvements #4, #5, #6

### 2.1 Update Emscripten

**Priority:** CRITICAL
**Current:** 3.1.40 (Aug 2023)
**Target:** 3.1.71 (Jan 2025)

**Edit `Dockerfile` base image:**

```dockerfile
# Change FROM line:
FROM emscripten/emsdk:3.1.71 AS emsdk-base
# Was: FROM emscripten/emsdk:3.1.40 AS emsdk-base
```

**Benefits:**
- 17 months of improvements
- Better SIMD codegen
- 20-30% faster pthreads
- 5-10% smaller WASM
- Security fixes

**Testing:** Build and run full test suite after this change.

### 2.2 Update Opus

**Priority:** HIGH
**Current:** 1.3.1 (Apr 2019)
**Target:** 1.5.2 (Feb 2024)

**Edit `Dockerfile` - opus-builder:**

```dockerfile
ENV OPUS_BRANCH=v1.5.2
```

**Benefits:**
- 10-15% encoding performance boost
- Better music quality at low bitrates
- DRED (Deep REDundancy) support
- 5 years of improvements!

### 2.3 Update Vorbis

**Priority:** HIGH (SECURITY)
**Current:** 1.3.3 (2012!)
**Target:** 1.3.7 (Jul 2020)

**Edit `Dockerfile` - vorbis-builder:**

```dockerfile
ENV VORBIS_BRANCH=v1.3.7
```

**Benefits:**
- **Security fixes** (12 years old!)
- Encoding quality improvements
- Bug fixes

### 2.4 Update FFmpeg

**Priority:** HIGH
**Current:** n5.1.4 (Jul 2022)
**Target:** n6.1.2 LTS (Sep 2024)

**⚠️ IMPORTANT:** Original Dockerfile has a comment: "We cannot upgrade to n6.0 as ffmpeg bin only supports multithread at the moment." This limitation may need verification for n6.1.2 LTS.

**Edit `Dockerfile` - emsdk-base ENV:**

```dockerfile
ENV FFMPEG_VERSION=n6.1.2  # Was n5.1.4
```

**Benefits:**
- FLAC encoder: 20-30% faster
- Better Opus integration
- AAC decoder improvements
- Memory leak fixes
- 2.5 years of bug fixes

**⚠️ Risk:** MEDIUM - Test thoroughly!

**Testing Requirements:**
1. Build both ST and MT versions
2. Verify ffmpeg binary threading behavior
3. Run full format conversion test suite
4. Check memory usage patterns
5. Validate against baseline metrics

### 2.5 Update Minor Libraries

**Ogg:**
```dockerfile
ENV OGG_BRANCH=v1.3.5  # Was v1.3.4
```

**LAME:** Already on stable release

### 2.6 Enable Missing Decoders

**Edit `build/ffmpeg.sh`:**

```bash
# Add to decoders (already in FFmpeg, just enable):
--enable-decoder=tta,tak,ape
--enable-demuxer=tta,tak,ape
```

No size increase - already in FFmpeg!

### 2.7 Aggressive Compiler Optimizations

**Edit `Makefile`:**

```makefile
PROD_CFLAGS := -O3 \
  -msimd128 \
  -flto \
  -ffast-math \
  -fno-rtti \
  -fno-exceptions \
  -DNDEBUG

PROD_LDFLAGS := -flto
```

**Edit `build/ffmpeg-wasm.sh` - Add Emscripten opts:**

```bash
CONF_FLAGS+=(
  # Use Emscripten's built-in zlib (needed for FLAC)
  -sUSE_ZLIB=1 \

  # Closure compiler optimizations (10-15% smaller JS)
  --closure 1 \
  -sAGGRESSIVE_VARIABLE_ELIMINATION=1 \

  # Remove unnecessary features
  -sASSERTIONS=0 \
  -sSTACK_OVERFLOW_CHECK=0 \
  -sSUPPORT_BIG_ENDIAN=0 \
  -sAUTO_NATIVE_LIBRARIES=0 \
  -sDYNAMIC_EXECUTION=0 \

  # Text decoding optimization
  -sTEXTDECODER=2 \
)
```

**Flag Explanations:**
- `-sUSE_ZLIB=1`: Use Emscripten's optimized built-in zlib (replaces custom build)
- `--closure 1`: Advanced JavaScript minification via Google Closure Compiler
- `-sAGGRESSIVE_VARIABLE_ELIMINATION=1`: More aggressive dead code elimination
- `-sASSERTIONS=0`: Remove runtime assertions (production only)
- `-sDYNAMIC_EXECUTION=0`: No eval/Function constructor (smaller, safer, CSP-friendly)
- `-sTEXTDECODER=2`: Optimized text decoding

**Expected Gains:**
- 10-20% performance improvement
- 15-25% size reduction
- Better code optimization with LTO

---

## 🛡️ Phase 3: Safety & UX (Week 3)

**Goal:** 80% reduction in user errors, better mobile experience
**Items:** TIER 2.5 improvements #8, #9, #10 + TIER 3 #11, #12, #13, #14

### 3.1 Comprehensive Error Handling

**Create `packages/ffmpeg/src/errors.ts`:**

```typescript
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

export function parseFFmpegError(stderr: string): FFmpegError {
  if (stderr.includes('Invalid data found')) {
    return new FFmpegError(
      FFmpegErrorCode.UNSUPPORTED_FORMAT,
      'File format not supported or file is corrupted',
      false,
      'Please check the file format. Supported: MP3, FLAC, WAV, Opus, Vorbis, ALAC, WavPack, Speex',
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

  return new FFmpegError(
    FFmpegErrorCode.CONVERSION_FAILED,
    'Conversion failed',
    false,
    'Check the console for technical details',
    stderr
  );
}
```

**Update worker to use error parser in error handling.**

### 3.2 Memory Pre-checks & Warnings

**Update `packages/ffmpeg/src/classes.ts`:**

```typescript
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
    // Audio conversion needs ~2.5x input size
    return (totalSize / (1024 * 1024)) * 2.5;
  }

  public async exec(
    args: string[],
    timeout = -1,
    { signal }: FFMessageOptions = {}
  ): Promise<number> {
    // Extract input files
    const inputFiles: string[] = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-i' && i + 1 < args.length) {
        inputFiles.push(args[i + 1]);
      }
    }

    // Check memory
    const estimatedMB = await this.estimateMemoryNeeded(inputFiles);
    if (!this.checkMemoryAvailable(estimatedMB)) {
      const availableMB = (performance as any).memory?.jsHeapSizeLimit
        ? Math.floor((performance as any).memory.jsHeapSizeLimit / (1024 * 1024))
        : 0;

      throw new FFmpegError(
        FFmpegErrorCode.OUT_OF_MEMORY,
        `This file requires ~${Math.ceil(estimatedMB)}MB of memory, but only ${availableMB}MB is available`,
        true,
        'Try closing other tabs/applications, or use a smaller file'
      );
    }

    return this.#send({ type: FFMessageType.EXEC, data: { args, timeout } }, undefined, signal) as Promise<number>;
  }

  // Public API for pre-checks
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

### 3.3 Magic Number Format Detection

**Create `packages/util/src/detector.ts`:**

```typescript
const MAGIC_NUMBERS: Record<string, { offset: number; bytes: number[] }> = {
  mp3: { offset: 0, bytes: [0xFF, 0xFB] },
  mp3_id3: { offset: 0, bytes: [0x49, 0x44, 0x33] }, // "ID3"
  flac: { offset: 0, bytes: [0x66, 0x4C, 0x61, 0x43] }, // "fLaC"
  ogg: { offset: 0, bytes: [0x4F, 0x67, 0x67, 0x53] }, // "OggS"
  wav: { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
  aiff: { offset: 0, bytes: [0x46, 0x4F, 0x52, 0x4D] }, // "FORM"
  m4a: { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // "ftyp"
  wv: { offset: 0, bytes: [0x77, 0x76, 0x70, 0x6B] }, // "wvpk"
};

export function detectFormatFast(data: Uint8Array): string | null {
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

export async function detectFormatFastAsync(blob: Blob | File): Promise<string | null> {
  const header = await blob.slice(0, 16).arrayBuffer();
  return detectFormatFast(new Uint8Array(header));
}

export function isFormatSupported(format: string | null): boolean {
  const supported = [
    'mp3', 'mp3_id3', 'flac', 'ogg', 'wav', 'aiff',
    'm4a', 'wv', 'opus', 'vorbis', 'alac'
  ];
  return format ? supported.includes(format) : false;
}
```

**Export from `packages/util/src/index.ts`**

### 3.4 Better Progress Reporting

**Update `packages/ffmpeg/src/classes.ts`:**

```typescript
async convertWithProgress(
  input: string,
  output: string,
  onProgress?: (progress: ProgressInfo) => void
): Promise<number> {
  // Pre-scan with ffprobe to get duration
  const probeResult = await this.ffprobe([
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    input
  ]);

  const duration = parseFloat(JSON.parse(probeResult).format.duration);
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
```

### 3.5 Format Presets API

**Create `packages/ffmpeg/src/presets.ts`:**

```typescript
export const ENCODER_PRESETS = {
  mp3: {
    highest: ['-codec:a', 'libmp3lame', '-q:a', '0'],
    high: ['-codec:a', 'libmp3lame', '-q:a', '2'],
    medium: ['-codec:a', 'libmp3lame', '-b:a', '192k'],
    small: ['-codec:a', 'libmp3lame', '-b:a', '128k']
  },
  opus: {
    music: ['-codec:a', 'libopus', '-b:a', '128k', '-application', 'audio'],
    speech: ['-codec:a', 'libopus', '-b:a', '32k', '-application', 'voip'],
    hifi: ['-codec:a', 'libopus', '-b:a', '256k', '-application', 'audio']
  },
  vorbis: {
    high: ['-codec:a', 'libvorbis', '-q:a', '8'],
    medium: ['-codec:a', 'libvorbis', '-q:a', '5'],
    low: ['-codec:a', 'libvorbis', '-q:a', '3']
  },
  flac: {
    best: ['-codec:a', 'flac', '-compression_level', '12'],
    fast: ['-codec:a', 'flac', '-compression_level', '5'],
    fastest: ['-codec:a', 'flac', '-compression_level', '0']
  }
};

// Add to FFmpeg class
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
```

### 3.6 Metadata Preservation

**Edit `src/bind/ffmpeg/bind.js`:**

```javascript
const DEFAULT_ARGS = ["./ffmpeg", "-nostdin", "-y", "-map_metadata", "0"];
```

### 3.7 Format Detection API

**Add to `packages/ffmpeg/src/classes.ts`:**

```typescript
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
  return [
    'mp3', 'opus', 'ogg', 'flac', 'wav', 'aiff',
    'alac', 'wv', 'spx', 'tta', 'tak', 'ape'
  ];
}

validateFormat(format: string): boolean {
  return this.getSupportedFormats().includes(format.toLowerCase());
}
```

---

## 🎨 Phase 4: Build Strategy & Polish (Week 4)

**Goal:** 60-75% faster perceived load for 80% of users
**Items:** TIER 1 #2 (micro/full split), TIER 2 #7 (smart threading), TIER 4 #16 (browser detection), TIER 4.5 #18-20 (testing)

### 4.1 Dual Build Strategy: Micro vs Full

**Create `Dockerfile.micro`:**

Copy `Dockerfile` and in `build/ffmpeg.sh` section, limit to core formats:

```bash
# Micro build: Only most common formats
--enable-decoder=mp3*,aac*,opus,vorbis,flac,pcm_*
--enable-encoder=libmp3lame,libopus,libvorbis,flac,pcm_*
--enable-demuxer=mp3,ogg,flac,wav,mov,m4a,matroska,webm
--enable-muxer=mp3,opus,ogg,flac,wav,null
```

**Update `Makefile`:**

```makefile
prd-micro:
	$(MAKE) build-st \
		EXTRA_CFLAGS="$(PROD_CFLAGS)" \
		EXTRA_ARGS="-f Dockerfile.micro"
```

**Micro Build:** ~600-800KB gzipped (MP3, Opus, Vorbis, FLAC, WAV only)
**Full Build:** ~1-1.5MB gzipped (all formats)

### 4.2 Smart Build Loading

**Create `packages/ffmpeg/src/variants.ts`:**

```typescript
export enum FFmpegVariant {
  MICRO = 'micro',
  FULL = 'full'
}

export const MICRO_FORMATS = ['mp3', 'opus', 'ogg', 'flac', 'wav', 'aiff'];

export async function loadFFmpegAuto(
  sourceFormat?: string,
  targetFormat?: string
): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

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

### 4.3 Smart Threading Strategy

**Create `packages/ffmpeg/src/utils.ts`:**

```typescript
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
    return 'st';
  }

  // Small files don't benefit from MT
  if (fileSize && fileSize < 50 * 1024 * 1024) {
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

### 4.4 Browser Compatibility Detection

**Create `packages/ffmpeg/src/capabilities.ts`:**

```typescript
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

  const wasmSIMD = WebAssembly.validate(
    new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])
  );

  const deviceMemory = (navigator as any).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const canUseMT = hasSAB && isCOI;
  const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);

  return {
    sharedArrayBuffer: hasSAB,
    crossOriginIsolated: isCOI,
    wasmSIMD,
    canUseMT,
    recommendedBuild: canUseMT && !isMobile && hardwareConcurrency >= 4 ? 'mt' : 'st',
    deviceMemory,
    hardwareConcurrency
  };
}
```

### 4.5 Testing Framework

**Create `tests/benchmarks/performance.bench.ts`:**

```typescript
import { FFmpeg } from '@ffmpeg/ffmpeg';

describe('Performance Benchmarks', () => {
  test('Load time (cold cache)', async () => {
    const start = performance.now();
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    const duration = performance.now() - start;

    console.log(`Load time: ${duration}ms`);
    expect(duration).toBeLessThan(3000); // Target: <3s
  });

  test('Conversion speed', async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();

    const sizes = [1, 5, 10, 25, 50]; // MB
    for (const sizeMB of sizes) {
      const testData = new Uint8Array(sizeMB * 1024 * 1024);
      await ffmpeg.writeFile('input.mp3', testData);

      const start = performance.now();
      await ffmpeg.exec(['-i', 'input.mp3', 'output.flac']);
      const duration = performance.now() - start;

      console.log(`${sizeMB}MB: ${duration}ms`);
    }
  });
});
```

**Create `tests/formats.test.ts`:**

```typescript
const REQUIRED_CONVERSIONS = [
  { from: 'wav', to: 'mp3', name: 'WAV to MP3' },
  { from: 'flac', to: 'opus', name: 'FLAC to Opus' },
  { from: 'mp3', to: 'flac', name: 'MP3 to FLAC' },
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

**Create `tests/memory.test.ts`:**

```typescript
describe('Memory Management', () => {
  test('No memory leaks after 10 conversions', async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();

    const testData = new Uint8Array(1024 * 1024);
    const initial = (performance as any).memory?.usedJSHeapSize;

    for (let i = 0; i < 10; i++) {
      await ffmpeg.writeFile('input.wav', testData);
      await ffmpeg.exec(['-i', 'input.wav', 'output.mp3']);
      await ffmpeg.deleteFile('input.wav');
      await ffmpeg.deleteFile('output.mp3');
    }

    if (global.gc) global.gc();

    const final = (performance as any).memory?.usedJSHeapSize;
    const growth = final - initial;

    console.log(`Memory growth: ${growth / 1024 / 1024}MB`);
    expect(growth).toBeLessThan(10 * 1024 * 1024);
  });
});
```

---

## 🚀 Phase 5: Delivery & Scale (Week 5-6)

**Goal:** Offline support, large file handling, optimal delivery
**Items:** TIER 4 #15 (service worker), TIER 4 #17 (streaming), TIER 5 #21-22 (compression/CDN)

### 5.1 Service Worker Caching

**Create `public/sw.js`:**

```javascript
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

### 5.2 Brotli Compression

**Add to build process:**

```bash
# After building
cd packages/core/dist/umd
brotli -q 11 ffmpeg-core.wasm -o ffmpeg-core.wasm.br
brotli -q 11 ffmpeg-core.js -o ffmpeg-core.js.br
gzip -9 ffmpeg-core.wasm -c > ffmpeg-core.wasm.gz
gzip -9 ffmpeg-core.js -c > ffmpeg-core.js.gz

# Repeat for micro and full builds
```

**Expected compression:**
- Raw: 5MB
- Gzip: 1.5MB (70% reduction)
- Brotli: 1.2MB (76% reduction)

### 5.3 CDN Optimization

**nginx configuration:**

```nginx
location ~* \.(wasm|js)$ {
    # Serve brotli if available
    gzip_static on;
    brotli_static on;

    # Long cache for versioned files
    expires 1y;
    add_header Cache-Control "public, immutable";

    # CORS for WASM
    add_header Cross-Origin-Embedder-Policy "require-corp";
    add_header Cross-Origin-Opener-Policy "same-origin";
    add_header Cross-Origin-Resource-Policy "cross-origin";
}
```

**Versioning strategy:**
```
https://cdn.example.com/ffmpeg-core-v0.13.0-micro.wasm
https://cdn.example.com/ffmpeg-core-v0.13.0-full.wasm
```

### 5.4 Streaming API for Large Files

**Add to `packages/ffmpeg/src/classes.ts`:**

```typescript
async convertLargeFile(
  inputBlob: Blob,
  outputFormat: string,
  onProgress?: (chunk: Uint8Array, progress: number) => void
): Promise<Blob> {
  // Mount WORKERFS for direct Blob access
  await this.mount('WORKERFS', {
    files: [new File([inputBlob], 'input.tmp')]
  }, '/work');

  // Use segment muxer for chunked output
  await this.exec([
    '-i', '/work/input.tmp',
    '-f', 'segment',
    '-segment_time', '10',
    '-c', 'copy',
    '/output_%03d.' + outputFormat
  ]);

  // Collect chunks
  const chunks: Uint8Array[] = [];
  // ... collect segments

  await this.unmount('/work');
  return new Blob(chunks);
}
```

### 5.5 Production Deployment

**Gradual rollout:**

1. Week 5: Deploy to staging
2. Week 6: 5% production traffic
3. Week 7: 25% production
4. Week 8: 50% production
5. Week 9: 100% production

**Monitor metrics:**
```javascript
analytics.track('ffmpeg_load_time', {
  duration: loadTime,
  variant: 'audio-optimized',
  size: wasmSize,
  mobile: isMobile
});

analytics.track('ffmpeg_conversion', {
  from: sourceFormat,
  to: targetFormat,
  fileSize: inputSize,
  duration: conversionTime,
  success: exitCode === 0
});
```

**Rollback criteria:**
- Error rate >5%
- Load failure rate >10%
- Average load time >5s
- Mobile OOM rate >5%

---

## 📊 Success Metrics

| Metric | Baseline | After Phase 1 | After All Phases | Improvement |
|--------|----------|---------------|------------------|-------------|
| Bundle Size | 10MB gzipped | 1.2MB gzipped | 800KB gzipped | 92% smaller |
| Load Time (3G) | 5-10s | 1-2s | 0.5-1s | 90% faster |
| Load Time (4G) | 2-3s | 0.5-1s | 0.2-0.5s | 85% faster |
| Initial Memory | 1024MB (MT) | 128MB (MT) | 16-128MB (smart) | 87-98% less |
| Conversion Speed | Baseline | +20% (libs) | +30% (all opts) | 30% faster |
| Mobile Support | Poor | Good | Excellent | Transformative |
| Largest File | ~300MB | ~500MB | ~2GB+ (streaming) | 6x+ larger |
| Error Clarity | Poor | Good | Excellent | +80% clarity |

---

## 🔑 Key Takeaways

1. **Phase 0 is mandatory** - Establish baseline before ANY optimization
2. **Custom audio-only build is THE game-changer** - 75-85% size reduction alone
3. **Library updates are critical** - Vorbis is 12 years old (security!)
4. **Error handling transforms UX** - Users need actionable feedback
5. **Micro/Full split serves 80% optimally** - Most don't need exotic codecs
6. **Smart MT strategy avoids hosting issues** - Not everyone can set COOP/COEP
7. **Testing prevents regressions** - Automate quality assurance
8. **Mobile support transformation** - Poor → Excellent

**Phase 1 changes alone make this a completely different product for mobile users.**

---

## 📝 Next Steps

**Immediate Actions:**

1. ✅ Review and approve roadmap
2. ⬜ Set up development branch: `feat/audio-optimization`
3. ⬜ Create tracking issues for each phase
4. ⬜ Run Phase 0 baseline measurements
5. ⬜ Generate test files for benchmarking

**Answers to Key Questions:**

1. ✅ Target size: 3-5MB is acceptable
2. ✅ Package: Create `@ffmpeg/audio` (separate from `@ffmpeg/core`)
3. ⬜ SharedArrayBuffer headers timeline: TBD
4. ✅ Legacy browser support: No (focus on modern browsers)
5. ✅ Micro build default: Yes, with auto-upgrade to full when needed

**Ready to proceed with Phase 0!**
