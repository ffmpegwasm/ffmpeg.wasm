const EXPORTED_RUNTIME_METHODS = [
  "FS",
  "setValue",
  "getValue",
  "UTF8ToString",
  "lengthBytesUTF8",
  "stringToUTF8",
  // Used by the tests to assert that exec()/ffprobe() leave the wasm stack
  // pointer where they found it.
  "stackSave",
];

console.log(EXPORTED_RUNTIME_METHODS.join(","));
