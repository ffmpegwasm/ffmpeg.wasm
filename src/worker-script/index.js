require('regenerator-runtime/runtime');
const defaultArgs = require('./constants/defaultArgs');
const strList2ptr = require('./utils/strList2ptr');
const getTransferables = require('../utils/getTransferables');

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

const FS = ({
  payload: {
    method,
    args,
  },
}, res) => {
  res.resolve({
    message: `Complete ${method}`,
    data: Module.FS[method](...args),
  });
};

const run = ({
  payload: {
    args: _args,
  },
}, res) => {
  const args = [...defaultArgs, ..._args.trim().split(' ')].filter((s) => s.length !== 0);
  ffmpeg(args.length, strList2ptr(Module, args));
  res.resolve({
    message: `Complete ${args.join(' ')}`,
  });
};

exports.dispatchHandlers = (packet, send) => {
  const { workerId, jobId, action: act } = packet;
  const res = (status, payload) => {
    const pkt = {
      workerId,
      jobId,
      action: act,
      status,
      payload,
    };
    send(pkt, getTransferables(pkt));
  };
  res.resolve = res.bind(this, 'resolve');
  res.reject = res.bind(this, 'reject');
  res.progress = res.bind(this, 'progress');

  action = act;
  try {
    ({
      load,
      FS,
      run,
    })[act](packet, res);
  } catch (err) {
    /** Prepare exception to travel through postMessage */
    res.reject(err.toString());
  }
  action = 'unknown';
};

exports.setAdapter = (_adapter) => {
  adapter = _adapter;
};
