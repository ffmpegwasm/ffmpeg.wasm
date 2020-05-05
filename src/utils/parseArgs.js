module.exports = (cmd) => {
  const args = [];
  let nextDelimiter = 0;
  let prevDelimiter = 0;
  // eslint-disable-next-line no-cond-assign
  while ((nextDelimiter = cmd.indexOf(' ', prevDelimiter)) >= 0) {
    let arg = cmd.substring(prevDelimiter, nextDelimiter);
    let quoteIdx = arg.indexOf('\'');
    let dblQuoteIdx = arg.indexOf('"');

    if (quoteIdx === 0 || dblQuoteIdx === 0) {
      /* The argument has a quote at the start i.e, 'id=0,streams=0 id=1,streams=1' */
      const delimiter = arg[0];
      const endDelimiter = cmd.indexOf(delimiter, prevDelimiter + 1);

      if (endDelimiter < 0) {
        throw new Error(`Bad command escape sequence ${delimiter} near ${nextDelimiter}`);
      }

      arg = cmd.substring(prevDelimiter + 1, endDelimiter);
      prevDelimiter = endDelimiter + 2;
      args.push(arg);
    } else if (quoteIdx > 0 || dblQuoteIdx > 0) {
      /* The argument has a quote in it, it must be ended correctly i,e. title='test' */
      if (quoteIdx === -1) quoteIdx = Infinity;
      if (dblQuoteIdx === -1) dblQuoteIdx = Infinity;
      const delimiter = (quoteIdx < dblQuoteIdx) ? '\'' : '"';
      const quoteOffset = Math.min(quoteIdx, dblQuoteIdx);
      const endDelimiter = cmd.indexOf(delimiter, prevDelimiter + quoteOffset + 1);

      if (endDelimiter < 0) {
        throw new Error(`Bad command escape sequence ${delimiter} near ${nextDelimiter}`);
      }

      arg = cmd.substring(prevDelimiter, endDelimiter + 1);
      prevDelimiter = endDelimiter + 2;
      args.push(arg);
    } else if (arg !== '') {
      args.push(arg);
      prevDelimiter = nextDelimiter + 1;
    } else {
      prevDelimiter = nextDelimiter + 1;
    }
  }

  if (prevDelimiter !== cmd.length) {
    args.push(cmd.substring(prevDelimiter));
  }

  return args;
};
