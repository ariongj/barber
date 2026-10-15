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

  let lang = store.get("lang") === "en" ? "en" : "sq";
  const t = (k) => DYN[lang][k];
  const local = (o) => (o && typeof o === "object" ? o[lang] ?? o.sq : o);

  const igUrl = `https://www.instagram.com/${C.instagram}/`;
  const igDm = `https://ig.me/m/${C.instagram}`;
  const waNumber = (C.whatsapp || "").replace(/\D/g, "");
  const telHref = C.phone ? "tel:" + C.phone.replace(/[^\d+]/g, "") : "";

  /* ---------- Time in the shop's time zone ---------- */
  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const hoursFor = (dow) => {
    const h = C.hours[DAY_KEYS[dow]];
    return h ? { open: toMin(h[0]), close: toMin(h[1]) } : null;
  };

  function shopNow() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: C.timezone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
    const ymd = `${p.year}-${p.month}-${p.day}`;
    return { ymd, dow: dowOf(ymd), min: Number(p.hour) * 60 + Number(p.minute) };
  }
  const ymdToUTC = (ymd) => { const [y, m, d] = ymd.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  const dowOf = (ymd) => new Date(ymdToUTC(ymd)).getUTCDay();
  const addDays = (ymd, n) => new Date(ymdToUTC(ymd) + n * 864e5).toISOString().slice(0, 10);
  const fmtDate = (ymd) => {
    const [, m, d] = ymd.split("-");
    return `${t("days")[dowOf(ymd)]}, ${Number(d)}.${m}.`;
  };

  /* ---------- Language ---------- */
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
        const store = "sq" + attr;
        if (el.dataset[store] === undefined) el.dataset[store] = el.getAttribute(attr) || "";
        el.setAttribute(attr, lang === "sq" ? el.dataset[store] : EN[key] ?? el.dataset[store]);
      });
    });
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));

    renderAll();
  }

  /* ---------- Services ---------- */
  let activeCat = "all";
  const price = (n) => `${n} ${C.currency}`;
  const minPrice = Math.min(...C.services.map((s) => s.price));

  function renderTabs() {
    const cats = [["all", t("all")], ...Object.entries(C.categories).map(([k, v]) => [k, local(v)])];
    $("#serviceTabs").innerHTML = cats.map(([k, label]) =>
      `<button type="button" role="tab" aria-selected="${k === activeCat}" data-cat="${k}">${esc(label)}</button>`
    ).join("");
  }

  function renderMenu() {
    const cats = Object.keys(C.categories).filter((k) => activeCat === "all" || k === activeCat);
    $("#serviceMenu").innerHTML = cats.map((cat) => {
      const items = C.services.filter((s) => s.cat === cat);
      return `<div class="menu__group">
        <h3 class="menu__cat"><span>${esc(local(C.categories[cat]))}</span><small>${items.length}</small></h3>
        <ul class="menu__list">${items.map((s) => `
          <li class="item${s.featured ? " item--featured" : ""}">
            <div class="item__main">
              <div class="item__line">
                <h4 class="item__name">${esc(local(s))}${s.featured ? `<span class="tag">${esc(t("popular"))}</span>` : ""}</h4>
                <span class="item__dots" aria-hidden="true"></span>
                <span class="item__price">${price(s.price)}</span>
              </div>
              <p class="item__desc">${esc(local(s.d))} <span class="item__min">· ${s.min} ${t("min")}</span></p>
            </div>
            <button type="button" class="item__book" data-book="${s.id}" aria-label="${esc(t("book") + ": " + local(s))}">
              ${esc(t("book"))}<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>
            </button>
          </li>`).join("")}
        </ul>
      </div>`;
    }).join("");
  }

  $("#serviceTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    activeCat = b.dataset.cat;
    renderTabs();
    renderMenu();
  });
  $("#serviceTabs").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const tabs = $$("#serviceTabs [role=tab]");
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const n = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    n.click();
    $(`#serviceTabs [data-cat="${n.dataset.cat}"]`).focus();
  });
  $("#serviceMenu").addEventListener("click", (e) => {
    const b = e.target.closest("[data-book]");
    if (!b) return;
    form.service.value = b.dataset.book;
    onServiceOrDate();
    $("#book").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setTimeout(() => (form.date.value ? form.time : form.date).focus({ preventScroll: true }), 500);
  });

  /* ---------- Open / closed status ---------- */
  function renderStatus() {
    const now = shopNow();
    const today = hoursFor(now.dow);
    let state, text;
    if (today && now.min >= today.open && now.min < today.close) {
      state = today.close - now.min <= 60 ? "soon" : "open";
      text = fill(t(state === "soon" ? "closingSoon" : "open"), { t: fmtMin(today.close) });
    } else if (today && now.min < today.open) {
      state = "closed";
      text = fill(t("opensToday"), { t: fmtMin(today.open) });
    } else {
      state = "closed";
      text = t("closedToday");
      for (let i = 1; i <= 7; i++) {
        const dow = (now.dow + i) % 7;
        const h = hoursFor(dow);
        if (h) {
          text = fill(t("closed"), { d: i === 1 ? t("tomorrow").toLowerCase() : t("days")[dow].toLowerCase(), t: fmtMin(h.open) });
          break;
        }
      }
    }
    ["#statusHero", "#statusVisit"].forEach((s) => {
      const el = $(s);
      el.dataset.state = state;
      $("span", el).textContent = text;
    });
  }

  function renderHours() {
    const now = shopNow();
    const order = [1, 2, 3, 4, 5, 6, 0];
    $("#hoursTable tbody").innerHTML = order.map((dow) => {
      const h = hoursFor(dow);
      return `<tr${dow === now.dow ? ' class="is-today"' : ""}>
        <th scope="row">${esc(t("days")[dow])}${dow === now.dow ? `<span class="today">${esc(t("today"))}</span>` : ""}</th>
        <td>${h ? `${fmtMin(h.open)} – ${fmtMin(h.close)}` : `<span class="muted">${esc(t("closedDay"))}</span>`}</td>
      </tr>`;
    }).join("");
  }

  /* ---------- Contact, map, Instagram ---------- */
  const ICON = {
    phone: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    wa: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/></svg>',
    ig: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    pin: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
  };
  const place = [C.address, C.city].filter(Boolean).join(", ");
  const mapsQuery = C.mapsQuery || (place ? `${C.name}, ${place}` : "");

  function renderContact() {
    const rows = [];
    if (place) {
      rows.push(`<li>${ICON.pin}<div><b>${esc(place)}</b><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}" target="_blank" rel="noopener">${esc(t("directions"))} ↗</a></div></li>`);
    } else {
      rows.push(`<li>${ICON.pin}<div><b>${esc(C.city || "Kosovë")}</b><span>${esc(t("addressSoon"))}</span></div></li>`);
    }
    if (C.phone) rows.push(`<li>${ICON.phone}<div><b>${esc(C.phone)}</b><a href="${telHref}">${esc(t("callUs"))}</a></div></li>`);
    if (waNumber) rows.push(`<li>${ICON.wa}<div><b>${esc(t("whatsapp"))}</b><a href="https://wa.me/${waNumber}" target="_blank" rel="noopener">wa.me/${waNumber} ↗</a></div></li>`);
    rows.push(`<li>${ICON.ig}<div><b>@${esc(C.instagram)}</b><a href="${igUrl}" target="_blank" rel="noopener">${esc(t("instagram"))} ↗</a></div></li>`);
    $("#contactList").innerHTML = rows.join("");

    const alt = [];
    if (C.phone) alt.push(`<a class="chip" href="${telHref}">${ICON.phone}${esc(t("callUs"))}</a>`);
    if (waNumber) alt.push(`<a class="chip" href="https://wa.me/${waNumber}" target="_blank" rel="noopener">${ICON.wa}WhatsApp</a>`);
    alt.push(`<a class="chip" href="${igDm}" target="_blank" rel="noopener">${ICON.ig}Instagram</a>`);
    $("#bookAlt").innerHTML = `<span>${esc(t("orBook"))}</span>${alt.join("")}`;

    $$(".js-city").forEach((el) => (el.textContent = C.city || "Kosovë"));
  }

  function renderMap() {
    if (!mapsQuery) return;
    const map = $("#map");
    if ($("iframe", map)) return;
    map.innerHTML = `<iframe title="Google Maps · ${esc(C.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed"></iframe>`;
  }

  /* ---------- Photos, gallery, team ---------- */
  function renderPhotos() {
    if (C.photos.hero) {
      $("#heroArch").innerHTML = `<img class="arch__img" src="${esc(C.photos.hero)}" alt="${esc(C.name)}" fetchpriority="high" />`;
      $("#heroArch").closest(".hero__visual").removeAttribute("aria-hidden");
    }
    if (C.photos.about) {
      $("#studioMedia").innerHTML = `<img class="studio__img" src="${esc(C.photos.about)}" alt="${esc(C.name)}" loading="lazy" />`;
    }
  }

  function renderGallery() {
    const g = $("#gallery");
    if (C.photos.gallery.length) {
      g.classList.add("gallery--photos");
      g.innerHTML = C.photos.gallery.map((src, i) =>
        `<a class="shot reveal in" href="${igUrl}" target="_blank" rel="noopener" style="--i:${i}">
          <img src="${esc(src)}" alt="${esc(C.name)} · ${i + 1}" loading="lazy" />
          <span class="shot__hover">${ICON.ig}${esc(t("viewOnIg"))}</span>
        </a>`).join("");
      return;
    }
    const tiles = t("tiles");
    g.innerHTML = tiles.map((label, i) =>
      `<a class="tile tile--${i + 1} reveal in" href="${igUrl}" target="_blank" rel="noopener">
        <span class="tile__n">0${i + 1}</span>
        <span class="tile__label">${esc(label)}</span>
        <span class="tile__go">${ICON.ig}</span>
      </a>`).join("") +
      `<a class="tile tile--cta reveal in" href="${igUrl}" target="_blank" rel="noopener">
        ${ICON.ig}<span>${esc(t("galleryCta"))}</span><b>@${esc(C.instagram)}</b>
      </a>`;
  }

  function renderTeam() {
    if (!C.team.length) return;
    $("#team").hidden = false;
    $("#teamGrid").innerHTML = C.team.map((p) => `
      <figure class="member reveal in">
        ${p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy" />` : `<span class="member__init">${esc(p.name[0])}</span>`}
        <figcaption><b>${esc(p.name)}</b><span>${esc(local(p.role))}</span></figcaption>
      </figure>`).join("");
  }

  /* ---------- Booking ---------- */
  const form = $("#bookForm");

  function fillServiceSelect() {
    const current = form.service.value;
    form.service.innerHTML = Object.keys(C.categories).map((cat) =>
      `<optgroup label="${esc(local(C.categories[cat]))}">${C.services.filter((s) => s.cat === cat).map((s) =>
        `<option value="${s.id}">${esc(local(s))} · ${price(s.price)} · ${s.min} ${t("min")}</option>`).join("")}</optgroup>`
    ).join("");
    form.service.value = current || C.services[0].id;
  }

  function fillBarberSelect() {
    if (!C.team.length) return;
    $("#fBarberWrap").hidden = false;
    const current = form.barber.value;
    form.barber.innerHTML = `<option value="">${esc(t("anyBarber"))}</option>` +
      C.team.map((p) => `<option>${esc(p.name)}</option>`).join("");
    form.barber.value = current;
  }

  const selected = () => C.services.find((s) => s.id === form.service.value);

  function slotsFor(ymd) {
    const h = hoursFor(dowOf(ymd));
    if (!h) return null;
    const s = selected();
    const now = shopNow();
    const earliest = ymd === now.ymd ? now.min + 30 : 0;
    const out = [];
    for (let m = h.open; m + (s ? s.min : C.slotMinutes) <= h.close; m += C.slotMinutes) {
      if (m >= earliest) out.push(m);
    }
    return out;
  }

  function fillTimes() {
    const prev = form.time.value;
    const ymd = form.date.value;
    let html;
    if (!ymd) {
      html = `<option value="">${esc(t("pickTime"))}</option>`;
    } else {
      const slots = slotsFor(ymd);
      if (!slots) html = `<option value="">${esc(t("closedDay"))}</option>`;
      else if (!slots.length) html = `<option value="">${esc(t("noSlots"))}</option>`;
      else html = `<option value="">${esc(t("pickTime"))}</option>` + slots.map((m) => `<option>${fmtMin(m)}</option>`).join("");
    }
    form.time.innerHTML = html;
    if ([...form.time.options].some((o) => o.value === prev && prev)) form.time.value = prev;
  }

  function renderQuickDays() {
    const now = shopNow();
    const chips = [];
    for (let i = 0; chips.length < 7 && i < C.bookingDaysAhead; i++) {
      const ymd = addDays(now.ymd, i);
      const slots = slotsFor(ymd);
      if (!slots || !slots.length) continue;
      const [, m, d] = ymd.split("-");
      const top = i === 0 ? t("today") : i === 1 ? t("tomorrow") : t("daysShort")[dowOf(ymd)];
      chips.push(`<button type="button" class="day${form.date.value === ymd ? " is-on" : ""}" data-date="${ymd}" aria-pressed="${form.date.value === ymd}">
        <small>${esc(top)}</small><b>${Number(d)}</b><small>${m}</small></button>`);
    }
    $("#quickDays").innerHTML = chips.join("");
  }

  function renderSummary() {
    const s = selected();
    $("#sumService").textContent = s ? local(s) : "–";
    $("#sumLength").textContent = s ? `${s.min} ${t("min")}` : "–";
    $("#sumPrice").textContent = s ? price(s.price) : "–";
    const d = form.date.value, tm = form.time.value;
    $("#sumWhen").textContent = d ? fmtDate(d) + (tm ? " · " + tm : "") : "–";
  }

  function onServiceOrDate() {
    fillTimes();
    renderQuickDays();
    renderSummary();
  }

  function setupDateLimits() {
    const now = shopNow();
    form.date.min = now.ymd;
    form.date.max = addDays(now.ymd, C.bookingDaysAhead);
  }

  function renderSubmit() {
    $("#submitLabel").textContent = waNumber ? t("submitWa") : t("submitIg");
    $("#formFine").textContent = waNumber ? t("fineWa") : t("fineIg");
  }

  form.service.addEventListener("change", onServiceOrDate);
  form.date.addEventListener("change", onServiceOrDate);
  form.time.addEventListener("change", renderSummary);
  $("#quickDays").addEventListener("click", (e) => {
    const b = e.target.closest("[data-date]");
    if (!b) return;
    form.date.value = b.dataset.date;
    onServiceOrDate();
    form.time.focus();
  });

  ["name", "phone"].forEach((k) => {
    const v = store.get(k);
    if (v) form[k].value = v;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#formError");
    const missing = ["service", "date", "time", "name", "phone"].filter((k) => !form[k].value.trim());
    $$(".field", form).forEach((f) => f.classList.remove("is-invalid"));
    if (form.date.value && !hoursFor(dowOf(form.date.value))) {
      err.textContent = t("errClosed");
      err.hidden = false;
      form.date.closest(".field").classList.add("is-invalid");
      form.date.focus();
      return;
    }
    if (missing.length) {
      err.textContent = fill(t("err"), { f: missing.map((k) => t("fields")[k]).join(", ") });
      err.hidden = false;
      missing.forEach((k) => form[k].closest(".field").classList.add("is-invalid"));
      form[missing[0]].focus();
      return;
    }
    err.hidden = true;
    store.set("name", form.name.value.trim());
    store.set("phone", form.phone.value.trim());

    const s = selected();
    const lines = [
      t("msgHello"),
      "",
      `${t("msgService")}: ${local(s)} (${price(s.price)}, ${s.min} ${t("min")})`,
      `${t("msgDate")}: ${fmtDate(form.date.value)}`,
      `${t("msgTime")}: ${form.time.value}`,
      form.barber && form.barber.value ? `${t("msgBarber")}: ${form.barber.value}` : "",
      `${t("msgName")}: ${form.name.value.trim()}`,
      `${t("msgPhone")}: ${form.phone.value.trim()}`,
      form.note.value.trim() ? `${t("msgNote")}: ${form.note.value.trim()}` : ""
    ].filter((l, i) => l || i === 1);
    const msg = lines.join("\n");

    if (waNumber) {
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
      return;
    }
    // Start the copy while this page still has focus, then open Instagram in the same click.
    let copied;
    try { copied = navigator.clipboard.writeText(msg); } catch (err) { copied = Promise.reject(err); }
    const win = window.open(igDm, "_blank");
    if (win) win.opener = null;
    try {
      await copied;
      toast(t("copied"));
    } catch {
      toast(t("copyFail"));
    }
    if (!win) setTimeout(() => (location.href = igDm), 1200);
  });

  let toastTimer;
  function toast(text) {
    const el = $("#toast");
    el.textContent = text;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("is-on"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("is-on");
      setTimeout(() => (el.hidden = true), 300);
    }, 5000);
  }

  /* ---------- Structured data for search engines ---------- */
  function injectSchema() {
    const spec = Object.entries(C.hours).filter(([, h]) => h).map(([k, h]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "https://schema.org/" + ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][DAY_KEYS.indexOf(k)],
      opens: h[0], closes: h[1]
    }));
    const data = {
      "@context": "https://schema.org",
      "@type": "HairSalon",
      name: C.name,
      url: location.origin + location.pathname,
      image: new URL("assets/og.png", location.href).href,
      sameAs: [igUrl],
      priceRange: "€",
      openingHoursSpecification: spec,
      makesOffer: C.services.map((s) => ({
        "@type": "Offer", price: s.price, priceCurrency: "EUR",
        itemOffered: { "@type": "Service", name: s.sq }
      }))
    };
    if (C.phone) data.telephone = C.phone;
    if (place) data.address = { "@type": "PostalAddress", streetAddress: C.address, addressLocality: C.city, addressCountry: "XK" };
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
  }

  /* ---------- Render everything that depends on language ---------- */
  function renderAll() {
    $$(".js-from-price").forEach((el) => (el.textContent = price(minPrice)));
    renderTabs();
    renderMenu();
    renderStatus();
    renderHours();
    renderContact();
    renderGallery();
    renderTeam();
    fillServiceSelect();
    fillBarberSelect();
    fillTimes();
    renderQuickDays();
    renderSummary();
    renderSubmit();
  }

  /* ---------- Header, menu, dock, reveal ---------- */
  const header = $("#top");
  const burger = $("#burger");
  const nav = $("#nav");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  $$(".lang button").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));

  const dock = $("#dock");
  const hero = $(".hero");
  const book = $("#book");
  let heroOut = false, bookIn = false;
  const syncDock = () => dock.classList.toggle("is-on", heroOut && !bookIn);
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting; syncDock(); }, { rootMargin: "-40% 0px 0px 0px" }).observe(hero);
    new IntersectionObserver(([e]) => { bookIn = e.isIntersecting; syncDock(); }).observe(book);

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));

    const links = $$(".nav a[href^='#']");
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["services", "studio", "work", "visit"].forEach((id) => spy.observe(document.getElementById(id)));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in"));
  }

  /* ---------- Init ---------- */
  $$(".js-ig").forEach((a) => (a.href = igUrl));
  $$(".js-ig-handle").forEach((el) => (el.textContent = "@" + C.instagram));
  if (C.phone) {
    const d = $(".js-dock-contact");
    d.href = telHref;
    d.removeAttribute("target");
    d.setAttribute("aria-label", C.phone);
    d.innerHTML = ICON.phone;
  }
  $("#year").textContent = new Date().getFullYear();

  setupDateLimits();
  renderPhotos();
  renderMap();
  applyLang(lang);
  injectSchema();
  setInterval(renderStatus, 60_000);
})();
