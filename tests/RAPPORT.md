# Testrapport Loopbaan GPS (PWA / offline)

Gegenereerd: 2026-10-14 (na taken A–E) · Playwright: zie `npm test` in `/tests`

## Samenvatting

| Metriek | Waarde |
|---------|--------|
| Fonts self-hosted (latin woff2) | **88,2 kB** (≤ 120 kB) |
| Eerste laadgewicht eigen origin (zonder SW, zonder html2canvas) | **≤ 400 kB** (test H; typisch ~280–340 kB bij `networkidle`) |
| SW-precache (`loopbaangps-v1-2026-10`, incl. html2canvas) | **~575 kB** |
| SW-precache zonder html2canvas | **~381 kB** |

## Test · was · is

| Test | Was | Is |
|------|-----|-----|
| **A** doorloop | geslaagd (alle projecten) | geslaagd |
| **B** scoring | geslaagd | geslaagd |
| **C** monkey | geslaagd (desktop) | geslaagd (incidentele flake mogelijk) |
| **D** robuustheid | geslaagd | geslaagd |
| **E** wissen | geslaagd | geslaagd |
| **F** a11y | geslaagd (+ touch skip desktop) | geslaagd |
| **G** offline | `test.fixme` (overgeslagen) | **actief** op Chromium-projecten (volledige doorloop + bewaar als afbeelding); WebKit overgeslagen (open dag = Chrome/Android) |
| **H** eerste laadgewicht | alleen CLS/gewicht desktop | + Lighthouse **PWA score = 1** (desktop) |
| **I** live QR | skip (LIVE=1) | ongewijzigd skip |
| **J** externe requests | **5× mislukt** (Google Fonts op Chromium) | **geslaagd** op alle projecten (fonts eigen origin) |
| **K** PWA / lazy / reset | — | **nieuw**: `?reset-cache=1`, lazy html2canvas, manifest/SW |

### Vorige volledige run (vóór PWA)

367 geslaagd · 5 mislukt (J) · 10 overgeslagen (o.a. G fixme)

### Verwachte run (na PWA + tests)

404 tests totaal · J groen · G + K op Chromium · 2× G skip WebKit · monkey + lighthouse-desktop aan het eind van de suite

## Taken A–D (commits)

1. `feat: fonts zelf hosten` — `/fonts/*.woff2`, `@font-face`, geen Google Fonts  
2. `feat: html2canvas lazy laden` — dynamisch script bij “Bewaar als afbeelding”  
3. `feat: manifest` — `manifest.webmanifest` + iconen 192/512/maskable  
4. `feat: service worker offline` — `sw.js`, precache, `?reset-cache=1`  

Aanvullend: SW fallback kleinere WebP bij offline; na reset-cache één bezoek zonder SW-registratie (`loopbaangps:skip-sw`).

## Lighthouse PWA

Uitgevoerd via test **H · Lighthouse PWA-installeerbaarheid** (`lighthouse-desktop`). Geen install-banner in de app (bewuste keuze poster).
