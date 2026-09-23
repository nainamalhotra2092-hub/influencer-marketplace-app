import http from "node:http";
import {
  addMedia,
  completeProfile,
  createLicense,
  getStudio,
  listLicenses,
  listTalent,
  registerUser,
  removeMedia,
  verifyUser,
} from "./store.js";

const PORT = Number(process.env.API_PORT || 3001);

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(json),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(json);
}

function notFound(res) {
  send(res, 404, { error: "Not found" });
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
      "Access-Control-Allow-Origin": "*",
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
      return send(res, 200, { ok: true, service: "facerights-api" });
    }

    if (req.method === "GET" && pathname === "/api/talent") {
      const results = listTalent({
        query: searchParams.get("query") || "",
        gender: searchParams.get("gender") || "All",
        categories: csv(searchParams.get("categories")),
        ages: csv(searchParams.get("ages")),
      });
      return send(res, 200, { results });
    }

    if (req.method === "POST" && pathname === "/api/register") {
      const body = await readBody(req);
      return send(res, 201, { user: registerUser(body) });
    }

    if (req.method === "POST" && pathname === "/api/verify") {
      const body = await readBody(req);
      return send(res, 200, { user: verifyUser(body.userId, body.field) });
    }

    const profileMatch = pathname.match(/^\/api\/users\/([^/]+)\/profile$/);
    if (req.method === "PATCH" && profileMatch) {
      const body = await readBody(req);
      return send(res, 200, { user: completeProfile(profileMatch[1], body) });
    }

    const studioMatch = pathname.match(/^\/api\/users\/([^/]+)\/studio$/);
    if (req.method === "GET" && studioMatch) {
      return send(res, 200, getStudio(studioMatch[1]));
    }

    const mediaMatch = pathname.match(/^\/api\/users\/([^/]+)\/media$/);
    if (req.method === "POST" && mediaMatch) {
      return send(res, 201, { media: addMedia(mediaMatch[1]) });
    }

    const mediaDelete = pathname.match(/^\/api\/users\/([^/]+)\/media\/([^/]+)$/);
    if (req.method === "DELETE" && mediaDelete) {
      return send(res, 200, { media: removeMedia(mediaDelete[1], mediaDelete[2]) });
    }

    if (req.method === "GET" && pathname === "/api/licenses") {
      return send(res, 200, { licenses: listLicenses() });
    }

    if (req.method === "POST" && pathname === "/api/licenses") {
      const body = await readBody(req);
      return send(res, 201, { license: createLicense(body) });
    }

    return notFound(res);
  } catch (error) {
    send(res, error.status || 500, { error: error.message || "Server error" });
  }
}

http.createServer(handle).listen(PORT, "0.0.0.0", () => {
  console.log(`FACERIGHTS API running at http://localhost:${PORT}`);
});
