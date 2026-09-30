# Beheeromgeving (administratie)

Via **www.properent.nl/beheer/** log je in op de administratie. Daar kun je:

- **Woningen** toevoegen, wijzigen, foto’s uploaden, online of offline zetten en op *verhuurd* zetten. Het interne adres en de notities zijn niet zichtbaar op de website.
- **Aanvragen** bekijken die via het contactformulier binnenkomen, met status (nieuw → in behandeling → bezichtiging → huurder / afgewezen) en notities.
- **Huurders en contracten** bijhouden: welke huurder in welke woning, ingangs- en einddatum, huur, servicekosten, borg (ontvangen ja/nee) en documenten zoals het huurcontract. Documenten zijn privé.
- Een **overzicht** zien met nieuwe aanvragen, contracten die binnenkort eindigen, openstaande borgen en oude aanvragen die weg moeten (privacy).
- Alles **exporteren naar Excel** (CSV), bijvoorbeeld voor de boekhouder of als back-up.

De gegevens staan in **Supabase**, een online database met een gratis abonnement en servers in de EU. De website blijft gewoon statisch. Supabase regelt het inloggen en de beveiliging.

---

## Eenmalig instellen (± 20 minuten)

### 1. Supabase-project aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak een account aan, bij voorkeur met het zakelijke e-mailadres.
2. Klik **New project**:
   - Naam: `properent`
   - Database password: laat genereren en bewaar het in een wachtwoordmanager.
   - Region: kies een regio in de EU, bijvoorbeeld **Central EU (Frankfurt)**.
   - Plan: **Free**.

### 2. Database klaarzetten

1. Open in het project **SQL Editor** → **New query**.
2. Plak de volledige inhoud van [`supabase/schema.sql`](../supabase/schema.sql) en klik **Run**.
3. Wil je de voorbeeldwoningen in de database? Doe hetzelfde met [`supabase/voorbeelddata.sql`](../supabase/voorbeelddata.sql). Ze hebben het label "Voorbeeld" en zijn later in het beheer te verwijderen.

### 3. Inloggen beveiligen

1. **Authentication → Sign In / Providers → Email**: zet **Allow new users to sign up** *uit*. Zo kan niemand zelf een account aanmaken.
2. **Authentication → URL Configuration → Site URL**: `https://www.properent.nl/beheer/`. Dit is nodig voor de link "Wachtwoord vergeten".
3. **Authentication → Users → Add user → Create new user**: vul het e-mailadres en een sterk wachtwoord in (minstens 12 tekens) en vink **Auto Confirm User** aan.
4. Maak deze gebruiker beheerder. Ga terug naar de **SQL Editor** en voer uit (met het juiste e-mailadres):

   ```sql
   insert into public.beheerders (user_id)
   select id from auth.users where email = 'info@properent.nl'
   on conflict do nothing;
   ```

   Een tweede beheerder (bijvoorbeeld een helper) voeg je op dezelfde manier toe. Een account zonder deze stap kan inloggen, maar ziet niets.

### 4. Website koppelen

1. **Project Settings → API**: kopieer de **Project URL** en de **anon public** key.
2. Zet ze in `assets/js/config.js`:

   ```js
   supabaseUrl: "https://abcdefgh.supabase.co",
   supabaseAnonKey: "eyJhbGciOi…",
   ```

   De *anon* key mag openbaar zijn: de database laat bezoekers alleen gepubliceerde woningen lezen en aanvragen insturen. Gebruik **nooit** de `service_role` key in de website.
3. Zet de site online (zie README). Ga naar `/beheer/` en log in.

Vanaf nu:

- komen de woningen op de website uit de database. `data/woningen.js` dient alleen nog als terugval als de database even onbereikbaar is.
- komen aanvragen van het contactformulier in **Beheer → Aanvragen** terecht.

### 5. (Aanbevolen) E-mail bij een nieuwe aanvraag

De database stuurt zelf geen e-mail. Wil je bij elke nieuwe aanvraag een melding in je mailbox? Vul dan ook `formEndpoint` in `config.js` in (Formspree, zie README). Het formulier slaat de aanvraag dan op in de database én stuurt een e-mail.

---

## Goed om te weten

- **Gratis abonnement.** Ruim voldoende: 500 MB database en 1 GB aan foto’s en documenten. Een gratis project wordt wel *gepauzeerd* na 7 dagen zonder activiteit. Bezoekers van de website tellen als activiteit. Word je toch een keer gepauzeerd, dan klik je in het Supabase-dashboard op *Restore*.
- **Back-ups.** Het gratis abonnement maakt geen back-ups die je zelf kunt terugzetten. Exporteer daarom bijvoorbeeld maandelijks de drie lijsten via **Exporteer (CSV)** en bewaar ze op een veilige plek. Wil je automatische dagelijkse back-ups, dan kan het Pro-abonnement (± $25 per maand).
- **Privacy (AVG).**
  - Aanvragen bewaren we volgens de privacyverklaring maximaal 12 maanden. Het overzicht waarschuwt als er oudere zijn en verwijdert ze met één klik.
  - Documenten van kandidaten die geen huurder worden: verwijder ze binnen 4 weken.
  - Huurdersgegevens bewaar je zolang het contract loopt. Financiële gegevens moet je 7 jaar bewaren; zet een huurder daarom op *beëindigd* in plaats van te verwijderen.
  - Sluit met Supabase een verwerkersovereenkomst (DPA) af. Die vraag je aan via de organisatie-instellingen in het Supabase-dashboard.
- **Huurbetalingen** zitten er (nog) niet in. Dat kan later als uitbreiding.
- **Wachtwoord vergeten.** Klik op het inlogscherm op *Wachtwoord vergeten?*. Je ontvangt dan een e-mail met een link.

## Technische opbouw

| Onderdeel | Bestand |
| --- | --- |
| Database, beveiliging (RLS) en opslag | `supabase/schema.sql` |
| Voorbeeldwoningen | `supabase/voorbeelddata.sql` |
| Beheerpagina | `beheer/index.html`, `beheer/beheer.js`, `beheer/beheer.css` |
| Koppeling publieke site | `assets/js/main.js` (leest woningen via de REST-API, schrijft aanvragen) |

Beveiliging wordt in de database afgedwongen, niet in de browser:

- Bezoekers (`anon`) kunnen alleen gepubliceerde woningen lezen, en daarvan alleen de publieke kolommen (dus niet `adres` of `notities`).
- Bezoekers kunnen aanvragen alleen insturen, niet teruglezen.
- Alleen gebruikers in de tabel `beheerders` kunnen alles lezen en wijzigen.
- De bucket `documenten` is privé. Bestanden openen gaat via een link die 2 minuten geldig is.
