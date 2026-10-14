import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import fs from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");
const phase = process.argv[2] === "voor" ? "voor" : "na";
const shotDir = path.join(__dirname, "..", "screenshots", "verder-kijken");

const serve = spawn("npx", ["serve", repoRoot, "-l", "4174", "--no-port-switching"], {
  cwd: path.join(__dirname, ".."),
  shell: true,
  stdio: "pipe",
});
const baseURL = "http://127.0.0.1:4174";
for (let i = 0; i < 40; i++) {
  try {
    const r = await fetch(baseURL);
    if (r.ok) break;
  } catch {
    /* retry */
  }
  await new Promise((r) => setTimeout(r, 500));
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(baseURL);
await page.evaluate(() => localStorage.removeItem("loopbaangps:v1"));
await page.reload();
await page.getByRole("button", { name: "Start je route" }).click();
await page.getByRole("button", { name: "Start de route" }).click();
for (let i = 0; i < 15; i++) {
  await page.locator(".choices .choice").first().click();
}
await page.getByRole("button", { name: "Volgende signaal →" }).click();
for (const i of [0, 1, 2]) await page.locator(".chip").nth(i).click();
await page.getByRole("button", { name: /Signaal ontvangen/ }).click();
await page.getByRole("button", { name: "Volgende signaal →" }).click();
await page.locator("#s1").evaluate((el) => {
  el.value = "80";
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.locator("#s2").evaluate((el) => {
  el.value = "20";
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.getByRole("button", { name: /Signaal ontvangen/ }).click();
await page.getByRole("button", { name: "Volgende signaal →" }).click();
const groups = page.locator(".lik");
const n = await groups.count();
for (let i = 0; i < n; i++) await groups.nth(i).locator(".dots button").nth(2).click();
await page.getByRole("button", { name: "Bereken mijn route" }).click();
await page.getByText(/Je route wijst richting/).waitFor();

await fs.mkdir(shotDir, { recursive: true });
await page.setViewportSize({ width: 375, height: 667 });
await page.screenshot({ path: path.join(shotDir, `adviesscherm-375-${phase}.png`), fullPage: true });
await page.setViewportSize({ width: 1280, height: 800 });
await page.screenshot({ path: path.join(shotDir, `adviesscherm-1280-${phase}.png`), fullPage: true });
await browser.close();
serve.kill();
console.log(`Screenshots (${phase}) in ${shotDir}`);
