import { test, expect } from "@playwright/test";
import {
  attachQualityGate,
  assertQualityGate,
  assertNoHorizontalScroll,
} from "../helpers/quality-gate.js";
import { fullFlowToResult } from "../helpers/app-flow.js";

test.describe("M · verder kijken op adviesscherm", () => {
  test("volgorde, pdf, scroll, print en export", async ({ page, baseURL }, testInfo) => {
    const origin = baseURL!;
    const gate = attachQualityGate(page, origin);
    await fullFlowToResult(page, "first", { s1: 80, s2: 20 });

    const beroepenHeading = page.getByRole("heading", {
      name: /Beroepen bij jouw sterkste interesses/,
    });
    const verderBlok = page.locator("section.verder-kijken");
    await expect(beroepenHeading).toBeVisible();
    await expect(verderBlok).toBeVisible();

    const order = await page.evaluate(() => {
      const sel = [
        '[data-order-ref="beroepen-kaart"]',
        "section.verder-kijken",
        "section.gesprekskaart",
        "#bewaar-knoppen",
      ];
      return sel.map((s) => {
        const el = document.querySelector(s);
        if (!el) return -1;
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY;
      });
    });
    expect(order[0]).toBeGreaterThan(0);
    expect(order[1]).toBeGreaterThan(order[0]);
    expect(order[2]).toBeGreaterThan(order[1]);
    expect(order[3]).toBeGreaterThan(order[2]);

    const routekaart = page.locator("#routekaart");
    await routekaart.scrollIntoViewIfNeeded();
    const scrollPx = await page.evaluate(() => {
      const rk = document.getElementById("routekaart");
      const vk = document.getElementById("verder-kijken-titel");
      if (!rk || !vk) return -1;
      const rkTop = rk.getBoundingClientRect().top + window.scrollY;
      const vkTop = vk.getBoundingClientRect().top + window.scrollY;
      return Math.round(vkTop - rkTop);
    });
    expect(scrollPx).toBeGreaterThan(0);
    expect(scrollPx).toBeLessThanOrEqual(667 * 2);
    test.info().annotations.push({ type: "scroll-afstand-routekaart-tot-kop", description: String(scrollPx) });

    const pdfBtn = verderBlok.getByRole("link", { name: /Open het overzicht/i });
    await expect(pdfBtn).toHaveAttribute("target", "_blank");
    await expect(pdfBtn).toHaveAttribute("rel", /noopener/);

    const pdfHead = await page.request.head(`${origin}/hbo-opleidingen-sociaal-domein.pdf`);
    expect(pdfHead.status()).toBe(200);

    await expect(verderBlok).toHaveAttribute("data-html2canvas-ignore", "true");

    const exportScope = await page.evaluate(() => {
      const bu = document.getElementById("bewaar-uitvoer");
      const vk = document.querySelector("section.verder-kijken");
      return {
        verderInBewaar: !!(bu && vk && bu.contains(vk)),
        routekaartInBewaar: !!(bu && document.getElementById("routekaart") && bu.contains(document.getElementById("routekaart"))),
      };
    });
    expect(exportScope.verderInBewaar).toBe(false);
    expect(exportScope.routekaartInBewaar).toBe(false);

    await page.emulateMedia({ media: "print" });
    await expect(verderBlok).toBeHidden();
    await page.emulateMedia({ media: "screen" });

    if (!testInfo.project.name.includes("webkit")) {
      await assertNoHorizontalScroll(page);
    }


    assertQualityGate(gate);
  });
});
