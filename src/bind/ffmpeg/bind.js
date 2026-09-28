const DEFAULT_ARGS = ["./ffmpeg", "-nostdin", "-y"];
const DEFAULT_ARGS_FFPROBE = ["./ffprobe"];

Module["ret"] = -1;
Module["timeout"] = -1;
Module["logger"] = () => {};
Module["progress"] = () => {};

function print(message) {
  Module["logger"]({ type: "stdout", message });
}

function printErr(message) {
  Module["logger"]({ type: "stderr", message });
}

function runCommand(fn, args) {
  const sp = stackSave();
  try {
    const argv = stackAlloc(args.length * 4);
    args.forEach((arg, i) => setValue(argv + i * 4, stringToUTF8OnStack(arg), "*"));
    fn(args.length, argv); // sets Module["ret"] (run.c)
  } finally {
    stackRestore(sp);
  }
  return Module["ret"];
}

function exec(...args) {
  return runCommand(_run_ffmpeg, [...DEFAULT_ARGS, ...args]);
}

function ffprobe(...args) {
  return runCommand(_run_ffprobe, [...DEFAULT_ARGS_FFPROBE, ...args]);
}

function setLogger(logger) {
  Module["logger"] = logger;
}

// Not named setTimeout: that would shadow the global inside the core (#611).
function setExecTimeout(timeout) {
  Module["timeout"] = timeout;
}

/** Most threads a codec or filter may use (default: min(cores, 4)). */
function setThreads(n) {
  _set_max_threads(n);
}

function setProgress(handler) {
  Module["progress"] = handler;
}

function receiveProgress(progress, time) {
  Module["progress"]({ progress, time });
}

/**
 * Stop the workers that run FFmpeg's threads. The core can't run commands
 * afterwards; drop it to free its memory.
 */
function terminateThreads() {
  if (typeof PThread !== "undefined") PThread.terminateAllThreads(); // only @ffmpeg/core-mt has workers
}

function reset() {
  Module["ret"] = -1;
  Module["timeout"] = -1;
}

/**
 * ffmpeg-core.wasm is expected next to ffmpeg-core.js. When it lives
 * elsewhere (e.g. a Blob URL), @ffmpeg/ffmpeg passes its URL in the hash of
 * mainScriptUrlOrBlob, the script URL pthread workers are started from:
 *
 *   http://example.com/ffmpeg-core.js#{btoa(JSON.stringify({ wasmURL: "..." }))}
 */
function _locateFile(path, prefix) {
  const mainScriptUrlOrBlob = Module["mainScriptUrlOrBlob"];
  if (mainScriptUrlOrBlob && path.endsWith(".wasm")) {
    const hash = mainScriptUrlOrBlob.slice(mainScriptUrlOrBlob.lastIndexOf("#") + 1);
    const { wasmURL } = JSON.parse(atob(hash));
    if (wasmURL) return wasmURL;
  }
  return prefix + path;
}

Module["print"] = print;
Module["printErr"] = printErr;
Module["locateFile"] = _locateFile;

Module["exec"] = exec;
Module["ffprobe"] = ffprobe;
Module["setLogger"] = setLogger;
Module["setTimeout"] = setExecTimeout;
Module["setProgress"] = setProgress;
Module["setThreads"] = setThreads;
Module["reset"] = reset;
Module["terminateThreads"] = terminateThreads;
Module["receiveProgress"] = receiveProgress;
