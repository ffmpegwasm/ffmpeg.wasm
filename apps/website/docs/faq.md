# FAQ

### Does ffmpeg.wasm work in Node.js?

Yes, since @ffmpeg/ffmpeg 0.13: the same `FFmpeg` class runs ffmpeg-core in a
`worker_threads` worker, loads the installed `@ffmpeg/core` by default, and can
mount host directories with `NODEFS`:

```js
import { FFmpeg } from "@ffmpeg/ffmpeg";

const ffmpeg = new FFmpeg();
await ffmpeg.load();
await ffmpeg.createDir("/host");
await ffmpeg.mount("NODEFS", { root: process.cwd() }, "/host");
await ffmpeg.exec(["-i", "/host/input.webm", "/host/output.mp4"]);
```

A native `ffmpeg` binary is still faster if you can ship one.

### Why ffmpeg.wasm is so slow comparing to ffmpeg?

WebAssembly runs FFmpeg's C code without its hand-written assembly, and
SIMD is limited to 128 bits, so encoding is several times slower than native.
Decoding and remuxing are closer. `pnpm bench` in the repository
measures common jobs against native FFmpeg on your machine.

To speed things up:
- Use `@ffmpeg/core-mt` on a cross-origin isolated page: FFmpeg's threads and
  the codecs' run in parallel, typically 2-4x faster than `@ffmpeg/core`.
- Use a faster preset: `-preset ultrafast` for x264, `-deadline realtime` for VP9.
- Remux with `-c copy` when you don't need to re-encode.
- Mount large inputs with `WORKERFS` instead of copying them with `writeFile()`.
- With `@ffmpeg/core-mt` on machines with many cores, `load({ threads: 8 })`
  lets codecs use more threads.

### Is RTSP supported by ffmpeg.wasm?

No. Browsers don't give WebAssembly raw TCP/UDP sockets, so ffmpeg.wasm is
built without network protocols (RTSP, RTMP, HTTP). Fetch inputs in
JavaScript and write them to the file system, or use WebRTC/MediaRecorder for
live streams.

### What is the license of ffmpeg.wasm?

The JavaScript packages are MIT; `@ffmpeg/core` is GPL-2.0-or-later. There are two components inside ffmpeg.wasm:

- @ffmpeg/ffmpeg (https://github.com/ffmpegwasm/ffmpeg.wasm/packages/ffmpeg)
- @ffmpeg/core (https://github.com/ffmpegwasm/ffmpeg.wasm/packages/core)

@ffmpeg/core contains WebAssembly code which is transpiled from original FFmpeg C code with minor modifications, but overall it still following the same licenses as FFmpeg and its external libraries (as each external libraries might have its own license).

@ffmpeg/ffmpeg contains kind of a wrapper to handle the complexity of loading core and calling low-level APIs. It is a small code base and under MIT license.

### What is the maximum size of input file?

Files written with `writeFile()` live in JavaScript memory, outside the
WebAssembly heap, so they can be larger than 2 GB if the browser allows it.
For big inputs, `mount("WORKERFS", { files: [file] }, "/input")` avoids
copying them at all. FFmpeg's own memory can grow to 4 GB, the limit of 32-bit
WebAssembly.

`WORKERFS` mounts are read-only: write outputs outside the mount point.

### Why are all log messages of type `stderr`?

FFmpeg writes its log (banner, progress, warnings) to stderr, like the
native `ffmpeg`. Only a few outputs, such as `ffprobe` results without `-o`,
go to stdout.

### Why do raw frames differ slightly from native FFmpeg?

The WebAssembly build uses swscale's C code paths, while native FFmpeg uses
assembly with slightly different rounding. For output closer to native, add
`-sws_flags accurate_rnd+bitexact`.

### How do I decode a WebM video with transparency?

FFmpeg's built-in VP8/VP9 decoders drop the alpha channel. Ask for the
libvpx decoder before the input: `["-c:v", "libvpx-vp9", "-i", "input.webm", ...]`.

### How can I build my own ffmpeg.wasm?

In fact, it is `@ffmpeg/core` most people would like to build.

To build on your own, you can check [Contribution Guide](/docs/contribution/core)

Also you can check this series of posts to learn more fundamental concepts
(OUTDATED, but still good to learn foundations):

- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-1-preparation/
- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-2-compile-with-emscripten/
- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-3-v0.1/
- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-4-v0.2/
