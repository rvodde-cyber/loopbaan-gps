import { test, expect } from "@playwright/test";
import {
  STORAGE_KEY,
  fullFlowToResult,
  openWipeAndConfirm,
  expectCover,
} from "../helpers/app-flow.js";

test.describe("E · wissen", () => {
  test("wissen leegt storage en toont omslag + aria-live", async ({ page }) => {
    await fullFlowToResult(page);
    await page.locator("#note-twijfel").fill("moet weg");
    await openWipeAndConfirm(page);
    await expectCover(page);

    const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(raw).toBeTruthy();
    const bag = JSON.parse(raw!);
    expect(bag.state.screen).toBe("cover");
    expect(bag.state.notes).toEqual({ twijfel: "", plan: "" });
    expect(bag.state.m1i).toBe(0);

    await expect(page.locator("#status-announcer")).toContainText("Je gegevens zijn gewist.", {
      timeout: 5000,
    });
    await expect(page.locator("#note-twijfel")).toHaveCount(0);
  });
});
