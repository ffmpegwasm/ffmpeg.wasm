import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { createSignal, Show } from 'solid-js';

const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
const videoURL =
  'https://raw.githubusercontent.com/ffmpegwasm/testdata/master/video-15s.avi';

export default function Home() {
  const [loaded, setLoaded] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  let ffmpegRef = new FFmpeg();
  let videoRef: any = null;
  let messageRef: any = null;

  const load = async () => {
    setIsLoading(true);
    const ffmpeg = ffmpegRef;
    ffmpeg.on('log', ({ message }) => {
      if (messageRef) messageRef.innerHTML = message;
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        'text/javascript'
      ),
    });
    setLoaded(true);
    setIsLoading(false);
  };

  const transcode = async () => {
    const ffmpeg = ffmpegRef;
    // u can use 'https://ffmpegwasm.netlify.app/video/video-15s.avi' to download the video to public folder for testing
    await ffmpeg.writeFile('input.avi', await fetchFile(videoURL));
    await ffmpeg.exec(['-i', 'input.avi', 'output.mp4']);
    const data = (await ffmpeg.readFile('output.mp4')) as any;
    if (videoRef)
      videoRef.src = URL.createObjectURL(
        new Blob([data.buffer], { type: 'video/mp4' })
      );
  };

  return (
    <Show
      when={loaded()}
      fallback={
        <button
          class='fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex items-center bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded'
          onClick={load}>
          Load ffmpeg-core
          <Show when={isLoading()}>
            <span class='animate-spin ml-3'>
              <svg
                viewBox='0 0 1024 1024'
                data-icon='loading'
                width='1em'
                height='1em'
                fill='currentColor'
                aria-hidden='true'>
                <path d='M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z'></path>
              </svg>
            </span>
          </Show>
        </button>
      }>
      <div class='fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]'>
        <video ref={videoRef} controls></video>
        <br />
        <button
          onClick={transcode}
          class='bg-green-500 hover:bg-green-700 text-white py-3 px-6 rounded'>
          Transcode avi to mp4
        </button>
        <p ref={messageRef}></p>
      </div>
    </Show>
  );
}
