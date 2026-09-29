// Serves the repository for the mocha test pages, cross-origin isolated so the
// multi-threaded core can use SharedArrayBuffer.
const http = require("http");
const fs = require("fs");
const path = require("path");

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".wasm": "application/wasm", ".css": "text/css" };

http
  .createServer((req, res) => {
    const file = path.join(__dirname, "..", decodeURIComponent(new URL(req.url, "http://localhost").pathname));
    fs.readFile(file, (err, body) => {
      res.writeHead(err ? 404 : 200, {
        "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      });
      res.end(body);
    });
  })
  .listen(3000);
