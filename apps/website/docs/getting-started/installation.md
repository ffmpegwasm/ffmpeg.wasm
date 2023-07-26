import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installation

:::note
ffmpeg.wasm only supports running in browser, see [FAQ](/docs/faq) for more
details
:::

## Packages Managers

Install ffmpeg.wasm using package managers like npm and yarn:

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add @ffmpeg/ffmpeg @ffmpeg/util
```

</TabItem>
</Tabs>

## CDN

Install ffmpeg.wasm with minimal setup via installing it via CDN.

<Tabs>
<TabItem value="classic" label="classic" default>

```html
<html>
  <head>
    <script src="https://unpkg.com/@ffmpeg/ffmpeg@0.12.1/dist/umd/ffmpeg.js"></script>
    <script src="https://unpkg.com/@ffmpeg/util@0.12.0/dist/umd/index.js"></script>
    <script>
      const { FFmpeg } = FFmpegWASM;
      const { fetchFile } = FFmpegUtil;
    </script>
  </head>
</html>
```

</TabItem>
<TabItem value="module" label="module">

```html
<html>
  <head>
    <script type="module">
      import { FFmpeg } from "https://unpkg.com/@ffmpeg/ffmpeg@0.12.1/dist/esm/ffmpeg.js";
      import { fetchFile } from "https://unpkg.com/@ffmpeg/util@0.12.0/dist/esm/index.js";
    </script>
  </head>
</html>
```

</TabItem>
</Tabs>
