import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

// /__test/gzip/<path>, /__test/nolength/<path> and /__test/echo?body=<text>
export const testRoutes = () => ({
  name: "test-routes",
  configureServer(server) {
    server.middlewares.use("/__test", async (req, res) => {
      const url = new URL(req.url, "http://localhost");
      const [, route, ...path] = url.pathname.split("/");
      if (route === "echo") return res.end(url.searchParams.get("body"));

      const body = await readFile(join(server.config.root, ...path));
      if (route === "gzip") {
        const gzipped = gzipSync(body);
        res.writeHead(200, { "Content-Encoding": "gzip", "Content-Length": gzipped.length });
        return res.end(gzipped);
      }
      res.write(body.subarray(0, body.length / 2));
      res.end(body.subarray(body.length / 2));
    });
  },
});
