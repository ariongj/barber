/*
 * Privé Hair Studio: all shop details live here.
 * Edit this file to change contact info, opening hours, prices and photos.
 * Fields left empty ("") are hidden on the site automatically.
 */
window.PRIVE = {
  name: "Privé Hair Studio",
  instagram: "privehairstudioks",

  // Contact. Leave empty to hide. WhatsApp: digits only with country code, e.g. "38344123456".
  phone: "",            // e.g. "+383 44 123 456"
  whatsapp: "",         // e.g. "38344123456"
  address: "",          // e.g. "Rr. Nëna Terezë 12"
  city: "",             // e.g. "Prishtinë"
  mapsQuery: "",        // optional: what Google Maps should search for (defaults to name + address + city)

  // Opening hours in the shop's local time. null = closed that day.
  timezone: "Europe/Belgrade",
  hours: {
    mon: ["09:00", "20:00"],
    tue: ["09:00", "20:00"],
    wed: ["09:00", "20:00"],
    thu: ["09:00", "20:00"],
    fri: ["09:00", "20:00"],
    sat: ["09:00", "18:00"],
    sun: null
  },
  slotMinutes: 30,        // booking time grid
  bookingDaysAhead: 30,   // how far ahead people can pick a date

  currency: "€",
  categories: {
    hair:     { sq: "Flokët",   en: "Hair" },
    beard:    { sq: "Mjekra",   en: "Beard" },
    packages: { sq: "Paketat",  en: "Packages" }
  },
  services: [
    { id: "classic",  cat: "hair",  price: 7,  min: 30, sq: "Prerje klasike", en: "Classic cut",
      d: { sq: "Makinë dhe gërshërë, larje dhe stilim në fund.", en: "Clippers and scissors, finished with a wash and style." } },
    { id: "fade",     cat: "hair",  price: 8,  min: 40, sq: "Fade / Skin fade", en: "Fade / Skin fade",
      d: { sq: "Kalim i butë deri në lëkurë, konture të pastra.", en: "Seamless blend down to the skin, crisp outlines." } },
    { id: "scissor",  cat: "hair",  price: 10, min: 45, sq: "Prerje me gërshërë", en: "Scissor cut",
      d: { sq: "Për flokë më të gjata dhe forma me teksturë.", en: "For longer hair and textured shapes." } },
    { id: "kids",     cat: "hair",  price: 5,  min: 25, sq: "Prerje për fëmijë", en: "Kids' cut",
      d: { sq: "Deri në 12 vjeç.", en: "Up to 12 years old." } },
    { id: "beard",    cat: "beard", price: 4,  min: 20, sq: "Rregullim mjekre", en: "Beard trim & shape",
      d: { sq: "Formë, gjatësi dhe konture me brisk.", en: "Shape, length and razor-lined edges." } },
    { id: "shave",    cat: "beard", price: 6,  min: 30, sq: "Rruajtje me peshqir të nxehtë", en: "Hot towel shave",
      d: { sq: "Rruajtje klasike me brisk, peshqir i nxehtë dhe balsam.", en: "Classic straight-razor shave, hot towel and balm." } },
    { id: "lineup",   cat: "beard", price: 3,  min: 15, sq: "Konturim", en: "Line-up",
      d: { sq: "Rifreskim i kontureve mes dy prerjeve.", en: "Fresh edges between cuts." } },
    { id: "combo",    cat: "packages", price: 11, min: 50, sq: "Prerje + mjekër", en: "Cut + beard",
      d: { sq: "Prerja që zgjedh plus rregullim i plotë i mjekrës.", en: "Any haircut plus a full beard trim." } },
    { id: "ritual",   cat: "packages", price: 18, min: 75, sq: "Privé Ritual", en: "Privé Ritual",
      d: { sq: "Prerje, mjekër, peshqir i nxehtë, maskë fytyre dhe stilim.", en: "Cut, beard, hot towel, face mask and styling." }, featured: true }
  ],

  // Photos: put files in assets/img/ and list them here, e.g. "assets/img/hero.jpg".
  // Without photos the site shows designed artwork instead.
  photos: {
    hero: "",
    about: "",
    gallery: []           // e.g. ["assets/img/cut-1.jpg", "assets/img/cut-2.jpg", ...]
  },

  // Optional team. Example: { name: "Arben", role: { sq: "Berber", en: "Barber" }, photo: "assets/img/arben.jpg" }
  team: []
};
