/* Properent – sitescripts (geen afhankelijkheden) */
(function () {
  "use strict";

  var CFG = window.PROPERENT || {};
  var DB = CFG.supabaseUrl && CFG.supabaseAnonKey ? CFG.supabaseUrl.replace(/\/+$/, "") + "/rest/v1/" : "";
  var DB_HEADERS = DB ? { apikey: CFG.supabaseAnonKey, Authorization: "Bearer " + CFG.supabaseAnonKey } : {};

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  function datum(d) {
    if (!d || d === "direct") return "Direct";
    var dt = new Date(d + "T12:00:00");
    if (isNaN(dt)) return d;
    if (dt <= new Date()) return "Direct";
    return "Per " + dt.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  }

  /* ---------- Menu ---------- */
  var toggle = $(".nav-toggle");
  var nav = $("#nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Contactgegevens uit config.js ---------- */
  function fillContact() {
    $$("[data-contact]").forEach(function (el) {
      var key = el.getAttribute("data-contact");
      var hideEmpty = el.closest("[data-contact-item]");
      var val = "";
      if (key === "email" && CFG.email) {
        el.textContent = CFG.email; el.href = "mailto:" + CFG.email; val = CFG.email;
      } else if (key === "telefoon" && CFG.telefoon) {
        el.textContent = CFG.telefoonWeergave || CFG.telefoon; el.href = "tel:" + CFG.telefoon.replace(/[^\d+]/g, ""); val = CFG.telefoon;
      } else if (key === "whatsapp" && CFG.whatsapp) {
        el.href = "https://wa.me/" + CFG.whatsapp.replace(/\D/g, ""); val = CFG.whatsapp;
      } else if (key === "bereikbaar" && CFG.bereikbaar) {
        el.textContent = CFG.bereikbaar; val = CFG.bereikbaar;
      } else if (key === "adres" && CFG.adres) {
        el.textContent = CFG.adres; val = CFG.adres;
      } else if (key === "kvk" && CFG.kvk) {
        el.textContent = "KvK " + CFG.kvk; val = CFG.kvk;
      }
      if (!val && hideEmpty) hideEmpty.hidden = true;
    });
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }
  fillContact();

  /* ---------- Illustratie als er (nog) geen foto is ---------- */
  var PALET = {
    "Walcheren": ["#a9dcf5", "#5fb4e5"],
    "Zuid-Beveland": ["#c9e8f7", "#7fc3ea"],
    "Noord-Beveland": ["#bfe3f6", "#4fa3d6"],
    "Schouwen-Duiveland": ["#d3edf9", "#6bb8e3"],
    "Tholen": ["#b5dff4", "#5aa9da"],
    "Zeeuws-Vlaanderen": ["#c4e6f7", "#5fb4e5"],
    "Omliggend": ["#fbe6c6", "#f2a541"],
  };
  function illustratie(w) {
    var p = PALET[w.regio] || PALET.Walcheren;
    var id = "g" + Math.random().toString(36).slice(2, 8);
    var hoog = /appartement|studio|bovenwoning/i.test(w.type);
    var huis = hoog
      ? '<rect x="150" y="70" width="100" height="140" rx="6" fill="#fff"/>' +
        '<rect x="165" y="88" width="22" height="22" rx="3" fill="' + p[1] + '"/><rect x="213" y="88" width="22" height="22" rx="3" fill="' + p[1] + '"/>' +
        '<rect x="165" y="124" width="22" height="22" rx="3" fill="' + p[1] + '"/><rect x="213" y="124" width="22" height="22" rx="3" fill="' + p[1] + '"/>' +
        '<rect x="165" y="160" width="22" height="22" rx="3" fill="' + p[1] + '"/><rect x="190" y="172" width="20" height="38" rx="3" fill="#0b2545"/>' +
        '<rect x="213" y="160" width="22" height="22" rx="3" fill="' + p[1] + '"/>'
      : '<path d="M130 130 200 72l70 58v80H130z" fill="#fff"/><path d="M118 136 200 66l82 70" fill="none" stroke="#0b2545" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<rect x="150" y="150" width="28" height="26" rx="3" fill="' + p[1] + '"/><rect x="222" y="150" width="28" height="26" rx="3" fill="' + p[1] + '"/>' +
        '<rect x="188" y="164" width="24" height="46" rx="3" fill="#0b2545"/>';
    return (
      '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(w.type + " in " + w.plaats) + '">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + p[0] + '"/><stop offset="1" stop-color="#eaf6fc"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#' + id + ')"/>' +
      '<circle cx="320" cy="64" r="22" fill="#f2a541"/>' +
      huis +
      '<path d="M0 222c33-14 67-14 100 0s67 14 100 0 67-14 100 0 67 14 100 0v78H0z" fill="' + p[1] + '"/>' +
      '<path d="M0 252c33-12 67-12 100 0s67 12 100 0 67-12 100 0 67 12 100 0v48H0z" fill="#0b2545" opacity=".85"/>' +
      "</svg>"
    );
  }
  function media(w, i) {
    var f = (w.fotos || [])[i || 0];
    return f ? '<img src="' + esc(f) + '" alt="' + esc(w.titel + " – " + w.plaats) + '" loading="lazy">' : illustratie(w);
  }

  var ICON = {
    m2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9V3h6M21 15v6h-6M3 3l7 7M21 21l-7-7"/></svg>',
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18V6M2 12h20v6M22 18v-4a3 3 0 0 0-3-3h-8v4"/><circle cx="6.5" cy="10.5" r="1.5"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  };

  function statusBadge(w) {
    var s = (w.status || "beschikbaar").toLowerCase();
    var cls = s === "verhuurd" ? "verhuurd" : s === "onder optie" ? "optie" : "beschikbaar";
    var label = s.charAt(0).toUpperCase() + s.slice(1);
    return '<span class="badge ' + cls + '">' + esc(label) + "</span>";
  }

  function kaart(w) {
    var verhuurd = (w.status || "").toLowerCase() === "verhuurd";
    return (
      '<a class="listing' + (verhuurd ? " is-verhuurd" : "") + '" href="woning.html?id=' + encodeURIComponent(w.id) + '">' +
      '<div class="listing-media">' + media(w) +
      '<div class="badges">' + statusBadge(w) + (w.voorbeeld ? '<span class="badge demo">Voorbeeld</span>' : "") + "</div></div>" +
      '<div class="listing-body">' +
      '<span class="listing-place">' + esc(w.plaats) + "</span>" +
      "<h3>" + esc(w.titel) + "</h3>" +
      '<ul class="specs">' +
      "<li>" + ICON.m2 + esc(w.oppervlakte) + " m²</li>" +
      "<li>" + ICON.bed + esc(w.slaapkamers) + " slaapk.</li>" +
      "<li>" + ICON.cal + esc(datum(w.beschikbaar)) + "</li>" +
      "</ul>" +
      '<div class="listing-price">' + euro.format(w.huur) + " <small>p/m kaal</small></div>" +
      "</div></a>"
    );
  }

  /* ---------- Woningen laden: database, anders data/woningen.js ---------- */
  var KOLOMMEN = "id,slug,titel,plaats,regio,type,huur,servicekosten,borg,oppervlakte,kamers,slaapkamers," +
    "energielabel,beschikbaar,status,interieur,kenmerken,voorwaarden,omschrijving,fotos,voorbeeld,volgorde";
  function laadWoningen() {
    var lokaal = window.WONINGEN || [];
    if (!DB) return Promise.resolve(lokaal);
    return fetch(DB + "woningen?select=" + KOLOMMEN + "&order=volgorde.asc,created_at.desc", { headers: DB_HEADERS })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) {
        return rows.map(function (w) {
          return Object.assign({}, w, { id: w.slug, uuid: w.id, huur: +w.huur, servicekosten: +w.servicekosten, borg: +w.borg, beschikbaar: w.beschikbaar || "direct" });
        });
      })
      .catch(function () { return lokaal; });
  }

  function start(WONINGEN) {
    /* ---------- Uitgelicht (home) ---------- */
    var featured = $("#uitgelicht");
    if (featured) {
      var top = WONINGEN.filter(function (w) { return (w.status || "").toLowerCase() !== "verhuurd"; }).slice(0, 3);
      featured.innerHTML = top.length
        ? top.map(kaart).join("")
        : '<div class="empty" style="grid-column:1/-1"><h3>Binnenkort nieuw aanbod</h3><p>Laat je interesse achter, dan hoor je het als eerste.</p></div>';
    }

    /* ---------- Aanbod met filters ---------- */
    var lijst = $("#aanbod-lijst");
    if (lijst) {
      var form = $("#filters");
      var plaatsSel = $("#f-plaats");
      var plaatsen = WONINGEN.map(function (w) { return w.plaats; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
      plaatsen.forEach(function (p) {
        var o = document.createElement("option"); o.value = p; o.textContent = p; plaatsSel.appendChild(o);
      });

      var params = new URLSearchParams(location.search);
      ["plaats", "regio", "maxhuur", "slaapkamers"].forEach(function (k) {
        var el = form.elements[k]; if (el && params.get(k)) el.value = params.get(k);
      });
      if (params.get("plaats") && !plaatsen.includes(params.get("plaats"))) plaatsSel.value = "";

      function render() {
        var f = {
          plaats: form.elements.plaats.value,
          regio: form.elements.regio.value,
          maxhuur: parseInt(form.elements.maxhuur.value, 10) || Infinity,
          slaapkamers: parseInt(form.elements.slaapkamers.value, 10) || 0,
          verhuurd: $("#f-verhuurd").checked,
          sort: $("#sort").value,
        };
        var res = WONINGEN.filter(function (w) {
          if (f.plaats && w.plaats !== f.plaats) return false;
          if (f.regio && w.regio !== f.regio) return false;
          if (w.huur > f.maxhuur) return false;
          if (w.slaapkamers < f.slaapkamers) return false;
          if (!f.verhuurd && (w.status || "").toLowerCase() === "verhuurd") return false;
          return true;
        });
        var rank = { beschikbaar: 0, "onder optie": 1, verhuurd: 2 };
        res.sort(function (a, b) {
          if (f.sort === "prijs-op") return a.huur - b.huur;
          if (f.sort === "prijs-af") return b.huur - a.huur;
          if (f.sort === "opp") return b.oppervlakte - a.oppervlakte;
          return (rank[(a.status || "").toLowerCase()] || 0) - (rank[(b.status || "").toLowerCase()] || 0);
        });
        $("#aantal").textContent = res.length === 1 ? "1 woning gevonden" : res.length + " woningen gevonden";
        lijst.innerHTML = res.length
          ? res.map(kaart).join("")
          : '<div class="empty" style="grid-column:1/-1"><h3>Geen woningen gevonden</h3>' +
            '<p>Pas je filters aan, of laat ons weten wat je zoekt. Dan nemen we contact op zodra er iets passends is.</p>' +
            '<a class="btn btn-dark" href="contact.html?onderwerp=zoekprofiel">Zoekprofiel doorgeven</a></div>';
      }
      form.addEventListener("input", render);
      form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
      $("#sort").addEventListener("change", render);
      $("#f-verhuurd").addEventListener("change", render);
      form.addEventListener("reset", function () { setTimeout(render, 0); });
      render();
    }

    /* ---------- Woning-detail ---------- */
    var detail = $("#woning");
    if (detail) {
      var wid = new URLSearchParams(location.search).get("id");
      var w = WONINGEN.find(function (x) { return x.id === wid; });
      if (!w) {
        detail.innerHTML =
          '<div class="empty"><h3>Deze woning is niet (meer) beschikbaar</h3><p>Mogelijk is de woning al verhuurd.</p>' +
          '<a class="btn btn-dark" href="aanbod.html">Bekijk actueel aanbod</a></div>';
      } else {
        document.title = w.titel + " in " + w.plaats + " | Properent";
        var md = $('meta[name="description"]');
        if (md) md.setAttribute("content", w.type + " te huur in " + w.plaats + ", " + w.oppervlakte + " m², " + euro.format(w.huur) + " per maand.");
        $("#woning-titel").textContent = w.titel;
        $("#woning-sub").textContent = w.type + " · " + w.plaats + " · " + w.regio;
        $("#bc-titel").textContent = w.titel;

        var fotos = w.fotos || [];
        var thumbs = fotos.length > 1
          ? '<div class="gallery-thumbs">' + fotos.map(function (f, i) {
              return '<button type="button" data-i="' + i + '" aria-current="' + (i === 0) + '" aria-label="Foto ' + (i + 1) + '"><img src="' + esc(f) + '" alt="" loading="lazy"></button>';
            }).join("") + "</div>"
          : "";
        var tekst = String(w.omschrijving || "").split(/\n\n+/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
        var list = function (arr) { return arr && arr.length ? '<ul class="ticks">' + arr.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") + "</ul>" : ""; };
        var verhuurd = (w.status || "").toLowerCase() === "verhuurd";

        detail.innerHTML =
          '<div class="detail">' +
          "<div>" +
          '<div class="gallery"><div class="gallery-main">' + media(w, 0) + "</div>" + thumbs + "</div>" +
          '<div style="margin-top:32px">' +
          (w.voorbeeld ? '<p class="note">Dit is voorbeeldaanbod om de website te laten zien. Deze woning is niet echt te huur.</p>' : "") +
          "<h2>Over deze woning</h2>" + tekst +
          (w.kenmerken && w.kenmerken.length ? "<h3>Kenmerken</h3>" + list(w.kenmerken) : "") +
          (w.voorwaarden && w.voorwaarden.length ? "<h3>Voorwaarden</h3>" + list(w.voorwaarden) : "") +
          "</div></div>" +
          '<aside class="sticky-card"><div class="price-card">' +
          statusBadge(w) +
          '<div class="big" style="margin-top:12px">' + euro.format(w.huur) + ' <small class="muted" style="font-size:1rem;font-weight:600">p/m</small></div>' +
          '<div class="muted">Kale huur' + (w.servicekosten ? " + " + euro.format(w.servicekosten) + " servicekosten" : "") + "</div>" +
          '<dl class="facts">' +
          "<div><dt>Woonoppervlakte</dt><dd>" + esc(w.oppervlakte) + " m²</dd></div>" +
          "<div><dt>Kamers</dt><dd>" + esc(w.kamers) + " (" + esc(w.slaapkamers) + " slaapk.)</dd></div>" +
          "<div><dt>Beschikbaar</dt><dd>" + esc(datum(w.beschikbaar)) + "</dd></div>" +
          "<div><dt>Energielabel</dt><dd>" + esc(w.energielabel || "–") + "</dd></div>" +
          "<div><dt>Oplevering</dt><dd>" + esc((w.interieur || "–").replace(/^./, function (c) { return c.toUpperCase(); })) + "</dd></div>" +
          "<div><dt>Borg</dt><dd>" + (w.borg ? euro.format(w.borg) : "–") + "</dd></div>" +
          "</dl>" +
          (verhuurd
            ? '<a class="btn btn-dark btn-block" href="aanbod.html">Bekijk ander aanbod</a>'
            : '<a class="btn btn-primary btn-block" href="contact.html?woning=' + encodeURIComponent(w.id) + '">Ik heb interesse</a>' +
              '<p class="muted center" style="font-size:.9rem;margin:12px 0 0">Vrijblijvend · reactie binnen 2 werkdagen</p>') +
          "</div></aside></div>";

        $$(".gallery-thumbs button", detail).forEach(function (b) {
          b.addEventListener("click", function () {
            var i = +b.getAttribute("data-i");
            $(".gallery-main", detail).innerHTML = media(w, i);
            $$(".gallery-thumbs button", detail).forEach(function (x) { x.setAttribute("aria-current", x === b); });
          });
        });
      }
    }

    /* ---------- Contact-/interesseformulier ---------- */
    var cform = $("#contact-form");
    if (cform) {
      var qp = new URLSearchParams(location.search);
      var sel = cform.elements.woning;
      WONINGEN.filter(function (x) { return (x.status || "").toLowerCase() !== "verhuurd"; }).forEach(function (x) {
        var o = document.createElement("option");
        o.value = x.id; o.textContent = x.titel + " – " + x.plaats + " (" + euro.format(x.huur) + ")";
        sel.appendChild(o);
      });
      if (qp.get("woning")) {
        sel.value = qp.get("woning");
        cform.elements.onderwerp.value = "interesse";
      }
      if (qp.get("onderwerp")) cform.elements.onderwerp.value = qp.get("onderwerp");

      var woningVeld = $("#veld-woning");
      function toggleWoning() { woningVeld.hidden = cform.elements.onderwerp.value !== "interesse"; }
      cform.elements.onderwerp.addEventListener("change", toggleWoning);
      toggleWoning();

      cform.addEventListener("submit", function (e) {
        e.preventDefault();
        var status = $("#form-status");
        status.className = "form-status";
        if (!cform.checkValidity()) { cform.reportValidity(); return; }
        if (cform.elements._gotcha && cform.elements._gotcha.value) return; // spam

        var data = new FormData(cform);
        var gekozen = sel.options[sel.selectedIndex];
        var woning = null;
        if (cform.elements.onderwerp.value === "interesse" && gekozen && gekozen.value) {
          data.set("woning", gekozen.textContent);
          woning = WONINGEN.find(function (x) { return x.id === gekozen.value; });
        } else data.delete("woning");
        data.delete("_gotcha");

        var knop = cform.querySelector('button[type="submit"]');
        var ok = function (r) { if (!r.ok) throw new Error(r.status); return r; };

        // Eerste verzoek bepaalt of het gelukt is; de formulierdienst dient
        // naast de database alleen als e-mailmelding.
        var verzoeken = [];
        if (DB) {
          var rij = {
            onderwerp: data.get("onderwerp"),
            woning_id: woning && woning.uuid ? woning.uuid : null,
            woning_label: data.get("woning") || null,
            naam: data.get("naam"),
            email: data.get("email"),
            telefoon: data.get("telefoon") || null,
            personen: data.get("personen") || null,
            inkomen: data.get("inkomen") || null,
            ingangsdatum: data.get("ingangsdatum") || null,
            bericht: data.get("bericht") || "",
          };
          verzoeken.push(fetch(DB + "aanvragen", {
            method: "POST",
            headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=minimal" }, DB_HEADERS),
            body: JSON.stringify(rij),
          }).then(ok));
        }
        if (CFG.formEndpoint) {
          verzoeken.push(fetch(CFG.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } }).then(ok));
        }

        if (verzoeken.length) {
          knop.disabled = true;
          verzoeken.slice(1).forEach(function (v) { v.catch(function () {}); });
          verzoeken[0]
            .then(function () {
              cform.reset(); toggleWoning();
              status.className = "form-status ok";
              status.textContent = "Bedankt! We hebben je bericht ontvangen en reageren binnen 2 werkdagen.";
            })
            .catch(function () {
              status.className = "form-status err";
              status.textContent = "Versturen lukte niet. Probeer het later opnieuw of mail ons via " + (CFG.email || "e-mail") + ".";
            })
            .finally(function () { knop.disabled = false; });
        } else {
          var labels = { naam: "Naam", email: "E-mail", telefoon: "Telefoon", onderwerp: "Onderwerp", woning: "Woning", personen: "Aantal personen", inkomen: "Bruto maandinkomen (indicatie)", ingangsdatum: "Gewenste ingangsdatum", bericht: "Bericht" };
          var body = [];
          data.forEach(function (v, k) { if (labels[k] && v) body.push(labels[k] + ": " + v); });
          var subj = "Properent – " + (cform.elements.onderwerp.options[cform.elements.onderwerp.selectedIndex].text);
          location.href = "mailto:" + (CFG.email || "") + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body.join("\n"));
          status.className = "form-status ok";
          status.textContent = "Je e-mailprogramma wordt geopend met je bericht. Verstuur de e-mail om je aanvraag af te ronden.";
        }
      });
    }
  }

  laadWoningen().then(start);
})();
