<script setup lang="ts">
import { ref } from 'vue';
import { FFmpeg, type LogEvent } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const FFMPEG_BASE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.9/dist/esm';
const VIDEO_URL = 'https://raw.githubusercontent.com/ffmpegwasm/testdata/master/video-15s.avi';

const ffmpeg = new FFmpeg();
const message = ref('');
const videoSrc = ref<string>();

ffmpeg.on('log', (logEvent: LogEvent) => {
  message.value = logEvent.message;
});

await ffmpeg.load({
  coreURL: await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
  wasmURL: await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
  workerURL: await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.worker.js`, 'text/javascript')
});

async function transcodeVideo() {
  message.value = 'Start video transcoding…';

  await ffmpeg.writeFile('test.avi', await fetchFile(VIDEO_URL));
  await ffmpeg.exec(['-i', 'test.avi', 'test.mp4']);

  const data = await ffmpeg.readFile('test.mp4');
  videoSrc.value = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }));

  message.value = 'Video transcoding completed';
}
</script>

<template>
  <div class="ffmpeg-demo">
    <video :src="videoSrc" controls></video>
    <button @click="transcodeVideo">Transcode video</button>
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.ffmpeg-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
</style>
