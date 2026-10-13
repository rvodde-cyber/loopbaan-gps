import { test, expect } from "@playwright/test";
import { runAxe } from "../helpers/axe-screens.js";
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
} from "../helpers/app-flow.js";

const screenSteps: { name: string; step: (page: import("@playwright/test").Page) => Promise<void> }[] = [
  { name: "omslag", step: async () => {} },
  { name: "intro", step: async (page) => { await startFromCover(page); } },
  { name: "m1", step: async (page) => { await startModules(page); } },
  { name: "relay-m1", step: async (page) => { await completeM1(page); } },
  { name: "m2", step: async (page) => { await completeRelay(page); } },
  { name: "relay-m2", step: async (page) => { await completeM2(page, [0, 1, 2], false); } },
  { name: "m3", step: async (page) => { await completeRelay(page); await page.locator("#s1").waitFor(); } },
  { name: "relay-m3", step: async (page) => { await completeM3(page, 50, 50, false); } },
  { name: "m4", step: async (page) => { await completeRelay(page); } },
  { name: "resultaat", step: async (page) => { await completeM4(page); } },
];

test.describe("F · toegankelijkheid axe per scherm", () => {
  for (const target of screenSteps) {
    test(`axe ${target.name}`, async ({ page }) => {
      await clearAppStorage(page);
      await expectCover(page);
      for (const s of screenSteps) {
        await s.step(page);
        if (s.name === target.name) {
          await runAxe(page, target.name);
          return;
        }
      }
    });
  }
});

test.describe("F · toetsenbord doorloop", () => {
  test("focus zichtbaar en doorloop met Tab/Enter", async ({ page }) => {
    await clearAppStorage(page);
    await expectCover(page);
    await page.getByRole("button", { name: "Start je route" }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Start de route" }).focus();
    await page.keyboard.press("Enter");
    await page.locator(".choices .choice").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText(/interesses · vraag 2 van/)).toBeVisible();
  });
});

test.describe("F · aanraakdoelen mobiel", () => {
  test("knoppen >= 44px", async ({ page }, testInfo) => {
    const mobile = testInfo.project.name.includes("iphone") || testInfo.project.name.includes("pixel");
    test.skip(!mobile, "alleen mobiele projecten");

    await clearAppStorage(page);
    await expectCover(page);
    const btn = page.getByRole("button", { name: "Start je route" });
    const box = await btn.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });
});
