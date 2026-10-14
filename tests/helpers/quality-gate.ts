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

const OPTIONAL_OFFLINE_ASSETS = /hbo-opleidingen-sociaal-domein-preview\.webp$/;

export type QualityGateOptions = {
  /** Chromium logt failed fetches bij offline herladen; SW levert alsnog cache. */
  ignoreOfflineResourceConsole?: boolean;
  /** PDF-preview staat niet in SW-precache; lazy op resultaat. */
  ignoreUncachedOptionalAssets?: boolean;
};

export function attachQualityGate(
  page: Page,
  origin: string,
  options: QualityGateOptions = {},
): QualityGate {
  const gate: QualityGate = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    externalUrls: [],
  };

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (
      options.ignoreOfflineResourceConsole &&
      /^Failed to load resource:/.test(text)
    ) {
      return;
    }
    gate.consoleErrors.push(text);
  });
  page.on("pageerror", (err) => gate.pageErrors.push(String(err)));
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (isFontCdn(url)) return;
    if (options.ignoreUncachedOptionalAssets && OPTIONAL_OFFLINE_ASSETS.test(url)) {
      return;
    }
    gate.failedRequests.push(`${url} (${req.failure()?.errorText ?? "failed"})`);
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

export type AssertQualityGateOptions = {
  /** Chromium + setOffline() meldt soms requestfailed terwijl SW cache levert. */
  skipFailedRequests?: boolean;
};

export function assertQualityGate(
  gate: QualityGate,
  options: AssertQualityGateOptions = {},
) {
  if (gate.consoleErrors.length) {
    throw new Error(`console.error:\n${gate.consoleErrors.join("\n")}`);
  }
  if (gate.pageErrors.length) {
    throw new Error(`pageerror:\n${gate.pageErrors.join("\n")}`);
  }
  if (!options.skipFailedRequests && gate.failedRequests.length) {
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
