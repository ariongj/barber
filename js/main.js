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
     Hero: shave the screen
     ====================================================================== */
  const hero = $(".hero");
  const clipper = $("#clipper");
  let hair = null;
  const THRESHOLD = 0.42;

  function setCut(p) {
    const pct = Math.round(clamp(p / THRESHOLD, 0, 1) * 100);
    $("#cutPct").textContent = pct + "%";
    $("#cutBar").style.strokeDashoffset = String(326.7 * (1 - pct / 100));
  }
  function renderHint() {
    const shaved = hero.classList.contains("is-shaved");
    $("#cutHint").textContent = shaved ? t("hintDone") : finePointer ? t("hintMouse") : t("hintTouch");
  }

  let buzzTimer;
  function moveClipper(x, y) {
    const angle = clamp((x - (moveClipper.lx ?? x)) * 1.6, -28, 28);
    moveClipper.lx = x;
    clipper.style.transform = `translate(${x - 19}px, ${y - 8}px) rotate(${angle}deg)`;
  }
  function buzz() {
    if (!clipper.classList.contains("is-buzz")) clipper.classList.add("is-buzz");
    clearTimeout(buzzTimer);
    buzzTimer = setTimeout(() => clipper.classList.remove("is-buzz"), 120);
  }

  function setupHero() {
    const canvas = $("#hair");
    if (reduceMotion || !canvas.getContext || !window.HairField) {
      document.body.classList.add("no-hair");
      hero.classList.add("is-shaved");
      setCut(1);
      return;
    }
    hair = new window.HairField(hero, canvas, {
      threshold: THRESHOLD,
      onProgress: setCut,
      onCut: buzz,
      onDone: () => {
        hero.classList.add("is-shaved");
        $("#growBtn").hidden = false;
        renderHint();
      },
      onDemoMove: (x, y, active) => {
        if (!finePointer) return;
        const r = hero.getBoundingClientRect();
        moveClipper(r.left + x, r.top + y);
        clipper.classList.toggle("is-on", active);
        if (active) buzz();
      }
    });
    $("#growBtn").addEventListener("click", () => {
      hero.classList.remove("is-shaved");
      $("#growBtn").hidden = true;
      hair.grow();
      renderHint();
    });

    if (finePointer) {
      document.body.classList.add("has-clipper");
      hero.addEventListener("pointermove", (e) => {
        if (hair.demoing) return;
        const overUi = e.target.closest("a, button, .header");
        clipper.classList.toggle("is-on", !overUi && hair.state !== "done");
        moveClipper(e.clientX, e.clientY);
      });
      hero.addEventListener("pointerleave", () => clipper.classList.remove("is-on"));
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
        if (hair) setTimeout(() => hair.demo(1700), 650);
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
    const headEl = $("#labHead");
    headEl.innerHTML = window.renderHead(labState(), "lab");
    if (changed) {
      headEl.classList.remove("is-swap");
      void headEl.offsetWidth;
      headEl.classList.add("is-swap");
    }
    $("#labTag").textContent = labSummary();
    updateLabPhoto();
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

    if (book.service === "lab") { renderSlots(); renderTicket(); }
    if (labTouched) {
      clearTimeout(svcTimer);
      svcTimer = setTimeout(renderSvc, 150);
    }
  }
  let svcTimer;

  /* ---------- Fade Lab photos ---------- */
  const labPhotos = (C.lab.photos && C.lab.photos.fades) || {};
  const beardPhotos = (C.lab.photos && C.lab.photos.beards) || {};
  const brokenPhotos = new Set();
  const usable = (src) => !!src && !brokenPhotos.has(src);
  const hasLabPhotos = () => Object.values(labPhotos).some(usable);
  let labView = store.get("labView") === "draw" ? "draw" : "photo";
  const photoImgs = $$("#labPhotos img");
  let photoActive = 0, photoSrc = "";

  function showPhoto(src) {
    if (src === photoSrc) return;
    photoSrc = src;
    const next = photoImgs[1 - photoActive];
    let done = false;
    const swap = () => {
      if (done || photoSrc !== src) return;
      done = true;
      next.classList.add("is-on");
      photoImgs[photoActive].classList.remove("is-on");
      photoActive = 1 - photoActive;
    };
    next.onload = swap;
    next.onerror = () => {
      brokenPhotos.add(src);
      photoSrc = "";
      updateLabPhoto();
    };
    next.src = src;
    if (next.complete && next.naturalWidth) swap();
  }

  function updateLabPhoto() {
    const stage = $("#labStage");
    const fadeSrc = labPhotos[lab.fade];
    const any = hasLabPhotos();
    const on = any && labView === "photo" && usable(fadeSrc);
    $("#labView").hidden = !any;
    $$("#labView [data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === labView)));
    stage.classList.toggle("is-photo", on);
    $("#labHead").dataset.label = on ? t("combo") : "";

    const cap = $("#labCaption");
    cap.hidden = !on;
    if (on) {
      showPhoto(fadeSrc);
      const fade = L.fades.find((f) => f.id === lab.fade);
      $("b", cap).textContent = local(fade);
    }

    const beardSrc = beardPhotos[lab.beard];
    const pic = $("#labBeardPic");
    const showBeard = on && lab.beard !== "none" && usable(beardSrc);
    pic.hidden = !showBeard;
    if (showBeard) {
      const img = $("img", pic);
      if (img.getAttribute("src") !== beardSrc) {
        img.onerror = () => { brokenPhotos.add(beardSrc); updateLabPhoto(); };
        img.src = beardSrc;
      }
      const beard = L.beards.find((b) => b.id === lab.beard);
      $("figcaption", pic).textContent = local(beard);
    }
  }

  $("#labView").addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]");
    if (!b) return;
    labView = b.dataset.view;
    store.set("labView", labView);
    updateLabPhoto();
  });

  // fetch the lab photos shortly before the section comes into view
  function preloadLabPhotos() {
    const all = [...Object.values(labPhotos), ...Object.values(beardPhotos)].filter(Boolean);
    if (!all.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      all.forEach((src) => {
        const img = new Image();
        img.decoding = "async";
        img.onerror = () => brokenPhotos.add(src);
        img.src = src;
      });
    }, { rootMargin: "600px 0px" });
    io.observe($("#lab"));
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
  $("#labBook").addEventListener("click", () => {
    touchLab();
    book.service = "lab";
    renderSvc();
    renderSlots();
    renderTicket();
    $("#book").scrollIntoView({ behavior: smooth });
    toast(t("added"));
  });

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
  function renderLooks() {
    const track = $("#looksTrack");
    track.innerHTML = C.looks.map((l, i) => {
      const q = quote({ ...l, extras: l.extras });
      return `<article class="look look--${(i % 6) + 1}">
        <div class="look__art${l.photo ? " look__art--photo" : ""}"><span class="look__n">0${i + 1}</span>${l.photo
          ? `<img src="${esc(l.photo)}" alt="${esc(local(l))}" loading="lazy" decoding="async" />`
          : window.renderHead(l, "look" + i)}</div>
        <div class="look__body">
          <h3 class="look__name">${esc(local(l))}</h3>
          <div class="look__meta"><span>${q.min} ${t("min")}</span><b>${price(q.price)}</b></div>
          <button type="button" class="look__try" data-look="${l.id}">${esc(t("tryIt"))}${ICON.arrow}</button>
        </div>
      </article>`;
    }).join("") + `<a class="look look--ig" href="${igUrl}" target="_blank" rel="noopener">
        ${ICON.ig}<span>${esc(t("lookCta"))}</span><b>@${esc(C.instagram)} ↗</b>
      </a>`;

    const photos = $("#photos");
    if (C.photos.gallery.length) {
      photos.hidden = false;
      photos.innerHTML = `<h3>${esc(t("photosTitle"))}</h3><div class="photos__grid">${C.photos.gallery.map((src, i) =>
        `<a class="shot" href="${igUrl}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="${esc(C.name)} · ${i + 1}" loading="lazy" /></a>`).join("")}</div>`;
    }
  }

  function setupLookTrack() {
    const track = $("#looksTrack");
    // a look photo that fails to load falls back to its drawing
    track.addEventListener("error", (e) => {
      const img = e.target;
      if (img.tagName !== "IMG") return;
      const card = img.closest(".look");
      const i = $$(".look", track).indexOf(card);
      const look = C.looks[i];
      if (!look) return;
      img.parentElement.classList.remove("look__art--photo");
      img.outerHTML = window.renderHead(look, "look" + i);
    }, true);
    track.addEventListener("click", (e) => {
      const b = e.target.closest("[data-look]");
      if (b) loadLook(b.dataset.look);
    });
    const step = () => ($(".look", track)?.getBoundingClientRect().width || 300) + 18;
    $("#looksPrev").addEventListener("click", () => track.scrollBy({ left: -step(), behavior: smooth }));
    $("#looksNext").addEventListener("click", () => track.scrollBy({ left: step(), behavior: smooth }));
    const syncNav = () => {
      $("#looksPrev").disabled = track.scrollLeft < 8;
      $("#looksNext").disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    };
    track.addEventListener("scroll", syncNav, { passive: true });
    syncNav();

    // drag to scroll with a mouse
    let drag = null;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false };
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; track.classList.add("is-drag"); }
      if (drag.moved) track.scrollLeft = drag.left - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (moved) setTimeout(() => track.classList.remove("is-drag"), 0);
    });
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
    const row = e.target.closest(".row");
    if (!row) return;
    const b = $("[data-book]", row);
    book.service = b.dataset.book;
    renderSvc();
    renderSlots();
    renderTicket();
    $("#book").scrollIntoView({ behavior: smooth });
  });

  /* ======================================================================
     Booking
     ====================================================================== */
  const book = { service: null, date: null, time: null };
  const form = $("#bookForm");

  function selectedService() {
    if (book.service === "lab") {
      const q = quote(lab);
      return { id: "lab", name: `${t("labCut")} (${labSummary()})`, price: q.price, min: q.min };
    }
    const s = C.services.find((x) => x.id === book.service);
    return s ? { id: s.id, name: local(s), price: s.price, min: s.min } : null;
  }

  function renderSvc() {
    const list = [];
    if (labTouched || book.service === "lab") {
      const q = quote(lab);
      list.push(`<label><input type="radio" name="svc" value="lab"${book.service === "lab" ? " checked" : ""} />
        <span class="svc__card svc__card--lab"><small>Fade Lab</small><span class="svc__name">${esc(labSummary())}</span>
        <span class="svc__meta"><span>${q.min} ${t("min")}</span><b>${price(q.price)}</b></span></span></label>`);
    }
    C.services.forEach((s) => {
      list.push(`<label><input type="radio" name="svc" value="${s.id}"${book.service === s.id ? " checked" : ""} />
        <span class="svc__card"><span class="svc__name">${esc(local(s))}</span>
        <span class="svc__meta"><span>${s.min} ${t("min")}</span><b>${price(s.price)}</b></span></span></label>`);
    });
    $("#svcList").innerHTML = list.join("");
    markSteps();
  }
  $("#svcList").addEventListener("change", (e) => {
    book.service = e.target.value;
    renderSlots();
    renderTicket();
  });

  function slotsFor(ymd) {
    const h = hoursFor(dowOf(ymd));
    if (!h) return null;
    const s = selectedService();
    const now = shopNow();
    const earliest = ymd === now.ymd ? now.min + 30 : 0;
    const out = [];
    for (let m = h.open; m + (s ? s.min : C.slotMinutes) <= h.close; m += C.slotMinutes) {
      if (m >= earliest) out.push(m);
    }
    return out;
  }

  function renderDays() {
    const now = shopNow();
    const html = [];
    for (let i = 0; i < C.bookingDaysAhead; i++) {
      const ymd = addDays(now.ymd, i);
      const slots = slotsFor(ymd);
      const off = !slots || !slots.length;
      const [, m, d] = ymd.split("-").map(Number);
      const top = i === 0 ? t("today") : i === 1 ? t("tomorrow") : t("daysShort")[dowOf(ymd)];
      html.push(`<button type="button" class="day" data-date="${ymd}" aria-pressed="${book.date === ymd}"${off ? " disabled" : ""} aria-label="${esc(fmtDate(ymd))}">
        <small>${esc(top)}</small><b>${d}</b><small>${esc(t("months")[m - 1])}</small></button>`);
    }
    $("#dayRow").innerHTML = html.join("");
  }
  $("#dayRow").addEventListener("click", (e) => {
    const b = e.target.closest("[data-date]");
    if (!b || b.disabled) return;
    book.date = b.dataset.date;
    $$("#dayRow .day").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderSlots();
    renderTicket();
  });

  function renderSlots() {
    const grid = $("#slotGrid");
    if (!book.date) {
      grid.innerHTML = `<p class="slots__empty">${esc(t("pickDay"))}</p>`;
      markSteps();
      return;
    }
    const slots = slotsFor(book.date) || [];
    if (book.time && !slots.includes(toMin(book.time))) book.time = null;
    grid.innerHTML = slots.length
      ? slots.map((m) => `<button type="button" class="slot" data-time="${fmtMin(m)}" aria-pressed="${book.time === fmtMin(m)}">${fmtMin(m)}</button>`).join("")
      : `<p class="slots__empty">${esc(t("noSlots"))}</p>`;
    markSteps();
  }
  $("#slotGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-time]");
    if (!b) return;
    book.time = b.dataset.time;
    $$("#slotGrid .slot").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderTicket();
    markSteps();
  });

  function markSteps() {
    const steps = $$(".step", form);
    const done = [!!book.service, !!book.date, !!book.time, !!(form.name.value.trim() && form.phone.value.trim())];
    steps.forEach((s, i) => s.classList.toggle("is-done", done[i]));
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  const ticketVals = {};
  function setTicket(id, val) {
    const el = $("#" + id);
    if (ticketVals[id] === val) return;
    const changed = ticketVals[id] !== undefined;
    ticketVals[id] = val;
    el.textContent = val;
    if (changed && val !== "–") {
      el.classList.remove("is-set");
      void el.offsetWidth;
      el.classList.add("is-set");
    }
  }

  function renderTicket() {
    const s = selectedService();
    setTicket("tService", s ? s.name : "–");
    setTicket("tDay", book.date ? fmtDate(book.date) : "–");
    setTicket("tTime", book.time || "–");
    setTicket("tLength", s ? `${s.min} ${t("min")}` : "–");
    setTicket("tName", form.name.value.trim() || "–");
    setTicket("tTotal", s ? price(s.price) : "–");

    const h = hash([book.service, book.date, book.time, form.name.value.trim()].join("|"));
    $("#tNo").textContent = String(h % 10000).padStart(4, "0");
    let x = 0, bars = "", seed = h || 1;
    while (x < 118) {
      seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
      const w = 1 + (seed % 4);
      if ((seed >> 5) % 3) bars += `<rect x="${x}" y="0" width="${w}" height="40"/>`;
      x += w + 1 + ((seed >> 8) % 2);
    }
    $("#tCode").innerHTML = bars;
    markSteps();
  }

  ["name", "phone"].forEach((k) => {
    const v = store.get(k);
    if (v) form[k].value = v;
  });
  form.name.addEventListener("input", renderTicket);
  form.phone.addEventListener("input", markSteps);

  function renderSubmit() {
    $("#submitLabel").textContent = waNumber ? t("submitWa") : t("submitIg");
    $("#formFine").textContent = waNumber ? t("fineWa") : t("fineIg");
    const alt = [];
    if (C.phone) alt.push(`<a href="${telHref}">${ICON.phone}${esc(t("callUs"))}</a>`);
    if (waNumber) alt.push(`<a href="https://wa.me/${waNumber}" target="_blank" rel="noopener">${ICON.wa}WhatsApp</a>`);
    alt.push(`<a href="${igDm}" target="_blank" rel="noopener">${ICON.ig}Instagram</a>`);
    $("#bookAlt").innerHTML = `<span>${esc(t("orBook"))}:</span>${alt.join("")}`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#formError");
    const missing = [];
    if (!book.service) missing.push("service");
    if (!book.date) missing.push("date");
    if (!book.time) missing.push("time");
    if (!form.name.value.trim()) missing.push("name");
    if (!form.phone.value.trim()) missing.push("phone");
    $$(".field", form).forEach((f) => f.classList.remove("is-invalid"));
    if (missing.length) {
      err.textContent = fill(t("err"), { f: missing.map((k) => t("fields")[k]).join(", ") });
      err.hidden = false;
      if (missing.includes("name")) form.name.closest(".field").classList.add("is-invalid");
      if (missing.includes("phone")) form.phone.closest(".field").classList.add("is-invalid");
      const target = { service: "#svcList", date: "#dayRow", time: "#slotGrid", name: "#fName", phone: "#fPhone" }[missing[0]];
      $(target).closest(".step").scrollIntoView({ behavior: smooth, block: "center" });
      if (missing[0] === "name" || missing[0] === "phone") $(target).focus({ preventScroll: true });
      return;
    }
    err.hidden = true;
    store.set("name", form.name.value.trim());
    store.set("phone", form.phone.value.trim());

    const s = selectedService();
    const msg = [
      t("msgHello"),
      "",
      `${t("msgService")}: ${s.name} (${price(s.price)}, ${s.min} ${t("min")})`,
      `${t("msgDate")}: ${fmtDate(book.date)}`,
      `${t("msgTime")}: ${book.time}`,
      `${t("msgName")}: ${form.name.value.trim()}`,
      `${t("msgPhone")}: ${form.phone.value.trim()}`,
      form.note.value.trim() ? `${t("msgNote")}: ${form.note.value.trim()}` : "",
      `${t("msgTicket")}: Nr. ${$("#tNo").textContent}`
    ].filter((l, i) => l || i === 1).join("\n");

    const ticket = $("#ticket");
    ticket.classList.remove("is-sent");
    void ticket.offsetWidth;
    ticket.classList.add("is-sent");

    if (waNumber) {
      const win = window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank");
      if (win) win.opener = null;
      else location.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
      return;
    }
    // Start the copy while this page still has focus, then open Instagram in the same click.
    let copied;
    try { copied = navigator.clipboard.writeText(msg); } catch (error) { copied = Promise.reject(error); }
    const win = window.open(igDm, "_blank");
    if (win) win.opener = null;
    try { await copied; toast(t("copied")); } catch { toast(t("copyFail")); }
    if (!win) setTimeout(() => (location.href = igDm), 1500);
  });

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
    let heroOut = false, bookIn = false;
    const sync = () => dock.classList.toggle("is-on", heroOut && !bookIn);
    new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting; sync(); }, { rootMargin: "-50% 0px 0px 0px" }).observe(hero);
    new IntersectionObserver(([e]) => { bookIn = e.isIntersecting; sync(); }).observe($("#book"));
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
    renderHint();
    splitManifesto();
    renderLabControls();
    updateLab(false);
    renderLooks();
    renderMenu();
    renderSvc();
    renderDays();
    renderSlots();
    renderTicket();
    renderSubmit();
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
