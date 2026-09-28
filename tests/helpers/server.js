import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import sirv from "sirv";

export const root = fileURLToPath(new URL("../..", import.meta.url));

// Serves `dir` (the repository by default) cross-origin isolated, which the
// multi-threaded core needs.
export function startServer({ dir = root } = {}) {
  const serve = sirv(dir, {
    dev: true,
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    },
  });
  const server = createServer((req, res) => serve(req, res, () => res.writeHead(404).end()));
  return new Promise((ready) =>
    server.listen(0, "127.0.0.1", () => ready({ server, url: `http://127.0.0.1:${server.address().port}` }))
  );
}
