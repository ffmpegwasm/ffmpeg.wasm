import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

function App() {
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const messageRef = useRef<HTMLParagraphElement | null>(null)

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
    setLoaded(true);
  };

  const transcode = async () => {
    const videoURL = "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/video-15s.avi";
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile("input.avi", await fetchFile(videoURL));
    await ffmpeg.exec(["-i", "input.avi", "output.mp4"]);
    const fileData = await ffmpeg.readFile('output.mp4');
    const data = new Uint8Array(fileData as ArrayBuffer);
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(
        new Blob([data.buffer], { type: 'video/mp4' })
      )
    }
  };

  return loaded ? (
    <>
      <video ref={videoRef} controls></video>
      <br />
      <button onClick={transcode}>Transcode avi to mp4</button>
      <p ref={messageRef}></p>
    </>
  ) : (
    <button onClick={load}>Load ffmpeg-core</button>
  );
}

export default App;
