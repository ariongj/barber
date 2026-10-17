/*
 * Booking page: pick a service, a day and a time, add a name and phone,
 * then send the request by WhatsApp (when a number is set) or Instagram DM.
 *
 * The service can arrive in the address:
 *   book.html?s=fade                         a service from the price list
 *   book.html?look=skin                      a style from the catalogue
 *   book.html?fade=mid&top=30&beard=short&x=lineup,towel   a Fade Lab cut
 */
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
  const store = {
    get(k) { try { return localStorage.getItem("prive." + k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem("prive." + k, v); } catch { /* storage unavailable */ } }
  };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smooth = reduceMotion ? "auto" : "smooth";

  let lang = store.get("lang") === "en" ? "en" : "sq";
  const t = (k) => DYN[lang][k];
  const local = (o) => (o && typeof o === "object" ? o[lang] ?? o.sq : o);
  const price = (n) => `${n} ${C.currency}`;
  const waNumber = (C.whatsapp || "").replace(/\D/g, "");
  const igDm = `https://ig.me/m/${C.instagram}`;

  /* ---------- time in the shop's time zone ---------- */
  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const hoursFor = (dow) => { const h = C.hours[DAY_KEYS[dow]]; return h ? { open: toMin(h[0]), close: toMin(h[1]) } : null; };
  const ymdToUTC = (ymd) => { const [y, m, d] = ymd.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  const dowOf = (ymd) => new Date(ymdToUTC(ymd)).getUTCDay();
  const addDays = (ymd, n) => new Date(ymdToUTC(ymd) + n * 864e5).toISOString().slice(0, 10);
  function shopNow() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: C.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
    const ymd = `${p.year}-${p.month}-${p.day}`;
    return { ymd, dow: dowOf(ymd), min: Number(p.hour) * 60 + Number(p.minute) };
  }
  const fmtDate = (ymd) => {
    const [, m, d] = ymd.split("-").map(Number);
    return `${t("days")[dowOf(ymd)]}, ${d} ${t("months")[m - 1]}`;
  };

  /* ---------- what is being booked ---------- */
  const L = C.lab;
  function labQuote(s) {
    const fade = L.fades.find((f) => f.id === s.fade) || L.fades[0];
    const lines = [{ label: local(fade), price: fade.price, min: fade.min }];
    if (s.top >= L.longTop.from) lines.push({ price: L.longTop.price, min: L.longTop.min });
    const beard = L.beards.find((b) => b.id === s.beard);
    if (beard && beard.price) lines.push({ price: beard.price, min: beard.min });
    L.extras.forEach((x) => { if (s.extras.includes(x.id)) lines.push({ price: x.price, min: x.min }); });
    return { price: lines.reduce((a, l) => a + l.price, 0), min: lines.reduce((a, l) => a + l.min, 0) };
  }

  // the cut chosen elsewhere on the site, read from the address
  const params = new URLSearchParams(location.search);
  let custom = null;
  (function readParams() {
    const look = params.get("look") && C.looks.find((l) => l.id === params.get("look"));
    if (look) {
      custom = { name: look, fade: look.fade, top: look.top, beard: look.beard, extras: look.extras.slice() };
      return;
    }
    const fade = params.get("fade");
    if (fade && L.fades.some((f) => f.id === fade)) {
      const beard = params.get("beard");
      custom = {
        name: null,
        fade,
        top: Math.max(0, Math.min(80, Number(params.get("top")) || 0)),
        beard: L.beards.some((b) => b.id === beard) ? beard : "none",
        extras: (params.get("x") || "").split(",").filter((x) => L.extras.some((e) => e.id === x))
      };
    }
  })();

  const state = {
    service: custom ? "custom" : (C.services.some((s) => s.id === params.get("s")) ? params.get("s") : null),
    date: null,
    time: null
  };
  let showList = !state.service;

  function selected() {
    if (state.service === "custom" && custom) {
      const q = labQuote(custom);
      const fade = local(L.fades.find((f) => f.id === custom.fade));
      const name = custom.name ? local(custom.name) : `${t("labCut")}`;
      const detail = [fade, custom.top + " mm"];
      const beard = L.beards.find((b) => b.id === custom.beard);
      if (beard && beard.id !== "none") detail.push(local(beard));
      custom.extras.forEach((x) => detail.push(local(L.extras.find((e) => e.id === x))));
      return { id: "custom", name, detail: detail.join(" · "), price: q.price, min: q.min };
    }
    const s = C.services.find((x) => x.id === state.service);
    return s ? { id: s.id, name: local(s), detail: local(s.d), price: s.price, min: s.min } : null;
  }

  /* ---------- rendering ---------- */
  function renderServices() {
    const s = selected();
    const picked = $("#picked");
    const list = $("#services");
    picked.hidden = !s || showList;
    list.hidden = !!s && !showList;
    if (s && !showList) {
      picked.innerHTML = `
        <div class="picked__main">
          <b>${esc(s.name)}</b>
          <span>${esc(s.detail)}</span>
        </div>
        <div class="picked__side"><b>${price(s.price)}</b><span>${s.min} ${t("min")}</span></div>
        <button type="button" class="picked__change" id="change">${esc(t("change"))}</button>`;
      return;
    }
    const rows = [];
    if (custom) {
      const q = labQuote(custom);
      rows.push(`<div class="group"><h3>${esc(custom.name ? "Privé" : "Fade Lab")}</h3>${row("custom", custom.name ? local(custom.name) : t("labCut"), q.min, q.price)}</div>`);
    }
    Object.entries(C.categories).forEach(([cat, label]) => {
      const items = C.services.filter((x) => x.cat === cat);
      if (!items.length) return;
      rows.push(`<div class="group"><h3>${esc(local(label))}</h3>${items.map((x) => row(x.id, local(x), x.min, x.price)).join("")}</div>`);
    });
    list.innerHTML = rows.join("");
  }
  const row = (id, name, min, p) => `
    <label class="svc">
      <input type="radio" name="svc" value="${esc(id)}"${state.service === id ? " checked" : ""} />
      <span class="svc__name">${esc(name)}</span>
      <span class="svc__min">${min} ${t("min")}</span>
      <b class="svc__price">${price(p)}</b>
    </label>`;

  function slotsFor(ymd) {
    const h = hoursFor(dowOf(ymd));
    if (!h) return null;
    const s = selected();
    const now = shopNow();
    const earliest = ymd === now.ymd ? now.min + 30 : 0;
    const out = [];
    for (let m = h.open; m + (s ? s.min : C.slotMinutes) <= h.close; m += C.slotMinutes) if (m >= earliest) out.push(m);
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
      html.push(`<button type="button" class="day" data-date="${ymd}" aria-pressed="${state.date === ymd}"${off ? " disabled" : ""} aria-label="${esc(fmtDate(ymd))}">
        <small>${esc(top)}</small><b>${d}</b><small>${esc(t("months")[m - 1])}</small></button>`);
    }
    $("#days").innerHTML = html.join("");
    // pick the first open day so times show straight away
    if (!state.date) {
      const first = $("#days .day:not([disabled])");
      if (first) { state.date = first.dataset.date; first.setAttribute("aria-pressed", "true"); }
    }
  }

  function renderSlots() {
    const grid = $("#slots");
    if (!state.date) { grid.innerHTML = `<p class="empty">${esc(t("pickDay"))}</p>`; return; }
    const slots = slotsFor(state.date) || [];
    if (state.time && !slots.includes(toMin(state.time))) state.time = null;
    grid.innerHTML = slots.length
      ? slots.map((m) => `<button type="button" class="slot" data-time="${fmtMin(m)}" aria-pressed="${state.time === fmtMin(m)}">${fmtMin(m)}</button>`).join("")
      : `<p class="empty">${esc(t("noSlots"))}</p>`;
  }

  function renderBar() {
    const s = selected();
    const parts = [];
    if (state.date) parts.push(fmtDate(state.date));
    if (state.time) parts.push(state.time);
    $("#sumMain").textContent = s ? `${s.name} · ${price(s.price)}` : t("pickService");
    $("#sumSub").textContent = parts.join(" · ") || (s ? `${s.min} ${t("min")}` : "");
    $("#sendLabel").textContent = waNumber ? t("submitWa") : t("submitIg");
    $("#fine").textContent = waNumber ? t("fineWa") : t("fineIg");
    const ready = s && state.date && state.time && $("#name").value.trim() && $("#phone").value.trim();
    $("#send").classList.toggle("is-ready", !!ready);
    $$(".step").forEach((el, i) => el.classList.toggle("is-done", [!!s, !!state.date, !!state.time, !!ready][i]));
  }

  function renderAll() {
    renderServices();
    renderDays();
    renderSlots();
    renderBar();
  }

  /* ---------- language ---------- */
  function applyLang(next) {
    lang = next;
    store.set("lang", lang);
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach((el) => {
      if (el.dataset.sq === undefined) el.dataset.sq = el.textContent;
      el.textContent = lang === "sq" ? el.dataset.sq : EN[el.dataset.i18n] ?? el.dataset.sq;
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
    document.title = `${lang === "sq" ? "Rezervo termin" : "Book an appointment"} · ${C.name}`;
    renderAll();
  }
  $$(".lang button").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));

  /* ---------- interaction: each choice moves you to the next step ---------- */
  const goTo = (id) => {
    const el = document.getElementById(id);
    const y = el.getBoundingClientRect().top + scrollY - 76;
    window.scrollTo({ top: y, behavior: smooth });
  };

  $("#stepService").addEventListener("change", (e) => {
    if (e.target.name !== "svc") return;
    state.service = e.target.value;
    showList = false;
    renderServices();
    renderSlots();
    renderBar();
    goTo("stepDay");
  });
  $("#stepService").addEventListener("click", (e) => {
    if (!e.target.closest("#change")) return;
    showList = true;
    renderServices();
  });
  $("#days").addEventListener("click", (e) => {
    const b = e.target.closest("[data-date]");
    if (!b || b.disabled) return;
    state.date = b.dataset.date;
    $$("#days .day").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderSlots();
    renderBar();
    goTo("stepTime");
  });
  $("#slots").addEventListener("click", (e) => {
    const b = e.target.closest("[data-time]");
    if (!b) return;
    state.time = b.dataset.time;
    $$("#slots .slot").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderBar();
    goTo("stepYou");
    const name = $("#name");
    if (!name.value.trim()) setTimeout(() => name.focus({ preventScroll: true }), reduceMotion ? 0 : 450);
  });
  ["name", "phone"].forEach((k) => {
    const v = store.get(k);
    if (v) $("#" + k).value = v;
    $("#" + k).addEventListener("input", renderBar);
  });

  /* ---------- send ---------- */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const s = selected();
    const name = $("#name").value.trim();
    const phone = $("#phone").value.trim();
    const missing = !s ? "stepService" : !state.date ? "stepDay" : !state.time ? "stepTime" : !name ? "name" : !phone ? "phone" : null;
    if (missing) {
      const step = missing === "name" || missing === "phone" ? "stepYou" : missing;
      const el = document.getElementById(step);
      goTo(step);
      el.classList.remove("is-missing");
      void el.offsetWidth;
      el.classList.add("is-missing");
      if (missing === "name" || missing === "phone") setTimeout(() => $("#" + missing).focus({ preventScroll: true }), 400);
      toast(fill(t("err"), { f: t("fields")[{ stepService: "service", stepDay: "date", stepTime: "time", name: "name", phone: "phone" }[missing]] }));
      return;
    }
    store.set("name", name);
    store.set("phone", phone);
    const no = String(hash([s.name, state.date, state.time, name].join("|")) % 10000).padStart(4, "0");
    const note = $("#note").value.trim();
    const msg = [
      t("msgHello"),
      "",
      `${t("msgService")}: ${s.name}${s.id === "custom" ? ` (${s.detail})` : ""} · ${price(s.price)}, ${s.min} ${t("min")}`,
      `${t("msgDate")}: ${fmtDate(state.date)}`,
      `${t("msgTime")}: ${state.time}`,
      `${t("msgName")}: ${name}`,
      `${t("msgPhone")}: ${phone}`,
      note ? `${t("msgNote")}: ${note}` : "",
      `${t("msgTicket")}: Nr. ${no}`
    ].filter((l, i) => l || i === 1).join("\n");

    const url = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}` : igDm;
    // start the copy while this page still has focus, then open the chat in the same tap
    let copied = Promise.resolve();
    if (!waNumber) {
      try { copied = navigator.clipboard.writeText(msg); } catch (err) { copied = Promise.reject(err); }
    }
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    showDone(s, no, url);
    if (!waNumber) {
      try { await copied; toast(t("copied")); } catch { toast(t("copyFail")); }
    }
    if (!win) setTimeout(() => { location.href = url; }, 1200);
  });

  function showDone(s, no, url) {
    $("#doneNo").textContent = no;
    $("#doneText").textContent = waNumber ? t("doneWa") : t("doneIg");
    $("#doneRows").innerHTML = [
      [t("msgService"), s.name], [t("msgDate"), fmtDate(state.date)], [t("msgTime"), state.time], [t("total"), price(s.price)]
    ].map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
    const again = $("#doneAgain");
    again.href = url;
    again.textContent = waNumber ? t("openWa") : t("openIg");
    $("#page").hidden = true;
    $("#bar").hidden = true;
    $("#done").hidden = false;
    window.scrollTo({ top: 0 });
  }

  let toastTimer;
  function toast(text) {
    const el = $("#toast");
    el.textContent = text;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("is-on"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove("is-on"); setTimeout(() => (el.hidden = true), 300); }, 3800);
  }

  applyLang(lang);
})();
