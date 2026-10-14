import { test, expect } from "@playwright/test";

test.describe("H · prestaties (eerste laadgewicht)", () => {
  test("eigen origin <= 400 kB incl. fonts, zonder html2canvas", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Chromium-only");

    await page.addInitScript(() => {
      navigator.serviceWorker.register = () => Promise.reject(new Error("sw off"));
    });

    const responses: { url: string; size: number }[] = [];
    page.on("response", async (res) => {
      const url = res.url();
      if (!url.includes("127.0.0.1:4173")) return;
      if (url.includes("html2canvas")) return;
      try {
        const buf = await res.body();
        responses.push({ url, size: buf.length });
      } catch {
        /* aborted */
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });
    const transferKb = responses.reduce((a, r) => a + r.size, 0) / 1024;

    const cls = await page.evaluate(() => {
      const entries = performance.getEntriesByType("layout-shift") as PerformanceEntry & {
        value?: number;
      }[];
      return entries.reduce((s, e) => s + (e.value ?? 0), 0);
    });

    test.info().annotations.push({
      type: "metrics",
      description: `eerste laad≈${transferKb.toFixed(0)} kB, CLS≈${cls.toFixed(3)}`,
    });

    const causes: string[] = [];
    if (transferKb > 400) causes.push(`eigen origin ~${transferKb.toFixed(0)} kB > 400 kB`);
    if (cls >= 0.1) causes.push(`CLS ${cls.toFixed(3)} >= 0.1`);
    expect(causes, causes.join("\n")).toHaveLength(0);
  });

  test("PWA manifest, icons en service worker (LH 12.x heeft geen pwa-categorie)", async ({
    page,
    baseURL,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Chromium-only");
    await page.goto(baseURL! + "/");
    const manifest = await page.evaluate(async () => {
      const link = document.querySelector('link[rel="manifest"]');
      if (!link) return null;
      const res = await fetch((link as HTMLLinkElement).href);
      return res.ok ? res.json() : null;
    });
    expect(manifest?.name).toBe("Loopbaan GPS");
    expect(manifest?.display).toBe("standalone");
    expect(manifest?.start_url).toBeTruthy();
    const icons = (manifest?.icons ?? []) as { sizes?: string; purpose?: string }[];
    expect(icons.some((i) => i.sizes === "192x192")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512" && i.purpose === "maskable")).toBe(
      true,
    );
    const swOk = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.register("./sw.js");
      await navigator.serviceWorker.ready;
      return Boolean(reg.installing || reg.waiting || reg.active);
    });
    expect(swOk).toBe(true);
    test.info().annotations.push({
      type: "metrics",
      description: "manifest+SW OK (vervangt Lighthouse pwa-categorie)",
    });
  });
});
