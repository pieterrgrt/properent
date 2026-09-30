/* Properent – demomodus voor de beheeromgeving
 * Zet in config.js `demo: true` om de beheeromgeving te bekijken zonder
 * database. Alle gegevens staan dan tijdelijk in het geheugen van de browser
 * en verdwijnen bij herladen. Bootst het deel van supabase-js na dat
 * beheer.js gebruikt.
 */
(function () {
  "use strict";
  var CFG = window.PROPERENT || {};
  if (!CFG.demo) return;

  var uid = function () { return "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); };
  var nu = Date.now();
  var dagen = function (n) { return new Date(nu + n * 864e5); };
  var iso = function (d) { return d.toISOString(); };
  var datum = function (d) { return d.toISOString().slice(0, 10); };

  var woningen = (window.WONINGEN || []).map(function (w, i) {
    return {
      id: uid(), slug: w.id, titel: w.titel, plaats: w.plaats, regio: w.regio, type: w.type, huur: w.huur,
      servicekosten: w.servicekosten, borg: w.borg, oppervlakte: w.oppervlakte, kamers: w.kamers, slaapkamers: w.slaapkamers,
      energielabel: w.energielabel, beschikbaar: w.beschikbaar === "direct" ? null : w.beschikbaar, status: w.status,
      interieur: w.interieur, kenmerken: w.kenmerken, voorwaarden: w.voorwaarden, omschrijving: w.omschrijving, fotos: w.fotos || [],
      gepubliceerd: true, voorbeeld: true, volgorde: i, adres: ["Balkengracht 14", "Oostzijde 7", "Boulevard Bankert 3a", "Havenpark 22", "Markt 5", "Zuivelstraat 9"][i] || null,
      notities: null, created_at: iso(dagen(-30 + i)), updated_at: iso(dagen(-30 + i)),
    };
  });
  var w = function (slug) { return (woningen.find(function (x) { return x.slug.indexOf(slug) === 0; }) || {}); };

  var aanvragen = [
    { naam: "Sanne de Vries", email: "sanne@example.nl", telefoon: "06 12 34 56 78", onderwerp: "interesse", woning: "goes", personen: "3", inkomen: "€ 4.500 – € 6.000", bericht: "Wij zoeken met ons gezin een woning in Goes. Kunnen we komen kijken?", status: "nieuw", d: -1 },
    { naam: "Mehmet Yilmaz", email: "mehmet@example.nl", telefoon: "06 98 76 54 32", onderwerp: "interesse", woning: "middelburg", personen: "2", inkomen: "€ 3.500 – € 4.500", bericht: "Graag een bezichtiging, liefst op een doordeweekse avond.", status: "bezichtiging", notities: "Bezichtiging donderdag 17:30.", d: -4 },
    { naam: "Lotte Janssen", email: "lotte@example.nl", onderwerp: "zoekprofiel", personen: "1", inkomen: "€ 2.500 – € 3.500", bericht: "Ik zoek een studio of klein appartement in Vlissingen of Middelburg, tot € 850.", status: "in behandeling", d: -9 },
    { naam: "Peter Bakker", email: "peter@example.nl", onderwerp: "verhuren", bericht: "Ik heb een appartement in Zierikzee dat ik wil laten verhuren.", status: "nieuw", d: -2 },
    { naam: "Anouk Visser", email: "anouk@example.nl", onderwerp: "interesse", woning: "bergen", personen: "2", bericht: "Is de woning nog beschikbaar?", status: "huurder", d: -40 },
  ].map(function (a) {
    var ww = a.woning ? w(a.woning) : null;
    return {
      id: uid(), created_at: iso(dagen(a.d)), updated_at: iso(dagen(a.d)), onderwerp: a.onderwerp,
      woning_id: ww ? ww.id : null, woning_label: ww ? ww.titel + " – " + ww.plaats : null, naam: a.naam, email: a.email,
      telefoon: a.telefoon || null, personen: a.personen || null, inkomen: a.inkomen || null, ingangsdatum: null,
      bericht: a.bericht, status: a.status, notities: a.notities || null,
    };
  });

  var bergen = w("bergen");
  var huurders = [
    { id: uid(), created_at: iso(dagen(-35)), updated_at: iso(dagen(-35)), woning_id: bergen.id, aanvraag_id: aanvragen[4].id, naam: "Anouk Visser", email: "anouk@example.nl",
      telefoon: "06 11 22 33 44", ingangsdatum: datum(dagen(-20)), einddatum: null, contract_type: "onbepaalde tijd", huur: 1025, servicekosten: 0, borg: 2050,
      borg_ontvangen: true, status: "actief", notities: null },
    { id: uid(), created_at: iso(dagen(-400)), updated_at: iso(dagen(-10)), woning_id: w("vlissingen").id, aanvraag_id: null, naam: "Tom de Wit", email: "tom@example.nl",
      telefoon: null, ingangsdatum: datum(dagen(-380)), einddatum: datum(dagen(45)), contract_type: "onbepaalde tijd", huur: 795, servicekosten: 45, borg: 1590,
      borg_ontvangen: false, status: "opgezegd", notities: "Heeft opgezegd per einddatum. Eindinspectie inplannen." },
  ];
  var documenten = [
    { id: uid(), created_at: iso(dagen(-35)), huurder_id: huurders[0].id, aanvraag_id: null, naam: "Huurcontract Anouk Visser.pdf", pad: "demo/contract.pdf" },
  ];
  var TABELLEN = { woningen: woningen, aanvragen: aanvragen, huurders: huurders, documenten: documenten };
  var bestanden = {};

  function Query(tabel) { this.t = tabel; this.op = "select"; this.filters = []; this.orders = []; this.enkel = false; }
  Query.prototype.select = function () { if (this.op === "select") this.op = "select"; else this.terug = true; return this; };
  Query.prototype.order = function (k, o) { this.orders.push([k, !o || o.ascending !== false]); return this; };
  Query.prototype.eq = function (k, v) { this.filters.push(function (r) { return r[k] === v; }); return this; };
  Query.prototype.in = function (k, v) { this.filters.push(function (r) { return v.indexOf(r[k]) > -1; }); return this; };
  Query.prototype.single = function () { this.enkel = true; return this; };
  Query.prototype.insert = function (v) { this.op = "insert"; this.waarde = v; return this; };
  Query.prototype.update = function (v) { this.op = "update"; this.waarde = v; return this; };
  Query.prototype.delete = function () { this.op = "delete"; return this; };
  Query.prototype.uitvoeren = function () {
    var rijen = TABELLEN[this.t], f = this.filters;
    var match = function (r) { return f.every(function (fn) { return fn(r); }); };
    var kopie = function (r) { return JSON.parse(JSON.stringify(r)); };
    if (this.op === "insert") {
      var nieuw = (Array.isArray(this.waarde) ? this.waarde : [this.waarde]).map(function (v) {
        return Object.assign({ id: uid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, v);
      });
      if (this.t === "woningen" && nieuw.some(function (n) { return rijen.some(function (r) { return r.slug === n.slug; }); })) {
        return { data: null, error: { code: "23505", message: "slug bestaat al" } };
      }
      Array.prototype.push.apply(rijen, nieuw);
      return { data: this.enkel ? kopie(nieuw[0]) : nieuw.map(kopie), error: null };
    }
    if (this.op === "update") {
      var w8 = this.waarde, bijgewerkt = [];
      rijen.forEach(function (r) { if (match(r)) { Object.assign(r, w8, { updated_at: new Date().toISOString() }); bijgewerkt.push(kopie(r)); } });
      return { data: this.enkel ? bijgewerkt[0] || null : bijgewerkt, error: null };
    }
    if (this.op === "delete") {
      for (var i = rijen.length - 1; i >= 0; i--) if (match(rijen[i])) rijen.splice(i, 1);
      return { data: null, error: null };
    }
    var res = rijen.filter(match).map(kopie);
    var orders = this.orders;
    res.sort(function (a, b) {
      for (var i = 0; i < orders.length; i++) {
        var k = orders[i][0], x = a[k], y = b[k];
        if (x === y) continue;
        return (x > y ? 1 : -1) * (orders[i][1] ? 1 : -1);
      }
      return 0;
    });
    return { data: this.enkel ? res[0] || null : res, error: null };
  };
  Query.prototype.then = function (ok, fout) {
    var self = this;
    return new Promise(function (r) { setTimeout(function () { r(self.uitvoeren()); }, 60); }).then(ok, fout);
  };

  var luisteraars = [], sessie = null;
  var auth = {
    onAuthStateChange: function (cb) { luisteraars.push(cb); setTimeout(function () { cb("INITIAL_SESSION", sessie); }, 0); return { data: { subscription: { unsubscribe: function () {} } } }; },
    signInWithPassword: function (c) {
      return new Promise(function (r) {
        setTimeout(function () {
          if (!c.email || !c.password) return r({ error: { message: "Invalid login credentials" } });
          sessie = { user: { id: "demo", email: c.email } };
          luisteraars.forEach(function (cb) { cb("SIGNED_IN", sessie); });
          r({ data: sessie, error: null });
        }, 150);
      });
    },
    signOut: function () { sessie = null; luisteraars.forEach(function (cb) { cb("SIGNED_OUT", null); }); return Promise.resolve({ error: null }); },
    resetPasswordForEmail: function () { return Promise.resolve({ error: null }); },
    updateUser: function () { return Promise.resolve({ error: null }); },
  };

  var storage = {
    from: function (bucket) {
      return {
        upload: function (pad, file) { bestanden[bucket + "/" + pad] = URL.createObjectURL(file); return Promise.resolve({ data: { path: pad }, error: null }); },
        getPublicUrl: function (pad) { return { data: { publicUrl: bestanden[bucket + "/" + pad] } }; },
        createSignedUrl: function (pad) {
          var u = bestanden[bucket + "/" + pad] || URL.createObjectURL(new Blob(["Dit is een voorbeelddocument in de demomodus."], { type: "text/plain" }));
          return Promise.resolve({ data: { signedUrl: u }, error: null });
        },
        remove: function (paden) { paden.forEach(function (p) { delete bestanden[bucket + "/" + p]; }); return Promise.resolve({ data: [], error: null }); },
      };
    },
  };

  window.supabase = {
    createClient: function () {
      return {
        auth: auth,
        storage: storage,
        from: function (t) { return new Query(t); },
        rpc: function () { return Promise.resolve({ data: true, error: null }); },
      };
    },
  };
  CFG.supabaseUrl = CFG.supabaseUrl || "demo";
  CFG.supabaseAnonKey = CFG.supabaseAnonKey || "demo";

  document.addEventListener("DOMContentLoaded", function () {
    var f = document.getElementById("login-form");
    if (!f) return;
    f.email.value = "demo@properent.nl";
    f.wachtwoord.value = "demo";
    var p = document.createElement("p");
    p.className = "note";
    p.style.fontSize = ".92rem";
    p.innerHTML = "<strong>Demo.</strong> Klik op Inloggen. Alle gegevens zijn verzonnen en wijzigingen verdwijnen bij herladen.";
    f.insertBefore(p, f.querySelector("h1").nextSibling);
  });
})();
