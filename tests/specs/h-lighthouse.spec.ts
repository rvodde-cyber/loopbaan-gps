import { execSync } from "node:child_process";
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

  test("Lighthouse PWA-installeerbaarheid zonder fouten", async ({ baseURL, browserName }) => {
    test.skip(browserName !== "chromium", "Chromium-only");
    const json = execSync(
      `npx lighthouse ${baseURL!} --only-categories=pwa --quiet --output=json --chrome-flags="--headless=new"`,
      { encoding: "utf8", maxBuffer: 20_000_000, cwd: import.meta.dirname, shell: true },
    );
    const report = JSON.parse(json) as {
      categories?: { pwa?: { score: number } };
    };
    const score = report.categories?.pwa?.score ?? 0;
    test.info().annotations.push({
      type: "metrics",
      description: `Lighthouse PWA score=${score}`,
    });
    expect(score).toBe(1);
  });
});
