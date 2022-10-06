import React, { useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import Button from "@mui/material/Button";
import { useColorMode } from "@docusaurus/theme-common";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const lightTheme = createTheme({});
const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function Playground() {
  const [loaded, setLoaded] = useState(false);
  const { colorMode } = useColorMode();
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
  return (
    <ThemeProvider theme={colorMode === "dark" ? darkTheme : lightTheme}>
      {loaded ? (
        <></>
      ) : (
        <Button variant="contained" onClick={load}>
          Load
        </Button>
      )}
    </ThemeProvider>
  );
}
