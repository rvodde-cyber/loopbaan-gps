import { test, expect } from "@playwright/test";
import {
  clearAppStorage,
  expectCover,
  startFromCover,
  startModules,
  completeM1,
  completeRelay,
  completeM2,
  completeM3,
  completeM4,
  expectResult,
  saveCardImage,
} from "../helpers/app-flow.js";
import { ensureServiceWorkerControls } from "../helpers/service-worker.js";
import {
  normalizeSameOriginPath,
  precacheBytesOnDisk,
  readServiceWorkerMeta,
  shouldVerifyInCache,
} from "../helpers/sw-cache.js";

test.describe("L · offline-dekking", () => {
  test("doorloop-requests zitten in cache na online sessie", async ({ page, baseURL }, testInfo) => {
    test.skip(
      !["desktop-chromium", "iphone-se-webkit"].includes(testInfo.project.name),
      "gap-analyse alleen desktop-chromium en iphone-se-webkit",
    );

    const origin = baseURL!;
    const { cacheName, precacheUrls } = readServiceWorkerMeta();
    const precacheKb = precacheBytesOnDisk() / 1024;
    expect(precacheKb, `precache ${precacheKb.toFixed(1)} kB > 900 kB`).toBeLessThanOrEqual(900);
    test.info().annotations.push({
      type: "metrics",
      description: `precache≈${precacheKb.toFixed(1)} kB`,
    });
    const precacheSet = new Set(
      precacheUrls.map((u) => (u === "./" ? "index.html" : u)),
    );

    const seen = new Set<string>();
    page.on("request", (req) => {
      if (req.method() !== "GET") return;
      const p = normalizeSameOriginPath(req.url(), origin);
      if (p && shouldVerifyInCache(p)) seen.add(p);
    });

    await clearAppStorage(page);
    await ensureServiceWorkerControls(page);
    await expectCover(page);
    await startFromCover(page);
    await startModules(page);
    await completeM1(page, "first");
    await completeRelay(page);
    await completeM2(page);
    await completeM3(page);
    await completeM4(page);
    await expectResult(page);
    await saveCardImage(page);

    const missingFromPrecache = [...seen].filter((p) => !precacheSet.has(p)).sort();
    test.info().annotations.push({
      type: "metrics",
      description: `requests=${seen.size}, niet in PRECACHE=${missingFromPrecache.length}`,
    });
    if (missingFromPrecache.length) {
      console.log(
        `[${testInfo.project.name}] same-origin tijdens doorloop, niet in PRECACHE_URLS:\n` +
          missingFromPrecache.join("\n"),
      );
    }

    const missingInCache = await page.evaluate(
      async ({ cacheName, paths }) => {
        const cache = await caches.open(cacheName);
        const miss: string[] = [];
        for (const p of paths) {
          const hit =
            (await cache.match(p)) ||
            (await cache.match("/" + p)) ||
            (await cache.match(new URL(p, location.origin).href));
          if (!hit) miss.push(p);
        }
        return miss;
      },
      { cacheName, paths: [...seen] },
    );

    expect(
      missingInCache,
      `Niet in Cache Storage na doorloop:\n${missingInCache.join("\n")}`,
    ).toEqual([]);
  });
});
