import React from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  FFmpeg,
  fetchFile,
  toBlobURL,
};
export default ReactLiveScope;
