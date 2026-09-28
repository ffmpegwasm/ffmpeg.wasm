import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../..", import.meta.url));

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".wasm": "application/wasm", ".css": "text/css" };

// Cross-origin isolation, which SharedArrayBuffer (the multi-threaded core) needs.
const HEADERS = { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" };

async function file(dir, pathname) {
  const path = resolve(join(dir, decodeURIComponent(pathname)));
  if (!path.startsWith(dir)) return null;
  const isDir = await stat(path).then((s) => s.isDirectory(), () => false);
  const target = isDir ? join(path, "index.html") : path;
  return readFile(target).then((body) => ({ body, type: TYPES[extname(target)] }), () => null);
}

/** Serves `dir` (the repository by default) for the Playwright runners. */
export function startServer({ dir = root } = {}) {
  const server = createServer(async (req, res) => {
    const found = await file(dir, new URL(req.url, "http://localhost").pathname);
    if (!found) return res.writeHead(404, HEADERS).end();
    res.writeHead(200, { ...HEADERS, "Content-Type": found.type ?? "application/octet-stream" });
    res.end(found.body);
  });
  return new Promise((ready) =>
    server.listen(0, "127.0.0.1", () => ready({ server, url: `http://127.0.0.1:${server.address().port}` }))
  );
}
