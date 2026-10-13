import { test } from "@playwright/test";
import {
  attachQualityGate,
  assertQualityGate,
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
} from "../helpers/app-flow.js";

test.describe("G · offline", () => {
  test.fixme(
    "offline herladen en doorloop — Prompt 9 (offline-first) nog niet uitgevoerd",
    async ({ page, baseURL, context }) => {
      const gate = attachQualityGate(page, baseURL!);
      await clearAppStorage(page);
      await expectCover(page);
      await context.setOffline(true);
      await page.reload();
      await expectCover(page);
      await startFromCover(page);
      await startModules(page);
      await completeM1(page, "first");
      await completeRelay(page);
      await completeM2(page);
      await completeM3(page);
      await completeM4(page);
      await expectResult(page);
      assertQualityGate(gate);
    },
  );
});
