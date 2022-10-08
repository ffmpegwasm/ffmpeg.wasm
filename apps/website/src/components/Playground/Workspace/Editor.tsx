/// <reference types="ace" />

import React, { useEffect, useState } from "react";
import AceEditor from "react-ace";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LinearProgressWithLabel from "@site/src/components/common/LinearProgressWithLabel";
import { useColorMode } from "@docusaurus/theme-common";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-github";

const genFFmpegText = (args: string) => {
  let data: any = [];
  try {
    data = JSON.parse(args);
  } catch (e) {}
  return `// equivalent ffmpeg.wasm API call
ffmpeg.exec(${JSON.stringify(data)});

// equivalent ffmpeg command line
ffmpeg ${data.join(" ")}`;
};

interface EditorProps {
  args: string;
  logs: string[];
  progress: number;
  time: number;
  onArgsUpdate: (args: string) => void;
  onExec: () => Promise<void>;
}

export default function Editor({
  args = "",
  logs = [],
  progress = 0,
  time = 0,
  onArgsUpdate,
  onExec,
}: EditorProps) {
  const { colorMode } = useColorMode();
  const [output, setOutput] = useState<Ace.Editor>();

  useEffect(() => {
    // scroll logs to the end.
    output && output.renderer.scrollToLine(Number.POSITIVE_INFINITY);
  }, [logs]);

  const theme = colorMode === "dark" ? "github" : "dracula";

  return (
    <Paper variant="outlined" style={{ padding: 8, height: "100%" }}>
      <Stack spacing={1}>
        <Stack>
          <Typography>Editor:</Typography>
          <Typography>Edit arguments below to update command:</Typography>
          <AceEditor
            mode="json"
            theme={theme}
            name="input-args"
            fontSize={16}
            showPrintMargin={true}
            showGutter={true}
            width="100%"
            minLines={8}
            maxLines={8}
            highlightActiveLine={true}
            value={args}
            onChange={onArgsUpdate}
            setOptions={{ tabSize: 2 }}
          />
        </Stack>
        <AceEditor
          mode="javascript"
          theme={theme}
          name="ffmpeg.wasm"
          fontSize={16}
          showGutter={false}
          width="100%"
          minLines={6}
          maxLines={6}
          readOnly
          highlightActiveLine={false}
          value={genFFmpegText(args)}
          setOptions={{ tabSize: 2 }}
        />
        <Typography>Console Output:</Typography>
        <AceEditor
          mode="text"
          theme={theme}
          name="console"
          fontSize={16}
          width="100%"
          minLines={8}
          maxLines={8}
          readOnly
          showPrintMargin={true}
          highlightActiveLine={false}
          value={logs.join("\n")}
          setOptions={{ tabSize: 2 }}
          onLoad={(editor) => setOutput(editor)}
        />
        <Typography>Transcoding Progress:</Typography>
        <LinearProgressWithLabel value={progress} />
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Typography>
            {time === 0 ? "" : `Time Elapsed: ${(time / 1000).toFixed(2)} s`}
          </Typography>
          <Button variant="contained" onClick={onExec}>
            Run
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
