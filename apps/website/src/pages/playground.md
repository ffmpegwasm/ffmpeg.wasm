import BrowserOnly from '@docusaurus/BrowserOnly';
import MuiThemeProvider from "@site/src/components/common/MuiThemeProvider";
import ThemedButton from "@site/src/components/common/ThemedButton";
import ThemedIconButton from "@site/src/components/common/ThemedIconButton";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import UploadIcon from "@mui/icons-material/Upload";

# Playground

Playground allows you to try ffmpeg.wasm without any installation and
development!

:::tip Quick Start

1. Wait for assets (~32 MB) downloading.
2. Press <ThemedButton>Load Sample Files</ThemedButton> to download & add sample files.
3. Press <ThemedButton variant="contained">Run</ThemedButton> to convert an AVI file to MP4 file.
4. Download output files.

:::

<BrowserOnly>
  {() => {
    const Playground = require('@site/src/components/Playground').default;
    return <Playground/>
  }}
</BrowserOnly>

<div style={{ height: 32 }} />

:::tip
Demo Video: [https://youtu.be/F01B0fV20QA](https://youtu.be/F01B0fV20QA)
:::

## How to Use :rocket:

> It is recommended to read [Overview](/docs/overview) first to learn
ffmpeg.wasm fundamentals.

A typical flow to use ffmpeg.wasm is:

#### Download and load JavaScript & WebAssembly assets

The assets are downloaded automatically when you enter the Playground. You can
choose to use multithreading version instead by click on the switch:

<MuiThemeProvider>
  <BrowserOnly>
  {() => {
    const CoreSwitcher = require('@site/src/components/Playground/CoreSwitcher').default;
    return <CoreSwitcher/>;
  }}
  </BrowserOnly>
</MuiThemeProvider>

#### Load files to in-memory File System

When ffmpeg.wasm is loaded and ready, you can upload files to its in-memory File
System to make sure these files can be consumed by the ffmpeg.wasm APIs:

<div style={{ maxWidth: 260 }}>
  <MuiThemeProvider>
    <BrowserOnly>
    {() => {
      const FileSystemManager = require('@site/src/components/Playground/Workspace/FileSystemManager').default;
      return (
        <FileSystemManager
          nodes={[
            {name: "..", isDir: true},
            {name: "tmp", isDir: true},
            {name: "home", isDir: true},
            {name: "dev", isDir: true},
            {name: "proc", isDir: true},
            {name: "video.avi", isDir: false},
          ]}
        />
      );
    }}
    </BrowserOnly>
  </MuiThemeProvider>
</div>

<div style={{ height: 32 }} />

- <ThemedIconButton size="small"><UploadFileIcon fontSize="small"
    /></ThemedIconButton>: Upload a media file.
- <ThemedIconButton size="small"><UploadIcon fontSize="small"
    /></ThemedIconButton>: Upload a text file.
- <ThemedIconButton size="small"><CreateNewFolderIcon fontSize="small"
    /></ThemedIconButton>: Create a new folder.
- <ThemedIconButton size="small"><RefreshIcon fontSize="small"
    /></ThemedIconButton>: Refresh File System.

> Press <ThemedButton>Load Sample Files</ThemedButton> to load a set of samples
files.

#### Run a command 

With files are ready in the File System, you can update arguments in the Editor
and hit <ThemedButton variant="contained">Run</ThemedButton> afterward:

<div style={{ maxWidth: 480 }}>
  <MuiThemeProvider>
    <BrowserOnly>
    {() => {
      const Editor = require('@site/src/components/Playground/Workspace/Editor').default;
      return (
        <Editor args={JSON.stringify(["-i", "video.avi", "video.mp4"], null, 2)} />
      );
    }}
    </BrowserOnly>
  </MuiThemeProvider>
</div>

<div style={{ height: 32 }} />

#### Download output files

Lastly you can download your files using File System panel and check the result.
:tada:
