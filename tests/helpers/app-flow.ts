import type { Page } from "@playwright/test";
import { assertNoHorizontalScroll } from "./quality-gate.js";

export const STORAGE_KEY = "loopbaangps:v1";

/** 15 M1-paren: altijd optie a = deze letters (volgorde in index.html). */
export const M1_LETTERS_A = "RISRAIRASIRARIW".split("");
export const M1_LETTERS_B = "CAWICCWSCWAWSSC".split("");

export async function clearAppStorage(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => {
    localStorage.removeItem(key);
    sessionStorage.clear();
  }, STORAGE_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#app").waitFor();
}

export async function clearServiceWorkerAndCaches(page: Page) {
  await page.evaluate(async () => {
    try {
      if (navigator.serviceWorker) {
        for (const r of await navigator.serviceWorker.getRegistrations()) {
          await r.unregister();
        }
      }
      if (self.caches) {
        for (const k of await caches.keys()) await caches.delete(k);
      }
    } catch {
      /* ignore */
    }
  });
}

export async function expectCover(page: Page) {
  await page.getByRole("button", { name: "Start je route" }).waitFor();
  await page.locator("#cover").waitFor();
}

export async function startFromCover(page: Page) {
  await page.getByRole("button", { name: "Start je route" }).click();
  await page.getByRole("button", { name: "Start de route" }).waitFor();
}

export async function startModules(page: Page) {
  await page.getByRole("button", { name: "Start de route" }).click();
  await page.getByText("Wat spreekt je meer aan?").waitFor();
}

export type M1Pick = "first" | "second" | "alternate";

export async function completeM1(page: Page, pick: M1Pick = "first") {
  for (let i = 0; i < 15; i++) {
    const choices = page.locator(".choices .choice");
    await choices.first().waitFor();
    let idx = 0;
    if (pick === "second") idx = 1;
    if (pick === "alternate") idx = i % 2;
    await choices.nth(idx).click();
    await assertNoHorizontalScroll(page);
  }
  await page.getByRole("button", { name: "Volgende signaal →" }).waitFor();
}

export async function completeRelay(page: Page) {
  await page.getByRole("button", { name: "Volgende signaal →" }).click();
}

export async function completeM2(page: Page, chipIndexes: number[] = [0, 1, 2], relay = true) {
  for (const i of chipIndexes) {
    await page.locator(".chip").nth(i).click();
  }
  await page.getByRole("button", { name: /Signaal ontvangen/ }).click();
  if (relay) await completeRelay(page);
}

export async function completeM3(page: Page, s1 = 50, s2 = 50, relay = true) {
  await page.locator("#s1").evaluate((el, v) => {
    (el as HTMLInputElement).value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, s1);
  await page.locator("#s2").evaluate((el, v) => {
    (el as HTMLInputElement).value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, s2);
  await page.getByRole("button", { name: /Signaal ontvangen/ }).click();
  if (relay) await completeRelay(page);
}

export async function completeM4(page: Page, rating = 3) {
  const groups = page.locator(".lik");
  const n = await groups.count();
  for (let i = 0; i < n; i++) {
    await groups.nth(i).locator(".dots button").nth(rating - 1).click();
  }
  await page.getByRole("button", { name: "Bereken mijn route" }).click();
}

export async function expectResult(page: Page) {
  await page.getByText(/Je route wijst richting/).waitFor();
  await page.getByRole("heading", { name: "Jouw gesprekskaart" }).waitFor();
}

export async function fillGesprekskaart(page: Page) {
  await page.locator("#note-twijfel").fill("Test twijfel");
  await page.locator("#note-plan").fill("Open dag bezoeken");
}

export async function saveCardImage(page: Page) {
  await page.getByRole("button", { name: "Bewaar als afbeelding" }).click();
  await page.waitForTimeout(800);
}

export async function openWipeAndConfirm(page: Page) {
  await page.getByRole("button", { name: "Wis mijn gegevens" }).first().click();
  await page.getByRole("button", { name: "Ja, wis alles" }).click();
}

export async function fullFlowToResult(
  page: Page,
  m1: M1Pick = "first",
  m3: { s1: number; s2: number } = { s1: 50, s2: 50 },
) {
  await clearAppStorage(page);
  await expectCover(page);
  await startFromCover(page);
  await startModules(page);
  await completeM1(page, m1);
  await completeRelay(page);
  await completeM2(page);
  await completeM3(page, m3.s1, m3.s2);
  await completeM4(page);
  await expectResult(page);
}

export function countLetters(letters: string[]) {
  const c: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, W: 0, C: 0 };
  for (const L of letters) c[L] = (c[L] ?? 0) + 1;
  return c;
}

export async function readRiasecFromStorage(page: Page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const bag = JSON.parse(raw);
    return bag.state?.riasec ?? null;
  }, STORAGE_KEY);
}

export async function rankedRiasecCode(riasec: Record<string, number>) {
  const entries = Object.entries(riasec).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const groups: string[] = [];
  let i = 0;
  while (i < entries.length && i < 3) {
    const score = entries[i][1];
    const g: string[] = [];
    while (i < entries.length && entries[i][1] === score) {
      g.push(entries[i][0]);
      i++;
    }
    groups.push(g.join("/"));
  }
  return groups.join("·");
}
