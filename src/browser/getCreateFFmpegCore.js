/* eslint-disable no-undef */
import { log } from '../utils/log';
import {
  CREATE_FFMPEG_CORE_IS_NOT_DEFINED,
} from '../utils/errors';

/*
 * Fetch data from remote URL and convert to blob URL
 * to avoid CORS issue
 */
const toBlobURL = async (url, mimeType) => {
  log('info', `fetch ${url}`);
  const buf = await (await fetch(url)).arrayBuffer();
  log('info', `${url} file size = ${buf.byteLength} bytes`);
  const blob = new Blob([buf], { type: mimeType });
  const blobURL = URL.createObjectURL(blob);
  log('info', `${url} blob URL = ${blobURL}`);
  return blobURL;
};

// eslint-disable-next-line
export const getCreateFFmpegCore = async ({
  corePath: _corePath,
  workerPath: _workerPath,
  wasmPath: _wasmPath,
}) => {
  // in Web Worker context
  // eslint-disable-next-line
  if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    if (typeof _corePath !== 'string') {
      throw Error('corePath should be a string!');
    }
    const coreRemotePath = new URL(_corePath, import.meta.url).href;
    const corePath = await toBlobURL(
      coreRemotePath,
      'application/javascript',
    );
    const wasmPath = await toBlobURL(
      _wasmPath !== undefined ? _wasmPath : coreRemotePath.replace('ffmpeg-core.js', 'ffmpeg-core.wasm'),
      'application/wasm',
    );
    const workerPath = await toBlobURL(
      _workerPath !== undefined ? _workerPath : coreRemotePath.replace('ffmpeg-core.js', 'ffmpeg-core.worker.js'),
      'application/javascript',
    );
    if (typeof createFFmpegCore === 'undefined') {
      return new Promise((resolve) => {
        globalThis.importScripts(corePath);
        if (typeof createFFmpegCore === 'undefined') {
          throw Error(CREATE_FFMPEG_CORE_IS_NOT_DEFINED(coreRemotePath));
        }
        log('info', 'ffmpeg-core.js script loaded');
        resolve({
          createFFmpegCore,
          corePath,
          wasmPath,
          workerPath,
        });
      });
    }
    log('info', 'ffmpeg-core.js script is loaded already');
    return Promise.resolve({
      createFFmpegCore,
      corePath,
      wasmPath,
      workerPath,
    });
  }
  if (typeof _corePath !== 'string') {
    throw Error('corePath should be a string!');
  }
  const coreRemotePath = new URL(_corePath, import.meta.url).href;
  const corePath = await toBlobURL(
    coreRemotePath,
    'application/javascript',
  );
  const wasmPath = await toBlobURL(
    _wasmPath !== undefined ? _wasmPath : coreRemotePath.replace('ffmpeg-core.js', 'ffmpeg-core.wasm'),
    'application/wasm',
  );
  const workerPath = await toBlobURL(
    _workerPath !== undefined ? _workerPath : coreRemotePath.replace('ffmpeg-core.js', 'ffmpeg-core.worker.js'),
    'application/javascript',
  );
  if (typeof createFFmpegCore === 'undefined') {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      const eventHandler = () => {
        script.removeEventListener('load', eventHandler);
        if (typeof createFFmpegCore === 'undefined') {
          throw Error(CREATE_FFMPEG_CORE_IS_NOT_DEFINED(coreRemotePath));
        }
        log('info', 'ffmpeg-core.js script loaded');
        resolve({
          createFFmpegCore,
          corePath,
          wasmPath,
          workerPath,
        });
      };
      script.src = corePath;
      script.type = 'text/javascript';
      script.addEventListener('load', eventHandler);
      document.getElementsByTagName('head')[0].appendChild(script);
    });
  }
  log('info', 'ffmpeg-core.js script is loaded already');
  return Promise.resolve({
    createFFmpegCore,
    corePath,
    wasmPath,
    workerPath,
  });
};
