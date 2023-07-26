import React, { useState, useEffect, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import Stack from "@mui/material/Stack";
import MuiThemeProvider from "@site/src/components/common/MuiThemeProvider";
import CoreDownloader from "./CoreDownloader";
import Workspace from "./Workspace";
import { CORE_URL, CORE_MT_URL } from "./const";
import CoreSwitcher from "./CoreSwitcher";

enum State {
  NOT_LOADED,
  LOADING,
  LOADED,
}

export default function Playground() {
  const [state, setState] = useState(State.LOADED);
  const [isCoreMT, setIsCoreMT] = useState(false);
  const [url, setURL] = useState("");
  const [received, setReceived] = useState(0);
  const ffmpeg = useRef(new FFmpeg());

  const load = async (mt: boolean = false) => {
    setState(State.LOADING);
    const setProgress = ({ url: _url, received: _received }) => {
      setURL(_url as string);
      setReceived(_received);
    };
    const coreURL = await toBlobURL(
      mt ? CORE_MT_URL : CORE_URL,
      "text/javascript",
      true,
      setProgress
    );
    const wasmURL = await toBlobURL(
      mt
        ? CORE_MT_URL.replace(/.js$/g, ".wasm")
        : CORE_URL.replace(/.js$/g, ".wasm"),
      "application/wasm",
      true,
      setProgress
    );
    const workerURL = mt
      ? await toBlobURL(
          CORE_MT_URL.replace(/.js$/g, ".worker.js"),
          "text/javascript",
          true,
          setProgress
        )
      : "";
    ffmpeg.current.terminate();
    await ffmpeg.current.load({
      coreURL,
      wasmURL,
      workerURL,
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
              return <Workspace ffmpeg={ffmpeg} />;
            default:
              return <></>;
          }
        })()}
      </Stack>
    </MuiThemeProvider>
  );
}
