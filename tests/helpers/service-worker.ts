import type { Page } from "@playwright/test";

export async function ensureServiceWorkerControls(page: Page) {
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
    async () => {
      const cache = await caches.open("loopbaangps-v1-2026-10");
      const hit =
        (await cache.match("index.html")) || (await cache.match("./"));
      const font = await cache.match("fonts/dm-sans-latin-400-normal.woff2");
      return !!hit && !!font;
    },
    null,
    { timeout: 15_000 },
  );
}
