let logging = false;

exports.logging = logging;

exports.setLogging = (_logging) => {
  logging = _logging;
};

exports.log = (type, message) => (logging ? console.log(`[${type}] ${message}`) : null);
