/*
 * Draws the Fade Lab client: a front-facing head in a striped barber cape.
 * renderHead({ fade, top, beard, extras }, uid) returns an SVG string.
 * `uid` keeps gradient/pattern ids unique when several heads are on the page.
 */
(() => {
  "use strict";

  const SKIN = "#d9a67c";
  const SKIN_SHADE = "#bf8c64";
  const HAIR = "#1c1612";
  const HAIR_LIGHT = "#4a3a2e";
  const BONE = "#efe8dc";
  const RED = "#d23b2a";
  const BLUE = "#2848a8";
  const HEAD = "M110 190 C110 120 150 88 200 88 C250 88 290 120 290 190 C290 250 280 285 250 305 C232 318 216 322 200 322 C184 322 168 318 150 305 C120 285 110 250 110 190 Z";

  // Where the sides go from hair to skin, as fractions of the side height (top → ear).
  const FADES = {
    none:  [0.84, 1.0],
    taper: [0.7, 0.97],
    low:   [0.6, 0.88],
    mid:   [0.42, 0.74],
    high:  [0.24, 0.56],
    skin:  [0.14, 0.42]
  };

  function renderHead(state, uid) {
    const s = Object.assign({ fade: "mid", top: 30, beard: "none", extras: [] }, state);
    const ex = new Set(s.extras);
    const H = Math.max(0, Math.min(80, s.top)) * 0.72;
    const [hairEnd, skinStart] = FADES[s.fade] || FADES.mid;
    const sideAlpha = s.top < 8 && s.fade === "none" ? 0.62 : 0.97;
    const id = (n) => `${n}-${uid}`;
    // optional guide line showing where the fade starts (used by "Fade 101")
    const my = 96 + ((hairEnd + skinStart) / 2) * 160;
    const marker = s.marker
      ? `<g stroke="${RED}" stroke-width="3" stroke-dasharray="6 5" stroke-linecap="round">
          <path d="M84 ${my} H140"/><path d="M260 ${my} H316"/>
        </g><circle cx="84" cy="${my}" r="5" fill="${RED}"/><circle cx="316" cy="${my}" r="5" fill="${RED}"/>`
      : "";

    const top = `M112 184
      C105 ${128 - H * 0.6} 146 ${84 - H} 200 ${82 - H}
      C254 ${84 - H} 295 ${128 - H * 0.6} 288 184
      L279 176 C268 152 238 140 200 142 C162 140 132 152 121 176 Z`;

    let strands = "";
    if (H > 6) {
      for (let k = -3; k <= 3; k++) {
        const x0 = 200 + k * 21;
        const y0 = 146 + Math.abs(k) * 5;
        strands += `<path d="M${x0} ${y0} Q${x0 + k * 5 - 6} ${118 - H * 0.6} ${x0 + k * 9 + 10} ${92 - H * 0.92}" />`;
      }
    }

    const f = s.beard === "full" ? 26 : 0;
    const beardPath = `M110 196
      C110 250 122 288 150 ${308 + f * 0.5}
      C168 ${322 + f} 186 ${328 + f} 200 ${330 + f}
      C214 ${328 + f} 232 ${322 + f} 250 ${308 + f * 0.5}
      C278 288 290 250 290 196
      L278 196 C276 236 262 258 242 266 C228 272 214 268 200 268
      C186 268 172 272 158 266 C138 258 124 236 122 196 Z`;
    const moustache = "M171 262 C184 251 196 255 200 259 C204 255 216 251 229 262 C219 267 208 267 200 264 C192 267 181 267 171 262 Z";
    const beardAlpha = { none: 0, stubble: 0.26, short: 0.92, full: 1 }[s.beard] ?? 0;

    let beard = "";
    if (beardAlpha) {
      beard = `<g fill="${HAIR}" opacity="${beardAlpha}">
        <path d="${beardPath}" ${s.beard === "stubble" ? `fill="url(#${id("stub")})"` : ""}/>
        <path d="${moustache}" />
      </g>`;
      if (s.beard !== "stubble") beard += `<ellipse cx="200" cy="282" rx="19" ry="9" fill="${SKIN}" />`;
      if (s.beard === "full") {
        beard += `<g stroke="${HAIR_LIGHT}" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round">
          <path d="M150 300 q8 14 22 22"/><path d="M250 300 q-8 14 -22 22"/><path d="M200 300 v40"/>
        </g>`;
      }
    }

    const part = ex.has("part")
      ? `<path d="M126 168 Q134 ${128 - H * 0.35} 160 ${104 - H * 0.8}" stroke="${SKIN}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      : "";
    const lineup = ex.has("lineup")
      ? `<path d="M121 176 C132 152 162 140 200 142 C238 140 268 152 279 176" stroke="${BONE}" stroke-width="1.6" fill="none" stroke-dasharray="3 4" opacity=".9"/>`
      : "";
    const mask = ex.has("mask")
      ? `<path d="M168 196 Q200 186 232 196 L240 232 Q226 252 214 250 L200 256 L186 250 Q174 252 160 232 Z" fill="#141210" opacity=".62"/>`
      : "";
    const steam = ex.has("towel")
      ? `<g class="steam" stroke="${BONE}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75">
          <path d="M318 318 q-12 -16 0 -32 q12 -16 0 -32"/><path d="M342 330 q-12 -16 0 -32 q12 -16 0 -32"/><path d="M82 318 q12 -16 0 -32 q-12 -16 0 -32"/>
        </g>`
      : "";

    return `<svg viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
  <defs>
    <pattern id="${id("cape")}" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
      <rect width="30" height="30" fill="${BONE}"/><rect width="10" height="30" fill="${RED}"/><rect x="16" width="5" height="30" fill="${BLUE}"/>
    </pattern>
    <linearGradient id="${id("fade")}" gradientUnits="userSpaceOnUse" x1="0" y1="96" x2="0" y2="256">
      <stop offset="0" stop-color="${HAIR}" stop-opacity="${sideAlpha}"/>
      <stop offset="${hairEnd}" stop-color="${HAIR}" stop-opacity="${sideAlpha}"/>
      <stop offset="${(hairEnd + skinStart) / 2}" stop-color="${HAIR}" stop-opacity="${sideAlpha * 0.38}"/>
      <stop offset="${skinStart}" stop-color="${HAIR}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="${id("stub")}" width="5" height="5" patternUnits="userSpaceOnUse">
      <rect width="5" height="5" fill="${HAIR}" opacity=".5"/><circle cx="2.5" cy="2.5" r="1.3" fill="${HAIR}"/>
    </pattern>
    <mask id="${id("rim")}">
      <rect width="400" height="440" fill="#fff"/>
      <ellipse cx="200" cy="228" rx="67" ry="104" fill="#000"/>
    </mask>
    <clipPath id="${id("upper")}"><rect width="400" height="258"/></clipPath>
    <clipPath id="${id("top")}"><path d="${top}"/></clipPath>
  </defs>

  <path d="M24 440 C36 382 108 352 168 344 Q200 356 232 344 C292 352 364 382 376 440 Z" fill="url(#${id("cape")})"/>
  <path d="M170 286 L170 350 Q200 366 230 350 L230 286 Z" fill="${SKIN_SHADE}"/>
  <path d="M160 340 Q200 364 240 340 L246 356 Q200 384 154 356 Z" fill="${BONE}"/>

  <ellipse cx="108" cy="224" rx="15" ry="25" fill="${SKIN}"/>
  <ellipse cx="292" cy="224" rx="15" ry="25" fill="${SKIN}"/>
  <path d="M104 214 q8 10 2 22" stroke="${SKIN_SHADE}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M296 214 q-8 10 -2 22" stroke="${SKIN_SHADE}" stroke-width="3" fill="none" stroke-linecap="round"/>

  <path d="${HEAD}" fill="${SKIN}"/>

  <g clip-path="url(#${id("upper")})" mask="url(#${id("rim")})">
    <path d="${HEAD}" fill="url(#${id("fade")})"/>
  </g>

  <path d="${top}" fill="${HAIR}"/>
  ${marker}
  <g clip-path="url(#${id("top")})" stroke="${HAIR_LIGHT}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7">${strands}</g>
  ${part}
  ${lineup}

  <g stroke-linecap="round" fill="none">
    <path d="M150 188 Q166 179 183 186" stroke="${HAIR}" stroke-width="6"/>
    <path d="M217 186 Q234 179 250 188" stroke="${HAIR}" stroke-width="6"/>
    <path d="M154 207 Q166 214 178 207" stroke="#3a2a20" stroke-width="3"/>
    <path d="M222 207 Q234 214 246 207" stroke="#3a2a20" stroke-width="3"/>
    <path d="M201 206 Q198 232 191 244 Q199 251 209 246" stroke="${SKIN_SHADE}" stroke-width="3"/>
  </g>
  ${mask}
  ${beard}
  <path d="M184 278 Q200 287 216 278" stroke="#8c4a3a" stroke-width="4" fill="none" stroke-linecap="round"/>
  ${steam}
</svg>`;
  }

  window.renderHead = renderHead;
})();
