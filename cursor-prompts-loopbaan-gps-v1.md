# Loopbaan GPS — Cursor-prompts op weg naar versie 1.0

Stand 05-10-2026 · live op `loopbaangps.moreelvakmanschap.nl` (GitHub Pages, repo `rvodde-cyber/loopbaan-gps`)

## Werkwijze

- Voer de prompts **één voor één** uit, in deze volgorde. Per prompt: testen → commit → push.
- Commitberichten: `feat: omslag`, `feat: opslag op apparaat + wisknop`, `fix: navigatie en toegankelijkheid`, `feat: gesprekskaart`.
- Zet vóór prompt 1 het bestand **`omslag-art.svg`** in de repo-root, naast `index.html`.
- Werkt iets niet zoals beschreven? Plak het verslag van Cursor hier terug, dan beoordeel ik het.

---

## Prompt 1 — Omslag

```
Context: Loopbaan GPS, single-file index.html (vanilla JS, state-object S, schermen
als secties). In de repo-root staat omslag-art.svg (illustratie, viewBox 600×800,
preserveAspectRatio xMidYMid slice, alle id's met prefix cv-).

Taak: voeg een omslagscherm #cover toe vóór het bestaande introscherm.

Opbouw
- Neem de inhoud van omslag-art.svg INLINE op (geen <img>), zodat er geen extra
  request is. Behoud de <title> voor schermlezers.
- Tekst als HTML, nooit in de SVG:
  - kicker (DM Mono, klein, kapitalen, letterspatiëring): "Loopbaan GPS"
  - titel (Cormorant Garamond, groot): "Vind jouw route"
  - ondertitel (DM Sans): "Ontdek in vier korte stappen wat bij je past —
    en neem je uitkomst mee naar het gesprek met je mentor, decaan of ouders."
  - vier stippen met labels in de modulekleuren: Interesses · Werkwaarden ·
    Werkomgeving · Competenties
  - primaire knop "Start je route" → toont het bestaande introscherm
  - klein: "± 15 minuten · je antwoorden blijven op dit apparaat"
- Achtergrond van het tekstvlak: #1E3552, tekst in de crèmekleur van de app.

Layout
- Mobiel: illustratie boven (58vh), tekst eronder.
- ≥900px: twee kolommen, illustratie links (volle hoogte), tekst rechts,
  verticaal gecentreerd. min-height: 100vh (gebruik 100dvh waar ondersteund).

Gedrag
- Alleen tonen bij een verse start. Wordt opgeslagen state hersteld, sla de
  omslag over en ga direct naar het opgeslagen scherm.
- Verbergen bij print (@media print) en bij html2canvas (data-html2canvas-ignore).
- Respecteer prefers-reduced-motion: geen animaties als dat aanstaat; anders
  mag de stippellijn één keer subtiel intekenen (stroke-dashoffset, ≤1,5s).
- Focus na klikken op "Start je route" op de kop van het introscherm.

Niet wijzigen: introscherm-inhoud, modules 1–4, scoring, GROUPS, twijfelhulp,
blok "Verder kijken".

Test: verse start toont omslag → knop gaat naar intro → refresh midden in de
test slaat omslag over → mobiel en desktop correct → print zonder omslag.
```

---

## Prompt 2 — Opslag op het apparaat, wisknop en privacy

