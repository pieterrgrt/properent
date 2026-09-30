# Properent

Website voor **Properent**: huurwoningen in en rond Zeeland.

Een eenvoudige, snelle website van gewone HTML-, CSS- en JavaScript-bestanden. Er is geen database, geen WordPress en geen build-stap nodig. De site draait gratis op GitHub Pages, Netlify of Cloudflare Pages.

- Huisstijl (logo, kleuren, lettertype, toon): [`docs/HUISSTIJL.md`](docs/HUISSTIJL.md)
- Sitemap en paginastructuur: [`docs/SITEMAP.md`](docs/SITEMAP.md)

## Structuur

```
index.html        Home
aanbod.html       Woningaanbod met filters
woning.html       Detailpagina (woning.html?id=…)
regio.html        Regio & dekking
faq.html          Veelgestelde vragen
contact.html      Contact + formulier
privacy.html      Privacyverklaring
404.html          Pagina niet gevonden
data/woningen.js  ← HET AANBOD (hier woningen toevoegen/verwijderen)
assets/js/config.js ← CONTACTGEGEVENS (e-mail, telefoon, KvK, adres)
assets/css/style.css  Opmaak
assets/js/main.js     Werking (filters, formulier, enz.)
assets/img/           Logo's, favicon, social-afbeelding
partials/             Header en footer (gedeeld door alle pagina's)
tools/sync-layout.py  Zet header/footer in alle pagina's
sitemap.xml, robots.txt
```

## Bekijken op je eigen computer

Dubbelklik op `index.html`. Dat werkt meteen.

Of start een lokale server (werkt het meest als de echte site):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Dagelijks beheer

### Woning toevoegen, wijzigen of verwijderen

Open `data/woningen.js`. Bovenin staat bij elk veld wat het betekent.

1. Kopieer een bestaand blok `{ … },` en pas de gegevens aan.
2. Geef elke woning een unieke `id` (kleine letters, streepjes, geen spaties).
3. Foto's zet je in `assets/img/woningen/` en je noemt ze bij `fotos`, bijvoorbeeld
   `fotos: ["assets/img/woningen/goes-1.jpg", "assets/img/woningen/goes-2.jpg"]`.
   Liggend formaat, ongeveer 1600 px breed, JPG onder 300 KB.
4. Verhuurd? Zet `status: "verhuurd"` (blijft zichtbaar met filter "Toon ook verhuurd") of verwijder het blok.

> De huidige woningen zijn **voorbeelden** (`voorbeeld: true`, met een label "Voorbeeld"). Vervang of verwijder ze voordat de site live gaat.

### Contactgegevens

Alles staat op één plek: `assets/js/config.js`. Wat je daar invult, verschijnt automatisch in de header, footer en contactpagina. Laat een veld leeg (`""`) om het te verbergen, bijvoorbeeld WhatsApp.

### Header of menu aanpassen

Pas `partials/header.html` of `partials/footer.html` aan en voer uit:

```bash
python3 tools/sync-layout.py
```

## Contactformulier instellen

Zonder instelling opent het formulier een vooringevulde e-mail in het mailprogramma van de bezoeker. Dat werkt, maar een formulierdienst is gebruiksvriendelijker:

1. Maak een gratis account bij bijvoorbeeld [Formspree](https://formspree.io) (tot 50 berichten per maand gratis) en koppel het aan `info@properent.nl`.
2. Maak een formulier aan en kopieer de link (`https://formspree.io/f/…`).
3. Zet die link in `config.js` bij `formEndpoint`.

Berichten komen dan gewoon in de mailbox binnen. Het formulier heeft een onzichtbaar spamfilter (honeypot).

## Online zetten

**GitHub Pages (gratis):** Repository → *Settings* → *Pages* → Source: *Deploy from a branch*, kies `main` en map `/ (root)`. Onder *Custom domain* vul je `www.properent.nl` in.

**Netlify / Cloudflare Pages (gratis):** koppel de repository, laat de build-opdracht leeg en kies als publicatiemap de hoofdmap (`/`).

**Domein:** registreer `properent.nl` bij een registrar en laat de DNS naar de gekozen host wijzen (de host legt uit welke records). Staat de site op een ander domein? Vervang dan `https://www.properent.nl` in `sitemap.xml`, `robots.txt` en de `<head>` van de pagina's.

Na livegang: meld `sitemap.xml` aan in [Google Search Console](https://search.google.com/search-console) en maak een (gratis) Google Bedrijfsprofiel aan als "servicegebied-bedrijf". Dan hoef je geen adres te tonen, alleen het werkgebied.

## Onzichtbaar, maar wel bereikbaar

De site noemt geen namen en toont geen foto's van de eigenaar, en spreekt overal in de wij-vorm. Een paar praktische tips om dat ook buiten de website vol te houden:

| Onderwerp | Advies |
| --- | --- |
| **E-mail** | Gebruik `info@properent.nl` (of een gedeelde mailbox), geen privéadres. Onderteken met "Team Properent". |
| **Telefoon** | Neem een apart zakelijk nummer (tweede simkaart, eSIM of VoIP-nummer), niet het privénummer. Via WhatsApp Business kun je automatische antwoorden en openingstijden instellen. |
| **Adres** | Een zakelijke website moet wettelijk een KvK-nummer en een adres tonen (art. 3:15d BW). Wil je je woonadres niet tonen, gebruik dan een postadres of virtueel kantoor en registreer dat als vestigings- of postadres bij de KvK. Het woonadres van eigenaren is in het Handelsregister standaard afgeschermd, maar een vestigingsadres niet. Laat je adviseren door de KvK. |
| **Domeinnaam** | Bij `.nl`-domeinen van een bedrijf staat de bedrijfsnaam in de openbare WHOIS. Registreer het domein daarom op naam van de onderneming, niet op een privénaam. |
| **Sociale media** | Maak een bedrijfspagina met het beeldmerk (`logo-mark.svg`) als profielfoto, los van privéaccounts. |
| **Bezichtigingen** | Die kunnen worden gedaan door een vaste contactpersoon of een lokale partner. De site belooft alleen "één vast aanspreekpunt", geen specifieke persoon. |

## Nog te doen vóór livegang

- [ ] Echte woningen en foto's in `data/woningen.js` (voorbeelden verwijderen)
- [ ] Contactgegevens, KvK-nummer en adres in `assets/js/config.js`
- [ ] Formulierdienst instellen (`formEndpoint`)
- [ ] Privacyverklaring nalopen en eventueel naam van de formulierdienst toevoegen
- [ ] Domein koppelen en `sitemap.xml` aanmelden bij Google
- [ ] Controleren of de voorwaarden in de FAQ (borg, inkomen, contracten) kloppen met de eigen werkwijze
