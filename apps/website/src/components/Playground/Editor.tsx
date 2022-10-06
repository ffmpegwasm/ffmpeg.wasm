/// <reference types="ace" />

import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import FolderIcon from "@mui/icons-material/Folder";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import UploadIcon from "@mui/icons-material/Upload";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useColorMode } from "@docusaurus/theme-common";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import AceEditor from "react-ace";
import styles from "./styles.module.css";
import { getFFmpeg } from "./ffmpeg";
import { SAMPLE_FILES } from "./const";
import LinearProgressWithLabel from "./LinearProgressWithLabel";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-github";

const defaultArgs = JSON.stringify(["-i", "video.avi", "video.mp4"], null, 2);
const options = ["Download", "Download as Text File", "Delete"];

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

export default function Editor() {
  const { useState, useEffect } = React;
  const [args, setArgs] = useState<string>(defaultArgs);
  const [logs, setLogs] = useState<string[]>([]);
  const [output, setOutput] = useState<Ace.Editor>();
  const [path, setPath] = useState<string>("/");
  const [nodes, setNodes] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(-1);
  const { colorMode } = useColorMode();
  const theme = colorMode === "dark" ? "github" : "dracula";

  const scrollToEnd = () => {
    output && output.renderer.scrollToLine(Number.POSITIVE_INFINITY);
  };

  const loadSamples = async () => {
    const ffmpeg = getFFmpeg();
    Object.keys(SAMPLE_FILES).forEach(async (name) => {
      await ffmpeg.writeFile(name, await fetchFile(SAMPLE_FILES[name]));
    });
    // Somehow we need to wait a little bit before reading the new nodes.
    setTimeout(async () => {
      setNodes(await ffmpeg.listDir(path));
    }, 500);
  };

  const refreshDir = async () => {
    setNodes(await getFFmpeg().listDir(path));
  };

  const exec = async () => {
    const ffmpeg = getFFmpeg();
    setProgress(-1);
    const logListener = ({ message }) => {
      setLogs((_logs) => [..._logs, message]);
      scrollToEnd();
    };
    const progListener = ({ progress: prog }) => {
      setProgress(prog * 100);
    };
    ffmpeg.on(FFmpeg.LOG, logListener);
    ffmpeg.on(FFmpeg.PROGRESS, progListener);
    await ffmpeg.exec(JSON.parse(args));
    ffmpeg.removeListener(FFmpeg.LOG, logListener);
    ffmpeg.removeListener(FFmpeg.PROGRESS, progListener);
    setNodes(await ffmpeg.listDir(path));
  };

  useEffect(() => {
    const ffmpeg = getFFmpeg();
    ffmpeg.listDir(path).then((nodes) => {
      setNodes(nodes);
    });
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        columns={{ xs: 4, sm: 8, md: 12 }}
      >
        <Grid item xs={4}>
          <Stack direction="row" className={styles.fsTitle}>
            <Typography>File System:</Typography>
            <Box>
              <Tooltip title="Upload a media file">
                <IconButton onClick={() => {}} aria-label="upload-media-file">
                  <UploadFileIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Upload a text file">
                <IconButton onClick={() => {}} aria-label="upload-text">
                  <UploadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh directory">
                <IconButton onClick={refreshDir} aria-label="fresh">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
          <Typography>{`${path}`}</Typography>
          <List dense={true}>
            {nodes.map((node, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <>
                    <IconButton
                      aria-label="more"
                      id="long-button"
                      aria-haspopup="true"
                      edge="end"
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      id="long-menu"
                      MenuListProps={{
                        "aria-labelledby": "long-button",
                      }}
                      PaperProps={{
                        style: {
                          width: "20ch",
                        },
                      }}
                    >
                      {options.map((option) => (
                        <MenuItem key={option} selected={option === "Download"}>
                          {option}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                }
              >
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText primary={node} />
              </ListItem>
            ))}
          </List>
        </Grid>
        <Grid item xs={8}>
          <Stack spacing={1}>
            <Box>
              <Typography>Edit JSON below to update command:</Typography>
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
                onChange={(value) => setArgs(value)}
                setOptions={{ tabSize: 2 }}
              />
            </Box>
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
            <Stack direction="row" spacing={2} className={styles.alignRight}>
              <Button onClick={loadSamples}>Load Sample Files</Button>
              <Button variant="contained" onClick={exec}>
                Run
              </Button>
            </Stack>
            {progress === -1 ? (
              <></>
            ) : (
              <>
                <Typography>Transcoding Progress:</Typography>
                <LinearProgressWithLabel value={progress} />
              </>
            )}
            <AceEditor
              placeholder="ffmpeg console output"
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
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
