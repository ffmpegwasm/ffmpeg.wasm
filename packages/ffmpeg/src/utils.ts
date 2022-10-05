import {
  ERROR_RESPONSE_BODY_READER,
  ERROR_INCOMPLETED_DOWNLOAD,
} from "./errors";
import { HeaderContentLength } from "./const";
import { ProgressCallback } from "./types";

/**
 * Generate an unique message ID.
 */
export const getMessageID = (() => {
  let messageID = 0;
  return () => messageID++;
})();

/**
 * Download content of a URL with progress.
 *
 * Progress only works when Content-Length is provided by the server.
 *
 */
export const downloadWithProgress = async (
  url: string | URL,
  cb: ProgressCallback
): Promise<ArrayBuffer> => {
  const resp = await fetch(url);
  let buf;

  try {
    // Set total to -1 to indicate that there is not Content-Type Header.
    const total = parseInt(resp.headers.get(HeaderContentLength) || "-1");

    const reader = resp.body?.getReader();
    if (!reader) throw ERROR_RESPONSE_BODY_READER;

    const data = new Uint8Array(total);
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      const delta = value ? value.length : 0;

      if (done) {
        if (total !== received) throw ERROR_INCOMPLETED_DOWNLOAD;
        cb({ url, total, received, delta, done });
        break;
      }

      data.set(value, received);
      received += delta;
      cb({ url, total, received, delta, done });
    }

    buf = data.buffer;
  } catch (e) {
    console.log(`failed to send download progress event: `, e);
    // Fetch arrayBuffer directly when it is not possible to get progress.
    buf = await resp.arrayBuffer();
    cb({
      url,
      total: buf.byteLength,
      received: buf.byteLength,
      delta: 0,
      done: true,
    });
  }

  return buf;
};

/**
 * Convert an URL to an Blob URL to avoid issues like CORS.
 */
export const toBlobURL = async (
  url: string,
  /** mime type like `text/javascript` and `application/wasm` */
  mimeType: string,
  cb: ProgressCallback
): Promise<string> =>
  URL.createObjectURL(
    new Blob([await downloadWithProgress(url, cb)], {
      type: mimeType,
    })
  );
