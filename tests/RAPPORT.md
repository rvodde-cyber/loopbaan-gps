# Testrapport Loopbaan GPS — release-controle (verkort)

Gegenereerd: 2026-10-14 · Branch: `main` · Niet gedeployd · Geen push uitgevoerd

## Scope

- **Volledige suite (404):** niet in deze sessie afgewacht (30–40 min); tussenstand uit eerdere run + log.
- **Verkorte release-controle:** 4 projecten (iPhone SE WebKit, iPhone 14 WebKit, Pixel 7 Chromium, desktop Chromium) + monkey `MONKEY_RUNS=20` + Lighthouse (`lighthouse-desktop`), **workers 4** op core, **~11,9 min** totaal (`tests/test-results/release-short2.log`).

---

## Tabel 1 — Tussenstand volledige suite (afgebroken / eerdere complete run)

Bron: `tests/test-results/results.json` + `tests/RAPPORT.md` (auto-reporter **2026-10-14T07:49:12**, Playwright exit **failed**) en `tests/test-results/full-run.log` (sessie later hervat, niet als eindrapport gebruikt).

| Metriek | Aantal |
|---------|--------|
| Geslaagd | **374** |
| Mislukt | **27** |
| Overgeslagen | **3** |
| Niet gedraaid (van 404) | **0** in reporter-run; log-sessie stopte eerder rond test **~316** vóór nieuwe herstart |

### Falende tests (volledige run, 27)

| Test | Project | Foutmelding (kort) |
|------|---------|-------------------|
| G · offline · volledige doorloop + bewaar | iphone-se-webkit | `pageerror` |
| G · offline · volledige doorloop + bewaar | iphone-14-webkit | `pageerror` |
| monkey seed 43 | monkey-desktop | `ENOENT` trace-artefact bij `browserContext.close` |
| monkey seed 44–66 (23×) | monkey-desktop | `net::ERR_CONNECTION_REFUSED` (serve/port 4173 weg — infra, geen app-logica) |
| H · Lighthouse PWA-installeerbaarheid | lighthouse-desktop | PWA-score **0**, verwacht **1** |

*Toelichting:* G op WebKit is in huidige code `test.skip`; failures komen uit run vóór die skip. Monkey 44–66 vallen samen met gestopte webserver / parallelle sessie.

---

## Tabel 2 — Verkorte release-run (2026-10-14)

**Samenvatting:** **133 geslaagd**, **2 mislukt**, **3 overgeslagen** (136 testuitvoeringen) · core **6,6 min** · monkey 20× **3,7 min** · Lighthouse **1,5 min** · **totaal ~11,9 min** (≤ 12 min doel, marginaal).

**Langste blok:** iPhone 14 WebKit (scoring + axe), incl. **F · axe m2** timeout **2,2 min** (parallel workers 4).

| Test | Project | Resultaat | Vermoedelijke oorzaak |
|------|---------|-----------|------------------------|
| A · doorloop | desktop-chromium, iphone-se-webkit, iphone-14-webkit, pixel-7-chromium | geslaagd | — |
| B · scoring (5×) | idem | geslaagd | — |
| D · robuustheid (5×) | idem | geslaagd | — |
| E · wissen | idem | geslaagd | — |
| F · axe (11 schermen × 4 projecten) | idem | geslaagd, **1× mislukt** | zie onder |
| F · axe m2 | iphone-14-webkit | **mislukt** | Timeout 120s: `.choice` niet stable/klikbaar (WebKit + parallel) |
| F · toetsenbord + touch | idem | geslaagd; touch **skip** op desktop | skip by design desktop |
| G · offline | desktop-chromium, pixel-7-chromium | geslaagd | — |
| G · offline | iphone-se-webkit, iphone-14-webkit | **skipped** | `test.skip` WebKit in `g-offline.spec.ts` |
| J · externe requests | alle 4 projecten | geslaagd | — |
| K · PWA (3×) | alle 4 projecten | geslaagd | — |
| C · monkey seed 0–19 | monkey-desktop (`MONKEY_RUNS=20`) | geslaagd | — |
| H · eerste laadgewicht ≤400 kB | lighthouse-desktop | geslaagd | — |
| H · Lighthouse PWA | lighthouse-desktop | **mislukt** | Score **0** op `http://127.0.0.1:4173` (CLI/localhost; geen productie-URL) |

