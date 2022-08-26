let duration = 0;
let frames = 0;
let readFrames = false;
let ratio = 0;

const ts2sec = (ts) => {
  const [h, m, s] = ts.split(':');
  return (parseFloat(h) * 60 * 60) + (parseFloat(m) * 60) + parseFloat(s);
};

module.exports = (message, progress) => {
  if (typeof message === 'string') {
    if (message.startsWith('  Duration')) {
      const ts = message.split(', ')[0].split(': ')[1];
      const d = ts2sec(ts);
      progress({ duration: d, ratio });
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
      const f = parseFloat(message.match(/frame=\s*(\d+)/)[1]);
      if (frames) {
        ratio = Math.min(f / frames, 1);
      } else {
        ratio = t / duration;
      }
      progress({ ratio, time: t });
    } else if (message.startsWith('video:')) {
      progress({ ratio: 1 });
      duration = 0;
    }
  }
};
