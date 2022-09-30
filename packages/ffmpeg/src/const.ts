export const HeaderContentLength = "Content-Length";
export const MIME_TYPE_JAVASCRIPT = "text/javascript";
export const MIME_TYPE_WASM = "application/wasm";

export const CORE_VERSION = "0.12.0";
export const CORE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`;

export enum FFMessageType {
  LOAD = "load",
  WRITE_FILE = "WRITE_FILE",
  EXEC = "EXEC",
  READ_FILE = "READ_FILE",
  ERROR = "ERROR",

  DOWNLOAD = "DOWNLOAD",
  PROGRESS = "PROGRESS",
  LOG = "LOG",
}
