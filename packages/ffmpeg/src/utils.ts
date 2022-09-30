import {
  ERROR_RESPONSE_BODY_READER,
  ERROR_ZERO_CONTENT_LENGTH,
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
 */
export const downloadWithProgress = async (
  url: string | URL,
  cb: ProgressCallback
): Promise<Uint8Array> => {
  const resp = await fetch(url);
  const reader = resp.body?.getReader();
  if (!reader) throw ERROR_RESPONSE_BODY_READER;

  const total = parseInt(resp.headers.get(HeaderContentLength) || "0");
  if (total === 0) throw ERROR_ZERO_CONTENT_LENGTH;

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

  return data;
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
    new Blob([(await downloadWithProgress(url, cb)).buffer], { type: mimeType })
  );
