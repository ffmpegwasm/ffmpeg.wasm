<script lang="ts">
	import { FFmpeg } from '@ffmpeg/ffmpeg';
	// @ts-ignore
	import type { LogEvent } from '@ffmpeg/ffmpeg/dist/esm/types';
	import { fetchFile, toBlobURL } from '@ffmpeg/util';

	let videoEl: HTMLVideoElement;

	const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm';
	const videoURL = 'https://raw.githubusercontent.com/ffmpegwasm/testdata/master/video-15s.avi';

	let message = 'Click Start to Transcode';

	async function transcode() {
		const ffmpeg = new FFmpeg();
		message = 'Loading ffmpeg-core.js';
		ffmpeg.on('log', ({ message: msg }: LogEvent) => {
			message = msg;
			console.log(message);
		});
		await ffmpeg.load({
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
			wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
			workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
		});
		message = 'Start transcoding';
		await ffmpeg.writeFile('test.avi', await fetchFile(videoURL));
		await ffmpeg.exec(['-i', 'test.avi', 'test.mp4']);
		message = 'Complete transcoding';
		const data = await ffmpeg.readFile('test.mp4');
		console.log('done');
		videoEl.src = URL.createObjectURL(
			new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' })
		);
	}
</script>

<div>
	<!-- svelte-ignore a11y-media-has-caption -->
	<video bind:this={videoEl} controls />
	<br />
	<button on:click={transcode}>Start</button>
	<p>{message}</p>
</div>
