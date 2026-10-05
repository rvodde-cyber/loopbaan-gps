# Kleurcontrast (prompt 3) — tekst op achtergrond

| Combinatie | Oud | Nieuw | Ratio (ca.) |
|------------|-----|-------|-------------|
| `--muted` op `#EFE9DF` / `#FBF8F2` | `#7C766B` | `#5F5A52` | ~4,6:1 (was ~3,9:1) |
| `.btn.ghost` tekst op lichte kaart | `var(--muted)` | `var(--ink)` | ~11:1 |
| `.cover-foot .foot-link` op `#1E3552` | `rgba(241,235,223,.75)` | `#F4ECDD` | ~11:1 |
| `--ink` op `#EFE9DF` | ongewijzigd | — | ~12:1 |
| `--staal-d` op witte kaart (summary) | ongewijzigd | — | ~5,5:1 |
| Witte tekst op `.sig` (modulekleuren) | ongewijzigd | — | ≥4,5:1 |

Grote koppen (Cormorant ≥24px) en UI-randen gebruiken bestaande `--staal` / `--ink` en voldoen aan 3:1 voor niet-tekst.
