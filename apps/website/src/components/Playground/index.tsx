import * as React from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import MuiThemeProvider from "@site/src/components/MuiThemeProvider";
import CoreSelector from "./CoreSelector";
import CoreDownloader from "./CoreDownloader";
import Editor from "./Editor";
import { getFFmpeg } from "./ffmpeg";

enum State {
  NOT_LOADED,
  LOADING,
  LOADED,
}

export default function Playground() {
  const { useState } = React;
  const [state, setState] = useState(State.LOADED);
  const [option, setOption] = useState("core");
  const [url, setURL] = useState("");
  const [received, setReceived] = useState(0);
  const load = async () => {
    setState(State.LOADING);
    const ffmpeg = getFFmpeg();
    ffmpeg.terminate();
    ffmpeg.on(FFmpeg.DOWNLOAD, ({ url: _url, received: _received }) => {
      setURL(_url as string);
      setReceived(_received);
    });
    await ffmpeg.load();
    setState(State.LOADED);
  };

  return (
    <MuiThemeProvider>
      {(() => {
        switch (state) {
          case State.LOADING:
            return <CoreDownloader url={url} received={received} />;
          case State.LOADED:
            return <Editor />;
          default:
            return <></>;
        }
      })()}
      <CoreSelector
        option={option}
        onChange={(event) => {
          setOption((event.target as HTMLInputElement).value);
        }}
        onSubmit={load}
      />
    </MuiThemeProvider>
  );
}
