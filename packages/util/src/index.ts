import {
  ERROR_RESPONSE_BODY_READER,
  ERROR_INCOMPLETED_DOWNLOAD,
} from "./errors.js";
import { HeaderContentLength } from "./const.js";
import { ProgressCallback } from "./types.js";

const readFromBlobOrFile = (blob: Blob | File): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const { result } = fileReader;
      if (result instanceof ArrayBuffer) {
        resolve(new Uint8Array(result));
      } else {
        resolve(new Uint8Array());
      }
    };
    fileReader.onerror = (event) => {
      reject(
        Error(
          `File could not be read! Code=${event?.target?.error?.code || -1}`
        )
      );
    };
    fileReader.readAsArrayBuffer(blob);
  });

/**
 * An util function to fetch data from url string, base64, URL, File or Blob format.
 *
 * Examples:
 * ```ts
 * // URL
 * await fetchFile("http://localhost:3000/video.mp4");
 * // base64
 * await fetchFile("data:<type>;base64,wL2dvYWwgbW9yZ...");
 * // URL
 * await fetchFile(new URL("video.mp4", import.meta.url));
 * // File
 * fileInput.addEventListener('change', (e) => {
 *   await fetchFile(e.target.files[0]);
 * });
 * // Blob
 * const blob = new Blob(...);
 * await fetchFile(blob);
 * ```
 */
export const fetchFile = async (
  file?: string | File | Blob
): Promise<Uint8Array> => {
  let data: ArrayBuffer | number[];

  if (typeof file === "string") {
    /* From base64 format */
    if (/data:_data\/([a-zA-Z]*);base64,([^"]*)/.test(file)) {
      data = atob(file.split(",")[1])
        .split("")
        .map((c) => c.charCodeAt(0));
      /* From remote server/URL */
    } else {
      data = await (await fetch(file)).arrayBuffer();
    }
  } else if (file instanceof URL) {
    data = await (await fetch(file)).arrayBuffer();
  } else if (file instanceof File || file instanceof Blob) {
    data = await readFromBlobOrFile(file);
  } else {
    return new Uint8Array();
  }

  return new Uint8Array(data);
};

/**
 * importScript dynamically import a script, useful when you
 * want to use different versions of ffmpeg.wasm based on environment.
 *
 * Example:
 *
 * ```ts
 * await importScript("http://localhost:3000/ffmpeg.js");
 * ```
 */
export const importScript = async (url: string): Promise<void> =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    const eventHandler = () => {
      script.removeEventListener("load", eventHandler);
      resolve();
    };
    script.src = url;
    script.type = "text/javascript";
    script.addEventListener("load", eventHandler);
    document.getElementsByTagName("head")[0].appendChild(script);
  });

/**
 * Download content of a URL with progress.
 *
 * Progress only works when Content-Length is provided by the server.
 *
 */
export const downloadWithProgress = async (
  url: string | URL,
  cb?: ProgressCallback
): Promise<ArrayBuffer> => {
  const resp = await fetch(url);
  let buf;

  try {
    // Set total to -1 to indicate that there is not Content-Type Header.
    const total = parseInt(resp.headers.get(HeaderContentLength) || "-1");

    const reader = resp.body?.getReader();
    if (!reader) throw ERROR_RESPONSE_BODY_READER;

    const chunks = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      const delta = value ? value.length : 0;

      if (done) {
        if (total != -1 && total !== received) throw ERROR_INCOMPLETED_DOWNLOAD;
        cb && cb({ url, total, received, delta, done });
        break;
      }

      chunks.push(value);
      received += delta;
      cb && cb({ url, total, received, delta, done });
    }

    const data = new Uint8Array(received);
    let position = 0;
    for (const chunk of chunks) {
      data.set(chunk, position);
      position += chunk.length;
    }

    buf = data.buffer;
  } catch (e) {
    console.log(`failed to send download progress event: `, e);
    // Fetch arrayBuffer directly when it is not possible to get progress.
    buf = await resp.arrayBuffer();
    cb &&
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
 * toBlobURL fetches data from an URL and return a blob URL.
 *
 * Example:
 *
 * ```ts
 * await toBlobURL("http://localhost:3000/ffmpeg.js", "text/javascript");
 * ```
 */
export const toBlobURL = async (
  url: string,
  mimeType: string,
  progress = false,
  cb?: ProgressCallback
): Promise<string> => {
  const buf = progress
    ? await downloadWithProgress(url, cb)
    : await (await fetch(url)).arrayBuffer();
  const blob = new Blob([buf], { type: mimeType });
  return URL.createObjectURL(blob);
};
