# Loopbaan GPS — Playwright-tests

Zie ook [../README.md](../README.md) voor de poster-URL.

## Installatie

```bash
npm install
npx playwright install chromium webkit
```

Zorg dat poort **4173** vrij is (geen andere `serve` op die poort).

## Commando's

| Commando | Doel |
|----------|------|
| `npm test` | Volledige suite (incl. 200 aapjes-runs op desktop) |
| `npm run test:quick` | Doorloop A op desktop + iPhone SE (Chromium) |
| `LIVE=1 npx playwright test --project=live` | Live QR-URL (poster) |

Rapport na een run: `tests/RAPPORT.md` (via custom reporter).