```
Context: Loopbaan GPS slaat state S nu op in sessionStorage. Doelgroep:
scholieren die zich voorbereiden op een gesprek. Afspraak: gegevens blijven
ALLEEN op het apparaat van de gebruiker; geen server, geen cookies, geen tracking.

Taak A — opslag
- Stap over op localStorage, sleutel "loopbaangps:v1". Sla op:
  { version: 1, savedAt: ISO-datum, state: S }.
- Eenmalige migratie: staat er nog state in sessionStorage, neem die over en
  verwijder hem daar.
- Automatisch wissen: is savedAt ouder dan 90 dagen, verwijder de data bij het
  laden en start vers.
- Alle storage-aanroepen in try/catch; als storage niet beschikbaar is
  (privévenster), werkt de app gewoon zonder opslag.

Taak B — wisknop
- Knop "Wis mijn gegevens" op het introscherm, op het adviesscherm (bij
  "Opnieuw beginnen") en in de footer.
- Bevestiging via een eigen dialoog in de app (geen window.confirm):
  "Weet je het zeker? Je antwoorden en notities op dit apparaat worden
  verwijderd." Knoppen: "Ja, wis alles" / "Annuleren".
- Na wissen: localStorage-sleutel weg, S terug naar beginwaarden, naar de omslag,
  korte melding "Je gegevens zijn gewist." in een aria-live-regio.

Taak C — vertrouwen (taalniveau B1)
- Vervang de huidige privacyregel op het introscherm door:
  "Je antwoorden blijven op dit apparaat. We sturen niets naar een server,
  gebruiken geen cookies en volgen je niet. Werk je op een computer van school
  of van iemand anders? Klik dan aan het eind op 'Wis mijn gegevens'."
- Voeg op het introscherm toe (kleiner, onder de privacyregel):
  "Loopbaan GPS helpt je nadenken over wat bij je past en je voorbereiden op een
  gesprek. Het is geen psychologische test en het zegt niet wat je moet kiezen.
  Jij beslist."
- Footer op elk scherm met link "Over deze app" naar een eenvoudig scherm
  #over met:
  - Waarvoor: hulpmiddel voor zelfreflectie en gespreksvoorbereiding.
  - Hoe het advies werkt: interesses volgens het RIASEC-model van Holland
    (1997), gecombineerd met werkwaarden, werkomgeving en competenties.
    Uitkomsten laten zien wat je relatief belangrijker vindt, geen score
    ten opzichte van anderen.
  - Privacy: dezelfde tekst als hierboven + "Gegevens worden na 90 dagen
    automatisch gewist."
  - Colofon: "Ontwikkeld door [NAAM] · Moreel Vakmanschap · versie 1.0"
  - Bron: Holland, J. L. (1997). Making vocational choices: A theory of
    vocational personalities and work environments (3rd ed.). Psychological
    Assessment Resources.
  - Knop "Terug" naar het scherm waar de gebruiker vandaan kwam.

Niet wijzigen: scoring, vragen, GROUPS, twijfelhulp, omslag-ontwerp.

Test: test half invullen → tabblad sluiten → heropenen → voortgang terug →
wissen → alles leeg en omslag zichtbaar → privévenster werkt zonder fouten →
savedAt handmatig op 100 dagen terug zetten → bij laden gewist.
```

---

## Prompt 3 — Navigatie, toegankelijkheid en techniek

```
Context: Loopbaan GPS, single-file index.html. Doel: WCAG 2.1 AA en robuust
gedrag op mobiel.

Taak A — browser-terugknop
- Gebruik history.pushState bij elke schermwissel ({screen, step}) en een
  popstate-handler die het juiste scherm toont.
- Belangrijk: terug binnen module 1 MOET via de bestaande m1back()-logica lopen
  (die trekt de eerder gekozen score af). Dubbel tellen mag nooit voorkomen.
  Hetzelfde geldt voor andere modules met een eigen terugfunctie.
- Terug vanaf het eerste scherm verlaat gewoon de site.

Taak B — schermlezers en focus
- Eén aria-live="polite"-regio die bij elke schermwissel meldt:
  "[Module/schermnaam], stap X van Y".
- Na elke schermwissel focus op de h1/h2 van het nieuwe scherm (tabindex="-1").
- Alle knoppen bereikbaar en bedienbaar met toetsenbord; zichtbare
  :focus-visible-stijl overal.
- Keuzeknoppen in de vragenlijsten: aria-pressed of radiogroep-semantiek.

Taak C — kleurcontrast
- Toets alle combinaties van tekst- en achtergrondkleuren uit de CSS-variabelen:
  minimaal 4,5:1 voor gewone tekst, 3:1 voor grote tekst (≥24px of ≥18,66px vet)
  en voor UI-randen/iconen.
- Pas alleen tinten aan die tekort schieten (donkerder/lichter binnen dezelfde
  kleurfamilie). Geef in je verslag een tabel: combinatie · oude ratio ·
  nieuwe kleur · nieuwe ratio.

Taak D — techniek en delen
- html2canvas niet meer van een CDN: zet html2canvas.min.js (v1.4.1) in
  /vendor/ en verwijs relatief.
- Favicon: SVG-favicon van de locatiepin (terra #C2704C met crème stip),
  plus apple-touch-icon 180×180 PNG.
- <head>: <html lang="nl">, title "Loopbaan GPS — vind jouw route",
  meta description "Ontdek in vier korte stappen welke opleidingen en beroepen
  bij je passen en bereid je voor op het gesprek met je mentor of decaan.
  Je antwoorden blijven op je eigen apparaat.",
  og:title, og:description, og:url https://loopbaangps.moreelvakmanschap.nl/,
  og:locale nl_NL, theme-color #1E3552.

Niet wijzigen: inhoud van vragen en adviezen, scoring, opslaglogica.

Test: mobiel de browser-terugknop door alle modules (scores kloppen daarna
nog) → alleen toetsenbord door de hele test → schermlezer (VoiceOver/NVDA)
meldt schermwissels → Lighthouse toegankelijkheid ≥ 95 → "bewaar als
afbeelding" werkt met de lokale html2canvas (netwerktab: geen CDN-request).
```

