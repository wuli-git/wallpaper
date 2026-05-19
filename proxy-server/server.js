import http from "node:http";

const port = Number(process.env.PORT || 3000);
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
const upstreamAccessKey = process.env.UPSTREAM_ACCESS_KEY || "1328433750wuli@";
const targetOrigin = process.env.TARGET_ORIGIN || "https://tea.qingnian8.com";
const targetPrefix = process.env.TARGET_PREFIX || "/api/bizhi";
const proxyPrefix = process.env.PROXY_PREFIX || "/api/bizhi";
const imageProxyPrefix = process.env.IMAGE_PROXY_PREFIX || "/proxy-image";

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

function buildImageHeaders(requestHeaders) {
  const headers = buildHeaders(requestHeaders);
  delete headers["access-key"];
  headers["user-agent"] =
    headers["user-agent"] ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
  return headers;
}

function writeUpstreamHeaders(response, upstreamResponse) {
  for (const [key, value] of upstreamResponse.headers) {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      response.setHeader(key, value);
    }
  }
}

function getPublicOrigin(request) {
  const proto = request.headers["x-forwarded-proto"] || "https";
  const host = request.headers["x-forwarded-host"] || request.headers.host;
  return `${proto}://${host}`;
}

function shouldProxyImage(value) {
  return (
    typeof value === "string" &&
    /^https:\/\/cdn\.qingnian8\.com\/.+/i.test(value)
  );
}

function rewriteImageUrls(value, publicOrigin) {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteImageUrls(item, publicOrigin));
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      value[key] = rewriteImageUrls(item, publicOrigin);
    }
    return value;
  }
  if (shouldProxyImage(value)) {
    return `${publicOrigin}${imageProxyPrefix}?url=${encodeURIComponent(value)}`;
  }
  return value;
}

function isJsonResponse(response) {
  return response.headers.get("content-type")?.includes("application/json");
}

async function writeUpstreamBody(request, response, upstreamResponse) {
  if (isJsonResponse(upstreamResponse)) {
    const json = await upstreamResponse.json();
    const body = JSON.stringify(rewriteImageUrls(json, getPublicOrigin(request)));
    response.writeHead(upstreamResponse.status, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
    });
    response.end(body);
    return;
  }

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

  const requestUrl = new URL(request.url || "/", "http://proxy.local");
  if (requestUrl.pathname === imageProxyPrefix) {
    const imageUrl = requestUrl.searchParams.get("url");
    if (!imageUrl || !shouldProxyImage(imageUrl)) {
      response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ errCode: 400, errMsg: "Invalid image url" }));
      return;
    }

    try {
      const upstreamResponse = await fetch(imageUrl, {
        headers: buildImageHeaders(request.headers),
      });
    writeUpstreamHeaders(response, upstreamResponse);
    response.setHeader("Cache-Control", "public, max-age=604800, immutable");
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

    await writeUpstreamBody(request, response, upstreamResponse);
  } catch (error) {
    response.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ errCode: 502, errMsg: error.message }));
  }
});

server.listen(port, () => {
  console.log(`Proxy server listening on ${port}`);
});
