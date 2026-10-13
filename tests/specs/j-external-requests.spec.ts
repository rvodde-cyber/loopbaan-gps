import { test, expect } from "@playwright/test";
import { attachQualityGate } from "../helpers/quality-gate.js";
import { fullFlowToResult } from "../helpers/app-flow.js";

test.describe("J · externe requests", () => {
  test("geen requests buiten eigen origin tijdens doorloop", async ({ page, baseURL }) => {
    const gate = attachQualityGate(page, baseURL!);
    await fullFlowToResult(page);

    const unique = [...new Set(gate.externalUrls)];
    if (unique.length) {
      console.log("Externe URLs:\n" + unique.join("\n"));
    }
    expect(unique, unique.join("\n")).toEqual([]);
  });
});
