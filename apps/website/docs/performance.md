# Performance

ffmpeg.wasm uses transpiled FFmpeg C source code to WebAssembly code, it is for
certain that ffmpeg.wasm won't perform as good as FFmpeg as it is not fully
optimized at the moment. (Even in ffmpeg.wasm multithread version). In this
section we provide a short comparison, so that you can make decision based on your
needs:

## Environment

- CPU: 8 × 11th Gen Intel® Core™ i5-1135G7 @ 2.40GHz
- Memory: 15.6 GiB of RAM
- OS: Manjaro Linux 6.1.44-1-MANJARO (64-bit)
- Browser: Google Chrome Version 116.0.5845.96 (Official Build) (64-bit)
- FFmpeg: n5.1.2

## Comparison

Setup:

- Each command is executed 5 times.
- Only `ffmpeg.exec()` time is measured.
- Candidates
  - FFmpeg: [native FFmpeg](https://hub.docker.com/r/linuxserver/ffmpeg),
      considered as baseline.
  - core: ffmpeg.wasm single thread version.
  - core-mt: ffmpeg.wasm multi thread version.

### $ ffmpeg -i [input.webm](https://test-videos.co.uk/vids/bigbuckbunny/webm/vp8/720/Big_Buck_Bunny_720_10s_1MB.webm) output.mp4

|  #  | FFmpeg | core v0.12.3 | core-mt v0.12.3 |
| --- | ------ | ------------ | --------------- |
| Avg | 5.2 sec | 128.8 sec (0.04x) | 60.4 sec (0.08x) |
| Max | 5.3 sec | 130.7 sec | 63.9 sec |
| Min | 5.1 sec | 126.6 sec | 59 sec |
