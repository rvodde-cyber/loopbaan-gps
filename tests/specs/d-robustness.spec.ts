import { test, expect } from "@playwright/test";
import { STORAGE_KEY, clearAppStorage, expectCover, startFromCover, startModules, completeM1, completeRelay, completeM2, completeM3, completeM4, expectResult } from "../helpers/app-flow.js";

test.describe("D · robuustheid", () => {
  test("verversen behoudt voortgang", async ({ page }) => {
    await clearAppStorage(page);
    await expectCover(page);
    await startFromCover(page);
    await startModules(page);
    await completeM1(page, "first");
    await page.reload();
    await page.getByRole("button", { name: "Volgende signaal →" }).waitFor();
    await completeRelay(page);
    await completeM2(page);
    await page.reload();
    await page.getByRole("button", { name: "Signaal ontvangen — volgende" }).waitFor();
  });

  test("browser-terug door module 1", async ({ page }) => {
    await clearAppStorage(page);
    await expectCover(page);
    await startFromCover(page);
    await startModules(page);
    await page.locator(".choices .choice").first().click();
    await page.locator(".choices .choice").first().click();
    await page.getByRole("button", { name: "← vorige" }).click();
    await expect(page.getByText(/interesses · vraag 2 van/)).toBeVisible();
    await page.getByRole("button", { name: "← vorige" }).click();
    await expect(page.getByText(/interesses · vraag 1 van/)).toBeVisible();
    await page.goBack();
    await page.getByRole("button", { name: "Start de route" }).waitFor();
  });

  test("localStorage geblokkeerd — app blijft bruikbaar", async ({ page }) => {
    await page.addInitScript(() => {
      const block = () => {
        throw new DOMException("blocked", "SecurityError");
      };
      Storage.prototype.setItem = block;
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Start je route" }).click();
    await page.getByRole("button", { name: "Start de route" }).click();
    await page.locator(".choices .choice").first().click();
    await expect(page.locator(".choices .choice").first()).toBeVisible();
  });

  test("savedAt ouder dan 90 dagen wordt gewist", async ({ page }) => {
    await page.goto("/");
    const old = new Date(Date.now() - 91 * 86400000).toISOString();
    await page.evaluate(
      ({ key, savedAt }) => {
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            savedAt,
            state: { screen: "intro", m1i: 0, m1hist: [], riasec: { R: 1, I: 0, A: 0, S: 0, W: 0, C: 0 }, values: [], env: { s1: 50, s2: 50 }, comp: {}, focus: null, relayFrom: null, tw: { chosen: [], as1: null, dom: null }, notes: { twijfel: "", plan: "" }, returnTo: "intro" },
          }),
        );
      },
      { key: STORAGE_KEY, savedAt: old },
    );
    await page.reload();
    await page.locator("#cover").waitFor();
    await expect(page.getByRole("button", { name: "Start je route" })).toBeVisible();
  });

  test("kapotte JSON in storage — schone start", async ({ page }) => {
    await page.goto("/");
    await page.evaluate((key) => {
      localStorage.setItem(key, "{niet-json");
    }, STORAGE_KEY);
    await page.reload();
    await expectCover(page);
  });
});
