-- ============================================================================
-- Properent – database voor de beheeromgeving
-- ----------------------------------------------------------------------------
-- Uitvoeren in Supabase: Dashboard → SQL Editor → New query → plak dit
-- bestand → Run. Veilig om opnieuw uit te voeren.
--
-- Beveiliging in het kort:
--   * Bezoekers (rol "anon") mogen alléén gepubliceerde woningen lezen en een
--     aanvraag insturen. Ze kunnen aanvragen niet teruglezen.
--   * Alleen gebruikers in de tabel "beheerders" mogen alles zien en wijzigen.
--   * Documenten (ID, loonstroken, contracten) staan in een PRIVÉ bucket.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Beheerders
-- ---------------------------------------------------------------------------
create table if not exists public.beheerders (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.beheerders enable row level security;

create or replace function public.is_beheerder()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.beheerders where user_id = auth.uid());
$$;
revoke all on function public.is_beheerder() from public;
grant execute on function public.is_beheerder() to anon, authenticated;

drop policy if exists "beheerders lezen eigen rij" on public.beheerders;
create policy "beheerders lezen eigen rij" on public.beheerders
  for select to authenticated using (user_id = auth.uid());

-- Automatisch updated_at bijwerken
create or replace function public.zet_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Woningen
-- ---------------------------------------------------------------------------
create table if not exists public.woningen (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titel         text not null,
  plaats        text not null,
  regio         text not null check (regio in ('Walcheren','Zuid-Beveland','Noord-Beveland','Schouwen-Duiveland','Tholen','Zeeuws-Vlaanderen','Omliggend')),
  type          text not null default 'Appartement',
  huur          numeric(10,2) not null check (huur >= 0),
  servicekosten numeric(10,2) not null default 0 check (servicekosten >= 0),
  borg          numeric(10,2) not null default 0 check (borg >= 0),
  oppervlakte   integer check (oppervlakte > 0),
  kamers        integer check (kamers >= 0),
  slaapkamers   integer check (slaapkamers >= 0),
  energielabel  text check (energielabel in ('A++++','A+++','A++','A+','A','B','C','D','E','F','G')),
  beschikbaar   date,                                   -- leeg = direct
  status        text not null default 'beschikbaar' check (status in ('beschikbaar','onder optie','verhuurd')),
  interieur     text not null default 'kaal' check (interieur in ('kaal','gestoffeerd','gemeubileerd')),
  kenmerken     text[] not null default '{}',
  voorwaarden   text[] not null default '{}',
  omschrijving  text not null default '',
  fotos         text[] not null default '{}',
  gepubliceerd  boolean not null default false,
  voorbeeld     boolean not null default false,        -- toont label "Voorbeeld"
  volgorde      integer not null default 0,
  -- Interne velden: NIET zichtbaar voor bezoekers (zie kolomrechten onder)
  adres         text,
  notities      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.woningen add column if not exists voorbeeld boolean not null default false;

drop trigger if exists woningen_updated on public.woningen;
create trigger woningen_updated before update on public.woningen
  for each row execute function public.zet_updated_at();
alter table public.woningen enable row level security;

drop policy if exists "publiek leest gepubliceerde woningen" on public.woningen;
create policy "publiek leest gepubliceerde woningen" on public.woningen
  for select to anon, authenticated using (gepubliceerd or public.is_beheerder());
drop policy if exists "beheer woningen" on public.woningen;
create policy "beheer woningen" on public.woningen
  for all to authenticated using (public.is_beheerder()) with check (public.is_beheerder());

-- Bezoekers mogen alleen de publieke kolommen lezen (dus niet adres/notities)
revoke all on public.woningen from anon;
grant select (id, slug, titel, plaats, regio, type, huur, servicekosten, borg, oppervlakte,
              kamers, slaapkamers, energielabel, beschikbaar, status, interieur, kenmerken,
              voorwaarden, omschrijving, fotos, voorbeeld, volgorde, created_at)
  on public.woningen to anon;
grant select, insert, update, delete on public.woningen to authenticated;

-- ---------------------------------------------------------------------------
-- Aanvragen (via het contactformulier)
-- ---------------------------------------------------------------------------
create table if not exists public.aanvragen (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  onderwerp    text not null default 'overig' check (onderwerp in ('interesse','zoekprofiel','verhuren','huurder','overig')),
  woning_id    uuid references public.woningen (id) on delete set null,
  woning_label text,
  naam         text not null check (length(naam) between 1 and 200),
  email        text not null check (length(email) between 3 and 320),
  telefoon     text check (length(telefoon) <= 50),
  personen     text check (length(personen) <= 20),
  inkomen      text check (length(inkomen) <= 50),
  ingangsdatum date,
  bericht      text not null default '' check (length(bericht) <= 5000),
  status       text not null default 'nieuw' check (status in ('nieuw','in behandeling','bezichtiging','afgewezen','huurder','gearchiveerd')),
  notities     text
);
drop trigger if exists aanvragen_updated on public.aanvragen;
create trigger aanvragen_updated before update on public.aanvragen
  for each row execute function public.zet_updated_at();
create index if not exists aanvragen_status_idx on public.aanvragen (status, created_at desc);
alter table public.aanvragen enable row level security;

drop policy if exists "publiek stuurt aanvraag in" on public.aanvragen;
create policy "publiek stuurt aanvraag in" on public.aanvragen
  for insert to anon, authenticated with check (status = 'nieuw' and notities is null);
drop policy if exists "beheer aanvragen" on public.aanvragen;
create policy "beheer aanvragen" on public.aanvragen
  for all to authenticated using (public.is_beheerder()) with check (public.is_beheerder());

revoke all on public.aanvragen from anon;
grant insert (onderwerp, woning_id, woning_label, naam, email, telefoon, personen, inkomen,
              ingangsdatum, bericht) on public.aanvragen to anon;
grant select, insert, update, delete on public.aanvragen to authenticated;

-- ---------------------------------------------------------------------------
-- Huurders & contracten (alleen beheer)
-- ---------------------------------------------------------------------------
create table if not exists public.huurders (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  woning_id      uuid references public.woningen (id) on delete set null,
  aanvraag_id    uuid references public.aanvragen (id) on delete set null,
  naam           text not null,
  email          text,
  telefoon       text,
  ingangsdatum   date,
  einddatum      date,
  contract_type  text not null default 'onbepaalde tijd' check (contract_type in ('onbepaalde tijd','bepaalde tijd')),
  huur           numeric(10,2),
  servicekosten  numeric(10,2) not null default 0,
  borg           numeric(10,2) not null default 0,
  borg_ontvangen boolean not null default false,
  status         text not null default 'actief' check (status in ('actief','opgezegd','beëindigd')),
  notities       text
);
drop trigger if exists huurders_updated on public.huurders;
create trigger huurders_updated before update on public.huurders
  for each row execute function public.zet_updated_at();
alter table public.huurders enable row level security;
drop policy if exists "beheer huurders" on public.huurders;
create policy "beheer huurders" on public.huurders
  for all to authenticated using (public.is_beheerder()) with check (public.is_beheerder());
revoke all on public.huurders from anon;
grant select, insert, update, delete on public.huurders to authenticated;

-- ---------------------------------------------------------------------------
-- Documenten (metadata; de bestanden zelf staan in de privé-bucket)
-- ---------------------------------------------------------------------------
create table if not exists public.documenten (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  huurder_id  uuid references public.huurders (id) on delete cascade,
  aanvraag_id uuid references public.aanvragen (id) on delete cascade,
  naam        text not null,
  pad         text not null unique
);
alter table public.documenten enable row level security;
drop policy if exists "beheer documenten" on public.documenten;
create policy "beheer documenten" on public.documenten
  for all to authenticated using (public.is_beheerder()) with check (public.is_beheerder());
revoke all on public.documenten from anon;
grant select, insert, update, delete on public.documenten to authenticated;

-- ---------------------------------------------------------------------------
-- Opslag: "fotos" is publiek (woningfoto's), "documenten" is privé.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true), ('documenten', 'documenten', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "beheer fotos" on storage.objects;
create policy "beheer fotos" on storage.objects
  for all to authenticated
  using (bucket_id = 'fotos' and public.is_beheerder())
  with check (bucket_id = 'fotos' and public.is_beheerder());

drop policy if exists "beheer documenten" on storage.objects;
create policy "beheer documenten" on storage.objects
  for all to authenticated
  using (bucket_id = 'documenten' and public.is_beheerder())
  with check (bucket_id = 'documenten' and public.is_beheerder());

-- ---------------------------------------------------------------------------
-- LAATSTE STAP (eenmalig, handmatig):
-- 1. Authentication → Users → "Add user" → e-mail + wachtwoord van de beheerder.
-- 2. Voer daarna uit (met het juiste e-mailadres):
--
--   insert into public.beheerders (user_id)
--   select id from auth.users where email = 'info@properent.nl'
--   on conflict do nothing;
-- ---------------------------------------------------------------------------
