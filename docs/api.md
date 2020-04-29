# API

- [createFFmpeg()](#create-ffmpeg)
  - [ffmpeg.load](#ffmpeg-load)
  - [ffmpeg.write](#ffmpeg-write)
  - [ffmpeg.writeText](#ffmpeg-writeText)
  - [ffmpeg.read](#ffmpeg-read)
  - [ffmpeg.remove](#ffmpeg-remove)
  - [ffmpeg.transcode](#ffmpeg-transcode)
  - [ffmpeg.trim](#ffmpeg-trim)
  - [ffmpeg.concatDemuxer](#ffmpeg-concatDemuxer)
  - [ffmpeg.run](#ffmpeg-run)

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
  corePath: "./node_modules/@ffmpeg/core/ffmpeg-core.js",
  log: true,
});
```

<a name="ffmpeg-load"></a>

### ffmpeg.load(): Promise

ffmpeg.load() loads ffmpeg-core.js script (download from remote if not presented), it makes WebAssembly code ready to use.

**Examples:**

```javascript
(async () => {
  await ffmpeg.load();
})();
```

<a name="ffmpeg-write"></a>

### ffmpeg.write(path, data): Promise

ffmpeg.write() writes data to specific path in Emscripten file system, it is an essential step before doing any other tasks.

> Currently we found an issue that you should not have parallel Worker.write() as it may cause unexpected behavior, please do it in sequential for-loop like [HERE](https://github.com/ffmpegjs/ffmpeg.js/blob/master/examples/browser/image2video.html#L36)

**Arguments:**

- `path` path to write data to file system
- `data` data to write, can be Uint8Array, URL, File, Blob or base64 format

**Examples:**

```javascript
(async () => {
  await ffmpeg.write(
    "flame.avi",
    "http://localhost:3000/tests/assets/flame.avi"
  );
})();
```

<a name="ffmpeg-writeText"></a>

### ffmpeg.writeText(path, text): undefined

ffmpeg.write() writes text data to specific path in Emscripten file system.

**Arguments:**

- `path` path to write data to file system
- `text` string to write to file

**Examples:**

```javascript
(async () => {
  ffmpeg.writeText("sub.srt", "...");
})();
```

<a name="ffmpeg-read"></a>

### ffmpeg.read(path): Uint8Array

ffmpeg.read() reads data from file system, often used to get output data after specific task.

**Arguments:**

- `path` path to read data from file system

**Examples:**

```javascript
(async () => {
  const data = ffmpeg.read("output.mp4");
})();
```

<a name="ffmpeg-remove"></a>

### ffmpeg.remove(path): Promise

ffmpeg.remove() removes files in file system, it will be better to delete unused files if you need to run ffmpeg.js multiple times.

**Arguments:**

- `path` path for file to delete

**Examples:**

```javascript
(async () => {
  ffmpeg.remove("output.mp4");
})();
```

<a name="ffmpeg-ls"></a>

### ffmpeg.ls(path): Promise

ffmpeg.ls() lists all files in specific path.

**Arguments:**

- `path` path to list

**Examples:**

```javascript
(async () => {
  const dirs = ffmpeg.ls("/");
})();
```

<a name="ffmpeg-transcode"></a>

### ffmpeg.transcode(input, output, options): Promise

ffmpeg.transcode() transcode a video file to another format.

**Arguments:**

- `input` input file path, the input file should be written through ffmpeg.write()
- `output` output file path, can be read with ffmpeg.read() later
- `options` a string to add extra arguments to ffmpeg

**Examples:**

```javascript
(async () => {
  await ffmpeg.transcode("flame.avi", "output.mp4", "-s 1920x1080");
})();
```

<a name="ffmpeg-trim"></a>

### ffmpeg.trim(input, output, from, to, options): Promise

ffmpeg.trim() trims video to specific interval.

**Arguments:**

- `inputPath` input file path, the input file should be written through ffmpeg.write()
- `outputPath` output file path, can be read with ffmpeg.read() later
- `from` start time, can be in time stamp (00:00:12.000) or seconds (12)
- `to` end time, rule same as above
- `options` a string to add extra arguments to ffmpeg

**Examples:**

```javascript
(async () => {
  await ffmpeg.trim("flame.avi", "output.mp4", 1, 2);
})();
```

<a name="ffmpeg-concatDemuxer"></a>

### ffmpeg.concatDemuxer(input, output, options): Promise

ffmpeg.concatDemuxer() concatenates multiple videos using concatDemuxer. This method won't encode the videos again. But it has its limitations. See [Concat demuxer Wiki](https://trac.ffmpeg.org/wiki/Concatenate)

**Arguments:**

- `input` input file paths as an Array, the input files should be written through ffmpeg.write()
- `output` output file path, can be read with ffmpeg.read() later
- `options` a string to add extra arguments to ffmpeg

**Examples:**

```javascript
(async () => {
  await ffmpeg.concatDemuxer(["flame-1.avi", "flame-2.avi"], "output.mp4");
})();
```

If the input video files are the same as the output video file, you can pass an extra option to speed up the process

```javascript
(async () => {
  await ffmpeg.concatDemuxer(["flame-1.mp4", "flame-2.mp4"], "output.mp4", "-c copy");
})();
```

<a name="ffmpeg-run"></a>

### ffmpeg.run(args): Promise

ffmpeg.run() is similar to FFmpeg cli tool, aims to provide maximum flexiblity for users.

**Arguments:**

- `args` a string to represent arguments

**Examples:**

```javascript
(async () => {
  await ffmpeg.run("-i flame.avi -s 1920x1080 output.mp4");
})();
```
