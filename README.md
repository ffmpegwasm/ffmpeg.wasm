<p align="center">
  <a href="#">
    <img alt="ffmpeg.wasm" width="128px" height="128px" src="https://github.com/DreamOfIce/ffmpeg.wasm/raw/master/docs/images/ffmpegwasm-icon.png">
  </a>
</p>

# ffmpeg.wasm

[![stability-experimental](https://img.shields.io/badge/stability-experimental-orange.svg)](https://github.com/emersion/stability-badges#experimental)
[![Node Version](https://img.shields.io/node/v/@ffmpeg.wasm/main.svg)](https://img.shields.io/node/v/@ffmpeg.wasm/main.svg)
[![Actions Status](https://github.com/DreamOfIce/ffmpeg.wasm/workflows/CI/badge.svg)](https://github.com/DreamOfIce/ffmpeg.wasm/actions)
![CodeQL](https://github.com/DreamOfIce/ffmpeg.wasm/workflows/CodeQL/badge.svg)
![npm (tag)](https://img.shields.io/npm/v/@ffmpeg.wasm/main/latest)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/DreamOfIce/ffmpeg.wasm/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)
[![Downloads Total](https://img.shields.io/npm/dt/@ffmpeg.wasm/main.svg)](https://www.npmjs.com/package/@ffmpeg.wasm/main)
[![Downloads Month](https://img.shields.io/npm/dm/@ffmpeg.wasm/main.svg)](https://www.npmjs.com/package/@ffmpeg.wasm/main)

## About this fork

Thanks to [Jerome Wu](https://github.com/jeromewu) for creating the very cool package ffmpegwasm!
However, because this package hasn't been updated in a long time, a lot of features are on hold and it's not compatible with node18 and above (because the emsdk version is too old). So I decided to maintain a fork, fix the problems and continue development iterations.
Feel free to create issues or pull requests ヾ(≧▽≦\*)o
Hopefully these changes can be merged into ffmpegwasm in the future

### Release Plan

> See the [Todos](#todos) chapter for more plans

- v0.12 is fully compatible with ffmpegwasm v0.11.x, but updates emsdk to the latest and fixes some bugs
- Since v0.13, I will start refactoring with a modern toolchain (TypeScript, vite, etc), **which will bring some breaking changes**.

### Migration from ffmpegwasm

1. Change package names and update imports:
   - `@ffmpeg/ffmpeg` => `@ffmpeg.wasm/main`
   - `@ffmpeg/core` & `@ffmpeg/core-mt` => `@ffmpeg.wasm/core-mt`
   - `@ffmpeg/core-st` => `@ffmpeg.wasm/core-st`
   - `@ffmpeg/types` is expected to be bundled with `@ffmpeg.wasm/main` in v0.13
2. Update version to `^0.12.0`

### Todos

- [x] Update emsdk to latest
- [x] Migrate to pnpm (WIP)
- [x] ESM Support (WIP)
- [x] Test with `vitest`(WIP)
- [ ] Update deps(WIP)
- [ ] Rewrite with TypeScript (WIP)
- [ ] Support for parallel tasks in multi-threaded mode(WIP)
- [ ] Release with Github Action
- [ ] Support build cache
- [ ] Migrate to monorepo
- [ ] Upgrade to FFmpeg@6
- [ ] Use the faster `libsvtav1` instead of `libaom` (currently disabled because it is too slow)

## Original readme

ffmpeg.wasm is a pure Webassembly / Javascript port of FFmpeg. It enables video & audio record, convert and stream right inside browsers.

**AVI to MP4 Demo**

<p align="center">
  <a href="#">
    <img alt="transcode-demo" src="https://github.com/DreamOfIce/ffmpeg.wasm/raw/master/docs/images/transcode.gif">
  </a>
</p>

Try it: [https://ffmpegwasm.netlify.app](https://ffmpegwasm.netlify.app#demo)

Check next steps of ffmpeg.wasm [HERE](https://github.com/DreamOfIce/ffmpeg.wasm/discussions/415)

## Installation

**Node**

```
$ npm install @ffmpeg.wasm/main @ffmpeg.wasm/core-mt
```

> As we are using experimental features, you need to add flags to run in Node.js

```
$ node --experimental-wasm-threads transcode.js
```

**Browser**

Or, using a script tag in the browser (only works in some browsers, see list below):

> SharedArrayBuffer is only available to pages that are [cross-origin isolated](https://developer.chrome.com/blog/enabling-shared-array-buffer/#cross-origin-isolation). So you need to host [your own server](https://github.com/DreamOfIce/ffmpegwasm.github.io/blob/main/server/server.js) with `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers to use ffmpeg.wasm.

```html
<script src="static/js/ffmpeg.min.js"></script>
<script>
  const { createFFmpeg } = FFmpeg;
  ...
</script>
```

> Only browsers with SharedArrayBuffer support can use ffmpeg.wasm, you can check [HERE](https://caniuse.com/sharedarraybuffer) for the complete list.

## Usage

ffmpeg.wasm provides simple to use APIs, to transcode a video you only need few lines of code:

```javascript
import { writeFile } from "fs/promises";
import { createFFmpeg, fetchFile } from "@ffmpeg.wasm/main";

const ffmpeg = createFFmpeg({ log: true });

(async () => {
  await ffmpeg.load();
  ffmpeg\.fs\("(.+?)", "test.avi", await fetchFile("./test.avi"));
  await ffmpeg.run("-i", "test.avi", "test.mp4");
  await fs.promises.writeFile("./test.mp4", ffmpeg\.fs\("(.+?)", "test.mp4"));
  process.exit(0);
})();
```

### Use other version of ffmpeg.wasm-core / @ffmpeg.wasm/core-mt

For each version of ffmpeg.wasm, there is a default version of @ffmpeg.wasm/core-mt (you can find it in **devDependencies** section of [package.json](https://github.com/DreamOfIce/ffmpeg.wasm/blob/master/package.json)), but sometimes you may need to use newer version of @ffmpeg.wasm/core-mt to use the latest/experimental features.

**Node**

Just install the specific version you need:

```bash
$ npm install @ffmpeg.wasm/core-mt@latest
```

Or use your own version with customized path

```javascript
const ffmpeg = createFFmpeg({
  corePath: "../../../src/ffmpeg-core.js",
});
```

**Browser**

```javascript
const ffmpeg = createFFmpeg({
  corePath: "static/js/ffmpeg-core.js",
});
```

Keep in mind that for compatibility with webworkers and nodejs this will default to a local path, so it will attempt to look for `'static/js/ffmpeg.core.js'` locally, often resulting in a local resource error. If you wish to use a core version hosted on your own domain, you might reference it relatively like this:

```javascript
const ffmpeg = createFFmpeg({
  corePath: new URL("static/js/ffmpeg-core.js", document.location).href,
});
```

For the list available versions and their changelog, please check: https://github.com/DreamOfIce/ffmpeg.wasm-core/releases

### Use single thread version

```javascript
const ffmpeg = createFFmpeg({
  mainName: "main",
  corePath: "https://unpkg.com/@ffmpeg.wasm/core-st@0.12.0/dist/ffmpeg-core.js",
});
```

## Multi-threading

Multi-threading need to be configured per external libraries, only following libraries supports it now:

### x264

Run it multi-threading mode by default, no need to pass any arguments.

### libvpx / webm

Need to pass `-row-mt 1`, but can only use one thread to help, can speed up around 30%

## Documentation

- [API](https://github.com/DreamOfIce/ffmpeg.wasm/blob/master/docs/api.md)
- [Supported External Libraries](https://github.com/DreamOfIce/ffmpeg.wasm-core#configuration)

## FAQ

### What is the license of ffmpeg.wasm?

There are two components inside ffmpeg.wasm:

- @ffmpeg.wasm/main (https://github.com/DreamOfIce/ffmpeg.wasm)
- @ffmpeg.wasm/core-mt (https://github.com/DreamOfIce/ffmpeg.wasm-core)

@ffmpeg.wasm/core-mt contains WebAssembly code which is transpiled from original FFmpeg C code with minor modifications, but overall it still following the same licenses as FFmpeg and its external libraries (as each external libraries might have its own license).

@ffmpeg.wasm/main contains kind of a wrapper to handle the complexity of loading core and calling low-level APIs. It is a small code base and under MIT license.

### Can I use ffmpeg.wasm in Firefox?

Yes, but only for Firefox 79+ with proper header in both client and server, visit https://ffmpegwasm.netlify.app to try whether your Firefox works.

![](https://user-images.githubusercontent.com/5723124/98955802-4cb20c80-253a-11eb-8f16-ce0298720a2a.png)

For more details: https://github.com/DreamOfIce/ffmpeg.wasm/issues/106

### What is the maximum size of input file?

2 GB, which is a hard limit in WebAssembly. Might become 4 GB in the future.

### How can I build my own ffmpeg.wasm?

In fact, it is ffmpeg.wasm-core most people would like to build.

To build on your own, you can check build.sh inside https://github.com/DreamOfIce/ffmpeg.wasm-core repository.

Also you can check this series of posts to learn more fundamental concepts:

- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-1-preparation/
- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-2-compile-with-emscripten/
- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-3-v0.1/
- https://jeromewu.github.io/build-ffmpeg-webassembly-version-part-4-v0.2/

### Why it doesn't work in my local environment?

When calling `ffmpeg.load()`, by default it looks for `http://localhost:3000/node_modules/@ffmpeg.wasm/core-mt/dist/` to download essential files (ffmpeg-core.js, ffmpeg-core.wasm, ffmpeg-core.worker.js). It is necessary to make sure you have those files served there.

If you have those files serving in other location, you can rewrite the default behavior when calling `createFFmpeg()`:

```javascript
const { createFFmpeg } = FFmpeg;
const ffmpeg = createFFmpeg({
  corePath: "http://localhost:3000/public/ffmpeg-core.js",
  // Use public address if you don't want to host your own.
  // corePath: 'https://unpkg.com/@ffmpeg.wasm/core-mt@0.10.0/dist/ffmpeg-core.js'
  log: true,
});
```
