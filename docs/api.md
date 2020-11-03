# API

- [createFFmpeg()](#create-ffmpeg)
  - [ffmpeg.load](#ffmpeg-load)
  - [ffmpeg.run](#ffmpeg-run)
  - [ffmpeg.FS](#ffmpeg-fs)

---

<a name="create-ffmpeg"></a>

## createFFmpeg(options): ffmpeg

createFFmpeg is a factory function that creates a ffmpeg instance.

**Arguments:**

- `options` an object of customized options
  - `corePath` path for ffmpeg-core.js script
  - `log` a boolean to turn on all logs, default is `false`
  - `logger` a function to get log messages, a quick example is `({ message }) => console.log(message)`
  - `progress` a function to trace the progress, a quick example is `p => console.log(p)`

**Examples:**

```javascript
const { createFFmpeg } = FFmpeg;
const ffmpeg = createFFmpeg({
  corePath: "./node_modules/@ffmpeg/core/dist/ffmpeg-core.js",
  log: true,
});
```

<a name="ffmpeg-load"></a>

### ffmpeg.load(): Promise

Load ffmpeg.wasm-core script.

In browser environment, the ffmpeg.wasm-core script is fetch from CDN and can be assign to a local path by assigning `corePath`. In node environment, we use dynamic require and the default `corePath` is `$ffmpeg/core`.

Typically the load() func might take few seconds to minutes to complete, better to do it as early as possible.

**Examples:**

```javascript
(async () => {
  await ffmpeg.load();
})();
```

<a name="ffmpeg-run"></a>

### ffmpeg.run(...args): Promise

This is the major function in ffmpeg.wasm, you can just imagine it as ffmpeg native cli and what you need to pass is the same.

**Arguments:**

- `args` string arguments just like cli tool.

**Examples:**

```javascript
(async () => {
  await ffmpeg.run('-i', 'flame.avi', '-s', '1920x1080', 'output.mp4');
  /* equals to `$ ffmpeg -i flame.avi -s 1920x1080 output.mp4` */
})();
```

<a name="ffmpeg-fs"></a>

### ffmpeg.FS(method, ...args): any

Run FS operations.

For input/output file of ffmpeg.wasm, it is required to save them to MEMFS first so that ffmpeg.wasm is able to consume them. Here we rely on the FS methods provided by Emscripten.

For more info, check https://emscripten.org/docs/api_reference/Filesystem-API.html

**Arguments:**

- `method` string method name
- `args` arguments to pass to method

**Examples:**

```javascript
/* Write data to MEMFS, need to use Uint8Array for binary data */
ffmpeg.FS('writeFile', 'video.avi', new Uint8Array(...));
/* Read data from MEMFS */
ffmpeg.FS('readFile', 'video.mp4');
/* Delete file in MEMFS */
ffmpeg.FS('unlink', 'video.mp4');
```
