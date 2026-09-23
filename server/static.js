import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

export function serveApp(req, res, pathname) {
  if (!fs.existsSync(distDir)) return false;

  let relative = decodeURIComponent(pathname || "/");
  if (relative === "/") relative = "/index.html";
  let file = path.resolve(distDir, `.${relative}`);
  if (!file.startsWith(distDir)) return false;

  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(distDir, "index.html");
  }

  const ext = path.extname(file).toLowerCase();
  const body = fs.readFileSync(file);
  res.writeHead(200, {
    "Content-Type": types[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  res.end(body);
  return true;
}
