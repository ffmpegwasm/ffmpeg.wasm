const createJob = require('./createJob');
const { log } = require('./utils/log');
const getId = require('./utils/getId');
const parseProgress = require('./utils/parseProgress');
const resolvePaths = require('./utils/resolvePaths');
const getTransferables = require('./utils/getTransferables');
const {
  defaultOptions,
  spawnWorker,
  onMessage,
  fetchFile,
} = require('./worker/node');

let workerCounter = 0;

module.exports = (_options = {}) => {
  const id = getId('Worker', workerCounter);
  const {
    logger,
    progress,
    ...options
  } = resolvePaths({
    ...defaultOptions,
    ..._options,
  });
  const resolves = {};
  const rejects = {};
  let worker = spawnWorker(options);

  workerCounter += 1;

  const setResolve = (action, res) => {
    resolves[action] = res;
  };

  const setReject = (action, rej) => {
    rejects[action] = rej;
  };

  const startJob = ({ id: jobId, action, payload }) => (
    new Promise((resolve, reject) => {
      const packet = {
        workerId: id,
        jobId,
        action,
        payload,
      };
      log(`[${id}]: Start ${jobId}, action=${action}`);
      setResolve(action, resolve);
      setReject(action, reject);
      /*
       * By using Transferable in postMessage, we are able
       * to send large files to worker
       * @ref: https://github.com/ffmpegjs/ffmpeg.js/issues/8#issuecomment-572230128
       */
      worker.postMessage(packet, getTransferables(packet));
    })
  );

  const load = (jobId) => (
    startJob(createJob({
      id: jobId, action: 'load', payload: { options },
    }))
  );

  const write = async (path, data, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'FS',
      payload: {
        method: 'writeFile',
        args: [path, await fetchFile(data)],
      },
    }))
  );

  const writeText = (path, text, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'FS',
      payload: {
        method: 'writeFile',
        args: [path, text],
      },
    }))
  );

  const read = (path, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'FS',
      payload: {
        method: 'readFile',
        args: [path],
      },
    }))
  );

  const remove = (path, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'FS',
      payload: {
        method: 'unlink',
        args: [path],
      },
    }))
  );

  const run = (args, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'run',
      payload: {
        args,
      },
    }))
  );

  const ls = (path, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'FS',
      payload: {
        method: 'readdir',
        args: [path],
      },
    }))
  );

  const transcode = (input, output, opts = '', jobId) => (
    run(
      `-i ${input} ${opts} ${output}`,
      jobId,
    )
  );

  const trim = (input, output, from, to, opts = '', jobId) => (
    run(
      `-i ${input} -ss ${from} -to ${to} ${opts} ${output}`,
      jobId,
    )
  );

  const concatDemuxer = async (input, output, opts = '', jobId) => {
    const text = input.reduce((acc, path) => `${acc}\nfile ${path}`, '');
    await writeText('concat_list.txt', text);
    return run(`-f concat -safe 0 -i concat_list.txt ${opts} ${output}`, jobId);
  };

  const terminate = async (jobId) => {
    if (worker !== null) {
      await startJob(createJob({
        id: jobId,
        action: 'terminate',
      }));
      worker.terminate();
      worker = null;
    }
    return Promise.resolve();
  };

  onMessage(worker, ({
    workerId, jobId, action, status, payload,
  }) => {
    if (status === 'resolve') {
      const { message, data } = payload;
      log(`[${workerId}]: Complete ${jobId}`);
      resolves[action]({
        workerId,
        jobId,
        message,
        data,
      });
    } else if (status === 'reject') {
      rejects[action](payload);
      throw Error(payload);
    } else if (status === 'progress') {
      parseProgress(payload, progress);
      logger(payload);
    }
  });

  return {
    id,
    worker,
    setResolve,
    setReject,
    load,
    write,
    writeText,
    read,
    remove,
    ls,
    run,
    transcode,
    trim,
    concatDemuxer,
    terminate,
  };
};
