import type { Page } from "@playwright/test";
import { readServiceWorkerMeta } from "./sw-cache.js";

export async function ensureServiceWorkerControls(page: Page) {
  const { cacheName } = readServiceWorkerMeta();
  await page.goto("/");
  await page.evaluate(async () => {
    if (!navigator.serviceWorker) return;
    await navigator.serviceWorker.register("./sw.js");
    await navigator.serviceWorker.ready;
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => navigator.serviceWorker?.controller != null,
    null,
    { timeout: 15_000 },
  );
  await page.waitForFunction(
    async (name) => {
      const cache = await caches.open(name);
      const hit =
        (await cache.match("index.html")) || (await cache.match("./"));
      const font = await cache.match("fonts/dm-sans-latin-400-normal.woff2");
      return !!hit && !!font;
    },
    cacheName,
    { timeout: 15_000 },
  );
}
