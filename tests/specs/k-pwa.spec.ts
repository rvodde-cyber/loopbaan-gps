import { test, expect } from "@playwright/test";
import {
  clearAppStorage,
  expectCover,
  fullFlowToResult,
  saveCardImage,
} from "../helpers/app-flow.js";
import { ensureServiceWorkerControls } from "../helpers/service-worker.js";

test.describe("K · PWA / lazy / reset", () => {
  test("?reset-cache=1 verwijdert worker en caches", async ({ page, context }) => {
    await context.clearCookies();
    await ensureServiceWorkerControls(page);
    await page.goto("/?reset-cache=1");
    await page.waitForURL((url) => !url.search.includes("reset-cache"), { timeout: 15_000 });
    const state = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      const keys = self.caches ? await caches.keys() : [];
      return { regs: regs.length, caches: keys.length };
    });
    expect(state.regs).toBe(0);
    expect(state.caches).toBe(0);
    await expectCover(page);
  });

  test("html2canvas wordt pas geladen na klik op bewaar", async ({ page }) => {
    const h2c: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("html2canvas")) h2c.push(req.url());
    });
    await clearAppStorage(page);
    await expectCover(page);
    expect(h2c).toHaveLength(0);
    await fullFlowToResult(page);
    expect(h2c).toHaveLength(0);
    await saveCardImage(page);
    expect(h2c.length).toBeGreaterThan(0);
  });

  test("manifest en service worker registratie", async ({ page }) => {
    await page.goto("/");
    const manifest = await page.evaluate(async () => {
      const link = document.querySelector('link[rel="manifest"]');
      if (!link) return null;
      const res = await fetch((link as HTMLLinkElement).href);
      return res.ok ? res.json() : null;
    });
    expect(manifest?.name).toBe("Loopbaan GPS");
    expect(manifest?.display).toBe("standalone");
    await page.evaluate(async () => {
      await navigator.serviceWorker.register("./sw.js");
      await navigator.serviceWorker.ready;
    });
  });
});
