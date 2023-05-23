import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const __dirname = dirname(fileURLToPath(import.meta.url));
export const assetsDir = join(__dirname, "..", "assets");
export const outDir = join(__dirname, "..", "out");

await mkdir(outDir, { recursive: true });
