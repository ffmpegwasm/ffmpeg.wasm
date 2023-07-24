# Usage

Learn the basics of using ffmpeg.wasm.

:::note
It is recommended to read [introduction](/docs/intro) to fully understand the
rationale.
:::

## Basic

Converting an AVI video to a MP4 video:

```js
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const videoURL = "https://github.com/ffmpegwasm/testdata/raw/master/video-15s.avi";

(async () => {
    const ffmpeg = new FFmpeg();
    // Create a web worker and the worker loads WebAssembly code.
    await ffmpeg.load();
    // Write a video file to FS.
    await ffmpeg.writeFile("input.avi", await fetchFile(videoURL));
    // Execute ffmpeg command.
    await ffmpeg.exec(["-i", "input.avi", "output.mp4"]);
    // Read the output video file from FS, the output file is a Uint8Array typed
    // array.
    const data = await ffmpeg.readFile("output.mp4");
})();
```
