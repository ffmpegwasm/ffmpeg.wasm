/**
 * Constants
 */

const NULL = 0;
const SIZE_I32 = Uint32Array.BYTES_PER_ELEMENT;
const DEFAULT_ARGS = ["./ffmpeg", "-nostdin", "-y"];

Module["NULL"] = NULL;
Module["SIZE_I32"] = SIZE_I32;
Module["DEFAULT_ARGS"] = DEFAULT_ARGS;

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
  if (!message.startsWith("Aborted(native code called abort())"))
    Module["logger"]({ type: "stderr", message });
}

function exec(..._args) {
  const args = [...Module["DEFAULT_ARGS"], ..._args];
  try {
    Module["_ffmpeg"](args.length, stringsToPtr(args));
  } catch (e) {
    if (!e.message.startsWith("Aborted")) {
      throw e;
    }
  }
  return Module["ret"];
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

function receiveProgress(progress, elapsed) {
  Module["progress"]({ progress, elapsed });
}

function reset() {
  Module["ret"] = -1;
  Module["timeout"] = -1;
}

Module["stringToPtr"] = stringToPtr;
Module["stringsToPtr"] = stringsToPtr;
Module["print"] = print;
Module["printErr"] = printErr;

Module["exec"] = exec;
Module["setLogger"] = setLogger;
Module["setTimeout"] = setTimeout;
Module["setProgress"] = setProgress;
Module["reset"] = reset;
Module["receiveProgress"] = receiveProgress;
