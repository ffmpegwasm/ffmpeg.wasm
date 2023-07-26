# Usage

Learn the basics of using ffmpeg.wasm.

:::note
It is recommended to read [overview](/docs/overview) first.
:::

## Transcoding video

:::tip
`Load ffmpeg-core` might take a few minutes to complete as it downloads
a ~31 MB ffmpeg-core.wasm.
:::

```jsx live
// import { FFmpeg } from '@ffmpeg/ffmpeg';
// import { fetchFile } from '@ffmpeg/util';
function() {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.1/dist/umd'
    const [loaded, setLoaded] = useState(false);
    const ffmpegRef = useRef(new FFmpeg());
    const videoRef = useRef(null);
    const messageRef = useRef(null);

    const load = async () => {
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on("log", ({ message }) => {
            messageRef.current.innerHTML = message;
        });
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`),
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

## Transcoding video (multi-thread)

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
        const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.1/dist/umd'
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on("log", ({ message }) => {
            messageRef.current.innerHTML = message;
        });
        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
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
:::caution
As SharedArrayBuffer is required for multithread version, make sure
you have have fulfilled [Security Requirements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements).
:::

## Transcoding video with timeout

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
        // The exec should stop after 1 second.
        await ffmpeg.exec(['-i', 'input.avi', 'output.mp4'], 1);
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

## Transcoding video with progress

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
        // Listen to progress event instead of log.
        ffmpeg.on("progress", ({ progress }) => {
            messageRef.current.innerHTML = `${progress * 100} %`;
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

:::caution
`progress` is an experimental feature and might not work for many cases
(ex. concat video files, convert image files, ...). Please use with caution.
:::
