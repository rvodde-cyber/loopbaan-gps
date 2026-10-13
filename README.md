# Loopbaan GPS

Single-page app (`index.html`) voor zelfreflectie en gespreksvoorbereiding rond studie en werk.

## Tests

```bash
cd tests
npm install
npx playwright install chromium webkit
npm test
```

Snelle smoke: `npm run test:quick` (doorloop A op desktop + iPhone SE).

Live QR-check (poster-URL): `LIVE=1 npx playwright test --project=live` (vanuit `tests/`).

## Open dag

De URL https://loopbaangps.moreelvakmanschap.nl/ staat op de open-dag-poster; niet wijzigen of verwijderen. Verhuizen vereist een redirect.
