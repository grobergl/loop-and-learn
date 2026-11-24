import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { generatePattern } from "./src/ai-service.js";
const root = resolve("dist"),
  port = Number(process.env.PORT || 4174),
  host = process.env.HOST || "127.0.0.1";
const attempts = new Map();
const send = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(body));
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/status" && req.method === "GET")
      return send(res, 200, { aiReady: !!process.env.OPENAI_API_KEY });
    if (url.pathname === "/api/generate" && req.method === "POST") {
      const origin = req.headers.origin;
      if (
        origin &&
        ![
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          `http://localhost:${port}`,
          `http://127.0.0.1:${port}`,
          process.env.APP_ORIGIN,
        ]
          .filter(Boolean)
          .includes(origin)
      )
        return send(res, 403, { error: "Use the app served by this server." });
      if (!process.env.OPENAI_API_KEY)
        return send(res, 503, {
          error:
            "AI drafting is not connected. Configure OPENAI_API_KEY on the server or use the copy-to-chat option.",
        });
      const ip = req.socket.remoteAddress,
        t = Date.now(),
        recent = (attempts.get(ip) || []).filter((x) => t - x < 600000);
      if (recent.length >= 10)
        return send(res, 429, {
          error: "Please wait before requesting another draft.",
        });
      attempts.set(ip, [...recent, t]);
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 1500000)
          return send(res, 413, {
            error: "The image or request is too large.",
          });
      }
      let input;
      try {
        input = JSON.parse(raw);
      } catch {
        return send(res, 400, { error: "Invalid request." });
      }
      return send(res, 200, {
        pattern: await generatePattern(input, {
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        }),
      });
    }
    if (url.pathname.startsWith("/api/"))
      return send(res, 404, { error: "Unknown API route." });
    if (!["GET", "HEAD"].includes(req.method))
      return send(res, 405, { error: "Method not allowed." });
    let path = resolve(root, "." + decodeURIComponent(url.pathname));
    if (path !== root && !path.startsWith(root + sep))
      return send(res, 403, { error: "Forbidden." });
    try {
      if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    } catch {
      path = resolve(root, "index.html");
    }
    const body = await readFile(path);
    const type =
      {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".png": "image/png",
      }[extname(path)] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch (e) {
    send(res, e.status || 500, {
      error: e.status
        ? e.message
        : "The server could not complete this request.",
    });
  }
}).listen(port, host, () =>
  console.log(
    `Loop & Learn at http://${host}:${port} — AI ${process.env.OPENAI_API_KEY ? "connected" : "not configured"}`,
  ),
);
