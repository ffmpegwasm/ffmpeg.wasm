import { readFile } from "node:fs/promises";

export const testdata = async (name) =>
  new Uint8Array(await readFile(new URL(`../../testdata/${name}`, import.meta.url)));
