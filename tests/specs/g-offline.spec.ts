import { test, expect } from "@playwright/test";
import {
  attachQualityGate,
  assertQualityGate,
} from "../helpers/quality-gate.js";
import {
  clearAppStorage,
  clearServiceWorkerAndCaches,
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
import { readServiceWorkerMeta } from "../helpers/sw-cache.js";

test.describe("G · offline", () => {
  test("offline herladen, volledige doorloop en bewaar als afbeelding", async ({
    page,
    baseURL,
    context,
    browserName,
  }) => {
    const { cacheName } = readServiceWorkerMeta();
    await clearAppStorage(page);
    await clearServiceWorkerAndCaches(page);
    await ensureServiceWorkerControls(page);
    await context.setOffline(true);
    const gate = attachQualityGate(page, baseURL!, {
      ignoreOfflineResourceConsole: true,
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    const offlineReadyTimeout = browserName === "webkit" ? 25_000 : 12_000;
    await expect
      .poll(
        async () =>
          page.evaluate(async (name) => {
            const cache = await caches.open(name);
            const hit = await cache.match("fonts/dm-sans-latin-400-normal.woff2");
            if (hit) return true;
            try {
              return (await fetch("fonts/dm-sans-latin-400-normal.woff2")).ok;
            } catch {
              return false;
            }
          }, cacheName),
        { timeout: offlineReadyTimeout },
      )
      .toBe(true);
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
    assertQualityGate(gate, { skipFailedRequests: true });
  });
});