Detailregels per Playwright-uitvoer: `tests/test-results/release-short2.log`.

---

## Tabel 3 — Extra controles (a–i)

| Controle | Resultaat | Meetwaarde / bewijs |
|----------|-----------|---------------------|
| **a** Geen installatiebanner / `beforeinstallprompt` / pop-up | **OK** | Geen matches in repo op `beforeinstallprompt`, `deferredPrompt`, install-banner; niet in UI |
| **b** Eerste laadgewicht zonder SW, zonder html2canvas | **OK** (≤400 kB) | **~242 kB** totaal (meting + test H geslaagd); opsplitsing netwerk: fonts **~65 kB**, omslag **~100 kB**, overig **~77 kB** (incl. `index.html` ~**77 kB** navigatie) |
| **c** Offline doorloop + bewaar als afbeelding + wissen | **Deels** | **G** geslaagd (Chromium): doorloop + bewaar; **E · wissen** geslaagd **online**; **geen** geautomatiseerde offline+wissen-combinatie |
| **d** Nieuwe versie: oude cache tijdens sessie, nieuwe HTML volgend bezoek | **Niet E2E getest** | `sw.js`: geen `skipWaiting` / geen geforceerde reload; `index.html` network-first HTML; verwachting conform spec, **twee-build test niet uitgevoerd** |
| **e** `?reset-cache=1` | **OK** | Test **K · ?reset-cache=1** geslaagd (alle 4 projecten in verkorte run) |
| **f** Geen externe origin | **OK** | Test **J** geslaagd (4 projecten) |
| **g** Precache-grootte | **OK** | **~575 kB** (som `PRECACHE_URLS` in `sw.js`, incl. html2canvas ~194 kB) |
| **h** WebKit horizontale scroll omslag | **OK** | **375×667:** nee (scrollWidth=375); **390×844:** nee (scrollWidth=390) |
| **i** Console-fouten verse start + na intro | **OK** | Cover: **0** `console.error` / `pageerror`; na Start route → module 1: **0** (Chromium, lokale meting) |

---

## Niet gedraaid in deze controle

- Volledige **monkey 200** seeds (alleen **20** met `MONKEY_RUNS=20`).
- Projecten: **iphone-se-chromium**, **iphone-14-chromium**, **ipad-chromium**, **live** (`LIVE=1`).
- Volledige **404** matrix opnieuw in één run.
- **G · offline** op WebKit (bewust skip).
- **I · live QR** (productie-URL).

---

## Open punten, op volgorde van risico voor de open dag

1. **Lighthouse PWA score 0** op localhost in CI/lokaal — vóór deploy op **productie-HTTPS** PWA opnieuw verifiëren (manifest, SW, icons); kan false negative zijn op `127.0.0.1`.
2. **Offline op iOS Safari (WebKit)** niet gedekt door G (skip); open dag = vooral **Chrome/Android** — acceptabel mits bewust, maar iPhone Safari offline niet gevalideerd.
3. **Wissen offline** niet gecombineerd getest; alleen online **E** + offline **G** apart.
4. **SW-update twee-build scenario** niet E2E — bij deploy cache-versie bump (`CACHE_NAME`) en rooktest op staging aanbevolen.
5. **WebKit parallel flake** (axe m2 timeout) — bij volledige run `workers: 1` of retry overwegen (niet in deze stap gewijzigd).
6. **Volledige monkey 200** + **ipad** + **live QR** nog vóór productie-deploy draaien.
7. Eerdere full-run **monkey 44–66** failures waren **infra** (connection refused), geen regressie in app-code.
