require('regenerator-runtime/runtime');
const defaultArgs = require('./constants/defaultArgs');

let action = 'unknown';
let Module = null;
let adapter = null;
let ffmpeg = null;

const str2ptr = (s) => {
  const ptr = Module._malloc((s.length + 1) * Uint8Array.BYTES_PER_ELEMENT);
  for (let i = 0; i < s.length; i += 1) {
    Module.setValue(ptr + i, s.charCodeAt(i), 'i8');
  }
  Module.setValue(ptr + s.length, 0, 'i8');
  return ptr;
};

const strList2ptr = (strList) => {
  const listPtr = Module._malloc(strList.length * Uint32Array.BYTES_PER_ELEMENT);

  strList.forEach((s, idx) => {
    const strPtr = str2ptr(s);
    Module.setValue(listPtr + (4 * idx), strPtr, 'i32');
  });

  return listPtr;
};

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

const ls = ({
  payload: {
    path,
  },
}, res) => {
  const dirs = Module.FS.readdir(path);
  res.resolve({ message: `List path ${path}`, dirs });
};

const run = async ({
  payload: {
    args: _args,
    options: {
      inputPath, inputPaths, outputPath, del,
    },
  },
}, res) => {
  const args = [...defaultArgs, ..._args.trim().split(' ')];
  ffmpeg(args.length, strList2ptr(args));
  await adapter.fs.writeFile(outputPath, Module.FS.readFile(outputPath));
  Module.FS.unlink(outputPath);
  if (del && typeof inputPath === 'string') {
    await adapter.fs.deleteFile(inputPath);
  } else if (del && Array.isArray(inputPaths)) {
    inputPaths.reduce((promise, input) => promise.then(() => adapter.fs.deleteFile(input)),
      Promise.resolve());
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
      ls,
      syncfs,
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