---

## Prompt 4 — Gesprekskaart

```
Context: Loopbaan GPS is bedoeld om scholieren voor te bereiden op een gesprek
met mentor, decaan of ouders. Opslag via localStorage (sleutel loopbaangps:v1).

Taak: voeg op het adviesscherm, direct NA het advies en VÓÓR de bewaarknoppen,
een sectie "Jouw gesprekskaart" toe.

Inhoud (B1, jij-vorm)
- Intro: "Neem dit mee naar je gesprek. Jij bepaalt wat je deelt."
- Automatisch ingevuld uit de bestaande state:
  - "Mijn drie letters: [top-3 RIASEC] — [korte typering per letter]"
  - "Wat ik belangrijk vind in werk: [top-3 werkwaarden uit module 2]"
  - "Beroepengroepen die bij mij lijken te passen: [top-2 uit GROUPS]"
- Vier gespreksvragen (vast):
  1. "Herken jij deze drie letters in mij? Waar zie je dat aan?"
  2. "Welke van deze beroepengroepen past volgens jou bij mij, en welke niet?"
  3. "Hoe kan ik uitzoeken of een opleiding past bij wat ik belangrijk vind?"
  4. "Ken jij iemand die dit werk doet en met wie ik kan praten?"
- Twee invulvelden (textarea, max 400 tekens, teller zichtbaar):
  - "Waar twijfel ik nog over?"
  - "Wat ga ik de komende maand doen? (bijv. open dag, meeloopdag,
    gesprek met een student)"
  Inhoud opslaan in S.notes en dus in localStorage; wordt meegewist met
  "Wis mijn gegevens".

Vormgeving
- Kaart in de app-stijl (crème, rand --line, kaartschaduw), bovenaan een smalle
  band in de vier modulekleuren.
- Het blok MOET meekomen in "Bewaar je routekaart als afbeelding" en in de
  PDF/print; textarea's tonen in print/afbeelding als gewone tekst (geen
  invoerveld-randen, lege velden als stippellijnen om met de hand in te vullen).

Niet wijzigen: scoring, advies, blok "Verder kijken", opslagsleutel.

Test: advies → kaart toont juiste letters/werkwaarden/beroepengroepen →
notities typen → refresh → notities nog daar → afbeelding en PDF bevatten de
kaart → wissen verwijdert ook de notities.
```

---

## Daarna — samen uitdenken, nog niet in Cursor

1. **Productbrief (1 A4)** — doel, doelgroep, gebruiksmoment (zelfstandig vóór het gesprek), wat de app wel en niet belooft, definitie van "klaar" voor versie 1.0.
2. **Inhoudelijke deugdelijkheid**
   - Adviesteksten relatief formuleren, want forced-choice levert ipsatieve scores op (Meade, 2004).
   - Genderstereotiep advies tegengaan: toon ook een minder voor de hand liggende route (Su et al., 2009).
   - `GROUPS` en opleidingsdata laten beoordelen door twee à drie decanen.
   - Twijfelhulp en pdf-overzicht op elkaar afstemmen; mbo- en wo-laag toevoegen.
3. **Technisch fundament** — inhoud naar JSON, Vite, tests voor de scoring, GitHub Actions. Pas doen ná prompts 1–4, zodat er een stabiele basis is om te herstructureren.
4. **Pilot** — 20–30 scholieren en twee decanen, kort evaluatieformulier, dan versie 1.0.

## Literatuur

Holland, J. L. (1997). *Making vocational choices: A theory of vocational personalities and work environments* (3rd ed.). Psychological Assessment Resources.

Meade, A. W. (2004). Psychometric problems and issues involving forced-choice, ipsative instruments. *Journal of Occupational and Organizational Psychology, 77*(4), 531–551. https://doi.org/10.1348/0963179042596504

Su, R., Rounds, J., & Armstrong, P. I. (2009). Men and things, women and people: A meta-analysis of sex differences in interests. *Psychological Bulletin, 135*(6), 859–884. https://doi.org/10.1037/a0017364

W3C. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/
