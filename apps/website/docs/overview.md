import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

# Overview

## Introduction

ffmpeg.wasm is a pure WebAssembly / JavaScript port of [FFmpeg](https://www.ffmpeg.org/)
enabling video & audio record, convert and stream right inside browsers.

We leverage
[Emscripten](https://emscripten.org/) to transpile FFmpeg source code and many
libraries to WebAssembly and develop a minimal but essential library to free
developers from common requirements like running ffmpeg inside web worker and
more.

## Advantages

- **Security**: your users' data only lives inside their browser, no need to
    worry about any data leakage or network latency.
- **Client-side computing**: instead of hosting a cluster of server-end servers,
    you can now offload multimedia processing to client-side.
- **Flexible**: ffmpeg.wasm comes with single-thread and multi-thread cores, you
    can use whichever fits your use case.

## Architecture

![architecture](/img/ffmpegwasm-arch.png)

Multimedia transcoding is a resource-intensive task that you don't want to
execute in main thread, thus in ffmpeg.wasm we offload those task to web worker
(`ffmpeg.worker`) by default. This makes almost all function calls in ffmpeg.wasm
are asynchronous and it is recommended to use **async** / **await** syntax.

`ffmpeg.worker` downloads WebAssembly code (`ffmpeg-core`) from CDN
and initialized it in WorkerGlobalScope. For any input video file you would like
to process, you need to first populated them inside ffmpeg-core File System and
also read result from `ffmpeg-core` File System once it is done.

If you are using a multi-thread version of `ffmpeg-core`, more web workers will
be spawned by `ffmpeg-core` inside `ffmpeg.worker`

## Libraries

ffmpeg.wasm is built with toolchains / libraries:

<TableContainer>
  <Table sx={{ minWidth: 650 }} aria-label="simple table">
    <TableHead>
      <TableRow>
        <TableCell align="center">Name</TableCell>
        <TableCell align="center">Version</TableCell>
        <TableCell align="center">Note</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {[
        {name: "Emscripten", version: "3.1.40", note: ""},
        {name: "FFmpeg", version: "n5.1.3", note: ""},
        {name: "x264", version: "0.164.x", note: ""},
        {name: "x265", version: "3.4", note: ""},
        {name: "libvpx", version: "v1.9.0", note: ""},
        {name: "lame", version: "3.100", note: ""},
        {name: "ogg", version: "v1.3.4", note: ""},
        {name: "theora", version: "v1.1.1", note: ""},
        {name: "opus", version: "v1.3.1", note: ""},
        {name: "vorbis", version: "v1.3.3", note: ""},
        {name: "zlib", version: "v1.2.11", note: ""},
        {name: "libwebp", version: "v1.1.0", note: ""},
        {name: "freetype2", version: "v2.10.4", note: ""},
        {name: "fribidi", version: "v1.0.9", note: ""},
        {name: "harfbuzz", version: "5.2.0", note: ""},
        {name: "libass", version: "0.15.0", note: ""},
       ].map((row) => (
        <TableRow
          key={row.name}
        >
          <TableCell component="th" scope="row">
            {row.name}
          </TableCell>
          <TableCell align="center">{row.version}</TableCell>
          <TableCell align="center">{row.note}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
