import http from "node:http";

const port = Number(process.env.PORT || 3000);
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
const upstreamAccessKey = process.env.UPSTREAM_ACCESS_KEY || "1328433750wuli@";
const targetOrigin = process.env.TARGET_ORIGIN || "https://tea.qingnian8.com";
const targetPrefix = process.env.TARGET_PREFIX || "/api/bizhi";
const proxyPrefix = process.env.PROXY_PREFIX || "/api/bizhi";

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
]);

function resolveAllowOrigin(origin) {
  if (allowedOrigin === "*") return origin || "*";
  const origins = allowedOrigin.split(",").map((item) => item.trim());
  return origins.includes(origin) ? origin : origins[0];
}

function setCorsHeaders(response, request) {
  const origin = request.headers.origin || "";
  response.setHeader("Access-Control-Allow-Origin", resolveAllowOrigin(origin));
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    request.headers["access-control-request-headers"] || "Content-Type, Authorization, access-key"
  );
  response.setHeader("Access-Control-Max-Age", "86400");
  response.setHeader("Vary", "Origin, Access-Control-Request-Headers");
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function buildUpstreamUrl(requestUrl) {
  const url = new URL(requestUrl, "http://proxy.local");
  if (!url.pathname.startsWith(proxyPrefix)) return null;
  const suffix = url.pathname.slice(proxyPrefix.length);
  return new URL(`${targetPrefix}${suffix}${url.search}`, targetOrigin);
}

function buildHeaders(requestHeaders) {
  const headers = {};
  for (const [key, value] of Object.entries(requestHeaders)) {
    if (!hopByHopHeaders.has(key.toLowerCase()) && value !== undefined) {
      headers[key] = value;
    }
  }
  headers["access-key"] = upstreamAccessKey;
  return headers;
}

function writeUpstreamHeaders(response, upstreamResponse) {
  for (const [key, value] of upstreamResponse.headers) {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      response.setHeader(key, value);
    }
  }
}

const server = http.createServer(async (request, response) => {
  setCorsHeaders(response, request);

  if (request.url === "/" || request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, proxyPrefix, targetOrigin, targetPrefix }));
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const upstreamUrl = buildUpstreamUrl(request.url || "/");
  if (!upstreamUrl) {
    response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ errCode: 404, errMsg: "Proxy route not found" }));
    return;
  }

  try {
    const body = ["GET", "HEAD"].includes(request.method || "") ? undefined : await readBody(request);
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: buildHeaders(request.headers),
      body,
    });

    writeUpstreamHeaders(response, upstreamResponse);
    response.writeHead(upstreamResponse.status);

    if (upstreamResponse.body) {
      await upstreamResponse.body.pipeTo(
        new WritableStream({
          write(chunk) {
            response.write(Buffer.from(chunk));
          },
          close() {
            response.end();
          },
          abort(error) {
            response.destroy(error);
          },
        })
      );
    } else {
      response.end();
    }
  } catch (error) {
    response.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ errCode: 502, errMsg: error.message }));
  }
});

server.listen(port, () => {
  console.log(`Proxy server listening on ${port}`);
});
