export const MIME_TYPE_JAVASCRIPT = "text/javascript";
export const MIME_TYPE_WASM = "application/wasm";

export const CORE_VERSION = "0.13.0";
export const CORE_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`;
export const CORE_JSPI_URL = CORE_URL.replace(/\.js$/, "-jspi.js");
export const CORE_MT_URL = CORE_URL.replace("@ffmpeg/core@", "@ffmpeg/core-mt@");

export enum FFMessageType {
  LOAD = "LOAD",
  EXEC = "EXEC",
  FFPROBE = "FFPROBE",
  OPEN = "OPEN",
  READ = "READ",
  WRITE = "WRITE",
  CLOSE = "CLOSE",
  WRITE_FILE = "WRITE_FILE",
  READ_FILE = "READ_FILE",
  DELETE_FILE = "DELETE_FILE",
  RENAME = "RENAME",
  CREATE_DIR = "CREATE_DIR",
  LIST_DIR = "LIST_DIR",
  DELETE_DIR = "DELETE_DIR",
  ERROR = "ERROR",

  DOWNLOAD = "DOWNLOAD",
  PROGRESS = "PROGRESS",
  LOG = "LOG",
  MOUNT = "MOUNT",
  UNMOUNT = "UNMOUNT",
}
