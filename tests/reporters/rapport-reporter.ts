import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";

type Row = {
  test: string;
  project: string;
  resultaat: string;
  oorzaak: string;
  fix: string;
};

class RapportReporter implements Reporter {
  private rows: Row[] = [];
  private started = "";

  onBegin(config: FullConfig) {
    this.started = new Date().toISOString();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const project = test.parent.project()?.name ?? "?";
    const title = test.titlePath().slice(1).join(" › ");
    let resultaat = "geslaagd";
    let oorzaak = "—";
    let fix = "—";

    if (result.status === "skipped" || result.status === "interrupted") {
      resultaat = result.status;
      oorzaak = result.error?.message?.split("\n")[0] ?? "overgeslagen";
    } else if (result.status !== "passed") {
      resultaat = "mislukt";
      oorzaak = result.error?.message?.split("\n")[0] ?? result.status;
      if (/fonts\.googleapis|fonts\.gstatic/i.test(oorzaak) || title.includes("externe")) {
        fix = "Fonts self-hosten of system stack; verwijder Google Fonts uit index.html (prompt 9).";
      } else if (/axe/i.test(oorzaak)) {
        fix = "A11y-issues in index.html oplossen (labels, contrast, structuur).";
      } else if (/Lighthouse|performance|CLS/i.test(oorzaak)) {
        fix = "Preload beperken, html2canvas lazy load, WebP-compressie, fonts lokaal.";
      } else if (/offline/i.test(oorzaak)) {
        fix = "Service worker + offline cache (prompt 9).";
      } else {
        fix = "Zie trace/screenshot in test-results.";
      }
    }

    this.rows.push({ test: title, project, resultaat, oorzaak, fix });
  }

  onEnd(result: FullResult) {
    const out = path.join(process.cwd(), "RAPPORT.md");
    const lines = [
      "# Testrapport Loopbaan GPS",
      "",
      `Gegenereerd: ${this.started} · Playwright exit: ${result.status}`,
      "",
      "| Test | Project | Resultaat | Vermoedelijke oorzaak | Voorgestelde fix |",
      "|------|---------|-----------|------------------------|------------------|",
    ];
    for (const r of this.rows) {
      const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
      lines.push(
        `| ${esc(r.test)} | ${esc(r.project)} | ${esc(r.resultaat)} | ${esc(r.oorzaak)} | ${esc(r.fix)} |`,
      );
    }
    lines.push("");
    fs.writeFileSync(out, lines.join("\n"), "utf8");
  }
}

export default RapportReporter;
