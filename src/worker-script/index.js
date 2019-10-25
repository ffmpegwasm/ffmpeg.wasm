require('regenerator-runtime/runtime');
const defaultArgs = require('./constants/defaultArgs');

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

const load = ({ payload: { options: { corePath } } }, res) => {
  if (Module == null) {
    const Core = adapter.getCore(corePath);
    Core()
      .then((_Module) => {
        Module = _Module;
        ffmpeg = Module.cwrap('ffmpeg', 'number', ['number', 'number']);
        res.resolve(true);
      });
  } else {
    res.resolve(true);
  }
};

const transcode = ({
  payload: {
    media,
    outputExt,
    options = '',
  },
}, res) => {
  const data = Uint8Array.from({ ...media, length: Object.keys(media).length });
  const iPath = 'media';
  const oPath = `media.${outputExt}`;
  const args = [...defaultArgs, ...`${options} -i file:${iPath} ${oPath}`.trim().split(' ')];
  Module.FS.writeFile(iPath, data);
  ffmpeg(args.length, strList2ptr(args));
  res.resolve(Module.FS.readFile(oPath));
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

  try {
    ({
      load,
      transcode,
    })[packet.action](packet, res);
  } catch (err) {
    /** Prepare exception to travel through postMessage */
    res.reject(err.toString());
  }
};

exports.setAdapter = (_adapter) => {
  adapter = _adapter;
};
