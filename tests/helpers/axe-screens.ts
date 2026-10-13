import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

export async function runAxe(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  if (bad.length) {
    const detail = bad.map((v) => `${v.id} (${v.impact}): ${v.help}`).join("; ");
    throw new Error(`axe op ${label}: ${detail}`);
  }
}
