/*
 * Properent – woningaanbod
 * ------------------------
 * Elke woning is één blok tussen { }. Kopieer een blok om een woning toe te
 * voegen, of verwijder een blok als de woning verhuurd is.
 *
 * Velden:
 *   id            unieke korte naam, zonder spaties (wordt gebruikt in de link)
 *   titel         korte omschrijving
 *   plaats        plaatsnaam
 *   regio         Walcheren | Zuid-Beveland | Noord-Beveland |
 *                 Schouwen-Duiveland | Tholen | Zeeuws-Vlaanderen | Omliggend
 *   type          Appartement | Eengezinswoning | Studio | Bovenwoning | ...
 *   huur          kale huur per maand in euro's (getal)
 *   servicekosten servicekosten per maand (getal, 0 als niet van toepassing)
 *   borg          borg in euro's (getal)
 *   oppervlakte   woonoppervlakte in m² (getal)
 *   kamers        totaal aantal kamers (getal)
 *   slaapkamers   aantal slaapkamers (getal)
 *   energielabel  A t/m G
 *   beschikbaar   datum als "2026-11-01", of "direct"
 *   status        "beschikbaar" | "onder optie" | "verhuurd"
 *   interieur     "kaal" | "gestoffeerd" | "gemeubileerd"
 *   kenmerken     lijst met korte kenmerken
 *   voorwaarden   lijst met huurvoorwaarden
 *   omschrijving  langere tekst (alinea's scheiden met \n\n)
 *   fotos         lijst met afbeeldingspaden, bijv. "assets/img/woningen/goes-1.jpg"
 *                 (leeg = er wordt een nette illustratie getoond)
 *   voorbeeld     true = dit is voorbeeldaanbod (toont een label). Verwijder
 *                 dit veld of zet op false voor echte woningen.
 */
