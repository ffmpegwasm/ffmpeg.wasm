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
      .then((_Module) => {
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

const write = ({
  payload: {
    path,
    data,
  },
}, res) => {
  const d = Uint8Array.from({ ...data, length: Object.keys(data).length });
  Module.FS.writeFile(path, d);
  res.resolve({ message: `Write ${path} (${d.length} bytes)` });
};

const transcode = ({
  payload: {
    inputPath,
    outputPath,
    options = '',
  },
}, res) => {
  const args = [...defaultArgs, ...`${options} -i ${inputPath} ${outputPath}`.trim().split(' ')];
  ffmpeg(args.length, strList2ptr(args));
  res.resolve({ message: `Complete transcoding ${inputPath} to ${outputPath}` });
};

const read = ({
  payload: {
    path,
  },
}, res) => {
  res.resolve(Module.FS.readFile(path));
};

const run = ({
  payload: {
    args: _args,
  },
}, res) => {
  const args = [...defaultArgs, ..._args.trim().split(' ')];
  ffmpeg(args.length, strList2ptr(args));
  res.resolve({ message: `Complete ./ffmpeg ${_args}` });
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
      write,
      transcode,
      read,
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
