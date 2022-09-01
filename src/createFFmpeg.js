const { defaultArgs, baseOptions } = require('./config');
const parseArgs = require('./utils/parseArgs');
const { defaultOptions, getCreateFFmpegCore } = require('./node');
const { version } = require('../package.json');

const NO_LOAD = Error('ffmpeg.wasm is not ready, make sure you have completed load().');

module.exports = (_options = {}) => {
  const {
    log: optLog,
    logger,
    progress: optProgress,
    ...options
  } = {
    ...baseOptions,
    ...defaultOptions,
    ..._options,
  };
  let Core = null;
  let ffmpeg = null;
  let runResolve = null;
  let runReject = null;
  let running = false;
  let customLogger = () => {};
  let logging = optLog;
  let progress = optProgress;
  let duration = 0;
  let frames = 0;
  let readFrames = false;
  let ratio = 0;

  const detectCompletion = (message) => {
    if (message === 'FFMPEG_END' && runResolve !== null) {
      runResolve();
      runResolve = null;
      runReject = null;
      running = false;
    }
  };
  const log = (type, message) => {
    customLogger({ type, message });
    if (logging) {
      console.log(`[${type}] ${message}`);
    }
  };
  const ts2sec = (ts) => {
    const [h, m, s] = ts.split(':');
    return (parseFloat(h) * 60 * 60) + (parseFloat(m) * 60) + parseFloat(s);
  };
  const parseProgress = (message, prog) => {
    if (typeof message === 'string') {
      if (message.startsWith('  Duration')) {
        const ts = message.split(', ')[0].split(': ')[1];
        const d = ts2sec(ts);
        prog({ duration: d, ratio });
        if (duration === 0 || duration > d) {
          duration = d;
          readFrames = true;
        }
      } else if (readFrames && message.startsWith('    Stream')) {
        const match = message.match(/([\d.]+) fps/);
        if (match) {
          const fps = parseFloat(match[1]);
          frames = duration * fps;
        } else {
          frames = 0;
        }
        readFrames = false;
      } else if (message.startsWith('frame') || message.startsWith('size')) {
        const ts = message.split('time=')[1].split(' ')[0];
        const t = ts2sec(ts);
        const match = message.match(/frame=\s*(\d+)/);
        if (frames && match) {
          const f = parseFloat(match[1]);
          ratio = Math.min(f / frames, 1);
        } else {
          ratio = t / duration;
        }
        prog({ ratio, time: t });
      } else if (message.startsWith('video:')) {
        prog({ ratio: 1 });
        duration = 0;
      }
    }
  };
  const parseMessage = ({ type, message }) => {
    log(type, message);
    parseProgress(message, progress);
    detectCompletion(message);
  };

  /*
   * Load ffmpeg.wasm-core script.
   * In browser environment, the ffmpeg.wasm-core script is fetch from
   * CDN and can be assign to a local path by assigning `corePath`.
   * In node environment, we use dynamic require and the default `corePath`
   * is `$ffmpeg/core`.
   *
   * Typically the load() func might take few seconds to minutes to complete,
   * better to do it as early as possible.
   *
   */
  const load = async () => {
    log('info', 'load ffmpeg-core');
    if (Core === null) {
      log('info', 'loading ffmpeg-core');
      /*
       * In node environment, all paths are undefined as there
       * is no need to set them.
       */
      const {
        createFFmpegCore,
        corePath,
        workerPath,
        wasmPath,
      } = await getCreateFFmpegCore(options);
      Core = await createFFmpegCore({
        /*
         * Assign mainScriptUrlOrBlob fixes chrome extension web worker issue
         * as there is no document.currentScript in the context of content_scripts
         */
        mainScriptUrlOrBlob: corePath,
        printErr: (message) => parseMessage({ type: 'fferr', message }),
        print: (message) => parseMessage({ type: 'ffout', message }),
        /*
         * locateFile overrides paths of files that is loaded by main script (ffmpeg-core.js).
         * It is critical for browser environment and we override both wasm and worker paths
         * as we are using blob URL instead of original URL to avoid cross origin issues.
         */
        locateFile: (path, prefix) => {
          if (typeof window !== 'undefined' || typeof WorkerGlobalScope !== 'undefined') {
            if (typeof wasmPath !== 'undefined'
              && path.endsWith('ffmpeg-core.wasm')) {
              return wasmPath;
            }
            if (typeof workerPath !== 'undefined'
              && path.endsWith('ffmpeg-core.worker.js')) {
              return workerPath;
            }
          }
          return prefix + path;
        },
      });
      ffmpeg = Core.cwrap(options.mainName || 'proxy_main', 'number', ['number', 'number']);
      log('info', 'ffmpeg-core loaded');
    } else {
      throw Error('ffmpeg.wasm was loaded, you should not load it again, use ffmpeg.isLoaded() to check next time.');
    }
  };

  /*
   * Determine whether the Core is loaded.
   */
  const isLoaded = () => Core !== null;

  /*
   * Run ffmpeg command.
   * This is the major function in ffmpeg.wasm, you can just imagine it
   * as ffmpeg native cli and what you need to pass is the same.
   *
   * For example, you can convert native command below:
   *
   * ```
   * $ ffmpeg -i video.avi -c:v libx264 video.mp4
   * ```
   *
   * To
   *
   * ```
   * await ffmpeg.run('-i', 'video.avi', '-c:v', 'libx264', 'video.mp4');
   * ```
   *
   */
  const run = (..._args) => {
    log('info', `run ffmpeg command: ${_args.join(' ')}`);
    if (Core === null) {
      throw NO_LOAD;
    } else if (running) {
      throw Error('ffmpeg.wasm can only run one command at a time');
    } else {
      running = true;
      return new Promise((resolve, reject) => {
        const args = [...defaultArgs, ..._args].filter((s) => s.length !== 0);
        runResolve = resolve;
        runReject = reject;
        ffmpeg(...parseArgs(Core, args));
      });
    }
  };

  /*
   * Run FS operations.
   * For input/output file of ffmpeg.wasm, it is required to save them to MEMFS
   * first so that ffmpeg.wasm is able to consume them. Here we rely on the FS
   * methods provided by Emscripten.
   *
   * Common methods to use are:
   * ffmpeg.FS('writeFile', 'video.avi', new Uint8Array(...)): writeFile writes
   * data to MEMFS. You need to use Uint8Array for binary data.
   * ffmpeg.FS('readFile', 'video.mp4'): readFile from MEMFS.
   * ffmpeg.FS('unlink', 'video.map'): delete file from MEMFS.
   *
   * For more info, check https://emscripten.org/docs/api_reference/Filesystem-API.html
   *
   */
  const FS = (method, ...args) => {
    log('info', `run FS.${method} ${args.map((arg) => (typeof arg === 'string' ? arg : `<${arg.length} bytes binary file>`)).join(' ')}`);
    if (Core === null) {
      throw NO_LOAD;
    } else {
      let ret = null;
      try {
        ret = Core.FS[method](...args);
      } catch (e) {
        if (method === 'readdir') {
          throw Error(`ffmpeg.FS('readdir', '${args[0]}') error. Check if the path exists, ex: ffmpeg.FS('readdir', '/')`);
        } else if (method === 'readFile') {
          throw Error(`ffmpeg.FS('readFile', '${args[0]}') error. Check if the path exists`);
        } else {
          throw Error('Oops, something went wrong in FS operation.');
        }
      }
      return ret;
    }
  };

  /**
   * forcibly terminate the ffmpeg program.
   */
  const exit = () => {
    if (Core === null) {
      throw NO_LOAD;
    } else {
      // if there's any pending runs, reject them
      if (runReject) {
        runReject('ffmpeg has exited');
      }
      running = false;
      try {
        Core.exit(1);
      } catch (err) {
        log(err.message);
        if (runReject) {
          runReject(err);
        }
      } finally {
        Core = null;
        ffmpeg = null;
        runResolve = null;
        runReject = null;
      }
    }
  };

  const setProgress = (_progress) => {
    progress = _progress;
  };

  const setLogger = (_logger) => {
    customLogger = _logger;
  };

  const setLogging = (_logging) => {
    logging = _logging;
  };

  log('info', `use ffmpeg.wasm v${version}`);

  return {
    setProgress,
    setLogger,
    setLogging,
    load,
    isLoaded,
    run,
    exit,
    FS,
  };
};
