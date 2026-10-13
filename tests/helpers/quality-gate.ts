import type { Page } from "@playwright/test";

export type QualityGate = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  externalUrls: string[];
};

function isFontCdn(url: string) {
  return url.includes("fonts.googleapis.com") || url.includes("fonts.gstatic.com");
}

export function attachQualityGate(page: Page, origin: string): QualityGate {
  const gate: QualityGate = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    externalUrls: [],
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") gate.consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => gate.pageErrors.push(String(err)));
  page.on("requestfailed", (req) => {
    if (isFontCdn(req.url())) return;
    gate.failedRequests.push(`${req.url()} (${req.failure()?.errorText ?? "failed"})`);
  });
  page.on("request", (req) => {
    const url = req.url();
    if (!url.startsWith("http")) return;
    try {
      const u = new URL(url);
      const o = new URL(origin);
      if (u.origin !== o.origin) gate.externalUrls.push(url);
    } catch {
      /* ignore */
    }
  });

  return gate;
}

export function assertQualityGate(gate: QualityGate) {
  if (gate.consoleErrors.length) {
    throw new Error(`console.error:\n${gate.consoleErrors.join("\n")}`);
  }
  if (gate.pageErrors.length) {
    throw new Error(`pageerror:\n${gate.pageErrors.join("\n")}`);
  }
  if (gate.failedRequests.length) {
    throw new Error(`requestfailed:\n${gate.failedRequests.join("\n")}`);
  }
}

export async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
  }));
  if (overflow.sw > overflow.iw + 1) {
    throw new Error(`horizontale scroll: scrollWidth=${overflow.sw} > innerWidth=${overflow.iw}`);
  }
}
