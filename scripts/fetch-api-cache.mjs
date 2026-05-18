import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = "https://tea.qingnian8.com/api/bizhi";
const accessKey = process.env.VITE_API_ACCESS_KEY || "1328433750wuli@";
const outputDir = new URL("../src/static/api-cache/", import.meta.url);

const endpoints = [
  ["homeBanner", "/homeBanner"],
  ["randomWall", "/randomWall"],
  ["wallNewsList-select", "/wallNewsList?select=true"],
  ["classify-select", "/classify?select=true"],
  ["classify", "/classify?pageSize=15"],
];

async function fetchEndpoint([name, path]) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${baseUrl}${path}${separator}access-key=${encodeURIComponent(accessKey)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${name} failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errCode !== 0) {
    throw new Error(`${name} failed: ${json.errMsg || json.errCode}`);
  }

  await writeFile(new URL(`${name}.json`, outputDir), JSON.stringify(json));
}

await mkdir(outputDir, { recursive: true });
await Promise.all(endpoints.map(fetchEndpoint));
