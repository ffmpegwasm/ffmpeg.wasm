let duration = 0;

const ts2sec = (ts) => {
  const [h, m, s] = ts.split(':');
  return (parseFloat(h) * 60 * 60) + (parseFloat(m) * 60) + parseFloat(s);
};

module.exports = ({ message }, progress) => {
  if (typeof message === 'string') {
    if (message.startsWith('  Duration')) {
      const ts = message.split(', ')[0].split(': ')[1];
      const d = ts2sec(ts);
      if (duration === 0 || duration > d) {
        duration = d;
      }
    } else if (message.startsWith('frame')) {
      const ts = message.split('time=')[1].split(' ')[0];
      const t = ts2sec(ts);
      progress({ ratio: t / duration });
    } else if (message.startsWith('video:')) {
      progress({ ratio: 1 });
    }
  }
};
