# Usage

Learn the basics of using ffmpeg.wasm.

:::note
It is recommended to read [overview](/docs/overview) first.
:::

## Transcoding AVI video to MP4 video

:::tip
`Load ffmpeg-core` might take a few minutes to complete as it downloads
a ~31 MB ffmpeg-core.wasm.
:::

```jsx live
// import { FFmpeg } from '@ffmpeg/ffmpeg';
// import { fetchFile } from '@ffmpeg/util';
function() {
    const [loaded, setLoaded] = useState(false);
    const ffmpegRef = useRef(new FFmpeg());
    const videoRef = useRef(null);
    const messageRef = useRef(null);

    const load = async () => {
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on("log", ({ message }) => {
            messageRef.current.innerHTML = message;
        });
        await ffmpeg.load();
        setLoaded(true);
    }

    const transcode = async () => {
        const ffmpeg = ffmpegRef.current;
        await ffmpeg.writeFile(
            "input.avi",
            await fetchFile('/video/video-15s.avi')
        );
        await ffmpeg.exec(['-i', 'input.avi', 'output.mp4']);
        const data = await ffmpeg.readFile('output.mp4');
        videoRef.current.src =
            URL.createObjectURL(new Blob([data.buffer], {type: 'video/mp4'}));
    }

    return (loaded
        ? (
            <>
                <video ref={videoRef} controls></video><br/>
                <button onClick={transcode}>Transcode avi to mp4</button>
                <p ref={messageRef}></p>
            </>
        )
        : (
            <button onClick={load}>Load ffmpeg-core</button>
        )
    );
}
```

## Transcoding AVI video to MP4 video (multi-thread)

:::tip
`Load ffmpeg-core` might take a few minutes to complete as it downloads
a ~31 MB ffmpeg-core.wasm.
:::

```jsx live
// import { FFmpeg } from '@ffmpeg/ffmpeg';
// import { fetchFile, toBlobURL } from '@ffmpeg/util';
function() {
    const [loaded, setLoaded] = useState(false);
    const ffmpegRef = useRef(new FFmpeg());
    const videoRef = useRef(null);
    const messageRef = useRef(null);

    const load = async () => {
        const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.0-alpha.2/dist/umd'
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on("log", ({ message }) => {
            messageRef.current.innerHTML = message;
        });
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`),
            workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`),
            thread: true,
        });
        setLoaded(true);
    }

    const transcode = async () => {
        const ffmpeg = ffmpegRef.current;
        await ffmpeg.writeFile(
            "input.avi",
            await fetchFile('/video/video-15s.avi')
        );
        await ffmpeg.exec(['-i', 'input.avi', 'output.mp4']);
        const data = await ffmpeg.readFile('output.mp4');
        videoRef.current.src =
            URL.createObjectURL(new Blob([data.buffer], {type: 'video/mp4'}));
    }

    return (loaded
        ? (
            <>
                <video ref={videoRef} controls></video><br/>
                <button onClick={transcode}>Transcode avi to mp4</button>
                <p ref={messageRef}></p>
            </>
        )
        : (
            <button onClick={load}>Load ffmpeg-core</button>
        )
    );
}
```
