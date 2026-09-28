// Node.js entry of @ffmpeg/util (the "node" export condition). fetchFile also
// reads local files, given as a path or a file: URL (#438, #426, #497), and
// Blobs without FileReader, which Node.js doesn't have.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fetchFile as fetchFileBrowser } from "./index.js";

export * from "./index.js";

const isRemote = (url: string) => /^(https?|data|blob):/i.test(url);

export const fetchFile = async (
  file?: string | URL | File | Blob
): Promise<Uint8Array> => {
  if (file instanceof URL && file.protocol === "file:") {
    return new Uint8Array(await readFile(fileURLToPath(file.href)));
  }
  if (typeof file === "string" && !isRemote(file)) {
    return new Uint8Array(await readFile(file.startsWith("file:") ? fileURLToPath(file) : file));
  }
  if (file instanceof Blob) {
    return new Uint8Array(await file.arrayBuffer());
  }
  return fetchFileBrowser(file as string | File | Blob);
};
