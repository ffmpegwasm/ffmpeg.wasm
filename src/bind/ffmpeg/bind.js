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

// Every command ends in abort() (see runCommand()), which emscripten reports as one
// of these; they are not errors.
const EXIT_MESSAGES = ["Aborted()", "Aborted(native code called abort())"];

function printErr(message) {
  if (!EXIT_MESSAGES.includes(message))
    Module["logger"]({ type: "stderr", message });
}

function runCommand(fn, args) {
  const sp = stackSave();
  try {
    // ffprobe() can also return normally, without exit_program() (#817).
    Module["ret"] = Module[fn](args.length, stringsToPtr(args));
  } catch (e) {
    if (!e.message.startsWith("Aborted")) {
      throw e;
    }
  } finally {
    stackRestore(sp);
  }
  return Module["ret"];
}

function exec(..._args) {
  return runCommand("_ffmpeg", [...Module["DEFAULT_ARGS"], ..._args]);
}

function ffprobe(..._args) {
  return runCommand("_ffprobe", [...Module["DEFAULT_ARGS_FFPROBE"], ..._args]);
}

function setLogger(logger) {
  Module["logger"] = logger;
}

function setTimeout(timeout) {
  Module["timeout"] = timeout;
}

function setProgress(handler) {
  Module["progress"] = handler;
}

function receiveProgress(progress, time) {
  Module["progress"]({ progress, time });
}

function reset() {
  Module["ret"] = -1;
  Module["timeout"] = -1;
}

/**
 * ffmpeg-core.wasm is expected next to ffmpeg-core.js. When it lives
 * elsewhere (e.g. a Blob URL), @ffmpeg/ffmpeg passes its URL in the hash of
 * mainScriptUrlOrBlob, the script the multi-threaded core starts its threads
 * from:
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
Module["setTimeout"] = setTimeout;
Module["setProgress"] = setProgress;
Module["reset"] = reset;
Module["receiveProgress"] = receiveProgress;
