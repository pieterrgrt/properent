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

  // Formulierdienst (bijv. Formspree: https://formspree.io/f/xxxxxxx).
  // Leeg laten = het formulier opent een vooringevulde e-mail.
  formEndpoint: "",

  // Wettelijk verplicht op een zakelijke website: KvK-nummer en een adres.
  // Het adres mag een postadres of virtueel kantoor zijn (zie README).
  kvk: "",
  adres: "",
};
