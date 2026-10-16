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
  bookingDaysAhead: 14,   // how many days ahead people can book

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

  // Fade Lab: what each choice costs and how long it takes.
  lab: {
    fades: [
      { id: "none",  price: 7, min: 30, sq: "Klasike",   en: "Classic" },
      { id: "taper", price: 8, min: 35, sq: "Taper",     en: "Taper" },
      { id: "low",   price: 8, min: 40, sq: "Low fade",  en: "Low fade" },
      { id: "mid",   price: 8, min: 40, sq: "Mid fade",  en: "Mid fade" },
      { id: "high",  price: 8, min: 40, sq: "High fade", en: "High fade" },
      { id: "skin",  price: 8, min: 45, sq: "Skin fade", en: "Skin fade" }
    ],
    longTop: { from: 40, price: 2, min: 10 },   // extra for scissor work when the top is at least `from` mm
    beards: [
      { id: "none",    price: 0, min: 0,  sq: "Pa mjekër",   en: "Clean" },
      { id: "stubble", price: 3, min: 10, sq: "Stubble",     en: "Stubble" },
      { id: "short",   price: 4, min: 20, sq: "E shkurtër",  en: "Short" },
      { id: "full",    price: 5, min: 25, sq: "E plotë",     en: "Full" }
    ],
    extras: [
      { id: "lineup", price: 2, min: 10, sq: "Konturim me brisk", en: "Razor line-up" },
      { id: "part",   price: 2, min: 10, sq: "Vijë anësore",      en: "Hard part" },
      { id: "towel",  price: 2, min: 10, sq: "Peshqir i nxehtë",  en: "Hot towel" },
      { id: "mask",   price: 4, min: 10, sq: "Maskë fytyre",      en: "Face mask" }
    ]
  },

  // Lookbook: ready-made looks shown as cards; "Try it" loads them into the Fade Lab.
  looks: [
    { id: "low",   fade: "low",   top: 30, beard: "none",    extras: [],                 sq: "Low fade",       en: "Low fade" },
    { id: "skin",  fade: "skin",  top: 18, beard: "stubble", extras: ["lineup"],         sq: "Skin fade",      en: "Skin fade" },
    { id: "mid",   fade: "mid",   top: 45, beard: "short",   extras: ["part"],           sq: "Mid fade + part", en: "Mid fade + part" },
    { id: "taper", fade: "taper", top: 55, beard: "full",    extras: ["towel"],          sq: "Taper & mjekër", en: "Taper & beard" },
    { id: "high",  fade: "high",  top: 12, beard: "none",    extras: ["lineup"],         sq: "High & tight",   en: "High & tight" },
    { id: "buzz",  fade: "none",  top: 3,  beard: "stubble", extras: [],                 sq: "Buzz cut",       en: "Buzz cut" }
  ],

  // Photos: put files in assets/img/ and list them here, e.g. "assets/img/cut-1.jpg".
  photos: {
    gallery: []           // e.g. ["assets/img/cut-1.jpg", "assets/img/cut-2.jpg", ...]
  }
};
