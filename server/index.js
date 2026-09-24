import http from "node:http";
import { initDatabase, query } from "./db.js";
import { serveApp } from "./static.js";
import {
  addMedia,
  completeProfile,
  createLicense,
  getStudio,
  getUser,
  listAdminTalent,
  listLicenses,
  listTalent,
  registerUser,
  removeMedia,
  requestLoginOtp,
  updateAdminTalent,
  verifyLoginOtp,
  verifyUser,
} from "./store.js";

const PORT = Number(process.env.PORT || process.env.API_PORT || 3001);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "https://www.facetroop.com,https://facetroop.com,http://localhost:8443,http://127.0.0.1:8443")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsOrigin(req) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return ALLOWED_ORIGINS[0];
}

function send(res, status, body, req) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(json),
    "Access-Control-Allow-Origin": corsOrigin(req || { headers: {} }),
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(json);
}

function notFound(res, req) {
  send(res, 404, { error: "Not found" }, req);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("Invalid JSON"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function csv(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function handle(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": corsOrigin(req),
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const { pathname, searchParams } = url;

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      await query("SELECT 1");
      return send(res, 200, { ok: true, service: "facetroop-api", database: "postgres" }, req);
    }

    if (req.method === "GET" && pathname === "/api/talent") {
      const results = await listTalent({
        query: searchParams.get("query") || "",
        gender: searchParams.get("gender") || "All",
        categories: csv(searchParams.get("categories")),
        ages: csv(searchParams.get("ages")),
      });
      return send(res, 200, { results }, req);
    }

    if (req.method === "POST" && pathname === "/api/register") {
      const body = await readBody(req);
      return send(res, 201, { user: await registerUser(body) }, req);
    }

    if (req.method === "POST" && pathname === "/api/login/otp") {
      const body = await readBody(req);
      return send(res, 200, await requestLoginOtp(body.email), req);
    }

    if (req.method === "POST" && pathname === "/api/login/verify") {
      const body = await readBody(req);
      return send(res, 200, { user: await verifyLoginOtp(body.email, body.code) }, req);
    }

    if (req.method === "POST" && pathname === "/api/verify") {
      const body = await readBody(req);
      return send(res, 200, { user: await verifyUser(body.userId, body.field) }, req);
    }

    const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (req.method === "GET" && userMatch) {
      return send(res, 200, { user: await getUser(userMatch[1]) }, req);
    }

    const profileMatch = pathname.match(/^\/api\/users\/([^/]+)\/profile$/);
    if (req.method === "PATCH" && profileMatch) {
      const body = await readBody(req);
      return send(res, 200, { user: await completeProfile(profileMatch[1], body) }, req);
    }

    const studioMatch = pathname.match(/^\/api\/users\/([^/]+)\/studio$/);
    if (req.method === "GET" && studioMatch) {
      return send(res, 200, await getStudio(studioMatch[1]), req);
    }

    const mediaMatch = pathname.match(/^\/api\/users\/([^/]+)\/media$/);
    if (req.method === "POST" && mediaMatch) {
      return send(res, 201, { media: await addMedia(mediaMatch[1]) }, req);
    }

    const mediaDelete = pathname.match(/^\/api\/users\/([^/]+)\/media\/([^/]+)$/);
    if (req.method === "DELETE" && mediaDelete) {
      return send(res, 200, { media: await removeMedia(mediaDelete[1], mediaDelete[2]) }, req);
    }

    if (req.method === "GET" && pathname === "/api/admin/talent") {
      const results = await listAdminTalent(searchParams.get("userId") || "");
      return send(res, 200, { results }, req);
    }

    const adminTalent = pathname.match(/^\/api\/admin\/talent\/([^/]+)$/);
    if (req.method === "PATCH" && adminTalent) {
      const body = await readBody(req);
      return send(res, 200, { talent: await updateAdminTalent(body.userId, adminTalent[1], body) }, req);
    }

    if (req.method === "GET" && pathname === "/api/licenses") {
      return send(res, 200, { licenses: await listLicenses() }, req);
    }

    if (req.method === "POST" && pathname === "/api/licenses") {
      const body = await readBody(req);
      return send(res, 201, { license: await createLicense(body) }, req);
    }

    if (pathname.startsWith("/api/")) return notFound(res, req);
    if (serveApp(req, res, pathname)) return;
    return notFound(res, req);
  } catch (error) {
    send(res, error.status || 500, { error: error.message || "Server error" }, req);
  }
}

initDatabase()
  .then(() => {
    http.createServer(handle).listen(PORT, "0.0.0.0", () => {
      console.log(`FACETROOP running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to Postgres:", error);
    process.exit(1);
  });
