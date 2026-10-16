# Privé Hair Studio

Website for [Privé Hair Studio](https://www.instagram.com/privehairstudioks/), a barber studio in Kosovo.

A fast, single-page site with no build step and no dependencies. It is in **Albanian** by default, with an **English** toggle (the choice is remembered).

## What makes it different

- **Shave the screen.** The hero is covered in hair. Your cursor becomes a pair of clippers (on phones, swipe sideways). Cut enough and the rest falls away to reveal the striped Privé wordmark. On load, the clippers make one pass by themselves to show how it works, and "Grow it back" resets it.
- **Fade Lab.** Build a cut on an illustrated client: fade height, length on top, beard and extras. The drawing, price and duration update live, and "Book this cut" puts exactly that cut into the booking form.
- **Lookbook.** Ready-made looks (low fade, skin fade, taper & beard…) drawn by the same renderer. Drag or swipe through them, and "Try it" loads one into the Fade Lab.
- **Booking ticket.** Pick a service, a day and a free time slot. The slots follow the opening hours and the length of the service, and past times are hidden. A barber-style ticket with a number and barcode fills in as you go, then gets stamped when sent:
  - If a WhatsApp number is set, the request opens in WhatsApp with the message written out.
  - Otherwise the message is copied and Instagram DMs open (`ig.me/m/privehairstudioks`), so booking works with only the Instagram account.
- **Hours dial.** A 24-hour clock shows each day's opening hours and the current time in Kosovo. The header shows whether the studio is open right now.
- Smaller touches: a spinning barber-pole logo, a barber-pole scroll indicator, a ticker that speeds up as you scroll, a manifesto that lights up word by word, and magnetic buttons.

The site works on phones, can be used with a keyboard, and switches the motion off for people who ask their device for reduced motion. It includes search-engine data (`HairSalon` structured data), social share tags and `assets/og.png`.

## Editing the details

Everything about the shop is in **`js/config.js`**:

| Field | What it does |
| --- | --- |
| `phone`, `whatsapp` | Show call/WhatsApp buttons. With `whatsapp` set, bookings go to WhatsApp |
| `address`, `city` | Show the address and directions link, and embed Google Maps |
| `hours` | Opening hours per day (`null` = closed). Drives the open badge, the dial and the booking slots |
| `services` | The price list: name (sq/en), description, price in €, minutes. `featured: true` adds a "Signature" tag |
| `lab` | Fade Lab prices and times: base price per fade, scissor extra for long tops, beard styles, extras |
| `looks` | The lookbook cards and the settings each one loads into the Fade Lab |
| `photos.gallery` | Put photos in `assets/img/` and list them. They appear under the lookbook |

Empty fields are hidden automatically. Page text lives in `index.html` (Albanian) and `js/i18n.js` (English).

> The prices, durations and opening hours currently in `config.js` are **placeholders**. Replace them with the studio's real ones before going live.

## Files

```
index.html        page structure (Albanian text)
css/styles.css    all styling
js/config.js      shop details, prices, hours
js/i18n.js        English text + runtime strings
js/hair.js        the hair canvas in the hero
js/head.js        the illustrated client used by Fade Lab and the lookbook
js/main.js        everything else
```

## Running and publishing

Open the site through any static server, e.g. `python3 -m http.server`, then visit http://localhost:8000.

**GitHub Pages:** in the repository go to Settings → Pages. Under "Build and deployment", choose "Deploy from a branch", pick the branch and the `/ (root)` folder, and save. The site appears at `https://ariongj.github.io/barber/` after a minute. `.nojekyll` is included so files are served as-is. If the site ends up on another address (for example a custom domain), update the `canonical` and `og:` URLs at the top of `index.html`.
