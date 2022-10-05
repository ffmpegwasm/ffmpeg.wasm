export const ERROR_RESPONSE_BODY_READER = new Error(
  "failed to get response body reader"
);
export const ERROR_UNKNOWN_MESSAGE_TYPE = new Error("unknown message type");
export const ERROR_NOT_LOADED = new Error(
  "ffmpeg is not loaded, call `await ffmpeg.load()` first"
);
export const ERROR_INCOMPLETED_DOWNLOAD = new Error(
  "failed to complete download"
);
export const ERROR_TERMINATED = new Error("called FFmpeg.terminate()");
