# ffmpeg.wasm (Homebase Fork)

This repository is a fork of [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm), a WebAssembly-powered FFmpeg library that enables video and audio processing in the browser.

## Why This Fork?

We maintain this fork to override the loading implementation, ensuring compatibility with [`homebase-id/odin-js`](https://github.com/homebase-id/odin-js). This allows seamless integration with the Homebase ecosystem while retaining the full power of FFmpeg in a WebAssembly environment.

The only modified package is the root ffmpeg package `./packages/ffmpeg`, the core package upon loading is still referencing the version of ffmpegwasm

## Publishing the NPM Package to github packages

The ffmpeg package within this repository is located in `./packages/ffmpeg`. If you need to publish a new version to Github packages, follow these steps:

1. Navigate to the package directory:
   ```sh
   cd packages/ffmpeg
   ```

2. Build the package:
   ```sh
   npm run build
   ```

3. Publish the package:
   ```sh
   npm publish
   ```

Ensure you have the necessary permissions and are authenticated with Github before publishing. (You'll need a PAT wtih write:packages permissions)

You will only need to publish a new version if notable changes were made to the ffmpeg package on the originally repo.
