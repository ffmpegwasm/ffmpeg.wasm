import React, { useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";

export default function Playground() {
  const [loaded, setLoaded] = useState(false);
  const ffmpeg = new FFmpeg();
  const load = async () => {
    ffmpeg.on(FFmpeg.DOWNLOAD, ({ url, total, received, done }) => {
      console.log(url, total, received, done);
    });
    await ffmpeg.load({
      coreURL: "http://localhost:8080/packages/core/dist/umd/ffmpeg-core.js",
    });
    setLoaded(true);
  };
  return loaded ? <></> : <button onClick={load}>Load</button>;
}
