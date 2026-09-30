/* Properent – beheeromgeving
 * Woningen, aanvragen en huurders beheren. Data staat in Supabase
 * (zie supabase/schema.sql); toegang wordt afgedwongen door de database.
 */
(function () {
  "use strict";

  var CFG = window.PROPERENT || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function toon(id) {
    ["scherm-login", "scherm-setup", "scherm-app"].forEach(function (s) { $("#" + s).hidden = s !== id; });
  }

  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !window.supabase) { toon("scherm-setup"); return; }

  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  var S = { woningen: [], aanvragen: [], huurders: [], filter: { aanvragen: "open", huurders: "actief" }, zoek: "" };

  /* ---------- Hulpjes ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 2, minimumFractionDigits: 0 });
  function geld(n) { return n == null || n === "" ? "–" : euro.format(+n); }
  function dag(d) { return d ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "–"; }
  function klasse(s) { return String(s || "").toLowerCase().replace(/\s+/g, "-"); }
  function pill(s) { return '<span class="pill ' + klasse(s) + '">' + esc(s) + "</span>"; }
  function slugify(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  }
  function bestandsnaam(n) {
    var d = n.lastIndexOf(".");
    var ext = d > 0 ? n.slice(d).toLowerCase().replace(/[^.a-z0-9]/g, "") : "";
    return Date.now() + "-" + (slugify(d > 0 ? n.slice(0, d) : n) || "bestand") + ext;
  }
  function dagenTot(d) { return d ? Math.round((new Date(d + "T12:00:00") - new Date()) / 864e5) : null; }
  function woning(id) { return S.woningen.find(function (w) { return w.id === id; }); }

  var toastTimer;
  function melding(tekst, fout) {
    var t = $("#toast");
    t.textContent = tekst;
    t.className = "toast zichtbaar" + (fout ? " fout" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast" + (fout ? " fout" : ""); }, fout ? 6000 : 2800);
  }
  function check(res) {
    if (res && res.error) throw res.error;
    return res ? res.data : null;
  }
  function fout(e) {
    console.error(e);
    melding("Er ging iets mis: " + (e && e.message ? e.message : e), true);
  }

  // Leest een formulier uit naar een object. data-type="getal|datum|lijst|bool" stuurt de conversie.
  function formWaarden(form) {
    var o = {};
    $$("[name]", form).forEach(function (el) {
      if (el.type === "file" || el.name.charAt(0) === "_") return;
      var t = el.getAttribute("data-type");
      var v = el.type === "checkbox" ? el.checked : el.value.trim();
      if (t === "getal") v = v === "" ? null : Number(String(v).replace(",", "."));
      else if (t === "datum") v = v || null;
      else if (t === "lijst") v = v.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
      else if (t === "leeg-null") v = v || null;
      o[el.name] = v;
    });
    return o;
  }

  function veld(label, html, cls) { return '<div class="field' + (cls ? " " + cls : "") + '"><label>' + label + "</label>" + html + "</div>"; }
  function input(name, val, extra) { return '<input name="' + name + '" value="' + esc(val == null ? "" : val) + '" ' + (extra || "") + ">"; }
  function select(name, opties, val, extra) {
    return '<select name="' + name + '" ' + (extra || "") + ">" + opties.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(val == null ? "" : val) ? " selected" : "") + ">" + esc(l) + "</option>";
    }).join("") + "</select>";
  }
  function textarea(name, val, extra) { return '<textarea name="' + name + '" ' + (extra || "") + ">" + esc(val || "") + "</textarea>"; }

  var dlg = $("#dlg");
  function openDialoog(titel, body, voet, opSubmit) {
    dlg.innerHTML =
      '<form method="dialog" novalidate>' +
      '<div class="dlg-kop"><h2>' + esc(titel) + '</h2><button class="dlg-sluit" type="button" aria-label="Sluiten">×</button></div>' +
      '<div class="dlg-body">' + body + "</div>" +
      '<div class="dlg-voet">' + voet + "</div></form>";
    var form = $("form", dlg);
    $(".dlg-sluit", dlg).addEventListener("click", function () { dlg.close(); });
    $$("[data-sluit]", dlg).forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var knop = $('button[type="submit"]', form);
      if (knop) knop.disabled = true;
      Promise.resolve(opSubmit(form))
        .catch(fout)
        .finally(function () { if (knop) knop.disabled = false; });
    });
    if (!dlg.open) dlg.showModal();
    return form;
  }

  function csv(naam, rijen, kolommen) {
    var q = function (v) { v = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v); return '"' + v.replace(/"/g, '""') + '"'; };
    var tekst = [kolommen.map(q).join(";")].concat(rijen.map(function (r) { return kolommen.map(function (k) { return q(r[k]); }).join(";"); })).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + tekst], { type: "text/csv;charset=utf-8" }));
    a.download = naam + "-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  /* ---------- Inloggen ---------- */
  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var st = $("#login-status"); st.className = "form-status";
    var f = e.target;
    sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.wachtwoord.value })
      .then(function (r) {
        if (r.error) { st.className = "form-status err"; st.textContent = "Inloggen mislukt. Controleer e-mailadres en wachtwoord."; }
      });
  });
  $("#ww-vergeten").addEventListener("click", function (e) {
    e.preventDefault();
    var email = $("#l-email").value.trim();
    var st = $("#login-status");
    if (!email) { st.className = "form-status err"; st.textContent = "Vul eerst je e-mailadres in."; return; }
    sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0] }).then(function () {
      st.className = "form-status ok"; st.textContent = "Als dit adres bekend is, ontvang je een e-mail om je wachtwoord opnieuw in te stellen.";
    });
  });
  $("#uitloggen").addEventListener("click", function () { sb.auth.signOut(); });

  var gestart = false;
  sb.auth.onAuthStateChange(function (event, sessie) {
    if (event === "PASSWORD_RECOVERY") {
      var nieuw = prompt("Kies een nieuw wachtwoord (minimaal 10 tekens):");
      if (nieuw && nieuw.length >= 10) sb.auth.updateUser({ password: nieuw }).then(function (r) { melding(r.error ? "Wachtwoord wijzigen mislukt" : "Wachtwoord gewijzigd", !!r.error); });
    }
    if (!sessie) { gestart = false; toon("scherm-login"); return; }
    if (gestart) return;
    gestart = true;
    sb.rpc("is_beheerder").then(function (r) {
      if (r.error || !r.data) {
        sb.auth.signOut();
        var st = $("#login-status"); st.className = "form-status err";
        st.textContent = "Dit account heeft geen beheerrechten.";
        return;
      }
      toon("scherm-app");
      laadAlles().then(route);
    });
  });

  /* ---------- Data ---------- */
  function laadAlles() {
    $("#view").innerHTML = '<p class="laden">Gegevens laden…</p>';
    return Promise.all([
      sb.from("woningen").select("*").order("volgorde", { ascending: true }).order("created_at", { ascending: false }),
      sb.from("aanvragen").select("*").order("created_at", { ascending: false }),
      sb.from("huurders").select("*").order("created_at", { ascending: false }),
    ]).then(function (r) {
      S.woningen = check(r[0]) || [];
      S.aanvragen = check(r[1]) || [];
      S.huurders = check(r[2]) || [];
      var n = S.aanvragen.filter(function (a) { return a.status === "nieuw"; }).length;
      var t = $("#teller-nieuw"); t.hidden = !n; t.textContent = n;
    }).catch(fout);
  }

  /* ---------- Routing ---------- */
  var VIEWS = { overzicht: overzicht, woningen: woningenView, aanvragen: aanvragenView, huurders: huurdersView };
  function route() {
    var naam = (location.hash || "#overzicht").slice(1);
    if (!VIEWS[naam]) naam = "overzicht";
    $$(".admin-tabs a").forEach(function (a) {
      if (a.getAttribute("href") === "#" + naam) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    S.zoek = "";
    VIEWS[naam]();
  }
  window.addEventListener("hashchange", function () { if (gestart) route(); });

  function herlaad() { return laadAlles().then(route); }

  /* ---------- Overzicht ---------- */
  function overzicht() {
    var nieuw = S.aanvragen.filter(function (a) { return a.status === "nieuw"; });
    var online = S.woningen.filter(function (w) { return w.gepubliceerd && w.status !== "verhuurd"; });
    var actief = S.huurders.filter(function (h) { return h.status !== "beëindigd"; });
    var aflopend = actief.filter(function (h) { var d = dagenTot(h.einddatum); return d != null && d <= 90; });
    var jaarGeleden = new Date(); jaarGeleden.setFullYear(jaarGeleden.getFullYear() - 1);
    var oud = S.aanvragen.filter(function (a) { return a.status !== "huurder" && new Date(a.created_at) < jaarGeleden; });
    var borgOpen = actief.filter(function (h) { return +h.borg > 0 && !h.borg_ontvangen; });

    var lijst = function (rijen, leeg) {
      return rijen.length ? '<div class="tabel-wrap"><table class="tabel"><tbody>' + rijen.join("") + "</tbody></table></div>" : '<p class="muted">' + leeg + "</p>";
    };

    $("#view").innerHTML =
      '<div class="view-head"><h1>Overzicht</h1></div>' +
      '<div class="stats">' +
      '<a class="stat' + (nieuw.length ? " let-op" : "") + '" href="#aanvragen"><b>' + nieuw.length + "</b><span>Nieuwe aanvragen</span></a>" +
      '<a class="stat" href="#woningen"><b>' + online.length + "</b><span>Woningen online</span></a>" +
      '<a class="stat" href="#huurders"><b>' + actief.length + "</b><span>Lopende huurcontracten</span></a>" +
      '<a class="stat' + (aflopend.length ? " let-op" : "") + '" href="#huurders"><b>' + aflopend.length + "</b><span>Contracten eindigen binnen 90 dagen</span></a>" +
      "</div>" +
      '<div class="paneel"><h2>Nieuwe aanvragen</h2>' +
      lijst(nieuw.slice(0, 8).map(function (a) {
        return '<tr data-aanvraag="' + a.id + '"><td>' + esc(a.naam) + '<span class="sub">' + esc(a.email) + "</span></td><td>" + esc(a.woning_label || a.onderwerp) + '</td><td class="num">' + dag(a.created_at) + "</td></tr>";
      }), "Geen nieuwe aanvragen.") + "</div>" +
      (borgOpen.length ? '<div class="paneel"><h2>Borg nog niet ontvangen</h2>' + lijst(borgOpen.map(function (h) {
        return '<tr data-huurder="' + h.id + '"><td>' + esc(h.naam) + "</td><td>" + esc((woning(h.woning_id) || {}).titel || "–") + '</td><td class="num">' + geld(h.borg) + "</td></tr>";
      }), "") + "</div>" : "") +
      (oud.length ? '<div class="paneel" style="border-color:var(--sand)"><h2>Privacy: ' + oud.length + " aanvraag/aanvragen ouder dan 12 maanden</h2>" +
        '<p class="muted">Volgens de privacyverklaring bewaren we aanvragen maximaal 12 maanden. Verwijder deze aanvragen.</p>' +
        '<button class="btn btn-danger btn-sm" id="oud-weg" type="button">Verwijder ' + oud.length + " oude aanvragen</button></div>" : "");

    $$("[data-aanvraag]").forEach(function (tr) { tr.addEventListener("click", function () { aanvraagDialoog(tr.getAttribute("data-aanvraag")); }); });
    $$("[data-huurder]").forEach(function (tr) { tr.addEventListener("click", function () { huurderDialoog(tr.getAttribute("data-huurder")); }); });
    var weg = $("#oud-weg");
    if (weg) weg.addEventListener("click", function () {
      if (!confirm("Weet je zeker dat je " + oud.length + " oude aanvragen definitief wilt verwijderen?")) return;
      sb.from("aanvragen").delete().in("id", oud.map(function (a) { return a.id; })).then(check)
        .then(function () { melding("Oude aanvragen verwijderd"); return herlaad(); }).catch(fout);
    });
  }

  /* ---------- Woningen ---------- */
  var REGIO = ["Walcheren", "Zuid-Beveland", "Noord-Beveland", "Schouwen-Duiveland", "Tholen", "Zeeuws-Vlaanderen", "Omliggend"];
  var TYPES = ["Appartement", "Eengezinswoning", "Studio", "Bovenwoning", "Benedenwoning", "Twee-onder-een-kap", "Vrijstaand", "Kamer"];
  var LABELS = ["", "A++++", "A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G"];

  function woningenView() {
    var zoek = S.zoek.toLowerCase();
    var rijen = S.woningen.filter(function (w) { return !zoek || (w.titel + " " + w.plaats + " " + (w.adres || "")).toLowerCase().indexOf(zoek) > -1; });
    $("#view").innerHTML =
      '<div class="view-head"><h1>Woningen</h1><div class="acties">' +
      '<button class="btn btn-ghost btn-sm" id="exp" type="button">Exporteer (CSV)</button>' +
      '<button class="btn btn-primary btn-sm" id="nieuw" type="button">+ Nieuwe woning</button></div></div>' +
      '<div class="filterbalk"><input type="search" id="zoek" placeholder="Zoek op titel, plaats of adres" value="' + esc(S.zoek) + '"></div>' +
      '<div class="tabel-wrap"><table class="tabel"><thead><tr><th>Woning</th><th>Status</th><th>Online</th><th class="num">Huur</th><th>Beschikbaar</th></tr></thead><tbody>' +
      (rijen.length ? rijen.map(function (w) {
        var foto = (w.fotos || [])[0];
        return '<tr data-id="' + w.id + '"><td><div class="rij-titel"><div class="thumb">' + (foto ? '<img src="' + esc(foto) + '" alt="">' : "") + "</div><div>" +
          esc(w.titel) + (w.voorbeeld ? ' <span class="pill demo">Voorbeeld</span>' : "") + '<span class="sub">' + esc(w.plaats) + (w.adres ? " · " + esc(w.adres) : "") + "</span></div></div></td>" +
          "<td>" + pill(w.status) + "</td><td>" + (w.gepubliceerd ? '<span class="pill online">Online</span>' : '<span class="pill">Concept</span>') + "</td>" +
          '<td class="num">' + geld(w.huur) + "</td><td>" + (w.beschikbaar ? dag(w.beschikbaar) : "Direct") + "</td></tr>";
      }).join("") : '<tr><td class="leeg" colspan="5">Nog geen woningen. Klik op “Nieuwe woning”.</td></tr>') +
      "</tbody></table></div>";

    $("#nieuw").addEventListener("click", function () { woningDialoog(null); });
    $("#exp").addEventListener("click", function () {
      csv("woningen", S.woningen, ["titel", "plaats", "adres", "regio", "type", "status", "gepubliceerd", "huur", "servicekosten", "borg", "oppervlakte", "kamers", "slaapkamers", "energielabel", "beschikbaar", "notities"]);
    });
    zoekveld(woningenView);
    $$("tr[data-id]").forEach(function (tr) { tr.addEventListener("click", function () { woningDialoog(tr.getAttribute("data-id")); }); });
  }

  function zoekveld(view) {
    var z = $("#zoek");
    z.addEventListener("input", function () {
      S.zoek = z.value; var pos = z.selectionStart; view();
      var n = $("#zoek"); n.focus(); n.setSelectionRange(pos, pos);
    });
  }

  function woningDialoog(id) {
    var w = id ? woning(id) : { status: "beschikbaar", interieur: "kaal", type: "Appartement", regio: "Walcheren", servicekosten: 0, borg: null, kenmerken: [], voorwaarden: [], fotos: [], gepubliceerd: false, volgorde: 0 };
    var fotos = (w.fotos || []).slice();

    var body =
      "<h3>Basis</h3>" +
      '<div class="form-grid">' +
      veld("Titel *", input("titel", w.titel, 'required maxlength="120" placeholder="Bijv. Licht appartement aan het water"'), "full") +
      veld("Plaats *", input("plaats", w.plaats, "required")) +
      veld("Regio *", select("regio", REGIO, w.regio)) +
      veld("Type", select("type", TYPES.indexOf(w.type) > -1 || !w.type ? TYPES : TYPES.concat([w.type]), w.type)) +
      veld("Adres (intern, niet online)", input("adres", w.adres, 'data-type="leeg-null" placeholder="Straat + huisnummer"')) +
      "</div>" +
      "<h3>Prijs en details</h3>" +
      '<div class="form-grid drie">' +
      veld("Kale huur p/m *", input("huur", w.huur, 'data-type="getal" type="number" min="0" step="0.01" required')) +
      veld("Servicekosten p/m", input("servicekosten", w.servicekosten, 'data-type="getal" type="number" min="0" step="0.01"')) +
      veld("Borg", input("borg", w.borg, 'data-type="getal" type="number" min="0" step="0.01" placeholder="Max. 2× kale huur"')) +
      veld("Woonoppervlakte (m²)", input("oppervlakte", w.oppervlakte, 'data-type="getal" type="number" min="1"')) +
      veld("Kamers", input("kamers", w.kamers, 'data-type="getal" type="number" min="0"')) +
      veld("Slaapkamers", input("slaapkamers", w.slaapkamers, 'data-type="getal" type="number" min="0"')) +
      veld("Energielabel", select("energielabel", LABELS.map(function (l) { return [l, l || "–"]; }), w.energielabel || "", 'data-type="leeg-null"')) +
      veld("Beschikbaar per", input("beschikbaar", w.beschikbaar, 'data-type="datum" type="date"') + '<span class="hint">Leeg = direct</span>') +
      veld("Oplevering", select("interieur", ["kaal", "gestoffeerd", "gemeubileerd"], w.interieur)) +
      "</div>" +
      "<h3>Tekst</h3>" +
      '<div class="form-grid">' +
      veld("Omschrijving", textarea("omschrijving", w.omschrijving, 'rows="6" placeholder="Laat een witregel tussen alinea\'s"'), "full") +
      veld("Kenmerken <span class=\"hint\">(één per regel)</span>", textarea("kenmerken", (w.kenmerken || []).join("\n"), 'data-type="lijst" rows="4"')) +
      veld("Voorwaarden <span class=\"hint\">(één per regel)</span>", textarea("voorwaarden", (w.voorwaarden || []).join("\n"), 'data-type="lijst" rows="4"')) +
      "</div>" +
      "<h3>Foto’s</h3>" +
      '<div class="fotos" id="fotos"></div>' +
      '<label class="btn btn-ghost btn-sm upload">+ Foto’s toevoegen<input type="file" name="_fotos" accept="image/*" multiple></label>' +
      '<p class="hint muted" style="font-size:.85rem">Liggend formaat, liefst ± 1600 px breed. De eerste foto is de hoofdfoto.</p>' +
      "<h3>Publicatie</h3>" +
      '<div class="form-grid">' +
      veld("Status", select("status", ["beschikbaar", "onder optie", "verhuurd"], w.status)) +
      veld("Volgorde <span class=\"hint\">(laag = bovenaan)</span>", input("volgorde", w.volgorde, 'data-type="getal" type="number"')) +
      veld("Webadres (slug)", input("slug", w.slug, 'pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="wordt automatisch gemaakt"') + '<span class="hint">properent.nl/woning.html?id=…</span>', "full") +
      '<div class="check-rij full">' +
      '<label class="check"><input type="checkbox" name="gepubliceerd"' + (w.gepubliceerd ? " checked" : "") + "> Online zichtbaar op de website</label>" +
      '<label class="check"><input type="checkbox" name="voorbeeld"' + (w.voorbeeld ? " checked" : "") + "> Voorbeeldwoning (toont label)</label>" +
      "</div>" +
      veld("Interne notities", textarea("notities", w.notities, 'data-type="leeg-null" rows="3" placeholder="Alleen zichtbaar in beheer"'), "full") +
      "</div>";

    var voet =
      (id ? '<button class="btn btn-danger btn-sm links" type="button" id="w-weg">Verwijderen</button>' +
        (w.slug ? '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="../woning.html?id=' + encodeURIComponent(w.slug) + '">Bekijk online ↗</a>' : "") : "") +
      '<button class="btn btn-ghost btn-sm" type="button" data-sluit>Annuleren</button>' +
      '<button class="btn btn-primary btn-sm" type="submit">Opslaan</button>';

    var form = openDialoog(id ? "Woning bewerken" : "Nieuwe woning", body, voet, function (f) {
      var v = formWaarden(f);
      v.fotos = fotos;
      ["servicekosten", "borg", "volgorde"].forEach(function (k) { if (v[k] == null) v[k] = 0; });
      if (!v.slug) v.slug = slugify(v.titel + "-" + v.plaats);
      var q = id ? sb.from("woningen").update(v).eq("id", id) : sb.from("woningen").insert(v);
      return q.then(check).then(function () {
        dlg.close(); melding("Woning opgeslagen"); return herlaad();
      }).catch(function (e) {
        if (e && e.code === "23505") melding("Dit webadres (slug) bestaat al. Kies een ander.", true); else throw e;
      });
    });

    function tekenFotos() {
      $("#fotos", form).innerHTML = fotos.map(function (u, i) {
        return '<div class="foto"><img src="' + esc(u) + '" alt=""><div class="knoppen">' +
          (i ? '<button type="button" data-links="' + i + '" title="Naar voren">←</button>' : "") +
          '<button type="button" data-weg="' + i + '" title="Verwijderen">✕</button></div></div>';
      }).join("");
      $$("[data-weg]", form).forEach(function (b) { b.addEventListener("click", function () { fotos.splice(+b.getAttribute("data-weg"), 1); tekenFotos(); }); });
      $$("[data-links]", form).forEach(function (b) {
        b.addEventListener("click", function () { var i = +b.getAttribute("data-links"); fotos.splice(i - 1, 0, fotos.splice(i, 1)[0]); tekenFotos(); });
      });
    }
    tekenFotos();

    form.elements._fotos.addEventListener("change", function (e) {
      var files = Array.prototype.slice.call(e.target.files);
      if (!files.length) return;
      var map = slugify(form.elements.slug.value || form.elements.titel.value || "woning") || "woning";
      melding("Foto’s uploaden…");
      Promise.all(files.map(function (file) {
        var pad = map + "/" + bestandsnaam(file.name);
        return sb.storage.from("fotos").upload(pad, file, { cacheControl: "31536000", upsert: false }).then(check).then(function () {
          return sb.storage.from("fotos").getPublicUrl(pad).data.publicUrl;
        });
      })).then(function (urls) {
        fotos = fotos.concat(urls); tekenFotos(); e.target.value = "";
        melding(urls.length + " foto(’s) toegevoegd. Vergeet niet op te slaan.");
      }).catch(fout);
    });

    var weg = $("#w-weg", form);
    if (weg) weg.addEventListener("click", function () {
      if (!confirm("Woning “" + w.titel + "” definitief verwijderen? Tip: zet hem liever op ‘verhuurd’ of haal hem offline.")) return;
      sb.from("woningen").delete().eq("id", id).then(check).then(function () { dlg.close(); melding("Woning verwijderd"); return herlaad(); }).catch(fout);
    });
  }

  /* ---------- Aanvragen ---------- */
  var A_STATUS = ["nieuw", "in behandeling", "bezichtiging", "afgewezen", "huurder", "gearchiveerd"];
  var ONDERWERP = { interesse: "Interesse in woning", zoekprofiel: "Zoekprofiel", verhuren: "Wil verhuren", huurder: "Vraag van huurder", overig: "Overig" };

  function aanvragenView() {
    var f = S.filter.aanvragen, zoek = S.zoek.toLowerCase();
    var open = function (a) { return ["nieuw", "in behandeling", "bezichtiging"].indexOf(a.status) > -1; };
    var rijen = S.aanvragen.filter(function (a) {
      if (f === "open" && !open(a)) return false;
      if (f !== "open" && f !== "alle" && a.status !== f) return false;
      return !zoek || (a.naam + " " + a.email + " " + (a.woning_label || "") + " " + (a.bericht || "")).toLowerCase().indexOf(zoek) > -1;
    });
    var chips = [["open", "Open"]].concat(A_STATUS.map(function (s) { return [s, s.charAt(0).toUpperCase() + s.slice(1)]; })).concat([["alle", "Alle"]]);
    $("#view").innerHTML =
      '<div class="view-head"><h1>Aanvragen</h1><div class="acties"><button class="btn btn-ghost btn-sm" id="exp" type="button">Exporteer (CSV)</button></div></div>' +
      '<div class="filterbalk">' + chips.map(function (c) {
        var n = c[0] === "open" ? S.aanvragen.filter(open).length : c[0] === "alle" ? S.aanvragen.length : S.aanvragen.filter(function (a) { return a.status === c[0]; }).length;
        return '<button class="chip" type="button" data-f="' + c[0] + '" aria-pressed="' + (f === c[0]) + '">' + c[1] + " (" + n + ")</button>";
      }).join("") + '<input type="search" id="zoek" placeholder="Zoek op naam, e-mail of woning" value="' + esc(S.zoek) + '"></div>' +
      '<div class="tabel-wrap"><table class="tabel"><thead><tr><th>Datum</th><th>Naam</th><th>Onderwerp / woning</th><th>Status</th></tr></thead><tbody>' +
      (rijen.length ? rijen.map(function (a) {
        return '<tr data-id="' + a.id + '"><td>' + dag(a.created_at) + "</td><td>" + esc(a.naam) + '<span class="sub">' + esc(a.email) + "</span></td>" +
          "<td>" + esc(ONDERWERP[a.onderwerp] || a.onderwerp) + (a.woning_label ? '<span class="sub">' + esc(a.woning_label) + "</span>" : "") + "</td><td>" + pill(a.status) + "</td></tr>";
      }).join("") : '<tr><td class="leeg" colspan="4">Geen aanvragen in deze selectie.</td></tr>') +
      "</tbody></table></div>";
    $$("[data-f]").forEach(function (b) { b.addEventListener("click", function () { S.filter.aanvragen = b.getAttribute("data-f"); aanvragenView(); }); });
    $("#exp").addEventListener("click", function () {
      csv("aanvragen", rijen, ["created_at", "status", "onderwerp", "woning_label", "naam", "email", "telefoon", "personen", "inkomen", "ingangsdatum", "bericht", "notities"]);
    });
    zoekveld(aanvragenView);
    $$("tr[data-id]").forEach(function (tr) { tr.addEventListener("click", function () { aanvraagDialoog(tr.getAttribute("data-id")); }); });
  }

  function aanvraagDialoog(id) {
    var a = S.aanvragen.find(function (x) { return x.id === id; });
    if (!a) return;
    var rij = function (k, v) { return v ? "<dt>" + k + "</dt><dd>" + v + "</dd>" : ""; };
    var body =
      '<dl class="details">' +
      rij("Ontvangen", esc(new Date(a.created_at).toLocaleString("nl-NL"))) +
      rij("Onderwerp", esc(ONDERWERP[a.onderwerp] || a.onderwerp)) +
      rij("Woning", esc(a.woning_label)) +
      rij("Naam", esc(a.naam)) +
      rij("E-mail", '<a href="mailto:' + esc(a.email) + '">' + esc(a.email) + "</a>") +
      rij("Telefoon", a.telefoon ? '<a href="tel:' + esc(a.telefoon) + '">' + esc(a.telefoon) + "</a>" : "") +
      rij("Aantal personen", esc(a.personen)) +
      rij("Inkomen (indicatie)", esc(a.inkomen)) +
      rij("Gewenste ingang", a.ingangsdatum ? dag(a.ingangsdatum) : "") +
      rij("Bericht", esc(a.bericht)) +
      "</dl>" +
      "<h3>Opvolging</h3>" +
      '<div class="form-grid">' +
      veld("Status", select("status", A_STATUS, a.status)) +
      '<div class="field" style="align-content:end"><a class="btn btn-ghost btn-sm" href="mailto:' + esc(a.email) + "?subject=" + encodeURIComponent("Je aanvraag bij Properent") + '">E-mail beantwoorden</a></div>' +
      veld("Notities", textarea("notities", a.notities, 'data-type="leeg-null" rows="4" placeholder="Bijv. bezichtiging gepland op…"'), "full") +
      "</div>";
    var voet =
      '<button class="btn btn-danger btn-sm links" type="button" id="a-weg">Verwijderen</button>' +
      (a.status !== "huurder" ? '<button class="btn btn-ghost btn-sm" type="button" id="a-huurder">Maak huurder</button>' : "") +
      '<button class="btn btn-primary btn-sm" type="submit">Opslaan</button>';
    var form = openDialoog("Aanvraag van " + a.naam, body, voet, function (f) {
      return sb.from("aanvragen").update(formWaarden(f)).eq("id", id).then(check).then(function () {
        dlg.close(); melding("Aanvraag bijgewerkt"); return herlaad();
      });
    });
    $("#a-weg", form).addEventListener("click", function () {
      if (!confirm("Aanvraag van " + a.naam + " definitief verwijderen?")) return;
      sb.from("aanvragen").delete().eq("id", id).then(check).then(function () { dlg.close(); melding("Aanvraag verwijderd"); return herlaad(); }).catch(fout);
    });
    var mh = $("#a-huurder", form);
    if (mh) mh.addEventListener("click", function () {
      var w = a.woning_id ? woning(a.woning_id) : null;
      huurderDialoog(null, {
        naam: a.naam, email: a.email, telefoon: a.telefoon, aanvraag_id: a.id, woning_id: a.woning_id,
        ingangsdatum: a.ingangsdatum, huur: w ? w.huur : null, servicekosten: w ? w.servicekosten : 0, borg: w ? w.borg : 0,
      });
    });
  }

  /* ---------- Huurders ---------- */
  function huurdersView() {
    var f = S.filter.huurders, zoek = S.zoek.toLowerCase();
    var rijen = S.huurders.filter(function (h) {
      if (f === "actief" && h.status === "beëindigd") return false;
      if (f === "beëindigd" && h.status !== "beëindigd") return false;
      var w = woning(h.woning_id) || {};
      return !zoek || (h.naam + " " + (h.email || "") + " " + (w.titel || "") + " " + (w.plaats || "") + " " + (w.adres || "")).toLowerCase().indexOf(zoek) > -1;
    });
    var totaal = rijen.filter(function (h) { return h.status !== "beëindigd"; }).reduce(function (s, h) { return s + (+h.huur || 0) + (+h.servicekosten || 0); }, 0);
    $("#view").innerHTML =
      '<div class="view-head"><h1>Huurders &amp; contracten</h1><div class="acties">' +
      '<button class="btn btn-ghost btn-sm" id="exp" type="button">Exporteer (CSV)</button>' +
      '<button class="btn btn-primary btn-sm" id="nieuw" type="button">+ Nieuwe huurder</button></div></div>' +
      '<div class="filterbalk">' + [["actief", "Lopend"], ["beëindigd", "Beëindigd"], ["alle", "Alle"]].map(function (c) {
        return '<button class="chip" type="button" data-f="' + c[0] + '" aria-pressed="' + (f === c[0]) + '">' + c[1] + "</button>";
      }).join("") + '<input type="search" id="zoek" placeholder="Zoek op naam of woning" value="' + esc(S.zoek) + '">' +
      (f !== "beëindigd" ? '<span class="muted" style="margin-left:auto;font-size:.92rem">Totale maandhuur (incl. servicekosten): <b style="color:var(--navy)">' + geld(totaal) + "</b></span>" : "") + "</div>" +
      '<div class="tabel-wrap"><table class="tabel"><thead><tr><th>Huurder</th><th>Woning</th><th>Ingang</th><th>Einde</th><th class="num">Huur</th><th>Borg</th><th>Status</th></tr></thead><tbody>' +
      (rijen.length ? rijen.map(function (h) {
        var w = woning(h.woning_id) || {};
        var d = dagenTot(h.einddatum);
        return '<tr data-id="' + h.id + '"><td>' + esc(h.naam) + '<span class="sub">' + esc(h.email || h.telefoon || "") + "</span></td>" +
          "<td>" + esc(w.titel || "–") + '<span class="sub">' + esc([w.adres, w.plaats].filter(Boolean).join(", ")) + "</span></td>" +
          "<td>" + dag(h.ingangsdatum) + "</td><td>" + (h.einddatum ? dag(h.einddatum) + (d != null && d <= 90 && d >= 0 && h.status !== "beëindigd" ? ' <span class="pill opgezegd">over ' + d + " d</span>" : "") : "–") + "</td>" +
          '<td class="num">' + geld(h.huur) + "</td><td>" + (+h.borg ? (h.borg_ontvangen ? "✓ " : "⚠︎ ") + geld(h.borg) : "–") + "</td><td>" + pill(h.status) + "</td></tr>";
      }).join("") : '<tr><td class="leeg" colspan="7">Geen huurders in deze selectie.</td></tr>') +
      "</tbody></table></div>";
    $$("[data-f]").forEach(function (b) { b.addEventListener("click", function () { S.filter.huurders = b.getAttribute("data-f"); huurdersView(); }); });
    $("#nieuw").addEventListener("click", function () { huurderDialoog(null); });
    $("#exp").addEventListener("click", function () {
      csv("huurders", rijen.map(function (h) {
        var w = woning(h.woning_id) || {};
        return Object.assign({ woning: w.titel, adres: w.adres, plaats: w.plaats }, h);
      }), ["naam", "email", "telefoon", "woning", "adres", "plaats", "ingangsdatum", "einddatum", "contract_type", "huur", "servicekosten", "borg", "borg_ontvangen", "status", "notities"]);
    });
    zoekveld(huurdersView);
    $$("tr[data-id]").forEach(function (tr) { tr.addEventListener("click", function () { huurderDialoog(tr.getAttribute("data-id")); }); });
  }

  function huurderDialoog(id, voorinvulling) {
    var h = id ? S.huurders.find(function (x) { return x.id === id; }) : Object.assign({ status: "actief", contract_type: "onbepaalde tijd", servicekosten: 0, borg: 0 }, voorinvulling || {});
    var woningOpties = [["", "– Kies een woning –"]].concat(S.woningen.map(function (w) {
      return [w.id, w.titel + " – " + (w.adres ? w.adres + ", " : "") + w.plaats + (w.status === "verhuurd" && w.id !== h.woning_id ? " (verhuurd)" : "")];
    }));
    var body =
      "<h3>Huurder</h3>" +
      '<div class="form-grid">' +
      veld("Naam *", input("naam", h.naam, "required")) +
      veld("E-mail", input("email", h.email, 'type="email" data-type="leeg-null"')) +
      veld("Telefoon", input("telefoon", h.telefoon, 'type="tel" data-type="leeg-null"')) +
      veld("Status", select("status", ["actief", "opgezegd", "beëindigd"], h.status)) +
      "</div>" +
      "<h3>Contract</h3>" +
      '<div class="form-grid">' +
      veld("Woning", select("woning_id", woningOpties, h.woning_id || "", 'data-type="leeg-null"'), "full") +
      veld("Soort contract", select("contract_type", ["onbepaalde tijd", "bepaalde tijd"], h.contract_type)) +
      '<div class="field"></div>' +
      veld("Ingangsdatum", input("ingangsdatum", h.ingangsdatum, 'type="date" data-type="datum"')) +
      veld("Einddatum <span class=\"hint\">(bij opzegging of bepaalde tijd)</span>", input("einddatum", h.einddatum, 'type="date" data-type="datum"')) +
      "</div>" +
      '<div class="form-grid drie" style="margin-top:18px">' +
      veld("Kale huur p/m", input("huur", h.huur, 'type="number" step="0.01" min="0" data-type="getal"')) +
      veld("Servicekosten p/m", input("servicekosten", h.servicekosten, 'type="number" step="0.01" min="0" data-type="getal"')) +
      veld("Borg", input("borg", h.borg, 'type="number" step="0.01" min="0" data-type="getal"')) +
      "</div>" +
      '<div class="check-rij" style="margin-top:14px">' +
      '<label class="check"><input type="checkbox" name="borg_ontvangen"' + (h.borg_ontvangen ? " checked" : "") + "> Borg ontvangen</label>" +
      (!id ? '<label class="check"><input type="checkbox" name="_verhuurd" checked> Zet de woning op ‘verhuurd’</label>' : "") +
      "</div>" +
      '<div class="form-grid" style="margin-top:18px">' + veld("Notities", textarea("notities", h.notities, 'rows="3" data-type="leeg-null"'), "full") + "</div>" +
      "<h3>Documenten</h3>" +
      (id
        ? '<ul class="doclijst" id="docs"><li class="muted">Laden…</li></ul>' +
          '<label class="btn btn-ghost btn-sm upload">+ Document uploaden<input type="file" name="_docs" multiple accept=".pdf,image/*,.doc,.docx"></label>' +
          '<p class="hint muted" style="font-size:.85rem">Bijv. huurcontract, opleverrapport, ID (met afgeschermd BSN). Bestanden zijn privé en alleen via beheer te openen.</p>'
        : '<p class="muted">Sla de huurder eerst op; daarna kun je documenten toevoegen.</p>');

    var voet =
      (id ? '<button class="btn btn-danger btn-sm links" type="button" id="h-weg">Verwijderen</button>' : "") +
      '<button class="btn btn-ghost btn-sm" type="button" data-sluit>Annuleren</button>' +
      '<button class="btn btn-primary btn-sm" type="submit">Opslaan</button>';

    var form = openDialoog(id ? "Huurder: " + h.naam : "Nieuwe huurder", body, voet, function (f) {
      var v = formWaarden(f);
      ["servicekosten", "borg"].forEach(function (k) { if (v[k] == null) v[k] = 0; });
      var zetVerhuurd = !id && f.elements._verhuurd && f.elements._verhuurd.checked && v.woning_id;
      if (h.aanvraag_id && !id) v.aanvraag_id = h.aanvraag_id;
      var q = id ? sb.from("huurders").update(v).eq("id", id).select().single() : sb.from("huurders").insert(v).select().single();
      return q.then(check).then(function (rij) {
        var na = [];
        if (zetVerhuurd) na.push(sb.from("woningen").update({ status: "verhuurd" }).eq("id", v.woning_id).then(check));
        if (!id && h.aanvraag_id) na.push(sb.from("aanvragen").update({ status: "huurder" }).eq("id", h.aanvraag_id).then(check));
        return Promise.all(na).then(function () {
          melding("Huurder opgeslagen");
          return laadAlles().then(function () {
            if (location.hash !== "#huurders") location.hash = "#huurders"; else route();
            if (!id && rij) huurderDialoog(rij.id); else dlg.close();
          });
        });
      });
    });

    if (!id) return;

    function laadDocs() {
      return sb.from("documenten").select("*").eq("huurder_id", id).order("created_at", { ascending: false }).then(check).then(function (docs) {
        var ul = $("#docs", form);
        if (!ul) return;
        ul.innerHTML = docs.length ? docs.map(function (d) {
          return '<li><span>' + esc(d.naam) + '</span><span class="muted" style="flex:none;font-size:.85rem">' + dag(d.created_at) + "</span>" +
            '<button class="btn btn-ghost btn-sm" type="button" data-open="' + esc(d.pad) + '">Openen</button>' +
            '<button class="btn btn-danger btn-sm" type="button" data-del="' + d.id + '" data-pad="' + esc(d.pad) + '">✕</button></li>';
        }).join("") : '<li class="muted">Nog geen documenten.</li>';
        $$("[data-open]", ul).forEach(function (b) {
          b.addEventListener("click", function () {
            var venster = window.open("", "_blank");
            sb.storage.from("documenten").createSignedUrl(b.getAttribute("data-open"), 120).then(check).then(function (r) {
              if (venster) venster.location = r.signedUrl; else location.href = r.signedUrl;
            }).catch(function (e) { if (venster) venster.close(); fout(e); });
          });
        });
        $$("[data-del]", ul).forEach(function (b) {
          b.addEventListener("click", function () {
            if (!confirm("Document definitief verwijderen?")) return;
            sb.storage.from("documenten").remove([b.getAttribute("data-pad")]).then(check)
              .then(function () { return sb.from("documenten").delete().eq("id", b.getAttribute("data-del")).then(check); })
              .then(function () { melding("Document verwijderd"); return laadDocs(); }).catch(fout);
          });
        });
      }).catch(fout);
    }
    laadDocs();

    form.elements._docs.addEventListener("change", function (e) {
      var files = Array.prototype.slice.call(e.target.files);
      if (!files.length) return;
      melding("Uploaden…");
      Promise.all(files.map(function (file) {
        var pad = "huurders/" + id + "/" + bestandsnaam(file.name);
        return sb.storage.from("documenten").upload(pad, file, { upsert: false }).then(check).then(function () {
          return sb.from("documenten").insert({ huurder_id: id, naam: file.name, pad: pad }).then(check);
        });
      })).then(function () { e.target.value = ""; melding("Document(en) toegevoegd"); return laadDocs(); }).catch(fout);
    });

    $("#h-weg", form).addEventListener("click", function () {
      if (!confirm("Huurder " + h.naam + " en alle bijbehorende documenten definitief verwijderen?\nTip: zet de status liever op ‘beëindigd’; financiële gegevens moet je 7 jaar bewaren.")) return;
      sb.from("documenten").select("pad").eq("huurder_id", id).then(check).then(function (docs) {
        return docs.length ? sb.storage.from("documenten").remove(docs.map(function (d) { return d.pad; })).then(check) : null;
      }).then(function () { return sb.from("huurders").delete().eq("id", id).then(check); })
        .then(function () { dlg.close(); melding("Huurder verwijderd"); return herlaad(); }).catch(fout);
    });
  }
})();
