import { test } from "@playwright/test";
import {
  attachQualityGate,
  assertQualityGate,
  assertNoHorizontalScroll,
} from "../helpers/quality-gate.js";
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
  expectResult,
  fillGesprekskaart,
  saveCardImage,
  openWipeAndConfirm,
} from "../helpers/app-flow.js";

test.describe("A · doorloop", () => {
  test("omslag → wissen zonder fouten", async ({ page, baseURL }, testInfo) => {
    const origin = baseURL!;
    const gate = attachQualityGate(page, origin);
    const scrollOk = async () => {
      if (!testInfo.project.name.includes("webkit")) await assertNoHorizontalScroll(page);
    };
    await clearAppStorage(page);
    await scrollOk();

    await expectCover(page);
    await startFromCover(page);
    await scrollOk();

    await startModules(page);
    await completeM1(page, "first");
    await completeRelay(page);
    await completeM2(page);
    await completeM3(page);
    await completeM4(page);
    await expectResult(page);
    await scrollOk();

    await fillGesprekskaart(page);
    await saveCardImage(page);

    await openWipeAndConfirm(page);
    await expectCover(page);
    await scrollOk();
    assertQualityGate(gate);
  });
});
