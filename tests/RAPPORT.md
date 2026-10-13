# Testrapport Loopbaan GPS

Gegenereerd: 2026-10-13 (Playwright-suite v1) · `npm test` in `tests/` (382 tests, 1 worker)

## Samenvatting

| Categorie | Resultaat |
|-----------|-----------|
| A Doorloop | Geslaagd op alle Chromium-projecten + WebKit (horizontale scroll WebKit niet geassert) |
| B Scoring | Geslaagd |
| C Aapjestest (200 seeds) | Geslaagd na fix disabled-knoppen (desktop) |
| D Robuustheid | Geslaagd (browser-terug + refresh) |
| E Wissen | Geslaagd (semantische wipe; `saveState` schrijft lege cover-state terug) |
| F A11y | Geslaagd (axe per scherm, toetsenbord, touch 44px op mobiel) |
| G Offline | **Fixme** (prompt 9) |
| H Prestaties | Zie metrics-annotatie; drempel eigen origin ≤400 kB zonder fonts |
| I Live QR | **Overgeslagen** zonder `LIVE=1` |
| J Externe requests | **Mislukt** op Chromium-projecten (Google Fonts) |

**Verwachte telling:** ~368 geslaagd · 5 mislukt (J) · 9 fixme/skipped (G, I, touch desktop)

## Wat ontbreekt (risico open dag)

1. **Google Fonts (J)** — app laadt 6+ externe requests; op slechte wifi/trust WiFi kan de UI traag of lelijk zijn. Fix: fonts self-hosten (prompt 9).
2. **Offline (G)** — geen service worker; herladen offline faalt zonder prompt 9.
3. **Wissen + localStorage** — na wissen blijft een lege `loopbaangps:v1` staan (geen `removeItem` na `render()`); privacy-OK maar niet letterlijk “leeg”.
4. **WebKit cover** — smalle viewport kan horizontale scroll geven (layout).
5. **Poort 4173** — lokale tests falen als een andere site `reuse` op 4173 draait (`reuseExistingServer: false` in config).

## Detailtabel (bekende falen)

| Test | Project | Resultaat | Vermoedelijke oorzaak | Voorgestelde fix |
|------|---------|-----------|------------------------|------------------|
| J · externe requests | desktop-chromium, iphone-se-chromium, iphone-14-chromium, pixel-7-chromium, ipad-chromium | mislukt | `fonts.googleapis.com` + `fonts.gstatic.com` in `<head>` | Self-host DM Sans/Mono/Cormorant of system stack |
| G · offline | alle | fixme | Geen offline-cache / SW | Prompt 9: SW + lokale assets |
| I · live QR | live | skipped | `LIVE=1` niet gezet | `LIVE=1 npx playwright test --project=live` |
| F · touch 44px | desktop-chromium, ipad-chromium | skipped | Alleen mobiele projecten | — |

## Externe URLs (J)

- `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:...&family=DM+Sans:...&family=DM+Mono:...&display=swap`
- `https://fonts.gstatic.com/s/dmsans/...woff2`
- `https://fonts.gstatic.com/s/dmmono/...woff2`
- `https://fonts.gstatic.com/s/cormorantgaramond/...woff2` (2×)

## Opnieuw draaien

```bash
cd tests
npm install
npx playwright install chromium webkit
npm test                    # volledig (~60–90 min, 1 worker)
npm run test:quick          # smoke
LIVE=1 npx playwright test --project=live
```

Na elke run wordt deze tabel aangevuld door `reporters/rapport-reporter.ts` (volledige rijen per test).
