# FAQ

### What is the license of ffmpeg.wasm?

There are two components inside ffmpeg.wasm:

- @ffmpeg/ffmpeg (https://github.com/ffmpegwasm/ffmpeg.wasm)
- @ffmpeg/core (https://github.com/ffmpegwasm/ffmpeg.wasm-core)

@ffmpeg/core contains WebAssembly code which is transpiled from original FFmpeg C code with minor modifications, but overall it still following the same licenses as FFmpeg and its external libraries (as each external libraries might have its own license).

@ffmpeg/ffmpeg contains kind of a wrapper to handle the complexity of loading core and calling low-level APIs. It is a small code base and under MIT license.

### What is the maximum size of input file?

2 GB, which is a hard limit in WebAssembly. Might become 4 GB in the future.

### How can I build my own ffmpeg.wasm?

In fact, it is `@ffmpeg/core` most people would like to build.

To build on your own, you can check [Contribution Guide](/docs/contribution/core)

Also you can check this series of posts to learn more fundamental concepts
(OUTDATED, but still good to learn foundations):

- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-1-preparation/
- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-2-compile-with-emscripten/
- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-3-v0.1/
- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-4-v0.2/
