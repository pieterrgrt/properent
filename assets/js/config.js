/*
 * Properent – centrale instellingen
 * ---------------------------------
 * Pas hier de contactgegevens aan. Ze worden automatisch op alle pagina's
 * ingevuld (header, footer, contactpagina). Laat een veld leeg ("") om het
 * te verbergen.
 */
window.PROPERENT = {
  email: "info@properent.nl",

  // Zakelijk nummer (bijv. een apart prepaid- of VoIP-nummer), niet privé.
  telefoon: "+31 6 00 00 00 00",
  telefoonWeergave: "06 – 00 00 00 00",

  // WhatsApp-nummer in internationaal formaat zonder + of spaties, of "".
  whatsapp: "",

  // Bereikbaarheid, zoals getoond op de contactpagina.
  bereikbaar: "Ma t/m vr, 9:00 – 17:00 uur",

  // Beheeromgeving (Supabase). Zie docs/BEHEER.md. Ingevuld = woningen komen
  // uit de database en aanvragen worden daarin opgeslagen. Leeg = de site
  // gebruikt data/woningen.js. De "anon key" is openbaar en mag hier staan.
  supabaseUrl: "",
  // true = beheeromgeving draait met verzonnen voorbeelddata (om te laten zien)
  demo: false,
  supabaseAnonKey: "",

  // Formulierdienst (bijv. Formspree: https://formspree.io/f/xxxxxxx).
  // Handig als e-mailmelding naast de database. Zijn beide leeg, dan opent
  // het formulier een vooringevulde e-mail.
  formEndpoint: "",

  // Wettelijk verplicht op een zakelijke website: KvK-nummer en een adres.
  // Het adres mag een postadres of virtueel kantoor zijn (zie README).
  kvk: "",
  adres: "",
};
