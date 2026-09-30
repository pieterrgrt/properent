# Properent – sitemap en paginastructuur

```
Home (index.html)
├── Aanbod (aanbod.html)
│   └── Woning-detail (woning.html?id=…)  ──► Contact met woning vooringevuld
├── Regio & dekking (regio.html)
├── FAQ (faq.html)
│   ├── Huren via Properent
│   ├── Documenten (#documenten)
│   ├── Bezichtiging & contract
│   └── Kosten & borg
├── Contact (contact.html)
│   ├── ?onderwerp=interesse   (Interesse melden)
│   └── ?onderwerp=zoekprofiel (Zoekprofiel doorgeven)
├── Privacyverklaring (privacy.html)   – in de footer
└── 404 (404.html)                     – niet in het menu
```

Hoofdmenu: **Home · Aanbod · Regio · FAQ · Contact** + knop **Interesse melden**.

## Per pagina

| Pagina | Doel | Inhoud |
| --- | --- | --- |
| **Home** | In 5 seconden duidelijk maken wat Properent is en de bezoeker naar het aanbod leiden | Hero met snelzoeken, "Waarom Properent?" (4 punten), 3 uitgelichte woningen, "Zo werkt het" (3 stappen), oproep om zoekprofiel door te geven |
| **Aanbod** | Woningen vinden | Filters (regio, plaats, max. huur, slaapkamers), sorteren, woningkaarten met status (beschikbaar / onder optie / verhuurd) |
| **Woning** | Alle informatie om te beslissen | Foto's, prijs, servicekosten, borg, m², kamers, energielabel, beschikbaarheid, kenmerken, voorwaarden, knop "Ik heb interesse" |
| **Regio** | Laten zien waar Properent actief is | Schematische kaart, 6 Zeeuwse regio's + omliggende plaatsen met kernen |
| **FAQ** | Vragen vooraf beantwoorden (minder mails) | 4 thema's, uitklapbare vragen |
| **Contact** | Eén plek voor alle contact | E-mail, telefoon, (optioneel) WhatsApp, bereikbaarheid, formulier met onderwerpkeuze |
| **Privacy** | Wettelijk verplicht (AVG) omdat er persoonsgegevens worden verzameld | Welke gegevens, waarom, hoe lang, rechten |

## Belangrijkste routes voor een bezoeker

1. Home → Aanbod → Woning → Ik heb interesse → Contactformulier (woning al ingevuld)
2. Home → snelzoeken → Aanbod (gefilterd)
3. Aanbod leeg / niets passends → Zoekprofiel doorgeven
4. Twijfel → FAQ → Contact

`sitemap.xml` in de hoofdmap is de versie voor zoekmachines (Google Search Console).
