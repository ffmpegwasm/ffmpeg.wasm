import * as React from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import Stack from "@mui/material/Stack";
import MuiThemeProvider from "@site/src/components/MuiThemeProvider";
import CoreDownloader from "./CoreDownloader";
import Editor from "./Editor";
import { getFFmpeg } from "./ffmpeg";
import { CORE_URL, CORE_MT_URL } from "./const";
import CoreSwitcher from "./CoreSwitcher";

enum State {
  NOT_LOADED,
  LOADING,
  LOADED,
}

export default function Playground() {
  const { useState, useEffect } = React;
  const [state, setState] = useState(State.LOADED);
  const [isCoreMT, setIsCoreMT] = useState(false);
  const [url, setURL] = useState("");
  const [received, setReceived] = useState(0);
  const load = async (mt: boolean = false) => {
    setState(State.LOADING);
    const ffmpeg = getFFmpeg();
    ffmpeg.terminate();
    ffmpeg.on(FFmpeg.DOWNLOAD, ({ url: _url, received: _received }) => {
      setURL(_url as string);
      setReceived(_received);
    });
    await ffmpeg.load({
      coreURL: mt ? CORE_MT_URL : CORE_URL,
      thread: mt,
    });
    setState(State.LOADED);
  };

  useEffect(() => {
    load(isCoreMT);
  }, []);

  return (
    <MuiThemeProvider>
      <Stack spacing={4}>
        <CoreSwitcher
          checked={isCoreMT}
          onChange={(evt) => {
            setIsCoreMT(evt.target.checked);
            load(evt.target.checked);
          }}
        />
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
      </Stack>
    </MuiThemeProvider>
  );
}
