import React, {
  ChangeEvent,
  useState,
  useEffect,
  useCallback,
  MutableRefObject,
} from "react";
import { useMediaQuery, useTheme } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { downloadFile } from "@site/src/util";
import { Node } from "./types";
import FileSystemManager from "./FileSystemManager";
import { SAMPLE_FILES } from "../const";
import Editor from "./Editor";
import Typography from "@mui/material/Typography/Typography";
import { Container, Stack } from "@mui/material";

const defaultArgs = JSON.stringify(["-i", "video.webm", "video.mp4"], null, 2);

function findInputPathIdx(argsJson: string): number {
  try {
    const argsArray = JSON.parse(argsJson);
    const inputFlagIdx = argsArray.findIndex((arg: string) => arg === "-i");
    if (inputFlagIdx !== -1 && inputFlagIdx < argsArray.length - 1) {
      return inputFlagIdx + 1;
    }
  } catch (e) {
    // Invalid JSON, return -1
  }
  return -1;
}

interface WorkspaceProps {
  ffmpeg: MutableRefObject<FFmpeg>;
}

export default function Workspace({ ffmpeg: _ffmpeg }: WorkspaceProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [accordionExpanded, setAccordionExpanded] = useState(false);
  const [path, setPath] = useState("/");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [oldName, setOldName] = useState("");
  const [newName, setNewName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [args, setArgs] = useState(defaultArgs);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [waveformUrl, setWaveformUrl] = useState<string | null>(null);
  const [waveformLoading, setWaveformLoading] = useState(false);

  const ffmpeg = _ffmpeg.current;
  
  useEffect(() => {
    setAccordionExpanded(!isSmallScreen);
  }, [isSmallScreen]);

  const generateWaveform = useCallback(async (fileName: string) => {
    if (!ffmpeg.loaded) return;

    setWaveformLoading(true);
    // Clean up previous waveform URL
    if (waveformUrl) {
      URL.revokeObjectURL(waveformUrl);
      setWaveformUrl(null);
    }

    try {
      const pathWithSlash = path === "/" ? "/" : `${path}/`;
      const fullPath = `${pathWithSlash}${fileName}`;
      const outputFile = "_waveform_temp.png";

      // Use showwaves filter to generate an audio waveform visualization
      // showwaves creates a waveform display of audio, output as video frames
      console.log("Generating waveform for", fullPath);
      await ffmpeg.exec([
        "-i", fullPath,
        "-filter_complex", "showwavespic=s=640x120",
        "-frames:v", "1",
        "-y",
        outputFile
      ]);

      // Read the generated waveform image
      const data = await ffmpeg.readFile(outputFile) as Uint8Array;
      const blob = new Blob([data.buffer], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      setWaveformUrl(url);

      // Clean up temp file
      await ffmpeg.deleteFile(outputFile);
    } catch (error) {
      console.error("Failed to generate waveform:", error);
      setWaveformUrl(null);
    } finally {
      setWaveformLoading(false);
    }
  }, [ffmpeg, path, waveformUrl]);

  const onFileSelect = useCallback(async (name: string) => {
    if (selectedFile === name) {
      // Deselect if clicking the same file
      setSelectedFile(null);
      if (waveformUrl) {
        URL.revokeObjectURL(waveformUrl);
        setWaveformUrl(null);
      }
    } else {
      setSelectedFile(name);
      await generateWaveform(name);
    }
  }, [selectedFile, waveformUrl, generateWaveform]);

  const refreshDir = async (curPath: string) => {
    if (ffmpeg.loaded) {
      setNodes(
        (await ffmpeg.listDir(curPath)).filter(({ name }) => name !== ".")
      );
    }
  };

  const onNewNameChange = () => async (event: ChangeEvent<HTMLInputElement>) => {
    setNewName(event.target.value);
  };

  const onCloseRenameModal = () => async () => {
    setRenameOpen(false);
  };

  const onFileUpload =
    (isText: boolean) =>
    async ({ target: { files } }: ChangeEvent<HTMLInputElement>) => {
      let lastFileName = "";
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let data: Uint8Array | string = await fetchFile(file);
        if (isText) data = new TextDecoder().decode(data);
        await ffmpeg.writeFile(`${path}/${file.name}`, data);
        lastFileName = file.name;
      }
      // Update args JSON to use the uploaded filename
      if (!isText && lastFileName) {
        const inputPathIdx = findInputPathIdx(args);
        if (inputPathIdx !== -1) {
          const argsArray = JSON.parse(args);
          argsArray[inputPathIdx] = lastFileName;
          setArgs(JSON.stringify(argsArray, null, 2));
        }
      }
      refreshDir(path);
      setAccordionExpanded(true);
    };

  const onFileClick = (name: string) => async (option: string) => {
    const fullPath = `${path}/${name}`;
    switch (option) {
      case "rename":
        setOldName(name);
        setNewName("");
        setRenameOpen(true);
        break;
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

  const onDirClick = (name: string) => async () => {
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

  const onDirCreate = (name: string) => async () => {
    if (name !== "") {
      await ffmpeg.createDir(`${path}/${name}`);
    }
    refreshDir(path);
  };

  const onRename = (old_name: string, new_name: string) => async () => {
    if (old_name !== "" && new_name !== "") {
      await ffmpeg.rename(`${path}/${old_name}`, `${path}/${new_name}`);
    }
    setRenameOpen(false);
    refreshDir(path);
  };

  const onLoadSamples = async () => {
    for (const name of Object.keys(SAMPLE_FILES)) {
      await ffmpeg.writeFile(name, await fetchFile(SAMPLE_FILES[name]));
    }
    refreshDir(path);
    setAccordionExpanded(true);
  };

  const onExec = async () => {
    setProgress(0);
    setTime(0);
    const logListener = ({ message }) => {
      setLogs((_logs) => [..._logs, message]);
    };
    const progListener = ({ progress: prog }) => {
      setProgress(prog * 100);
    };
    ffmpeg.on("log", logListener);
    ffmpeg.on("progress", progListener);
    const start = performance.now();
    await ffmpeg.exec(JSON.parse(args));
    setTime(performance.now() - start);
    ffmpeg.off("log", logListener);
    ffmpeg.off("progress", progListener);
    refreshDir(path);
  };

  useEffect(() => {
    refreshDir(path);
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={{ xs: 1 }} columns={{ xs: 4, md: 12 }}>
        <Grid item xs={4}>
          <Stack spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="contained"
            component="label"
            size="large"
            startIcon={<UploadFileIcon />}
            sx={{
              width: "100%",
              mb: 0,
              py: 2,
              fontSize: "1.1rem",
              backgroundColor: "#1976d2",
              "&:hover": {
                backgroundColor: "#1565c0",
              },
            }}
          >
            Upload Media
            <input
              hidden
              multiple
              type="file"
              accept="video/*,audio/*,image/*"
              onChange={onFileUpload(false)}
            />
          </Button>
          <Typography variant="body1" align="center" sx={{mt: 0, py:0}}>or</Typography>
          <Button onClick={onLoadSamples} sx={{mt: 0}}>Load Sample Files</Button>
          </Stack>
          <Accordion
            expanded={accordionExpanded}
            onChange={(_, isExpanded) => setAccordionExpanded(isExpanded)}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="file-system-content"
              id="file-system-header"
            >
              <Typography variant="h6" component="h2">File System</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <FileSystemManager
                path={path}
                nodes={nodes}
                oldName={oldName}
                newName={newName}
                renameOpen={renameOpen}
                selectedFile={selectedFile}
                waveformUrl={waveformUrl}
                waveformLoading={waveformLoading}
                onNewNameChange={onNewNameChange}
                onCloseRenameModal={onCloseRenameModal}
                onFileUpload={onFileUpload}
                onFileClick={onFileClick}
                onFileSelect={onFileSelect}
                onDirClick={onDirClick}
                onDirCreate={onDirCreate}
                onRename={onRename}
                onLoadSamples={onLoadSamples}
                onRefresh={() => refreshDir(path)}
              />
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={8}>
          <Editor
            args={args}
            logs={logs}
            progress={progress}
            time={time}
            onArgsUpdate={(_args) => setArgs(_args)}
            onExec={onExec}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
