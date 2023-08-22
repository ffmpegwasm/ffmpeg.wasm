import React, {
  ChangeEvent,
  useState,
  useEffect,
  MutableRefObject,
} from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { downloadFile } from "@site/src/util";
import { Node } from "./types";
import FileSystemManager from "./FileSystemManager";
import { SAMPLE_FILES } from "../const";
import Editor from "./Editor";

const defaultArgs = JSON.stringify(["-i", "video.webm", "video.mp4"], null, 2);

interface WorkspaceProps {
  ffmpeg: MutableRefObject<FFmpeg>;
}

export default function Workspace({ ffmpeg: _ffmpeg }: WorkspaceProps) {
  const [path, setPath] = useState("/");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [args, setArgs] = useState(defaultArgs);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const ffmpeg = _ffmpeg.current;

  const refreshDir = async (curPath: string) => {
    if (ffmpeg.loaded) {
      setNodes(
        (await ffmpeg.listDir(curPath)).filter(({ name }) => name !== ".")
      );
    }
  };

  const onFileUpload =
    (isText: boolean) =>
    async ({ target: { files } }: ChangeEvent<HTMLInputElement>) => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let data: Uint8Array | string = await fetchFile(file);
        if (isText) data = new TextDecoder().decode(data);
        await ffmpeg.writeFile(`${path}/${file.name}`, data);
      }
      refreshDir(path);
    };

  const onFileClick = (name: string) => async (option: string) => {
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

  const onLoadSamples = async () => {
    for (const name of Object.keys(SAMPLE_FILES)) {
      await ffmpeg.writeFile(name, await fetchFile(SAMPLE_FILES[name]));
    }
    refreshDir(path);
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
          <FileSystemManager
            path={path}
            nodes={nodes}
            onFileUpload={onFileUpload}
            onFileClick={onFileClick}
            onDirClick={onDirClick}
            onDirCreate={onDirCreate}
            onLoadSamples={onLoadSamples}
            onRefresh={() => refreshDir(path)}
          />
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
