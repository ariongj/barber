# Fade Lab photos

Drop real photos of the studio's work here. Any file names are fine.

Best results:

- One photo per fade style: classic (no fade), taper, low fade, mid fade, high fade, skin fade
- Optionally one per beard style: stubble, short beard, full beard
- Side or three-quarter view, so the fade is visible
- Portrait or square, at least 900 px wide, JPG

Then list each file in `js/config.js` under `lab.photos`, for example:

```js
photos: {
  fades:  { none: "", taper: "", low: "assets/img/lab/low-fade.jpg", mid: "", high: "", skin: "assets/img/lab/skin-fade.jpg" },
  beards: { stubble: "", short: "", full: "assets/img/lab/full-beard.jpg" }
},
```

A style without a photo keeps showing the illustration.
