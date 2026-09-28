/**
 * Constants
 */

const NULL = 0;
const SIZE_I32 = Uint32Array.BYTES_PER_ELEMENT;
const DEFAULT_ARGS = ["./ffmpeg", "-nostdin", "-y"];
const DEFAULT_ARGS_FFPROBE = ["./ffprobe"];

Module["NULL"] = NULL;
Module["SIZE_I32"] = SIZE_I32;
Module["DEFAULT_ARGS"] = DEFAULT_ARGS;
Module["DEFAULT_ARGS_FFPROBE"] = DEFAULT_ARGS_FFPROBE;

/**
 * Variables
 */

Module["ret"] = -1;
Module["timeout"] = -1;
Module["logger"] = () => {};
Module["progress"] = () => {};

/**
 * Functions
 */

function stringToPtr(str) {
  const len = Module["lengthBytesUTF8"](str) + 1;
  const ptr = Module["_malloc"](len);
  Module["stringToUTF8"](str, ptr, len);

  return ptr;
}

function stringsToPtr(strs) {
  const len = strs.length;
  const ptr = Module["_malloc"](len * SIZE_I32);
  for (let i = 0; i < len; i++) {
    Module["setValue"](ptr + SIZE_I32 * i, stringToPtr(strs[i]), "i32");
  }

  return ptr;
}

function print(message) {
  Module["logger"]({ type: "stdout", message });
}

function printErr(message) {
  Module["logger"]({ type: "stderr", message });
}

// Returns the exit code, or with the JSPI core a Promise of it. One command at
// a time: two JSPI commands would interleave in the same module.
function runCommand(fn, args) {
  if (Module["running"]) throw new Error("ffmpeg-core runs one command at a time; await the previous one");
  Module["running"] = true;
  const sp = stackSave();
  const argv = stringsToPtr(args);
  const cleanUp = () => {
    Module["running"] = false;
    stackRestore(sp);
    for (let i = 0; i < args.length; i++) {
      Module["_free"](Module["getValue"](argv + SIZE_I32 * i, "i32"));
    }
    Module["_free"](argv);
  };
  let running;
  try {
    running = Module[fn](args.length, argv); // sets Module["ret"] (run.c)
  } catch (e) {
    cleanUp();
    throw e;
  }
  if (running instanceof Promise) {
    return running.then(
      () => (cleanUp(), Module["ret"]),
      (e) => (cleanUp(), Promise.reject(e))
    );
  }
  cleanUp();
  return Module["ret"];
}

function exec(..._args) {
  return runCommand("_run_ffmpeg", [...Module["DEFAULT_ARGS"], ..._args]);
}

function ffprobe(..._args) {
  return runCommand("_run_ffprobe", [...Module["DEFAULT_ARGS_FFPROBE"], ..._args]);
}

function setLogger(logger) {
  Module["logger"] = logger;
}

// Not named setTimeout: that would shadow the global inside the core (#611).
function setExecTimeout(timeout) {
  Module["timeout"] = timeout;
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

Module["stringToPtr"] = stringToPtr;
Module["stringsToPtr"] = stringsToPtr;
Module["print"] = print;
Module["printErr"] = printErr;
Module["locateFile"] = _locateFile;

Module["exec"] = exec;
Module["ffprobe"] = ffprobe;
Module["setLogger"] = setLogger;
Module["setTimeout"] = setExecTimeout;
Module["setProgress"] = setProgress;
Module["reset"] = reset;
Module["terminateThreads"] = terminateThreads;
Module["receiveProgress"] = receiveProgress;
