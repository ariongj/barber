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
    // Real photos. When the chosen fade has a photo, the Fade Lab shows it, with the
    // drawing of the exact combination as a small card. Without a photo it shows the drawing.
    // Each entry is a path/URL, or { src, credit, href } to show a photo credit.
    // These are free stock photos (Unsplash License, and one CC BY-SA 4.0 photo from
    // Wikimedia Commons). Replace them with the studio's own work in assets/img/lab/.
    photos: {
      fades: {
        none:  { src: "https://unsplash.com/photos/tWzR3llIMsY/download?w=1200", credit: "Unsplash", href: "https://unsplash.com/photos/tWzR3llIMsY" },
        taper: { src: "https://unsplash.com/photos/z0Cyh9nGLFY/download?w=1200", credit: "Unsplash", href: "https://unsplash.com/photos/z0Cyh9nGLFY" },
        low:   { src: "https://unsplash.com/photos/CCTCHXEsan8/download?w=1200", credit: "John Arano / Unsplash", href: "https://unsplash.com/photos/CCTCHXEsan8" },
        mid:   { src: "https://unsplash.com/photos/jzGDfI9GMS0/download?w=1200", credit: "Hair Spies / Unsplash", href: "https://unsplash.com/photos/jzGDfI9GMS0" },
        high:  { src: "https://unsplash.com/photos/FtYpeIRDzaw/download?w=1200", credit: "Hair Spies / Unsplash", href: "https://unsplash.com/photos/FtYpeIRDzaw" },
        skin:  { src: "https://commons.wikimedia.org/wiki/Special:FilePath/Fade_Hair_Cut.jpg?width=1100", credit: "Truth678 / Wikimedia Commons, CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Fade_Hair_Cut.jpg" }
      },
      beards: {
        stubble: "",
        short: "",
        full:  { src: "https://unsplash.com/photos/Twd3yaqA2NM/download?w=1200", credit: "Arthur Humeau / Unsplash", href: "https://unsplash.com/photos/Twd3yaqA2NM" }
      }
    },
    extras: [
      { id: "lineup", price: 2, min: 10, sq: "Konturim me brisk", en: "Razor line-up" },
      { id: "part",   price: 2, min: 10, sq: "Vijë anësore",      en: "Hard part" },
      { id: "towel",  price: 2, min: 10, sq: "Peshqir i nxehtë",  en: "Hot towel" },
      { id: "mask",   price: 4, min: 10, sq: "Maskë fytyre",      en: "Face mask" }
    ]
  },

  // Style catalogue: grouped looks with a short explanation, how often they need a
  // touch-up, and the settings "Try it" loads into the Fade Lab.
  // `photo` is a path/URL or { src, credit, href }; without it the card shows the drawing.
  lookGroups: {
    fade:    { sq: "Fade & taper", en: "Fade & taper" },
    classic: { sq: "Klasike",     en: "Classic" },
    short:   { sq: "Të shkurtra", en: "Short" },
    long:    { sq: "Të gjata",    en: "Long" },
    beard:   { sq: "Mjekër",      en: "Beard" }
  },
  looks: [
    { id: "low", group: "fade", fade: "low", top: 30, beard: "none", extras: [], weeks: 3,
      sq: "Low fade", en: "Low fade",
      d: { sq: "Kalimi fillon shumë poshtë, pak mbi vesh dhe në zverk. I përmbajtur dhe i pastër, shkon me çdo stil sipër.",
           en: "The blend starts very low, just above the ear and at the nape. Subtle and clean, it works with any style on top." },
      photo: { src: "https://unsplash.com/photos/CCTCHXEsan8/download?w=900", credit: "John Arano / Unsplash", href: "https://unsplash.com/photos/CCTCHXEsan8" } },
    { id: "mid", group: "fade", fade: "mid", top: 35, beard: "none", extras: [], weeks: 3,
      sq: "Mid fade", en: "Mid fade",
      d: { sq: "Fillon në mes të anës, rreth tëmthave. Ekuilibri më i kërkuar mes të butës dhe të guximshmes.",
           en: "Starts halfway up the sides, around the temples. The most requested balance between subtle and bold." },
      photo: { src: "https://unsplash.com/photos/jzGDfI9GMS0/download?w=900", credit: "Hair Spies / Unsplash", href: "https://unsplash.com/photos/jzGDfI9GMS0" } },
    { id: "skin", group: "fade", fade: "skin", top: 18, beard: "stubble", extras: ["lineup"], weeks: 2,
      sq: "Skin fade", en: "Skin fade",
      d: { sq: "Anët shkojnë deri në lëkurë, pastaj kalojnë butë në flokë. Kontrasti më i fortë që mund të kesh.",
           en: "The sides go down to bare skin, then blend smoothly into the hair. The strongest contrast you can get." },
      photo: { src: "https://commons.wikimedia.org/wiki/Special:FilePath/Fade_Hair_Cut.jpg?width=900", credit: "Truth678 / Wikimedia Commons, CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Fade_Hair_Cut.jpg" } },
    { id: "high", group: "fade", fade: "high", top: 12, beard: "none", extras: ["lineup"], weeks: 2,
      sq: "High & tight", en: "High & tight",
      d: { sq: "Fade i lartë deri afër majës, me pak flokë sipër. I pastër dhe pa asnjë rregullim në mëngjes.",
           en: "A high fade almost up to the crown with a short top. Clean, with zero styling in the morning." },
      photo: { src: "https://unsplash.com/photos/FtYpeIRDzaw/download?w=900", credit: "Hair Spies / Unsplash", href: "https://unsplash.com/photos/FtYpeIRDzaw" } },
    { id: "drop", group: "fade", fade: "mid", top: 40, beard: "none", extras: [], weeks: 3,
      sq: "Drop fade", en: "Drop fade",
      d: { sq: "Fade-i bie pas veshit dhe ndjek formën e kokës drejt zverkut, duke krijuar një hark të butë.",
           en: "The fade drops behind the ear and follows the head down to the nape, forming a soft arc." },
      photo: { src: "https://unsplash.com/photos/LU2XkVyhf_c/download?w=900", credit: "Hair Spies / Unsplash", href: "https://unsplash.com/photos/LU2XkVyhf_c" } },
    { id: "hitop", group: "fade", fade: "high", top: 80, beard: "none", extras: ["lineup"], weeks: 3,
      sq: "Hi-top fade", en: "Hi-top fade",
      d: { sq: "Anë të shkurtra dhe sipër flokë të gjata, të ngritura drejt e lart në formë kubi. Klasik i viteve '90.",
           en: "Short sides with a tall top stood straight up into a block. A '90s classic." },
      photo: { src: "https://commons.wikimedia.org/wiki/Special:FilePath/Hi-top_fade.jpg?width=900", credit: "Paul Uzzo / Wikimedia Commons", href: "https://commons.wikimedia.org/wiki/File:Hi-top_fade.jpg" } },
    { id: "taper", group: "fade", fade: "taper", top: 45, beard: "none", extras: [], weeks: 4,
      sq: "Taper klasik", en: "Classic taper",
      d: { sq: "Shkurtim gradual vetëm te konturet: tëmthat dhe zverku. Më i butë se fade-i, ideal për zyrë.",
           en: "Gradual shortening only at the edges: temples and nape. Softer than a fade, ideal for the office." },
      photo: { src: "https://unsplash.com/photos/8esvJeVUdes/download?w=900", credit: "delfina pan / Unsplash", href: "https://unsplash.com/photos/8esvJeVUdes" } },
    { id: "pomp", group: "classic", fade: "low", top: 70, beard: "none", extras: [], weeks: 3,
      sq: "Pompadour", en: "Pompadour",
      d: { sq: "Volum i madh përpara, i krehur lart e mbrapa, me anë të shkurtra. Kërkon fen dhe pak pomadë.",
           en: "Big volume at the front, swept up and back, with short sides. Needs a blow-dry and a little pomade." },
      photo: { src: "https://unsplash.com/photos/z0Cyh9nGLFY/download?w=900", credit: "Unsplash", href: "https://unsplash.com/photos/z0Cyh9nGLFY" } },
    { id: "slick", group: "classic", fade: "taper", top: 70, beard: "short", extras: [], weeks: 4,
      sq: "Slick back", en: "Slick back",
      d: { sq: "Flokë mesatare të krehura mbrapa me xhel ose pomadë, me anë të pastra. Elegant dhe serioz.",
           en: "Medium-length hair combed straight back with gel or pomade, clean sides. Sharp and grown-up." },
      photo: { src: "https://unsplash.com/photos/ymkRPqPmRew/download?w=900", credit: "Sigmund / Unsplash", href: "https://unsplash.com/photos/ymkRPqPmRew" } },
    { id: "part", group: "classic", fade: "none", top: 45, beard: "none", extras: ["part"], weeks: 4,
      sq: "Side part", en: "Side part",
      d: { sq: "Vijë anësore e qartë dhe flokë të krehura në njërën anë. Prerja e zotërinjve, nuk del kurrë nga moda.",
           en: "A clean side parting with the hair combed to one side. The gentleman's cut that never dates." },
      photo: { src: "https://unsplash.com/photos/tWzR3llIMsY/download?w=900", credit: "Unsplash", href: "https://unsplash.com/photos/tWzR3llIMsY" } },
    { id: "buzz", group: "short", fade: "none", top: 3, beard: "stubble", extras: [], weeks: 2,
      sq: "Buzz cut", en: "Buzz cut",
      d: { sq: "E njëjta gjatësi kudo me makinë, zakonisht 3–9 mm. Asnjë krehje: lahesh dhe del.",
           en: "One length all over with clippers, usually 3–9 mm. No styling: wash and go." },
      photo: { src: "https://unsplash.com/photos/5D9ixjUmWQg/download?w=900", credit: "Karsten Winegeart / Unsplash", href: "https://unsplash.com/photos/5D9ixjUmWQg" } },
    { id: "crew", group: "short", fade: "taper", top: 15, beard: "none", extras: [], weeks: 3,
      sq: "Crew cut", en: "Crew cut",
      d: { sq: "Pak më e gjatë përpara e sipër, anët të shkurtra. Klasikja që i rri mirë pothuajse çdo fytyre.",
           en: "A little longer at the front and top, short sides. The classic that suits almost every face." },
      photo: { src: "https://unsplash.com/photos/uvMvCf1zREY/download?w=900", credit: "Unsplash", href: "https://unsplash.com/photos/uvMvCf1zREY" } },
    { id: "crop", group: "short", fade: "mid", top: 25, beard: "none", extras: ["lineup"], weeks: 3,
      sq: "French crop", en: "French crop",
      d: { sq: "Sipër me teksturë dhe balluke e drejtë përpara, anët me fade. Modern dhe i lehtë për t'u rregulluar.",
           en: "A textured top with a short straight fringe and faded sides. Modern and easy to style." },
      photo: { src: "https://unsplash.com/photos/zeRW9gsdkBk/download?w=900", credit: "Unsplash", href: "https://unsplash.com/photos/zeRW9gsdkBk" } },
    { id: "curly", group: "long", fade: "mid", top: 55, beard: "none", extras: [], weeks: 4,
      sq: "Kaçurrela sipër", en: "Curly top",
      d: { sq: "Kaçurrelat lihen të lira sipër dhe anët pastrohen, që forma të duket e qëllimshme, jo e harruar.",
           en: "Curls left free on top with tidy sides, so the shape looks intentional, not overgrown." },
      photo: { src: "https://unsplash.com/photos/XYG5DeDOe8s/download?w=900", credit: "Unsplash", href: "https://unsplash.com/photos/XYG5DeDOe8s" } },
    { id: "long", group: "long", fade: "none", top: 80, beard: "short", extras: [], weeks: 6,
      sq: "Flokë të gjata", en: "Long hair",
      d: { sq: "Flokët mbahen në formë duke shkurtuar majat dhe pastruar konturet, pa humbur gjatësinë.",
           en: "Kept in shape by trimming the ends and cleaning the edges, without losing length." },
      photo: { src: "https://unsplash.com/photos/eSku_QvbiEs/download?w=900", credit: "Unsplash", href: "https://unsplash.com/photos/eSku_QvbiEs" } },
    { id: "fullbeard", group: "beard", fade: "low", top: 30, beard: "full", extras: ["towel"], weeks: 2,
      sq: "Mjekër e plotë", en: "Full beard",
      d: { sq: "Formohet me makinë dhe gërshërë, me vijë të pastër në faqe dhe në qafë. E plotë, por kurrë e çrregullt.",
           en: "Shaped with clippers and scissors, with clean cheek and neck lines. Full, but never messy." },
      photo: { src: "https://unsplash.com/photos/pp76Y6Fq6xw/download?w=900", credit: "Unsplash", href: "https://unsplash.com/photos/pp76Y6Fq6xw" } },
    { id: "shortbeard", group: "beard", fade: "taper", top: 30, beard: "short", extras: ["lineup"], weeks: 2,
      sq: "Mjekër e shkurtër", en: "Short beard",
      d: { sq: "Mjekër e shkurtër me konture të sakta me brisk. Duket e rregullt edhe kur rritet pak.",
           en: "A short beard with razor-sharp edges. Still looks neat as it grows." },
      photo: { src: "https://unsplash.com/photos/eIDpwjVLNSE/download?w=900", credit: "Unsplash", href: "https://unsplash.com/photos/eIDpwjVLNSE" } },
    { id: "shave", group: "beard", fade: "none", top: 30, beard: "none", extras: ["towel"], weeks: 1,
      sq: "Rruajtje me peshqir", en: "Hot towel shave",
      d: { sq: "Peshqiri i nxehtë hap poret, pastaj rruajtje me brisk të drejtë dhe balsam. Lëkura më e butë që do ta ndjesh.",
           en: "A hot towel opens the pores, then a straight-razor shave and balm. The smoothest your skin will feel." },
      photo: { src: "https://unsplash.com/photos/Twd3yaqA2NM/download?w=900", credit: "Arthur Humeau / Unsplash", href: "https://unsplash.com/photos/Twd3yaqA2NM" } }
  ],

  // Photos: put files in assets/img/ and list them here, e.g. "assets/img/cut-1.jpg".
  photos: {
    gallery: []           // e.g. ["assets/img/cut-1.jpg", "assets/img/cut-2.jpg", ...]
  }
};
