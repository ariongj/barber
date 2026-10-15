# Privé Hair Studio

Website for [Privé Hair Studio](https://www.instagram.com/privehairstudioks/), a barber studio in Kosovo.

A fast, single-page site with no build step and no dependencies. It is in **Albanian** by default, with an **English** toggle (the choice is remembered).

## What's on the page

- **Hero** with a live open/closed badge that uses the studio's hours in Kosovo time
- **Service menu** with prices, durations and category tabs. "Rezervo" on any service jumps to booking with that service picked.
- **Studio** section, the three-step "how it works", and a **work gallery** that links to Instagram
- **Booking form**: pick a service, a day (quick-pick chips for the next open days) and a free time slot. Slots follow the opening hours and the service length, and past times are hidden. A live summary shows the price.
  - If a WhatsApp number is set, the request opens in WhatsApp with the message written out.
  - Otherwise the message is copied and Instagram DMs open (`ig.me/m/privehairstudioks`), so booking works with only the Instagram account.
- **Hours & location** with today's row highlighted, Google Maps (shown once an address is set) and contact links
- Mobile booking bar, light motion (switched off for people who ask for reduced motion), keyboard accessible
- SEO: meta tags, social share image (`assets/og.png`) and `HairSalon` structured data built from the config

## Editing the details

Everything about the shop is in **`js/config.js`**:

| Field | What it does |
| --- | --- |
| `phone`, `whatsapp` | Show call/WhatsApp buttons; with `whatsapp` set, bookings go to WhatsApp |
| `address`, `city` | Show the address, directions link and the embedded map |
| `hours` | Opening hours per day (`null` = closed). Drives the open badge, hours table and booking slots |
| `services` | Name (sq/en), description, price in €, duration in minutes. `featured: true` highlights one |
| `photos` | Put images in `assets/img/` and list them: `hero`, `about`, and `gallery` (6 or more works best). Without photos the site shows designed artwork |
| `team` | Optional barbers; adds a team section and a "barber" choice in the booking form |

Empty fields are hidden automatically. Page text lives in `index.html` (Albanian) and `js/i18n.js` (English).

> The prices, durations and opening hours currently in `config.js` are **placeholders**. Replace them with the studio's real ones before going live.

## Running and publishing

Open `index.html` through any static server, e.g. `python3 -m http.server`, then visit http://localhost:8000.

For GitHub Pages: Settings → Pages → deploy from the `main` branch, root folder. `.nojekyll` is included so files are served as-is. If the site ends up on another address, update the `canonical` and `og:` URLs at the top of `index.html`.
