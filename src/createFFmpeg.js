const defaultArgs = require('./constants/defaultArgs');
const { setLogging, log } = require('./utils/log');
const resolvePaths = require('./utils/resolvePaths');
const parseProgress = require('./utils/parseProgress');
const stringList2pointer = require('./utils/stringList2pointer');
const parseArgs = require('./utils/parseArgs');
const {
  defaultOptions,
  getModule,
  fetchFile,
} = require('./node');

const NO_LOAD = Error('FFmpeg.js is not ready, make sure you have completed load().');
const NO_MULTIPLE_RUN = Error('FFmpeg.js can only run one command at a time');
let Module = null;
let ffmpeg = null;

module.exports = (_options = {}) => {
  let runResolve = null;
  let running = false;
  const {
    log: logging,
    logger,
    progress,
    ...options
  } = resolvePaths({
    ...defaultOptions,
    ..._options,
  });
  const detectCompletion = ({ message, type }) => {
    if (type === 'ffmpeg-stdout'
      && message === 'FFMPEG_END'
      && runResolve !== null) {
      runResolve();
      runResolve = null;
      running = false;
    }
  };

  setLogging(logging);

  const load = async () => {
    if (Module === null) {
      log('info', 'load ffmpeg-core');
      Module = await getModule(options);
      Module.setLogger((_log) => {
        detectCompletion(_log);
        parseProgress(_log, progress);
        logger(_log);
        log(_log.type, _log.message);
      });
      if (ffmpeg === null) {
        ffmpeg = Module.cwrap('proxy_main', 'number', ['number', 'number']);
      }
      log('info', 'ffmpeg-core loaded');
    }
  };

  const FS = (method, args) => {
    if (Module === null) {
      throw NO_LOAD;
    } else {
      log('info', `FS.${method} ${args[0]}`);
      return Module.FS[method](...args);
    }
  };

  const write = async (path, data) => (
    FS('writeFile', [path, await fetchFile(data)])
  );

  const writeText = (path, text) => (
    FS('writeFile', [path, text])
  );

  const read = (path) => (
    FS('readFile', [path])
  );

  const remove = (path) => (
    FS('unlink', [path])
  );

  const ls = (path) => (
    FS('readdir', [path])
  );

  const run = (_args) => {
    if (ffmpeg === null) {
      throw NO_LOAD;
    } else if (running) {
      throw NO_MULTIPLE_RUN;
    } else {
      running = true;
      return new Promise((resolve) => {
        const args = [...defaultArgs, ...parseArgs(_args)].filter((s) => s.length !== 0);
        log('info', `ffmpeg command: ${args.join(' ')}`);
        runResolve = resolve;
        ffmpeg(args.length, stringList2pointer(Module, args));
      });
    }
  };

  const transcode = (input, output, opts = '') => (
    run(`-i ${input} ${opts} ${output}`)
  );

  const trim = (input, output, from, to, opts = '') => (
    run(`-i ${input} -ss ${from} -to ${to} ${opts} ${output}`)
  );

  const concatDemuxer = (input, output, opts = '') => {
    const text = input.reduce((acc, path) => `${acc}\nfile ${path}`, '');
    writeText('concat_list.txt', text);
    return run(`-f concat -safe 0 -i concat_list.txt ${opts} ${output}`);
  };

  return {
    load,
    FS,
    write,
    writeText,
    read,
    remove,
    ls,
    run,
    transcode,
    trim,
    concatDemuxer,
  };
};
