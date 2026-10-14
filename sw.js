const CACHE_NAME = "loopbaangps-v2-2026-10";

const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "favicon.svg",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "icon-512-maskable.png",
  "vendor/html2canvas.min.js",
  "fonts/dm-sans-latin-400-normal.woff2",
  "fonts/dm-sans-latin-500-normal.woff2",
  "fonts/dm-mono-latin-400-normal.woff2",
  "fonts/cormorant-garamond-latin-500-normal.woff2",
  "fonts/cormorant-garamond-latin-400-italic.woff2",
  "img/omslag-600.webp",
  "img/omslag-1200.webp",
  "img/interesses-800.webp",
  "img/werkwaarden-800.webp",
  "img/werkomgeving-800.webp",
  "img/competenties-800.webp",
  "hbo-opleidingen-sociaal-domein-preview.webp",
  "hbo-opleidingen-sociaal-domein.pdf",
];

const TRANSPARENT_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
});

function isHtmlNavigation(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept");
  return request.method === "GET" && accept && accept.includes("text/html");
}

function isImageRequest(request) {
  if (request.destination === "image") return true;
  const path = new URL(request.url).pathname;
  return /\.(webp|png|jpe?g|gif|svg|ico|avif)$/i.test(path);
}

function offlineAssetResponse(request) {
  if (isImageRequest(request)) {
    return new Response(TRANSPARENT_PNG, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }
  return new Response("", { status: 504, statusText: "Offline" });
}

function respondSafely(event, handlerPromise) {
  event.respondWith(
    handlerPromise.catch(() => offlineAssetResponse(event.request)),
  );
}

async function networkFirstHtml(request) {
  const cache = await caches.open(CACHE_NAME);
  const fallback = () =>
    cache.match(request).then((r) => r || cache.match("index.html") || cache.match("./"));

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await fallback();
    if (cached) return cached;
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

function smallerImageFallbackUrl(url) {
  if (url.includes("-1600.webp")) return url.replace("-1600.webp", "-800.webp");
  if (url.includes("-1200.webp")) return url.replace("-1200.webp", "-600.webp");
  return null;
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && new URL(request.url).origin === self.location.origin) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const smaller = smallerImageFallbackUrl(request.url);
    if (smaller) {
      const fb = await caches.match(smaller);
      if (fb) return fb;
    }
    const any = await caches.match(request);
    if (any) return any;
    return offlineAssetResponse(request);
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isHtmlNavigation(event.request)) {
    respondSafely(event, networkFirstHtml(event.request));
    return;
  }
  if (event.request.method !== "GET") return;
  respondSafely(event, cacheFirstAsset(event.request));
});
