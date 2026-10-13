import { test, expect } from "@playwright/test";
import {
  attachQualityGate,
  assertQualityGate,
  assertNoHorizontalScroll,
} from "../helpers/quality-gate.js";
import { clearAppStorage } from "../helpers/app-flow.js";

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Action = { kind: string; detail?: string };

async function monkeyRun(
  page: import("@playwright/test").Page,
  seed: number,
  origin: string,
  log: Action[],
) {
  const rng = mulberry32(seed);
  const gate = attachQualityGate(page, origin);

  await clearAppStorage(page);
  log.push({ kind: "clear" });

  const forward = [
    /Start je route/,
    /Start de route/,
    /Volgende signaal/,
    /Signaal ontvangen/,
    /Bereken mijn route/,
    /Beoordeel ze allemaal/,
  ];

  for (let step = 0; step < 150; step++) {
    if (await page.getByText(/Je route wijst richting/).isVisible()) {
      assertQualityGate(gate);
      return;
    }

    await assertNoHorizontalScroll(page).catch(() => {});

    if (rng() < 0.1 && await page.getByRole("button", { name: "← vorige" }).isVisible()) {
      await page.getByRole("button", { name: "← vorige" }).click();
      log.push({ kind: "back" });
      continue;
    }

    let clicked = false;
    for (const pat of forward) {
      const btn = page.getByRole("button", { name: pat });
      const n = await btn.count();
      if (!n) continue;
      for (let i = 0; i < n; i++) {
        const b = btn.nth(i);
        if (!(await b.isEnabled())) continue;
        await b.click({ timeout: 3000 });
        log.push({ kind: "forward", detail: String(pat) });
        clicked = true;
        break;
      }
      if (clicked) break;
    }
    if (clicked) continue;

    const choices = page.locator(".choices .choice");
    if (await choices.count()) {
      const n = await choices.count();
      const idx = Math.floor(rng() * n);
      await choices.nth(idx).click();
      if (rng() < 0.12) await choices.nth(idx).dblclick({ timeout: 400 }).catch(() => {});
      log.push({ kind: "choice", detail: String(idx) });
      continue;
    }

    const chips = page.locator(".chip");
    if (await chips.count()) {
      await chips.nth(Math.floor(rng() * await chips.count())).click();
      log.push({ kind: "chip" });
      continue;
    }

    if (await page.locator("#s1").count()) {
      const v1 = Math.floor(rng() * 100);
      const v2 = Math.floor(rng() * 100);
      await page.locator("#s1").evaluate((el, v) => {
        (el as HTMLInputElement).value = String(v);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }, v1);
      await page.locator("#s2").evaluate((el, v) => {
        (el as HTMLInputElement).value = String(v);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }, v2);
      log.push({ kind: "sliders" });
      continue;
    }

    const lik = page.locator(".lik .dots button");
    if (await lik.count()) {
      await lik.nth(Math.floor(rng() * await lik.count())).click();
      log.push({ kind: "likert" });
      continue;
    }
  }

  await expect(page.getByText(/Je route wijst richting/)).toBeVisible({ timeout: 5000 });
  assertQualityGate(gate);
}

test.describe.configure({ timeout: 180_000 });

for (let seed = 0; seed < 200; seed++) {
  test(`monkey seed ${seed}`, async ({ page, baseURL }) => {
    const log: Action[] = [];
    try {
      await monkeyRun(page, seed, baseURL!, log);
    } catch (e) {
      console.error(`MONKEY FAIL seed=${seed}`, log.slice(-10));
      throw e;
    }
  });
}
