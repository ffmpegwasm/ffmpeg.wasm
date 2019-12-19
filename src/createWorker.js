const createJob = require('./createJob');
const { log } = require('./utils/log');
const getId = require('./utils/getId');
const extractProgress = require('./utils/extractProgress');
const resolvePaths = require('./utils/resolvePaths');
const {
  defaultOptions,
  spawnWorker,
  terminateWorker,
  onMessage,
  send,
  fetchFile,
  fs,
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
      log(`[${id}]: Start ${jobId}, action=${action}`);
      setResolve(action, resolve);
      setReject(action, reject);
      send(worker, {
        workerId: id,
        jobId,
        action,
        payload,
      });
    })
  );

  const load = (jobId) => (
    startJob(createJob({
      id: jobId, action: 'load', payload: { options },
    }))
  );

  const syncfs = (populate, jobId) => (
    startJob(createJob({
      id: jobId, action: 'syncfs', payload: { populate },
    }))
  );

  const write = async (path, data) => {
    await syncfs();
    await fs.writeFile(path, await fetchFile(data));
    await syncfs(true);
    return {
      path: `/data/${path}`,
    };
  };

  const writeText = async (path, text) => {
    await syncfs(true);
    await fs.writeFile(path, text);
    await syncfs(true);
    return {
      path: `/data/${path}`,
    };
  };

  const read = async (path, del = true) => {
    const data = await fs.readFile(path);
    if (del) {
      await fs.deleteFile(path);
    }
    return {
      data,
    };
  };

  const remove = async (path) => {
    await fs.deleteFile(path);
    return {
      path: `/data/${path}`,
    };
  };

  const run = (args, opts = {}, jobId) => (
    startJob(createJob({
      id: jobId, action: 'run', payload: { args, options: opts },
    }))
  );

  const transcode = (input, output, opts = '', del = true, jobId) => (
    run(
      `${opts} -i /data/${input} ${output}`,
      { input, output, del },
      jobId,
    )
  );

  const trim = (input, output, from, to, opts = '', del = true, jobId) => (
    run(
      `${opts} -i /data/${input} -ss ${from} -to ${to} ${output}`,
      { input, output, del },
      jobId,
    )
  );

  const concatDemuxer = async (input, output, opts = '', del = true, jobId) => {
    const text = input.reduce((acc, path) => `${acc}\nfile ${path}`, '');
    await writeText('concat_list.txt', text);
    return run(`${opts} -f concat -safe 0 -i /data/concat_list.txt -c copy ${output}`,
      { del, output, input: [...input, 'concat_list.txt'] },
      jobId);
  };

  const ls = (path, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'FS',
      payload: { method: 'readdir', args: [path] },
    }))
  );

  const terminate = async (jobId) => {
    if (worker !== null) {
      await startJob(createJob({
        id: jobId,
        action: 'terminate',
      }));
      terminateWorker(worker);
      worker = null;
    }
    return Promise.resolve();
  };

  onMessage(worker, ({
    workerId, jobId, status, action, data,
  }) => {
    if (status === 'resolve') {
      log(`[${workerId}]: Complete ${jobId}`);
      let d = data;
      if (action === 'FS') {
        const { method, data: _data } = data;
        if (method === 'readFile') {
          d = Uint8Array.from({ ..._data, length: Object.keys(_data).length });
        } else {
          d = _data;
        }
      }
      resolves[action]({ jobId, data: d });
    } else if (status === 'reject') {
      rejects[action](data);
      throw Error(data);
    } else if (status === 'progress') {
      extractProgress(data, progress);
      logger(data);
    }
  });

  return {
    id,
    worker,
    setResolve,
    setReject,
    load,
    syncfs,
    write,
    writeText,
    read,
    remove,
    run,
    transcode,
    trim,
    concatDemuxer,
    ls,
    terminate,
  };
};
