import { test, expect } from "@playwright/test";

test.describe("I · live QR-URL", () => {
  test("poster-URL 200, redirect, omslag, geen mixed content", async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== "live" || process.env.LIVE !== "1", "LIVE=1 en --project=live");

    const url = "https://loopbaangps.moreelvakmanschap.nl/";
    let hops = 0;
    let current = url;
    let status = 0;
    while (hops <= 2) {
      const res = await request.get(current, { maxRedirects: 0 });
      status = res.status();
      if (status >= 300 && status < 400) {
        const loc = res.headers()["location"];
        expect(loc).toBeTruthy();
        current = loc!.startsWith("http") ? loc! : new URL(loc!, current).href;
        hops++;
        continue;
      }
      break;
    }
    expect(status).toBe(200);
    expect(hops).toBeLessThanOrEqual(1);
    expect(current).toMatch(/^https:\/\//);

    const mixed: string[] = [];
    page.on("request", (req) => {
      if (req.url().startsWith("http://") && !req.url().includes("localhost")) mixed.push(req.url());
    });
    await page.goto(current);
    await page.locator("#cover").waitFor();
    await expect(page.getByRole("button", { name: "Start je route" })).toBeVisible();
    expect(mixed).toEqual([]);
  });
});
