import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function readServiceWorkerMeta() {
  const sw = readFileSync(path.join(repoRoot, "sw.js"), "utf8");
  const cacheName = /const CACHE_NAME = "([^"]+)"/.exec(sw)?.[1] ?? "";
  const block = /PRECACHE_URLS\s*=\s*\[([\s\S]*?)\]/.exec(sw)?.[1] ?? "";
  const precacheUrls: string[] = [];
  for (const m of block.matchAll(/"([^"]+)"/g)) precacheUrls.push(m[1]);
  return { cacheName, precacheUrls };
}

/** Som unieke bestanden op schijf (./ en index.html tellen één keer). */
export function precacheBytesOnDisk(): number {
  const { precacheUrls } = readServiceWorkerMeta();
  let total = 0;
  const seen = new Set<string>();
  for (const u of precacheUrls) {
    const file = u === "./" ? "index.html" : u;
    if (seen.has(file)) continue;
    seen.add(file);
    total += statSync(path.join(repoRoot, file)).size;
  }
  return total;
}

export function normalizeSameOriginPath(url: string, origin: string): string | null {
  try {
    const u = new URL(url);
    const o = new URL(origin);
    if (u.origin !== o.origin) return null;
    let p = decodeURIComponent(u.pathname.replace(/^\//, ""));
    if (!p) return "index.html";
    return p;
  } catch {
    return null;
  }
}

const SKIP_CACHE_CHECK = /^(sw\.js|favicon\.ico)$/;

export function shouldVerifyInCache(pathname: string): boolean {
  if (!pathname || pathname.includes("..")) return false;
  if (SKIP_CACHE_CHECK.test(pathname)) return false;
  return true;
}
