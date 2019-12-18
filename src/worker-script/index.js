require('regenerator-runtime/runtime');
const defaultArgs = require('./constants/defaultArgs');
const strList2ptr = require('./utils/strList2ptr');

let action = 'unknown';
let Module = null;
let adapter = null;
let ffmpeg = null;

const load = ({ workerId, payload: { options: { corePath } } }, res) => {
  if (Module == null) {
    const Core = adapter.getCore(corePath);
    Core()
      .then(async (_Module) => {
        Module = _Module;
        Module.setLogger((message, type) => {
          res.progress({
            workerId, action, type, message,
          });
        });
        ffmpeg = Module.cwrap('ffmpeg', 'number', ['number', 'number']);
        res.resolve({ message: 'Loaded ffmpeg-core' });
      });
  } else {
    res.resolve({ message: 'Loaded ffmpeg-core' });
  }
};

const syncfs = async ({
  payload: {
    populate = false,
  },
}, res) => {
  await Module.syncfs(populate);
  res.resolve({ message: `Sync file system with populate=${populate}` });
};

const FS = ({
  payload: {
    method,
    args,
  },
}, res) => {
  const data = Module.FS[method](...args);
  res.resolve({
    message: `${method} ${args.join(',')}`,
    method,
    data,
  });
};

const run = async ({
  payload: {
    args: _args,
    options: {
      input, output, del = true,
    },
  },
}, res) => {
  const args = [...defaultArgs, ..._args.trim().split(' ')];
  ffmpeg(args.length, strList2ptr(Module, args));

  /*
   * After executing the ffmpeg command, the data is saved in MEMFS,
   * if `output` is specified in the options, here ffmpeg.js will move
   * these files to IDBFS or NODEFS here.
   */
  if (typeof output === 'string') {
    await adapter.fs.writeFile(output, Module.FS.readFile(output));
    Module.FS.unlink(output);
  } else if (Array.isArray(output)) {
    await Promise.all(output.map(async (p) => {
      await adapter.fs.writeFile(p, Module.FS.readFile(p));
      Module.FS.unlink(p);
    }));
  }

  /*
   * To prevent input files occupy filesystem without notice,
   * if `input` is specified in the options, ffmpeg.js cleans these
   * files for you
   */
  if (del && typeof input === 'string') {
    await adapter.fs.deleteFile(input);
  } else if (del && Array.isArray(input)) {
    await Promise.all(input.map((p) => adapter.fs.deleteFile(p)));
  }

  res.resolve({ message: `Complete ${args.join(' ')}` });
};

exports.dispatchHandlers = (packet, send) => {
  const res = (status, data) => {
    send({
      ...packet,
      status,
      data,
    });
  };
  res.resolve = res.bind(this, 'resolve');
  res.reject = res.bind(this, 'reject');
  res.progress = res.bind(this, 'progress');

  action = packet.action;
  try {
    ({
      load,
      syncfs,
      FS,
      run,
    })[packet.action](packet, res);
  } catch (err) {
    /** Prepare exception to travel through postMessage */
    res.reject(err.toString());
  }
  action = 'unknown';
};

exports.setAdapter = (_adapter) => {
  adapter = _adapter;
};
