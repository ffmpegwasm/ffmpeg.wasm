# Introduction

ffmpeg.wasm is an experimental project to run [FFmpeg](https://www.ffmpeg.org/) right
inside your browser without any back-end servers. It enables maximum security
for end-users and equips your web application with rich multimedia processing
capabilities.

We leverage
[Emscripten](https://emscripten.org/) to compile FFmpeg source code and many
libraries to WebAssembly and develop a minimal but essential library to free
developers from common requirements like running ffmpeg inside web worker and
more.

> Talk about how it works with a diagram
