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
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import UploadIcon from "@mui/icons-material/Upload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import { useColorMode } from "@docusaurus/theme-common";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { downloadFile } from "@site/src/util";
import AceEditor from "react-ace";
import { getFFmpeg } from "./ffmpeg";
import { SAMPLE_FILES } from "./const";
import LinearProgressWithLabel from "./LinearProgressWithLabel";
import MoreButton from "./MoreButton";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-github";
import ListItemButton from "@mui/material/ListItemButton";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";

const defaultArgs = JSON.stringify(["-i", "video.avi", "video.mp4"], null, 2);
const options = [
  { text: "Download", key: "download" },
  { text: "Download as Text File", key: "download-text" },
  { text: "Delete", key: "delete" },
];

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  p: 4,
};

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
  const [nodes, setNodes] = useState([]);
  const [progress, setProgress] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(0);
  const [folderName, setFolderName] = useState("");
  const handleModalOpen = () => setOpen(true);
  const handleModalClose = () => setOpen(false);
  const { colorMode } = useColorMode();

  const theme = colorMode === "dark" ? "github" : "dracula";

  const scrollToEnd = () => {
    output && output.renderer.scrollToLine(Number.POSITIVE_INFINITY);
  };

  const refreshDir = async (curPath: string) => {
    const ffmpeg = getFFmpeg();
    if (ffmpeg.loaded) {
      setNodes(
        (await ffmpeg.listDir(curPath)).filter(({ name }) => name !== ".")
      );
    }
  };

  const loadSamples = async () => {
    const ffmpeg = getFFmpeg();
    for (const name of Object.keys(SAMPLE_FILES)) {
      await ffmpeg.writeFile(name, await fetchFile(SAMPLE_FILES[name]));
    }
    refreshDir(path);
  };

  const exec = async () => {
    const ffmpeg = getFFmpeg();
    setProgress(0);
    setTime(0);
    const logListener = ({ message }) => {
      setLogs((_logs) => [..._logs, message]);
      scrollToEnd();
    };
    const progListener = ({ progress: prog }) => {
      setProgress(prog * 100);
    };
    ffmpeg.on(FFmpeg.LOG, logListener);
    ffmpeg.on(FFmpeg.PROGRESS, progListener);
    const start = performance.now();
    await ffmpeg.exec(JSON.parse(args));
    setTime(performance.now() - start);
    ffmpeg.removeListener(FFmpeg.LOG, logListener);
    ffmpeg.removeListener(FFmpeg.PROGRESS, progListener);
    refreshDir(path);
  };

  const cd = (name: string) => async () => {
    let nextPath = path;
    if (path === "/") {
      if (name !== "..") nextPath = `/${name}`;
    } else if (name === "..") {
      const cols = path.split("/");
      cols.pop();
      nextPath = cols.length === 1 ? "/" : cols.join("/");
    } else {
      nextPath = `${path}/${name}`;
    }
    setPath(nextPath);
    refreshDir(nextPath);
  };

  const handleFileUpload =
    (isText: boolean = false) =>
    async ({ target: { files } }: React.ChangeEvent<HTMLInputElement>) => {
      const ffmpeg = getFFmpeg();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let data: Uint8Array | string = await fetchFile(file);
        if (isText) data = new TextDecoder().decode(data);
        await ffmpeg.writeFile(`${path}/${file.name}`, data);
      }
      refreshDir(path);
    };

  const handleItemClick = (name: string) => async (option: string) => {
    const ffmpeg = getFFmpeg();
    const fullPath = `${path}/${name}`;
    switch (option) {
      case "download":
        downloadFile(
          name,
          ((await ffmpeg.readFile(fullPath, "binary")) as Uint8Array).buffer
        );
        break;
      case "download-text":
        downloadFile(name, await ffmpeg.readFile(fullPath, "utf8"));
        break;
      case "delete":
        await ffmpeg.deleteFile(fullPath);
        refreshDir(path);
        break;
      default:
        break;
    }
  };

  const handleFolderCreate = async () => {
    if (folderName !== "") {
      await getFFmpeg().createDir(`${path}/${folderName}`);
    }
    refreshDir(path);
    handleModalClose();
  };

  useEffect(() => {
    refreshDir(path);
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={{ xs: 1 }} columns={{ xs: 4, md: 12 }}>
        <Grid item xs={4}>
          <Paper variant="outlined" style={{ padding: 8, height: "100%" }}>
            <Stack justifyContent="space-between" style={{ height: "100%" }}>
              <>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>File System:</Typography>
                  <Box>
                    <Tooltip title="Upload a media file">
                      <IconButton
                        aria-label="upload-media-file"
                        component="label"
                        size="small"
                      >
                        <input
                          hidden
                          multiple
                          type="file"
                          onChange={handleFileUpload(false)}
                        />
                        <UploadFileIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Upload a text file">
                      <IconButton
                        onClick={() => {}}
                        aria-label="upload-text"
                        component="label"
                        size="small"
                      >
                        <input
                          hidden
                          multiple
                          type="file"
                          onChange={handleFileUpload(true)}
                        />
                        <UploadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Create a new folder">
                      <IconButton
                        onClick={() => {
                          setFolderName("");
                          handleModalOpen();
                        }}
                        aria-label="create-a-new-folder"
                        size="small"
                      >
                        <CreateNewFolderIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh directory">
                      <IconButton
                        onClick={() => refreshDir(path)}
                        aria-label="fresh"
                        size="small"
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Stack>
                <Typography>{`Path: ${path}`}</Typography>
                <List style={{ height: 480, overflowX: "auto" }}>
                  {nodes.map(({ name, isDir }, index) =>
                    isDir ? (
                      <ListItemButton key={index} onClick={cd(name)}>
                        <ListItemIcon>
                          <FolderIcon />
                        </ListItemIcon>
                        <ListItemText primary={name} />
                      </ListItemButton>
                    ) : (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <MoreButton
                            options={options}
                            onItemClick={handleItemClick(name)}
                          />
                        }
                      >
                        <ListItemIcon>
                          <InsertDriveFileIcon />
                        </ListItemIcon>
                        <ListItemText primary={name} />
                      </ListItem>
                    )
                  )}
                </List>
              </>
              <Button onClick={loadSamples}>Load Sample Files</Button>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={8}>
          <Paper variant="outlined" style={{ padding: 8, height: "100%" }}>
            <Stack spacing={1}>
              <Stack>
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
                  {time === 0
                    ? ""
                    : `Time Elapsed: ${(time / 1000).toFixed(2)} s`}
                </Typography>
                <Button variant="contained" onClick={exec}>
                  Run
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Modal
        open={open}
        onClose={handleModalClose}
        aria-labelledby="new-folder-name"
        aria-describedby="new-folder-name-description"
      >
        <Box sx={modalStyle}>
          <Stack spacing={4}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Folder Name:
            </Typography>
            <TextField
              id="outlined-basic"
              label="my-folder"
              variant="outlined"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
            />
            <Stack direction="row" justifyContent="flex-end">
              <Button onClick={handleModalClose}>Cancel</Button>
              <Button variant="contained" onClick={handleFolderCreate}>
                Create
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
