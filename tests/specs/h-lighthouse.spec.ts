import { test, expect } from "@playwright/test";

test.describe("H · prestaties (Lighthouse mobiel)", () => {
  test("eerste laadgewicht en CLS-indicatie", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Chromium-only");

    const responses: { url: string; size: number }[] = [];
    page.on("response", async (res) => {
      const url = res.url();
      if (!url.includes("127.0.0.1:4173")) return;
      if (url.includes("fonts.googleapis") || url.includes("fonts.gstatic")) return;
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
      const entries = performance.getEntriesByType("layout-shift") as PerformanceEntry & { value?: number }[];
      return entries.reduce((s, e) => s + (e.value ?? 0), 0);
    });

    const causes: string[] = [];
    if (transferKb > 400) causes.push(`eigen origin ~${transferKb.toFixed(0)} kB > 400 kB (zonder fonts)`);
    if (cls >= 0.1) causes.push(`CLS (Performance API) ${cls.toFixed(3)} >= 0.1`);

    test.info().annotations.push({
      type: "metrics",
      description: `transfer≈${transferKb.toFixed(0)} kB, CLS≈${cls.toFixed(3)}`,
    });

    expect(causes, causes.join("\n")).toHaveLength(0);
  });
});