window.WONINGEN = [
  {
    id: "middelburg-appartement-balkengracht",
    titel: "Licht appartement aan het water",
    plaats: "Middelburg",
    regio: "Walcheren",
    type: "Appartement",
    huur: 1150,
    servicekosten: 65,
    borg: 2300,
    oppervlakte: 74,
    kamers: 3,
    slaapkamers: 2,
    energielabel: "A",
    beschikbaar: "2026-11-01",
    status: "beschikbaar",
    interieur: "gestoffeerd",
    kenmerken: ["Balkon op het zuiden", "Lift", "Berging", "Nabij centrum en station"],
    voorwaarden: ["Bruto inkomen minimaal 3× de huur", "Geen huisdieren", "Niet roken"],
    omschrijving:
      "Ruim en licht driekamerappartement op loopafstand van de binnenstad en het station van Middelburg. De woonkamer heeft grote ramen en toegang tot een zonnig balkon.\n\nDe open keuken is voorzien van inbouwapparatuur. Het appartement wordt gestoffeerd opgeleverd met vloeren en raambekleding.",
    fotos: [],
    voorbeeld: true,
  },
  {
    id: "goes-eengezinswoning-oostzijde",
    titel: "Eengezinswoning met tuin",
    plaats: "Goes",
    regio: "Zuid-Beveland",
    type: "Eengezinswoning",
    huur: 1395,
    servicekosten: 0,
    borg: 2790,
    oppervlakte: 112,
    kamers: 5,
    slaapkamers: 3,
    energielabel: "B",
    beschikbaar: "direct",
    status: "beschikbaar",
    interieur: "kaal",
    kenmerken: ["Achtertuin met schuur", "Parkeren voor de deur", "Scholen in de buurt", "Zolder als 4e slaapkamer"],
    voorwaarden: ["Bruto inkomen minimaal 3× de huur", "Huisdieren in overleg", "Minimale huurperiode 12 maanden"],
    omschrijving:
      "Goed onderhouden tussenwoning in een rustige, kindvriendelijke wijk van Goes. Scholen, winkels en de A58 liggen op korte afstand.\n\nBeneden een doorzonwoonkamer en een dichte keuken; boven drie slaapkamers en een badkamer met douche. De vaste trap naar de zolder biedt ruimte voor een extra kamer.",
    fotos: [],
    voorbeeld: true,
  },
  {
    id: "vlissingen-studio-boulevard",
    titel: "Studio vlak bij de boulevard",
    plaats: "Vlissingen",
    regio: "Walcheren",
    type: "Studio",
    huur: 795,
    servicekosten: 45,
    borg: 1590,
    oppervlakte: 34,
    kamers: 1,
    slaapkamers: 1,
    energielabel: "C",
    beschikbaar: "2026-10-15",
    status: "onder optie",
    interieur: "gemeubileerd",
    kenmerken: ["Gemeubileerd", "Eigen keuken en badkamer", "Fietsenstalling", "Zee op 3 minuten lopen"],
    voorwaarden: ["Bruto inkomen minimaal 3× de huur", "Geschikt voor 1 persoon", "Niet roken"],
    omschrijving:
      "Compacte, volledig ingerichte studio op een paar minuten van de boulevard en de hogescholen in Vlissingen. Ideaal voor een starter of iemand die tijdelijk in Zeeland werkt.",
    fotos: [],
    voorbeeld: true,
  },
  {
    id: "zierikzee-bovenwoning-havenpark",
    titel: "Karakteristieke bovenwoning",
    plaats: "Zierikzee",
    regio: "Schouwen-Duiveland",
    type: "Bovenwoning",
    huur: 975,
    servicekosten: 0,
    borg: 1950,
    oppervlakte: 68,
    kamers: 3,
    slaapkamers: 2,
    energielabel: "C",
    beschikbaar: "2026-12-01",
    status: "beschikbaar",
    interieur: "gestoffeerd",
    kenmerken: ["Historische binnenstad", "Eigen opgang", "Dakterras", "Gerenoveerde badkamer"],
    voorwaarden: ["Bruto inkomen minimaal 3× de huur", "Geen huisdieren"],
    omschrijving:
      "Sfeervolle bovenwoning met eigen opgang in de historische binnenstad van Zierikzee. De woning is recent gerenoveerd en heeft een dakterras met uitzicht over de daken.",
    fotos: [],
    voorbeeld: true,
  },
  {
    id: "terneuzen-appartement-centrum",
    titel: "Nieuwbouwappartement in het centrum",
    plaats: "Terneuzen",
    regio: "Zeeuws-Vlaanderen",
    type: "Appartement",
    huur: 1075,
    servicekosten: 55,
    borg: 2150,
    oppervlakte: 70,
    kamers: 3,
    slaapkamers: 2,
    energielabel: "A",
    beschikbaar: "direct",
    status: "beschikbaar",
    interieur: "gestoffeerd",
    kenmerken: ["Nieuwbouw", "Vloerverwarming", "Eigen parkeerplaats", "Lift"],
    voorwaarden: ["Bruto inkomen minimaal 3× de huur", "Niet roken"],
    omschrijving:
      "Modern en energiezuinig appartement in het centrum van Terneuzen, met een eigen parkeerplaats in de afgesloten garage.",
    fotos: [],
    voorbeeld: true,
  },
  {
    id: "bergen-op-zoom-benedenwoning",
    titel: "Benedenwoning met stadstuin",
    plaats: "Bergen op Zoom",
    regio: "Omliggend",
    type: "Benedenwoning",
    huur: 1025,
    servicekosten: 0,
    borg: 2050,
    oppervlakte: 72,
    kamers: 3,
    slaapkamers: 2,
    energielabel: "B",
    beschikbaar: "2026-11-15",
    status: "verhuurd",
    interieur: "kaal",
    kenmerken: ["Stadstuin", "Nabij station", "Eigen voordeur"],
    voorwaarden: ["Bruto inkomen minimaal 3× de huur"],
    omschrijving:
      "Benedenwoning met eigen voordeur en stadstuin, op korte afstand van het station en het centrum van Bergen op Zoom.",
    fotos: [],
    voorbeeld: true,
  },
];
