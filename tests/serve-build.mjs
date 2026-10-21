import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const prefix = "/borrowed-shell/";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (!url.pathname.startsWith(prefix)) {
        res.writeHead(404).end();
        return;
      }
      const filename = path.resolve(
        root,
        decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html",
      );
      if (
        !filename.startsWith(root + path.sep) &&
        filename !== path.join(root, "index.html")
      ) {
        res.writeHead(403).end();
        return;
      }
      const data = await fs.readFile(filename);
      res
        .writeHead(200, {
          "Content-Type":
            mime[path.extname(filename)] || "application/octet-stream",
        })
        .end(data);
    } catch {
      res.writeHead(404).end();
    }
  })
  .listen(5188, "127.0.0.1", () =>
    console.log("Production build: http://127.0.0.1:5188/borrowed-shell/"),
  );
