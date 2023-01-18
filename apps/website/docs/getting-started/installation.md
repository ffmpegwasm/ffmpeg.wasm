# Installation

ffmpeg.wasm supports multiple ways of installation:

## Packages Managers

To install ffmpeg.wasm using package managers like npm and yarn:

```bash
npm install @ffmpeg/ffmpeg
```

Or

```bash
yarn add @ffmpeg/ffmpeg
```

## Vanilla HTML

To use ffmpeg.wasm directly in your web page:

```html
<html>
  <head>
    <script src="https://unpkg.com/@ffmpeg/ffmpeg@0.12.0/dist/umd/ffmpeg.js"></script>
    <script>
      const { FFmpeg } = FFmpegWASM;
    </script>
  </head>
</html>
```

Or use it as a module:

```html
<html>
  <head>
    <script type="module">
      import { FFmpeg } from "https://unpkg.com/@ffmpeg/ffmpeg@0.12.0/dist/esm/ffmpeg.js";
    </script>
  </head>
</html>
```
