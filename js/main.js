(() => {
  "use strict";

  const C = window.PRIVE;
  const EN = window.I18N.en;
  const DYN = window.I18N.dyn;
  const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? "");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const store = {
    get(k) { try { return localStorage.getItem("prive." + k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem("prive." + k, v); } catch { /* storage unavailable */ } }
  };

  let lang = store.get("lang") === "en" ? "en" : "sq";
  const t = (k) => DYN[lang][k];
  const local = (o) => (o && typeof o === "object" ? o[lang] ?? o.sq : o);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const smooth = reduceMotion ? "auto" : "smooth";

  const igUrl = `https://www.instagram.com/${C.instagram}/`;
  const igDm = `https://ig.me/m/${C.instagram}`;
  const waNumber = (C.whatsapp || "").replace(/\D/g, "");
  const telHref = C.phone ? "tel:" + C.phone.replace(/[^\d+]/g, "") : "";
  const place = [C.address, C.city].filter(Boolean).join(", ");
  const mapsQuery = C.mapsQuery || (place ? `${C.name}, ${place}` : "");
  const price = (n) => `${n} ${C.currency}`;

  const ICON = {
    phone: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    wa: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/></svg>',
    ig: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    pin: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    arrow: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    diag: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>'
  };

  /* ======================================================================
     Time in the shop's time zone
     ====================================================================== */
  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const hoursFor = (dow) => {
    const h = C.hours[DAY_KEYS[dow]];
    return h ? { open: toMin(h[0]), close: toMin(h[1]) } : null;
  };
  const ymdToUTC = (ymd) => { const [y, m, d] = ymd.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  const dowOf = (ymd) => new Date(ymdToUTC(ymd)).getUTCDay();
  const addDays = (ymd, n) => new Date(ymdToUTC(ymd) + n * 864e5).toISOString().slice(0, 10);

  function shopNow() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: C.timezone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
    const ymd = `${p.year}-${p.month}-${p.day}`;
    return { ymd, dow: dowOf(ymd), min: Number(p.hour) * 60 + Number(p.minute) };
  }
  const fmtDate = (ymd) => {
    const [, m, d] = ymd.split("-").map(Number);
    return `${t("days")[dowOf(ymd)]}, ${d} ${t("months")[m - 1]}`;
  };

  /* ======================================================================
     Language
     ====================================================================== */
  function applyLang(next) {
    lang = next;
    store.set("lang", lang);
    document.documentElement.lang = lang;

    $$("[data-i18n]").forEach((el) => {
      if (el.dataset.sq === undefined) el.dataset.sq = el.textContent;
      el.textContent = lang === "sq" ? el.dataset.sq : EN[el.dataset.i18n] ?? el.dataset.sq;
    });
    $$("[data-i18n-html]").forEach((el) => {
      if (el.dataset.sq === undefined) el.dataset.sq = el.innerHTML;
      el.innerHTML = lang === "sq" ? el.dataset.sq : EN[el.dataset.i18nHtml] ?? el.dataset.sq;
    });
    $$("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        const k = "sq" + attr.replace(/\W/g, "");
        if (el.dataset[k] === undefined) el.dataset[k] = el.getAttribute(attr) || "";
        el.setAttribute(attr, lang === "sq" ? el.dataset[k] : EN[key] ?? el.dataset[k]);
      });
    });
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    $$(".hero__title .line").forEach((l) => (l.innerHTML = `<span>${l.innerHTML}</span>`));
    renderAll();
  }

  /* ======================================================================
     Open / closed
     ====================================================================== */
  function statusInfo() {
    const now = shopNow();
    const today = hoursFor(now.dow);
    if (today && now.min >= today.open && now.min < today.close) {
      const soon = today.close - now.min <= 60;
      return { state: soon ? "soon" : "open", text: fill(t(soon ? "closingSoon" : "open"), { t: fmtMin(today.close) }) };
    }
    if (today && now.min < today.open) return { state: "closed", text: fill(t("opensToday"), { t: fmtMin(today.open) }) };
    for (let i = 1; i <= 7; i++) {
      const dow = (now.dow + i) % 7;
      const h = hoursFor(dow);
      if (h) return { state: "closed", text: fill(t("closed"), { d: (i === 1 ? t("tomorrow") : t("days")[dow]).toLowerCase(), t: fmtMin(h.open) }) };
    }
    return { state: "closed", text: t("closedDay") };
  }
  function renderStatus() {
    const s = statusInfo();
    const el = $("#statusHeader");
    el.dataset.state = s.state;
    $("span", el).textContent = s.text;
  }

  /* ======================================================================
     Hero: a black curtain lifts to reveal the barber-pole colours
     ====================================================================== */
  const hero = $(".hero");
  let curtain = true;

  function openHero() {
    hero.classList.add("is-open");
    // drop the curtain panels from the page once they have lifted
    setTimeout(() => $(".hero__curtain")?.remove(), 1600);
  }

  function setupHero() {
    // skip the curtain when motion is reduced, or when the page opens scrolled past the hero
    if (reduceMotion || scrollY > innerHeight * 0.5) {
      curtain = false;
      hero.classList.add("is-open", "is-instant");
      $(".hero__curtain")?.remove();
    }
  }

  /* ======================================================================
     Loader
     ====================================================================== */
  function finishLoading() {
    const loader = $("#loader");
    const started = performance.now();
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 1400))]).then(() => {
      const wait = Math.max(0, 750 - (performance.now() - started));
      setTimeout(() => {
        loader.classList.add("is-done");
        document.body.classList.remove("is-loading");
        setTimeout(() => loader.remove(), 800);
        if (curtain) setTimeout(openHero, 650);
      }, reduceMotion ? 0 : wait);
    });
  }

  /* ======================================================================
     Manifesto: words light up as you scroll
     ====================================================================== */
  const manifesto = $("#manifesto");
  let mWords = [], mLit = 0;
  function splitManifesto() {
    const words = manifesto.textContent.trim().split(/\s+/);
    manifesto.innerHTML = words.map((w) => `<span class="w">${esc(w)}</span>`).join(" ");
    mWords = Array.from(manifesto.children);
    mLit = 0;
    updateManifesto();
  }
  function updateManifesto() {
    if (!mWords.length) return;
    const r = manifesto.getBoundingClientRect();
    const vh = innerHeight;
    const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3), 0, 1);
    const n = Math.round(p * mWords.length);
    if (n === mLit) return;
    const [a, b] = n > mLit ? [mLit, n] : [n, mLit];
    for (let i = a; i < b; i++) mWords[i].classList.toggle("on", i < n);
    mLit = n;
  }

  /* ======================================================================
     Fade Lab
     ====================================================================== */
  const L = C.lab;
  const lab = { fade: "mid", top: 30, beard: "none", extras: new Set() };
  let labTouched = false;
  let shownPrice = null;

  function quote(s) {
    const fade = L.fades.find((f) => f.id === s.fade) || L.fades[0];
    const lines = [{ label: local(fade), price: fade.price, min: fade.min }];
    if (s.top >= L.longTop.from) lines.push({ label: t("labTopExtra"), price: L.longTop.price, min: L.longTop.min });
    const beard = L.beards.find((b) => b.id === s.beard);
    if (beard && beard.price) lines.push({ label: `${lang === "sq" ? "Mjekra" : "Beard"}: ${local(beard)}`, price: beard.price, min: beard.min });
    L.extras.forEach((x) => { if (s.extras.has ? s.extras.has(x.id) : s.extras.includes(x.id)) lines.push({ label: local(x), price: x.price, min: x.min }); });
    return {
      lines,
      price: lines.reduce((a, l) => a + l.price, 0),
      min: lines.reduce((a, l) => a + l.min, 0)
    };
  }
  const labState = () => ({ fade: lab.fade, top: lab.top, beard: lab.beard, extras: [...lab.extras] });
  const labSummary = () => {
    const fade = L.fades.find((f) => f.id === lab.fade);
    return `${local(fade)} · ${lab.top} mm`;
  };

  function renderLabControls() {
    $("#labFade").setAttribute("role", "radiogroup");
    $("#labFade").innerHTML = L.fades.map((f) =>
      `<button type="button" role="radio" aria-checked="${f.id === lab.fade}" data-fade="${f.id}">${esc(local(f))}</button>`).join("");
    $("#labBeard").setAttribute("role", "radiogroup");
    $("#labBeard").innerHTML = L.beards.map((b) =>
      `<button type="button" role="radio" aria-checked="${b.id === lab.beard}" data-beard="${b.id}">${esc(local(b))}${b.price ? `<small>+${price(b.price)}</small>` : ""}</button>`).join("");
    $("#labExtras").innerHTML = L.extras.map((x) =>
      `<button type="button" class="chip" aria-pressed="${lab.extras.has(x.id)}" data-extra="${x.id}">${esc(local(x))} <small>+${price(x.price)}</small></button>`).join("");
  }

  function animateNumber(el, from, to) {
    if (reduceMotion || from === null || from === to) { el.textContent = to; return; }
    const start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / 450);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function updateLab(changed) {
    $("#labTag").textContent = labSummary();
    updateLabPhoto(changed);
    $("#labTopOut").textContent = lab.top + " mm";
    const range = $("#labTop");
    range.value = lab.top;
    range.style.setProperty("--p", (lab.top / 80) * 100 + "%");

    const q = quote(lab);
    const prevLabels = new Set($$("#labLines li").map((li) => li.dataset.k));
    $("#labLines").innerHTML = q.lines.map((l) =>
      `<li data-k="${esc(l.label)}"${changed && !prevLabels.has(l.label) ? ' class="is-new"' : ""}><span>${esc(l.label)}</span><span>${price(l.price)}</span></li>`).join("");
    animateNumber($("#labPrice"), shownPrice, q.price);
    shownPrice = q.price;
    $("#labMin").textContent = `${q.min} ${t("min")}`;

  }

  /* ---------- Fade Lab photos ---------- */
  // photo entries are a path/URL or { src, credit, href }
  const photoOf = (v) => (typeof v === "string" ? { src: v } : v || {});
  const mapPhotos = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, photoOf(v)]));
  const labPhotoInfo = mapPhotos(C.lab.photos && C.lab.photos.fades);
  const beardPhotoInfo = mapPhotos(C.lab.photos && C.lab.photos.beards);

  // Each photo gets its own <img> in the stage, created once and kept, so
  // switching between fades is instant once a photo has loaded.
  const photoBox = $("#labPhotos");
  photoBox.innerHTML = "";
  const photoEls = new Map();
  let currentPhoto = "";
  const loaded = (img) => img.complete && img.naturalWidth > 0;

  function photoEl(src) {
    let img = photoEls.get(src);
    if (!img) {
      img = new Image();
      img.alt = "";
      img.decoding = "async";
      img.addEventListener("error", () => {
        img.dataset.failed = "1";
        if (src === currentPhoto) updateLabPhoto();
      });
      img.src = src;
      photoBox.appendChild(img);
      photoEls.set(src, img);
    }
    return img;
  }

  function updateLabPhoto(changed) {
    const stage = $("#labStage");
    const info = labPhotoInfo[lab.fade] || {};
    const fade = L.fades.find((f) => f.id === lab.fade);
    const cap = $("#labCaption");
    $("b", cap).textContent = local(fade);
    if (changed) {
      cap.classList.remove("is-swap");
      void cap.offsetWidth;
      cap.classList.add("is-swap");
    }
    const credit = $("#labCredit");
    credit.hidden = !info.credit;
    credit.textContent = info.credit ? "· " + info.credit : "";
    if (info.href) credit.href = info.href; else credit.removeAttribute("href");

    currentPhoto = info.src || "";
    const img = info.src ? photoEl(info.src) : null;
    const ok = img && !img.dataset.failed;
    stage.classList.toggle("is-photo", !!ok);
    if (ok) {
      const show = () => {
        if (currentPhoto !== info.src) return;
        photoEls.forEach((el) => el.classList.toggle("is-on", el === img));
        stage.classList.remove("is-loading");
      };
      if (loaded(img)) show();
      else {
        stage.classList.add("is-loading");
        img.addEventListener("load", show, { once: true });
      }
    } else {
      stage.classList.remove("is-loading");
      photoEls.forEach((el) => el.classList.remove("is-on"));
    }

    const beard = photoOf(beardPhotoInfo[lab.beard]);
    const pic = $("#labBeardPic");
    const showBeard = lab.beard !== "none" && !!beard.src;
    pic.hidden = !showBeard;
    if (showBeard) {
      const bimg = $("img", pic);
      if (bimg.getAttribute("src") !== beard.src) {
        bimg.onerror = () => { pic.hidden = true; };
        bimg.src = beard.src;
      }
      $("figcaption", pic).textContent = local(L.beards.find((x) => x.id === lab.beard));
    }
  }

  // Load every Fade Lab photo in the background once the page has settled,
  // so a click on any fade shows its photo straight away.
  function preloadLabPhotos() {
    const go = () => {
      Object.values(labPhotoInfo).forEach((i) => i.src && photoEl(i.src));
      Object.values(beardPhotoInfo).forEach((i) => {
        if (!i.src) return;
        const img = new Image();
        img.decoding = "async";
        img.src = i.src;
      });
    };
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
    if (document.readyState === "complete") idle(go);
    else window.addEventListener("load", () => idle(go), { once: true });
  }

  function touchLab() {
    labTouched = true;
  }

  $("#labFade").addEventListener("click", (e) => {
    const b = e.target.closest("[data-fade]");
    if (!b) return;
    lab.fade = b.dataset.fade;
    $$("#labFade [data-fade]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    touchLab();
    updateLab(true);
  });
  $("#labBeard").addEventListener("click", (e) => {
    const b = e.target.closest("[data-beard]");
    if (!b) return;
    lab.beard = b.dataset.beard;
    $$("#labBeard [data-beard]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    touchLab();
    updateLab(true);
  });
  $("#labExtras").addEventListener("click", (e) => {
    const b = e.target.closest("[data-extra]");
    if (!b) return;
    const id = b.dataset.extra;
    lab.extras.has(id) ? lab.extras.delete(id) : lab.extras.add(id);
    b.setAttribute("aria-pressed", String(lab.extras.has(id)));
    touchLab();
    updateLab(true);
  });
  // radio-group arrow keys
  ["#labFade", "#labBeard"].forEach((sel) => {
    $(sel).addEventListener("keydown", (e) => {
      if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
      e.preventDefault();
      const items = $$("[role=radio]", $(sel));
      const i = items.findIndex((x) => x.getAttribute("aria-checked") === "true");
      const n = items[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
      n.click();
      n.focus();
    });
  });
  let rangeRaf;
  $("#labTop").addEventListener("input", (e) => {
    lab.top = Number(e.target.value);
    touchLab();
    cancelAnimationFrame(rangeRaf);
    rangeRaf = requestAnimationFrame(() => updateLab(false));
  });
  $("#labDice").addEventListener("click", () => {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    lab.fade = pick(L.fades).id;
    lab.top = Math.round(Math.random() * 16) * 5;
    lab.beard = pick(L.beards).id;
    lab.extras = new Set(L.extras.filter(() => Math.random() < 0.3).map((x) => x.id));
    touchLab();
    renderLabControls();
    updateLab(true);
  });
  $("#labBook").addEventListener("click", () => goBook(labBookUrl(lab)));

  function loadLook(id) {
    const look = C.looks.find((l) => l.id === id);
    if (!look) return;
    Object.assign(lab, { fade: look.fade, top: look.top, beard: look.beard, extras: new Set(look.extras) });
    touchLab();
    renderLabControls();
    updateLab(true);
    $("#lab").scrollIntoView({ behavior: smooth });
  }

  /* ======================================================================
     Lookbook
     ====================================================================== */
  let lookGroup = "all";
  const lookById = (id) => C.looks.find((l) => l.id === id);
  const visibleLooks = () => C.looks.filter((l) => lookGroup === "all" || l.group === lookGroup);
  const lookNo = (l) => String(C.looks.indexOf(l) + 1).padStart(2, "0");
  const upkeepText = (l) => (l.weeks ? (l.weeks === 1 ? t("upkeep1") : fill(t("upkeep"), { n: l.weeks })) : "");
  const CLOCK = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  function renderLookFilters() {
    const groups = [["all", t("all"), C.looks.length], ...Object.entries(C.lookGroups || {}).map(([k, v]) =>
      [k, local(v), C.looks.filter((l) => l.group === k).length])].filter((g) => g[2]);
    $("#looksFilters").innerHTML = groups.map(([k, label, n]) =>
      `<button type="button" class="pill" data-group="${k}" aria-pressed="${k === lookGroup}">${esc(label)}<small>${n}</small></button>`).join("");
  }

  // When a photo is missing or fails, the card shows the style name on a striped panel.
  const placeholder = (l) => `<span class="look__ph"><span>${esc(local(l))}</span></span>`;

  function lookCard(l, copy) {
    const q = quote({ ...l, extras: l.extras });
    const ph = photoOf(l.photo);
    const group = C.lookGroups && C.lookGroups[l.group];
    const tab = copy ? ' tabindex="-1"' : "";
    return `<article class="look" data-id="${esc(l.id)}"${copy ? ' aria-hidden="true"' : ""}>
        <div class="look__art">
          ${ph.src ? `<img src="${esc(ph.src)}" alt="${esc(local(l))}" loading="lazy" decoding="async" draggable="false" />` : placeholder(l)}
          <span class="look__n">${lookNo(l)}</span>
          ${group ? `<span class="look__group">${esc(local(group))}</span>` : ""}
          ${ph.src && ph.credit ? `<a class="look__credit" href="${esc(ph.href || ph.src)}" target="_blank" rel="noopener"${tab}>${esc(ph.credit)}</a>` : ""}
        </div>
        <div class="look__body">
          <h3 class="look__name">${esc(local(l))}</h3>
          ${l.d ? `<p class="look__desc">${esc(local(l.d))}</p>` : ""}
          ${l.weeks ? `<p class="look__upkeep">${CLOCK}${esc(upkeepText(l))}</p>` : ""}
          <div class="look__meta"><span>${q.min} ${t("min")}</span><b>${price(q.price)}</b></div>
          <button type="button" class="look__try" data-open="${esc(l.id)}"${tab}>${esc(t("learnMore"))}${ICON.arrow}</button>
        </div>
      </article>`;
  }

  /* ---------- the moving catalogue: an endless, full-width loop ---------- */
  const rail = $("#looksRail");
  const marquee = { x: 0, setW: 0, step: 320, speed: 0, vel: 0, drag: null, tween: null, inView: false, hover: false, holdUntil: 0, raf: 0, last: 0, count: 0 };

  function renderLooks() {
    renderLookFilters();
    const looks = visibleLooks();
    marquee.count = looks.length;
    const one = looks.map((l) => lookCard(l, false)).join("");
    const copyHtml = looks.map((l) => lookCard(l, true)).join("");
    rail.innerHTML = one;
    // enough copies that the loop never shows a gap, even on wide screens
    const track = $("#looksTrack");
    const setW = rail.scrollWidth + 18;
    const copies = Math.max(3, Math.ceil((track.clientWidth * 3) / Math.max(setW, 1)));
    rail.innerHTML = one + copyHtml.repeat(copies - 1);
    measureMarquee();
    // start mid-flow: the first card slightly cut at the left edge, cards filling the width
    marquee.x = -marquee.setW - marquee.step * 0.22;
    marquee.vel = 0;
    marquee.tween = null;
    applyMarquee();
    renderFade101();
    if (sheetId && !lookById(sheetId)) closeSheet();

    const photos = $("#photos");
    if (C.photos.gallery.length) {
      photos.hidden = false;
      photos.innerHTML = `<h3>${esc(t("photosTitle"))}</h3><div class="photos__grid">${C.photos.gallery.map((src, i) =>
        `<a class="shot" href="${igUrl}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="${esc(C.name)} · ${i + 1}" loading="lazy" /></a>`).join("")}</div>`;
    }
  }

  function measureMarquee() {
    const kids = rail.children;
    const n = marquee.count;
    marquee.setW = kids[n] ? kids[n].offsetLeft - kids[0].offsetLeft : rail.scrollWidth;
    marquee.step = kids[1] ? kids[1].offsetLeft - kids[0].offsetLeft : 320;
  }

  // keep the visible part inside the copies; returns how far it jumped
  function wrapMarquee() {
    const w = marquee.setW;
    if (!w) return 0;
    let shift = 0;
    while (marquee.x <= -2 * w) { marquee.x += w; shift += w; }
    while (marquee.x > -w) { marquee.x -= w; shift -= w; }
    return shift;
  }

  function applyMarquee() {
    rail.style.transform = `translate3d(${marquee.x.toFixed(2)}px, 0, 0)`;
  }

  // A small visual guide: real photos of each fade height with a gauge showing where the blend starts.
  function renderFade101() {
    const fades = [["low", 0.25], ["mid", 0.5], ["high", 0.75], ["skin", 0.25]];
    $("#fade101").innerHTML = `
      <div class="fade101__head"><h3>${esc(t("f101Title"))}</h3><p>${esc(t("f101Lead"))}</p></div>
      <div class="fade101__row">${fades.map(([f, h], i) => {
        const name = local(L.fades.find((x) => x.id === f));
        const ph = labPhotoInfo[f] || {};
        return `<button type="button" class="fade101__item" data-fade101="${f}">
          <span class="fade101__art">
            ${ph.src ? `<img src="${esc(ph.src)}" alt="${esc(name)}" loading="lazy" decoding="async" />` : ""}
            <span class="gauge${f === "skin" ? " gauge--skin" : ""}" style="--h:${h}" aria-hidden="true"><i></i></span>
          </span>
          <span class="fade101__n">0${i + 1}</span>
          <b>${esc(name)}</b><small>${esc(t("f101")[f])}</small>
        </button>`;
      }).join("")}</div>`;
  }

  /* ---------- style guide panel ---------- */
  let sheetId = null, sheetReturn = null;
  function openSheet(id) {
    const l = lookById(id);
    if (!l) return;
    if (!sheetId) sheetReturn = document.activeElement;
    sheetId = id;
    const list = visibleLooks();
    const pos = list.indexOf(l);
    const ph = photoOf(l.photo);
    const group = C.lookGroups && C.lookGroups[l.group];
    const q = quote({ ...l, extras: l.extras });
    $("#sheetPanel").innerHTML = `
      <button type="button" class="sheet__close" data-close aria-label="${esc(t("close"))}">×</button>
      <div class="sheet__media">
        ${ph.src ? `<img src="${esc(ph.src)}" alt="${esc(local(l))}" />` : placeholder(l)}
        ${group ? `<span class="look__group">${esc(local(group))}</span>` : ""}
        ${ph.credit ? `<a class="look__credit" href="${esc(ph.href || ph.src)}" target="_blank" rel="noopener">${esc(ph.credit)}</a>` : ""}
      </div>
      <div class="sheet__body">
        <p class="sheet__n">${lookNo(l)} · ${esc(group ? local(group) : "")}</p>
        <h3 class="sheet__title" id="sheetTitle">${esc(local(l))}</h3>
        <p class="sheet__desc">${esc(local(l.d))}</p>
        <dl class="sheet__facts">
          ${l.ask ? `<div><dt>${esc(t("askTitle"))}</dt><dd>${esc(local(l.ask))}</dd></div>` : ""}
          ${l.suits ? `<div><dt>${esc(t("suitsTitle"))}</dt><dd>${esc(local(l.suits))}</dd></div>` : ""}
          ${l.how ? `<div><dt>${esc(t("howTitle"))}</dt><dd>${esc(local(l.how))}</dd></div>` : ""}
        </dl>
        <div class="sheet__meta">
          ${l.weeks ? `<span>${CLOCK}${esc(upkeepText(l))}</span>` : ""}
          <span>${q.min} ${t("min")}</span>
          <b>${price(q.price)}</b>
        </div>
        <div class="sheet__actions">
          <button type="button" class="btn btn--red btn--lg" data-sheet-book>${esc(t("bookStyle"))}${ICON.arrow}</button>
          <button type="button" class="btn btn--line btn--lg" data-sheet-lab>${esc(t("tryIt"))}</button>
        </div>
        <div class="sheet__nav">
          <button type="button" class="round round--dark" data-sheet-step="-1" aria-label="${esc(t("prevStyle"))}"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>
          <span>${pos + 1} / ${list.length}</span>
          <button type="button" class="round round--dark" data-sheet-step="1" aria-label="${esc(t("nextStyle"))}"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
        </div>
      </div>`;
    const sheet = $("#sheet");
    const wasHidden = sheet.hidden;
    sheet.hidden = false;
    document.body.classList.add("sheet-open");
    if (wasHidden) requestAnimationFrame(() => sheet.classList.add("is-on"));
    $(".sheet__close", sheet).focus({ preventScroll: true });
    $(".sheet__panel", sheet).scrollTop = 0;
  }
  function closeSheet() {
    const sheet = $("#sheet");
    if (sheet.hidden) return;
    sheetId = null;
    sheet.classList.remove("is-on");
    document.body.classList.remove("sheet-open");
    setTimeout(() => { if (!sheetId) sheet.hidden = true; }, 300);
    if (sheetReturn && sheetReturn.focus) sheetReturn.focus({ preventScroll: true });
  }
  function setupSheet() {
    const sheet = $("#sheet");
    sheet.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) return closeSheet();
      const step = e.target.closest("[data-sheet-step]");
      if (step) {
        const list = visibleLooks();
        const i = list.findIndex((l) => l.id === sheetId);
        const n = list[(i + Number(step.dataset.sheetStep) + list.length) % list.length];
        return openSheet(n.id);
      }
      if (e.target.closest("[data-sheet-lab]")) {
        const id = sheetId;
        closeSheet();
        return loadLook(id);
      }
      if (e.target.closest("[data-sheet-book]")) {
        goBook(bookUrl({ look: sheetId }));
      }
    });
    document.addEventListener("keydown", (e) => {
      if (!sheetId) return;
      if (e.key === "Escape") closeSheet();
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const b = $(`[data-sheet-step="${e.key === "ArrowRight" ? 1 : -1}"]`, sheet);
        if (b && !e.target.closest("input, textarea")) b.click();
      }
      if (e.key === "Tab") {
        // keep focus inside the panel
        const f = $$("button, a[href]", $("#sheetPanel"));
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  function setupLookTrack() {
    const track = $("#looksTrack");
    const m = marquee;
    const BASE = () => (innerWidth < 700 ? 34 : 46); // px per second

    // a photo that fails to load is replaced by the striped name panel
    rail.addEventListener("error", (e) => {
      const img = e.target;
      if (img.tagName !== "IMG") return;
      const card = img.closest(".look");
      const look = card && lookById(card.dataset.id);
      if (!look) return;
      card.querySelector(".look__credit")?.remove();
      img.outerHTML = placeholder(look);
    }, true);

    // open the guide; a drag never counts as a click
    rail.addEventListener("click", (e) => {
      if (track.classList.contains("is-drag")) { e.preventDefault(); e.stopPropagation(); return; }
      if (e.target.closest(".look__credit")) return;
      const card = e.target.closest(".look");
      if (card) openSheet(card.dataset.id);
    });

    $("#looksFilters").addEventListener("click", (e) => {
      const b = e.target.closest("[data-group]");
      if (!b || b.dataset.group === lookGroup) return;
      lookGroup = b.dataset.group;
      renderLooks();
      kick();
    });
    $("#fade101").addEventListener("click", (e) => {
      const b = e.target.closest("[data-fade101]");
      if (!b) return;
      Object.assign(lab, { fade: b.dataset.fade101, top: 30, beard: "none", extras: new Set() });
      touchLab();
      renderLabControls();
      updateLab(true);
      $("#lab").scrollIntoView({ behavior: smooth });
    });

    // arrows and keys glide one card
    const glide = (dir) => {
      m.vel = 0;
      m.tween = { from: m.x, to: m.x - dir * m.step, t0: performance.now(), dur: 650 };
      m.holdUntil = Date.now() + 3500;
      kick();
    };
    $("#looksPrev").addEventListener("click", () => glide(-1));
    $("#looksNext").addEventListener("click", () => glide(1));
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); glide(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); glide(-1); }
    });

    // drag (mouse) and swipe (touch); vertical swipes still scroll the page
    track.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      m.tween = null;
      m.vel = 0;
      m.drag = { id: e.pointerId, x0: e.clientX, start: m.x, lx: e.clientX, lt: performance.now(), v: 0, moved: false };
      kick();
    });
    window.addEventListener("pointermove", (e) => {
      const d = m.drag;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x0;
      if (!d.moved && Math.abs(dx) > 6) {
        d.moved = true;
        track.classList.add("is-drag");
        try { track.setPointerCapture(d.id); } catch { /* ignore */ }
      }
      if (!d.moved) return;
      const now = performance.now();
      const dt = Math.max(1, now - d.lt);
      d.v = 0.8 * ((e.clientX - d.lx) / dt) * 1000 + 0.2 * d.v;
      d.lx = e.clientX;
      d.lt = now;
      m.x = d.start + dx;
      d.start += wrapMarquee();
      applyMarquee();
    });
    const release = (e) => {
      const d = m.drag;
      if (!d || (e && e.pointerId !== d.id)) return;
      m.drag = null;
      if (d.moved) {
        m.vel = clamp(d.v, -2500, 2500);
        m.holdUntil = Date.now() + 2500;
        setTimeout(() => track.classList.remove("is-drag"), 0);
      }
      kick();
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);

    if (finePointer) {
      track.addEventListener("mouseenter", () => { m.hover = true; });
      track.addEventListener("mouseleave", () => { m.hover = false; kick(); });
    }
    track.addEventListener("focusin", () => { m.hover = true; });
    track.addEventListener("focusout", () => { m.hover = false; kick(); });

    function frame(now) {
      m.raf = 0;
      const dt = Math.min(0.05, (now - (m.last || now)) / 1000);
      m.last = now;
      const want = !reduceMotion && !m.hover && !m.drag && !m.tween && !sheetId && Date.now() >= m.holdUntil ? BASE() : 0;
      m.speed += (want - m.speed) * Math.min(1, dt * 3);

      if (m.tween) {
        const k = Math.min(1, (now - m.tween.t0) / m.tween.dur);
        const e = 1 - Math.pow(1 - k, 3);
        m.x = m.tween.from + (m.tween.to - m.tween.from) * e;
        if (k >= 1) m.tween = null;
      } else if (!m.drag) {
        m.x -= m.speed * dt;
        if (m.vel) {
          m.x += m.vel * dt;
          m.vel *= Math.pow(0.05, dt);
          if (Math.abs(m.vel) < 8) m.vel = 0;
        }
      }
      const shift = wrapMarquee();
      if (shift && m.tween) { m.tween.from += shift; m.tween.to += shift; }
      applyMarquee();

      const busy = m.tween || m.vel || m.drag || m.speed > 0.5 || want;
      if (m.inView && !document.hidden && busy) m.raf = requestAnimationFrame(frame);
      else m.last = 0;
    }
    function kick() {
      if (!m.raf && m.inView && !document.hidden) {
        m.last = 0;
        m.raf = requestAnimationFrame(frame);
      }
    }
    marquee.kick = kick;
    document.addEventListener("visibilitychange", kick);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { m.inView = e.isIntersecting; kick(); }).observe(track);
    } else {
      m.inView = true;
    }
    // card sizes follow the window width
    let rw = innerWidth, rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (Math.abs(innerWidth - rw) < 2) return;
        rw = innerWidth;
        renderLooks();
        kick();
      }, 200);
    });
    setInterval(kick, 1000); // resumes after holds and hovers end
  }

  /* ======================================================================
     Menu
     ====================================================================== */
  let menuCat = "all";
  function renderMenu() {
    const cats = [["all", t("all")], ...Object.entries(C.categories).map(([k, v]) => [k, local(v)])];
    $("#menuTabs").innerHTML = cats.map(([k, label]) =>
      `<button type="button" role="tab" aria-selected="${k === menuCat}" data-cat="${k}">${esc(label)}</button>`).join("");
    const items = C.services.filter((s) => menuCat === "all" || s.cat === menuCat);
    $("#menuList").innerHTML = items.map((s) => {
      const n = C.services.indexOf(s) + 1;
      return `<li class="row">
        <span class="row__n">${String(n).padStart(2, "0")}</span>
        <div>
          <h3 class="row__name">${esc(local(s))}${s.featured ? `<span class="tag">${esc(t("signature"))}</span>` : ""}</h3>
          <span class="row__desc">${esc(local(s.d))}</span>
        </div>
        <span class="row__min">${s.min} ${t("min")}</span>
        <div class="row__right">
          <span class="row__price">${price(s.price)}</span>
          <button type="button" class="row__book" data-book="${s.id}" aria-label="${esc(t("book") + ": " + local(s))}">${ICON.diag}</button>
        </div>
      </li>`;
    }).join("");
  }
  $("#menuTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    menuCat = b.dataset.cat;
    renderMenu();
    $(`#menuTabs [data-cat="${menuCat}"]`).focus();
  });
  $("#menuList").addEventListener("click", (e) => {
    const b = e.target.closest(".row") && $("[data-book]", e.target.closest(".row"));
    if (b) goBook(bookUrl({ s: b.dataset.book }));
  });

  /* ======================================================================
     Booking happens on book.html; these build the links that carry the choice
     ====================================================================== */
  const bookUrl = (q) => "book.html" + (q ? "?" + new URLSearchParams(q).toString() : "");
  const labBookUrl = (st) => bookUrl({ fade: st.fade, top: st.top, beard: st.beard, x: [...st.extras].join(",") });
  const goBook = (url) => { location.href = url; };

  /* ======================================================================
     Visit: hours dial, contact, map
     ====================================================================== */
  let dialDow = null;
  function renderDial() {
    const now = shopNow();
    if (dialDow === null) dialDow = now.dow;
    const h = hoursFor(dialDow);
    const cx = 150, r = 112, circ = 2 * Math.PI * r;
    const ticks = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 2 * Math.PI - Math.PI / 2;
      const major = i % 6 === 0;
      const r1 = 132, r2 = major ? 144 : 139;
      ticks.push(`<line class="${major ? "major" : ""}" x1="${cx + Math.cos(a) * r1}" y1="${cx + Math.sin(a) * r1}" x2="${cx + Math.cos(a) * r2}" y2="${cx + Math.sin(a) * r2}"/>`);
    }
    const labels = [0, 6, 12, 18].map((hh) => {
      const a = (hh / 24) * 2 * Math.PI - Math.PI / 2;
      return `<text x="${cx + Math.cos(a) * 92}" y="${cx + Math.sin(a) * 92}" text-anchor="middle" dominant-baseline="central">${String(hh).padStart(2, "0")}</text>`;
    }).join("");
    let arc = "";
    if (h) {
      const len = ((h.close - h.open) / 1440) * circ;
      const rot = (h.open / 1440) * 360 - 90;
      arc = `<circle class="dial__arc" cx="${cx}" cy="${cx}" r="${r}" stroke-dasharray="${len} ${circ}" transform="rotate(${rot} ${cx} ${cx})"/>`;
    }
    let hand = "";
    if (dialDow === now.dow) {
      const a = (now.min / 1440) * 2 * Math.PI - Math.PI / 2;
      hand = `<line class="dial__hand" x1="${cx + Math.cos(a) * 96}" y1="${cx + Math.sin(a) * 96}" x2="${cx + Math.cos(a) * 128}" y2="${cx + Math.sin(a) * 128}"/><circle class="dial__pin" cx="${cx + Math.cos(a) * 112}" cy="${cx + Math.sin(a) * 112}" r="6"/>`;
    }
    const isToday = dialDow === now.dow;
    const st = isToday ? statusInfo() : null;
    $("#dial").innerHTML = `<svg viewBox="0 0 300 300" aria-hidden="true">
        <g class="dial__ticks">${ticks.join("")}</g>
        <g class="dial__labels">${labels}</g>
        <circle class="dial__track" cx="${cx}" cy="${cx}" r="${r}"/>
        ${arc}${hand}
      </svg>
      <div class="dial__center">
        <small>${esc(isToday ? t("today") : t("days")[dialDow])}</small>
        <b>${h ? `${fmtMin(h.open)}<br>${fmtMin(h.close)}` : esc(t("closedDay"))}</b>
        ${st ? `<span class="${st.state === "closed" ? "is-closed" : "is-open"}">${esc(st.text)}</span>` : ""}
      </div>`;

    const order = [1, 2, 3, 4, 5, 6, 0];
    $("#week").innerHTML = order.map((dow) => {
      const hh = hoursFor(dow);
      return `<button type="button" data-dow="${dow}" aria-pressed="${dow === dialDow}" class="${dow === now.dow ? "is-today" : ""}">
        ${esc(t("daysShort")[dow])}<small>${hh ? fmtMin(hh.open).slice(0, 2) + "–" + fmtMin(hh.close).slice(0, 2) : "—"}</small></button>`;
    }).join("");
  }
  $("#week").addEventListener("click", (e) => {
    const b = e.target.closest("[data-dow]");
    if (!b) return;
    dialDow = Number(b.dataset.dow);
    renderDial();
  });

  function renderContact() {
    const row = (icon, title, sub) => `<li><span class="contact__i">${icon}</span><div><b>${title}</b>${sub}</div></li>`;
    const rows = [];
    rows.push(place
      ? row(ICON.pin, esc(place), `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}" target="_blank" rel="noopener">${esc(t("directions"))} ↗</a>`)
      : row(ICON.pin, esc(C.city || "Kosovë"), `<span>${esc(t("addressSoon"))}</span>`));
    if (C.phone) rows.push(row(ICON.phone, esc(C.phone), `<a href="${telHref}">${esc(t("callUs"))}</a>`));
    if (waNumber) rows.push(row(ICON.wa, "WhatsApp", `<a href="https://wa.me/${waNumber}" target="_blank" rel="noopener">wa.me/${waNumber} ↗</a>`));
    rows.push(row(ICON.ig, "@" + esc(C.instagram), `<a href="${igUrl}" target="_blank" rel="noopener">Instagram ↗</a>`));
    $("#contactList").innerHTML = rows.join("");
    $$(".js-city").forEach((el) => (el.textContent = C.city || "Kosovë"));
  }

  function renderMap() {
    if (!mapsQuery || $("#map iframe")) return;
    $("#map").insertAdjacentHTML("afterbegin", `<iframe title="Google Maps · ${esc(C.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed"></iframe>`);
  }

  /* ======================================================================
     Toast
     ====================================================================== */
  let toastTimer;
  function toast(text) {
    const el = $("#toast");
    el.textContent = text;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("is-on"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("is-on");
      setTimeout(() => (el.hidden = true), 350);
    }, 4200);
  }

  /* ======================================================================
     Pointer effects: magnetic buttons and tilting cards
     ====================================================================== */
  function setupPointerFx() {
    if (!finePointer || reduceMotion) return;
    let mag = null;
    document.addEventListener("pointermove", (e) => {
      const m = e.target.closest ? e.target.closest("[data-magnetic]") : null;
      if (mag && mag !== m) mag.style.transform = "";
      mag = m;
      if (!m) return;
      const r = m.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      m.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
    }, { passive: true });

    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.transform = `rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg) translateY(-4px)`;
        card.style.setProperty("--mx", x * 100 + "%");
        card.style.setProperty("--my", y * 100 + "%");
      });
      card.addEventListener("pointerleave", () => (card.style.transform = ""));
    });
  }

  /* ======================================================================
     Scroll-driven bits: header, pole progress, ticker, manifesto, finale
     ====================================================================== */
  const header = $("#header");
  const pole = $(".pole-progress");
  const poleFill = $("#poleFill");
  const ticker = $("#ticker");
  const finaleWord = $(".finale__word");
  let lastY = scrollY, velocity = 0, tickX = 0, tickerOn = false, tickerRunning = false;
  let heroH = hero.offsetHeight, maxScroll = 1, manifestoOn = false, finaleOn = false, headerHidden = false, poleOn = false;
  const measure = () => {
    heroH = hero.offsetHeight;
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  };
  window.addEventListener("resize", () => { measure(); onScroll(); }, { passive: true });
  window.addEventListener("load", measure);
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(document.body);

  function onScroll() {
    // reads
    const y = scrollY;
    const dy = y - lastY;
    lastY = y;
    velocity += dy;
    const fr = finaleOn ? finaleWord.getBoundingClientRect() : null;
    if (manifestoOn) updateManifesto();

    // writes
    const menuOpen = document.body.classList.contains("menu-open");
    let hide = headerHidden;
    if (!menuOpen && y > heroH * 0.6 && dy > 4) hide = true;
    if (dy < -4 || y < heroH * 0.6 || menuOpen) hide = false;
    if (hide !== headerHidden) { headerHidden = hide; header.classList.toggle("is-hidden", hide); }

    poleFill.style.transform = `translate3d(0, ${(1 - clamp(y / maxScroll, 0, 1)) * 100}%, 0)`;
    const on = y > heroH * 0.5;
    if (on !== poleOn) { poleOn = on; pole.classList.toggle("is-on", on); }

    if (fr) finaleWord.style.transform = `translate3d(0, ${(fr.top - innerHeight) * -0.12}px, 0)`;
    if (tickerOn) startTicker();
  }
  let scrollRaf = 0;
  window.addEventListener("scroll", () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; onScroll(); });
  }, { passive: true });

  let tickerHalf = 0;
  function startTicker() {
    if (tickerRunning || reduceMotion || !tickerOn) return;
    tickerRunning = true;
    tickerHalf = ticker.scrollWidth / 2;
    requestAnimationFrame(tickerLoop);
  }
  function tickerLoop() {
    if (!tickerOn) { tickerRunning = false; return; }
    {
      velocity *= 0.9;
      const boost = clamp(Math.abs(velocity) * 0.06, 0, 8);
      const dir = velocity < -2 ? -1 : 1;
      tickX -= (0.7 + boost) * dir;
      const half = tickerHalf;
      if (half) {
        if (-tickX >= half) tickX += half;
        if (tickX > 0) tickX -= half;
      }
      const skew = clamp(velocity * 0.04, -8, 8);
      ticker.style.transform = `translate3d(${tickX}px, 0, 0) skewX(${-skew.toFixed(2)}deg)`;
    }
    requestAnimationFrame(tickerLoop);
  }

  /* ======================================================================
     Header menu, reveal, nav spy, dock
     ====================================================================== */
  const burger = $("#burger");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    if (open) header.classList.remove("is-hidden");
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $("#nav").addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  $$(".lang button").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));

  function setupObservers() {
    if (!("IntersectionObserver" in window)) {
      $$(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));

    const links = $$(".nav a[href^='#']:not(.btn)");
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["lab", "lookbook", "menu", "visit"].forEach((id) => spy.observe(document.getElementById(id)));

    new IntersectionObserver(([e]) => { tickerOn = e.isIntersecting; startTicker(); }).observe($(".ticker"));
    new IntersectionObserver(([e]) => { manifestoOn = e.isIntersecting; if (manifestoOn) updateManifesto(); }).observe(manifesto);
    new IntersectionObserver(([e]) => { finaleOn = e.isIntersecting; }).observe(finaleWord);

    const dock = $("#dock");
    new IntersectionObserver(([e]) => dock.classList.toggle("is-on", !e.isIntersecting), { rootMargin: "-50% 0px 0px 0px" }).observe(hero);
  }

  /* ======================================================================
     Structured data
     ====================================================================== */
  function injectSchema() {
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const data = {
      "@context": "https://schema.org",
      "@type": "HairSalon",
      name: C.name,
      url: location.origin + location.pathname,
      image: new URL("assets/og.png", location.href).href,
      sameAs: [igUrl],
      priceRange: "€",
      openingHoursSpecification: Object.entries(C.hours).filter(([, h]) => h).map(([k, h]) => ({
        "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/" + names[DAY_KEYS.indexOf(k)], opens: h[0], closes: h[1]
      })),
      makesOffer: C.services.map((s) => ({ "@type": "Offer", price: s.price, priceCurrency: "EUR", itemOffered: { "@type": "Service", name: s.sq } }))
    };
    if (C.phone) data.telephone = C.phone;
    if (place) data.address = { "@type": "PostalAddress", streetAddress: C.address, addressLocality: C.city, addressCountry: "XK" };
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
  }

  /* ======================================================================
     Render everything that depends on language
     ====================================================================== */
  function renderAll() {
    $$(".js-cur").forEach((el) => (el.textContent = " " + C.currency));
    renderStatus();
    splitManifesto();
    renderLabControls();
    updateLab(false);
    renderLooks();
    renderMenu();
    renderDial();
    renderContact();
  }

  /* ======================================================================
     Init
     ====================================================================== */
  $$(".js-ig").forEach((a) => (a.href = igUrl));
  if (C.phone) {
    const d = $(".js-dock-contact");
    d.href = telHref;
    d.removeAttribute("target");
    d.setAttribute("aria-label", C.phone);
    d.innerHTML = ICON.phone;
  }
  $("#year").textContent = new Date().getFullYear();

  setupHero();
  setupLookTrack();
  setupSheet();
  preloadLabPhotos();
  setupPointerFx();
  renderMap();
  applyLang(lang);
  setupObservers();
  injectSchema();
  measure();
  onScroll();
  finishLoading();
  setInterval(() => { renderStatus(); renderDial(); }, 60_000);
})();
