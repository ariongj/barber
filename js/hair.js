/*
 * The hero's opening curtain: a full-screen field of hair drawn once on a
 * canvas. Shortly after the page loads it drops away in clumps, revealing the
 * barber-pole colours underneath.
 */
(() => {
  "use strict";

  const SHADES = ["#17110d", "#211913", "#2d231b", "#45372a"];
  const SHADE_WEIGHTS = [0.38, 0.34, 0.21, 0.07];
  const SCALP = "#130f0c";

  class HairCurtain {
    constructor(host, canvas) {
      this.host = host;
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.dropped = false;
      this.paint();

      let lastW = this.w, t;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const w = this.host.getBoundingClientRect().width;
          if (this.dropped || Math.abs(w - lastW) < 2) return;
          lastW = w;
          this.paint();
        }, 200);
      });
    }

    paint() {
      const r = this.host.getBoundingClientRect();
      const w = (this.w = Math.max(1, Math.round(r.width)));
      const h = (this.h = Math.max(1, Math.round(r.height)));
      const dpr = (this.dpr = Math.min(window.devicePixelRatio || 1, 1.5));
      const c = this.canvas;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = w + "px";
      c.style.height = h + "px";

      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = SCALP;
      ctx.fillRect(0, 0, w, h);

      const small = w < 700;
      const s = small ? 7 : 8;
      const minLen = small ? 17 : 21, spread = small ? 10 : 11;
      const paths = SHADES.map(() => new Path2D());
      for (let y = -2 * s; y < h + s; y += s) {
        for (let x = -2 * s; x < w + s; x += s) {
          const bx = x + Math.random() * s, by = y + Math.random() * s;
          const L = minLen + Math.random() * spread;
          // a combed flow: strands lean in slow waves across the head
          const a = Math.PI / 2 + 0.55 * Math.sin(bx * 0.0045 + by * 0.0021) + 0.32 * Math.sin(by * 0.011 - bx * 0.002) + (Math.random() - 0.5) * 0.35;
          let r2 = Math.random(), k = 0;
          while (k < SHADES.length - 1 && r2 > SHADE_WEIGHTS[k]) r2 -= SHADE_WEIGHTS[k++];
          paths[k].moveTo(bx, by);
          paths[k].lineTo(bx + Math.cos(a) * L, by + Math.sin(a) * L);
        }
      }
      ctx.lineWidth = small ? 2 : 2.4;
      paths.forEach((p, k) => { ctx.strokeStyle = SHADES[k]; ctx.stroke(p); });
    }

    // Drop the hair in vertical clumps, each falling and tilting a little.
    drop(onDone) {
      if (this.dropped) return;
      this.dropped = true;
      const { w, h, dpr, ctx } = this;
      const src = document.createElement("canvas");
      src.width = this.canvas.width;
      src.height = this.canvas.height;
      src.getContext("2d").drawImage(this.canvas, 0, 0);

      const n = w < 700 ? 10 : 20;
      const cw = w / n;
      const clumps = Array.from({ length: n }, (_, i) => ({
        x: i * cw,
        delay: Math.abs(i - (n - 1) / 2) * 38 + Math.random() * 110, // centre first
        spin: (Math.random() - 0.5) * 0.18,
        drift: (Math.random() - 0.5) * 40
      }));
      const dur = 950;
      const last = Math.max(...clumps.map((c) => c.delay)) + dur;
      const start = performance.now();

      const frame = (now) => {
        const t = now - start;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        for (const c of clumps) {
          const k = Math.min(1, Math.max(0, (t - c.delay) / dur));
          if (k >= 1) continue;
          const e = k * k * k;
          ctx.save();
          ctx.globalAlpha = Math.pow(1 - k, 1.6);
          ctx.translate(c.x + cw / 2 + c.drift * e, e * h * 1.2);
          ctx.rotate(c.spin * e);
          ctx.drawImage(src, c.x * dpr, 0, (cw + 1) * dpr, h * dpr, -cw / 2, 0, cw + 1, h);
          ctx.restore();
        }
        if (t < last) requestAnimationFrame(frame);
        else {
          ctx.clearRect(0, 0, w, h);
          onDone?.();
        }
      };
      requestAnimationFrame(frame);
    }
  }

  window.HairCurtain = HairCurtain;
})();
