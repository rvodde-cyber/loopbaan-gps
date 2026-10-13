import { test, expect } from "@playwright/test";
import {
  M1_LETTERS_A,
  M1_LETTERS_B,
  countLetters,
  rankedRiasecCode,
  readRiasecFromStorage,
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
} from "../helpers/app-flow.js";

test.describe("B · scoring", () => {
  test("altijd eerste optie — RIASEC, gelijke scores, uitleg", async ({ page }) => {
    await clearAppStorage(page);
    await expectCover(page);
    await startFromCover(page);
    await startModules(page);
    await completeM1(page, "first");
    await completeRelay(page);
    await completeM2(page);
    await completeM3(page, 20, 80);
    await completeM4(page, 5);
    await expectResult(page);

    const riasec = await readRiasecFromStorage(page);
    expect(riasec).toBeTruthy();
    const expected = countLetters(M1_LETTERS_A);
    expect(riasec).toMatchObject(expected);

    const code = await rankedRiasecCode(riasec!);
    const topBlock = code.split("·")[0] ?? "";
    for (const letter of topBlock.replace(/\//g, "")) {
      await expect(page.locator("#routekaart")).toContainText(letter);
    }
    await expect(page.getByText(/Jouw richting:/)).toBeVisible();
    await expect(page.getByText(/past bij deze richting|goed om te bespreken/)).toBeVisible();
  });

  test("altijd tweede optie", async ({ page }) => {
    await clearAppStorage(page);
    await expectCover(page);
    await startFromCover(page);
    await startModules(page);
    await completeM1(page, "second");
    await completeRelay(page);
    await completeM2(page);
    await completeM3(page);
    await completeM4(page);
    await expectResult(page);

    const riasec = await readRiasecFromStorage(page);
    expect(riasec).toMatchObject(countLetters(M1_LETTERS_B));
  });

  test("gelijke RIASEC-scores — melding op advies", async ({ page }) => {
    await clearAppStorage(page);
    await expectCover(page);
    await startFromCover(page);
    await startModules(page);
    await completeM1(page, "alternate");
    await completeRelay(page);
    await completeM2(page);
    await completeM3(page);
    await completeM4(page);
    await expectResult(page);
    await expect(page.getByText(/scoren bij jou even hoog/)).toBeVisible();
  });

  test("afwisselend eerste/tweede", async ({ page }) => {
    await clearAppStorage(page);
    await expectCover(page);
    await startFromCover(page);
    await startModules(page);
    await completeM1(page, "alternate");
    await completeRelay(page);
    await completeM2(page);
    await completeM3(page);
    await completeM4(page);
    await expectResult(page);

    const letters = M1_LETTERS_A.map((a, i) => (i % 2 === 0 ? a : M1_LETTERS_B[i]));
    const riasec = await readRiasecFromStorage(page);
    expect(riasec).toMatchObject(countLetters(letters));
  });

  test("m1back telt antwoorden niet dubbel", async ({ page }) => {
    await clearAppStorage(page);
    await expectCover(page);
    await startFromCover(page);
    await startModules(page);

    for (let i = 0; i < 5; i++) {
      await page.locator(".choices .choice").first().click();
    }
    await page.getByRole("button", { name: "← vorige" }).click();
    await page.getByRole("button", { name: "← vorige" }).click();
    await page.locator(".choices .choice").nth(1).click();
    await page.locator(".choices .choice").nth(1).click();

    for (let i = 0; i < 10; i++) {
      await page.locator(".choices .choice").first().click();
    }
    await page.getByRole("button", { name: "Volgende signaal →" }).waitFor();
    await completeRelay(page);
    await completeM2(page);
    await completeM3(page);
    await completeM4(page);
    await expectResult(page);

    const letters = [...M1_LETTERS_A.slice(0, 3), M1_LETTERS_B[3], M1_LETTERS_B[4], ...M1_LETTERS_A.slice(5)];
    const riasec = await readRiasecFromStorage(page);
    expect(riasec).toMatchObject(countLetters(letters));
  });
});
