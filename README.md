# Privé Hair Studio

Website for [Privé Hair Studio](https://www.instagram.com/privehairstudioks/), a barber studio in Kosovo.

A fast, single-page site with no build step and no dependencies. It is in **Albanian** by default, with an **English** toggle (the choice is remembered).

## What makes it different

- **Black-to-barber-pole reveal.** The page opens on black. A moment after it loads, the black lifts away in panels with a red, white and blue edge, and the striped Privé wordmark rolls in. It goes straight to the striped wordmark for people who ask for reduced motion.
- **Fade Lab.** Build a cut on an illustrated client: fade height, length on top, beard and extras. The drawing, price and duration update live, and "Book this cut" puts exactly that cut into the booking form.
- **Style catalogue.** 18 styles in groups (Fade & taper, Classic, Short, Long, Beard) with filter buttons. Each card has a real photo, a short explanation of the style, how often it needs a touch-up, its time and price, and "Try it" to load it into the Fade Lab. The cards slide by themselves, pausing while someone hovers, swipes or reads. Below them, "Fade 101" shows the same client with a low, mid, high and skin fade, with a marker where each one starts.
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
| `lab.photos` | Real photos per fade and beard style (files in `assets/img/lab/`). When the chosen fade has one, the Fade Lab shows the photo, with a small drawing of the exact combination; otherwise it shows the drawing. Visitors can switch between Photo and Illustration |
| `lookGroups`, `looks` | The style catalogue: groups, and for each style its group, explanation (`d`), touch-up interval (`weeks`), photo with credit, and the settings "Try it" loads into the Fade Lab |
| `photos.gallery` | Put photos in `assets/img/` and list them. They appear under the lookbook |

Empty fields are hidden automatically. Page text lives in `index.html` (Albanian) and `js/i18n.js` (English).

> The prices, durations and opening hours currently in `config.js` are **placeholders**. Replace them with the studio's real ones before going live.

## Photo credits

The Fade Lab and the style catalogue use free stock photos as illustrative examples, each credited on the page: photos on [Unsplash](https://unsplash.com/license) (Unsplash License) and on Wikimedia Commons ([Fade Hair Cut](https://commons.wikimedia.org/wiki/File:Fade_Hair_Cut.jpg) by Truth678, CC BY-SA 4.0; [Hi-top fade](https://commons.wikimedia.org/wiki/File:Hi-top_fade.jpg) by Paul Uzzo). The full list with links is in `js/config.js`. Swap them for the studio's own work there (`lab.photos` and each look's `photo`).

## Files

```
index.html        page structure (Albanian text)
css/styles.css    all styling
js/config.js      shop details, prices, hours
js/i18n.js        English text + runtime strings
js/head.js        the illustrated client used by the Fade Lab, Fade 101 and as a photo fallback
js/main.js        everything else
```

## Running and publishing

Open the site through any static server, e.g. `python3 -m http.server`, then visit http://localhost:8000.

**GitHub Pages:** in the repository go to Settings → Pages. Under "Build and deployment", choose "Deploy from a branch", pick the branch and the `/ (root)` folder, and save. The site appears at `https://ariongj.github.io/barber/` after a minute. `.nojekyll` is included so files are served as-is. If the site ends up on another address (for example a custom domain), update the `canonical` and `og:` URLs at the top of `index.html`.
