import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { wardrobeImportApi } from "./scripts/import-job-api.mjs";
import { responsiveImageApi } from "./scripts/responsive-image-api.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const env = loadEnv("production", root, "");
const host = process.env.WARDROBE_HOST || env.WARDROBE_HOST || "127.0.0.1";
const port = Number(process.env.WARDROBE_PORT || env.WARDROBE_PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("WARDROBE_PORT 必须是有效端口。");
if (!(await stat(path.join(dist, "index.html")).catch(() => null))?.isFile()) {
  throw new Error("缺少 dist/index.html，请先运行 npm run build。");
}

const handlers = new Map();
const surface = { middlewares: { use(route, handler) {
  if (typeof route === "function") handlers.set("/api/import", route);
  else handlers.set(route, handler);
} } };
const config = { root, publicDir: path.join(root, "public"), build: { outDir: "dist" } };
for (const plugin of [responsiveImageApi(), wardrobeImportApi({ env })]) {
  await plugin.configResolved(config);
  plugin.configureServer(surface);
}

const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
};

async function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }); return res.end();
  }
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch { res.writeHead(400); return res.end(); }
  if (decoded.includes("\0") || decoded.includes("\\")) {
    res.writeHead(400); return res.end();
  }
  const requested = decoded === "/" ? "/index.html" : decoded;
  const candidate = path.resolve(dist, `.${requested}`);
  if (!candidate.startsWith(dist + path.sep)) {
    res.writeHead(403); return res.end();
  }
  let file = candidate;
  let info = await stat(file).catch(() => null);
  if (!info?.isFile() && req.headers.accept?.includes("text/html") && !path.extname(requested)) {
    file = path.join(dist, "index.html");
    info = await stat(file);
  }
  if (!info?.isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, {
    "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Content-Length": info.size,
    "Cache-Control": file.includes(`${path.sep}assets${path.sep}`) ? "public, max-age=31536000, immutable" : "no-cache",
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(file).on("error", () => res.destroy()).pipe(res);
}

const server = createServer((req, res) => {
  let pathname;
  try { pathname = new URL(req.url, "http://localhost").pathname; }
  catch { res.writeHead(400); return res.end(); }
  const fail = (error) => {
    console.error(error);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  };
  if (pathname === "/_ipx" || pathname.startsWith("/_ipx/")) {
    req.url = req.url.slice("/_ipx".length) || "/";
    return Promise.resolve(handlers.get("/_ipx")(req, res, () => { res.writeHead(404); res.end(); })).catch(fail);
  }
  if (pathname.startsWith("/api/import/")) {
    return Promise.resolve(handlers.get("/api/import")(req, res, () => { res.writeHead(404); res.end(); })).catch(fail);
  }
  return serveStatic(req, res, pathname).catch(fail);
});
server.listen(port, host, () => console.log(`Wardrobe 已启动：http://${host}:${port}`));
