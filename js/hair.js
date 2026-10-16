/*
 * The hero's hair field: thousands of strands drawn on a canvas over the page.
 * Moving the pointer (or dragging a finger) shaves them off; once enough is
 * cut, the rest falls away and reveals what is underneath.
 */
(() => {
  "use strict";

  const SHADES = ["#17110d", "#211913", "#2d231b", "#45372a"];
  const SHADE_WEIGHTS = [0.38, 0.34, 0.21, 0.07];
  const SCALP = "#130f0c";
  const TAU = Math.PI * 2;

  class HairField {
    constructor(host, canvas, opts = {}) {
      this.host = host;
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.scalp = document.createElement("canvas");
      this.sctx = this.scalp.getContext("2d");
      this.opts = opts;
      this.threshold = opts.threshold ?? 0.5;
      this.state = "live";
      this.particles = [];
      this.pointer = { x: -1e4, y: -1e4 };
      this.last = null;
      this.down = false;
      this.visible = true;
      this.running = false;
      this.lite = false;
      this.frameCost = 0;
      this.frames = 0;
      this.dirty = true;
      this.anim = 0;
      this.build();
      this.bind();
      this.start();
    }

    build() {
      const r = this.host.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      Object.assign(this, { w, h, dpr });
      for (const c of [this.canvas, this.scalp]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";

      const small = w < 700;
      const s = (this.spacing = small ? 6 : 7);
      this.radius = small ? 28 : 36;
      this.lineWidth = small ? 1.7 : 2;
      const cols = (this.cols = Math.ceil(w / s) + 3);
      const rows = (this.rows = Math.ceil(h / s) + 3);
      const n = (this.total = cols * rows);

      this.bx = new Float32Array(n);
      this.by = new Float32Array(n);
      this.len = new Float32Array(n);
      this.ang = new Float32Array(n);
      this.ph = new Float32Array(n);
      this.cut = new Uint8Array(n);
      const buckets = SHADES.map(() => []);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;
          const x = (col - 2) * s + Math.random() * s;
          const y = (row - 2) * s + Math.random() * s;
          this.bx[i] = x;
          this.by[i] = y;
          this.len[i] = (small ? 15 : 19) + Math.random() * 11;
          // a combed flow: strands lean in slow waves across the head
          this.ang[i] = Math.PI / 2 + 0.55 * Math.sin(x * 0.0045 + y * 0.0021) + 0.32 * Math.sin(y * 0.011 - x * 0.002) + (Math.random() - 0.5) * 0.35;
          this.ph[i] = Math.random() * TAU;
          let r2 = Math.random(), k = 0;
          while (k < SHADES.length - 1 && r2 > SHADE_WEIGHTS[k]) r2 -= SHADE_WEIGHTS[k++];
          buckets[k].push(i);
        }
      }
      this.buckets = buckets.map((b) => Uint32Array.from(b));
      this.cutCount = 0;
      this.paintScalp();
      this.dirty = true;
    }

    paintScalp() {
      const c = this.sctx;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.globalCompositeOperation = "source-over";
      c.fillStyle = SCALP;
      c.fillRect(0, 0, this.w, this.h);
    }

    bind() {
      const host = this.host;
      const pos = (e) => {
        const r = this.canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      host.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse") return;
        this.down = true;
        this.last = pos(e);
      });
      host.addEventListener("pointermove", (e) => {
        const p = pos(e);
        this.pointer = p;
        this.dirty = true;
        if (this.demoing) return;
        if (e.pointerType === "mouse" || this.down) {
          if (this.last) this.cutSegment(this.last.x, this.last.y, p.x, p.y);
          this.last = p;
        }
      });
      const end = () => { this.down = false; this.last = null; };
      host.addEventListener("pointerup", end);
      host.addEventListener("pointercancel", end);
      host.addEventListener("pointerleave", () => {
        end();
        this.pointer = { x: -1e4, y: -1e4 };
        this.dirty = true;
      });

      let lastW = this.w, lastH = this.h, t;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const r = this.host.getBoundingClientRect();
          // ignore the small height changes from mobile browser toolbars
          if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 140) return;
          lastW = r.width; lastH = r.height;
          if (this.state === "done") return;
          this.state = "live";
          this.build();
          this.opts.onProgress?.(0);
          this.start();
        }, 200);
      });

      new IntersectionObserver(([e]) => {
        this.visible = e.isIntersecting;
        if (this.visible) this.start();
      }).observe(host);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) this.start(); });
    }

    cutSegment(x0, y0, x1, y1) {
      if (this.state !== "live") return 0;
      const { spacing: s, cols, rows, radius: r } = this;
      const c0 = Math.max(0, Math.floor((Math.min(x0, x1) - r) / s));
      const c1 = Math.min(cols - 1, Math.floor((Math.max(x0, x1) + r) / s) + 3);
      const r0 = Math.max(0, Math.floor((Math.min(y0, y1) - r) / s));
      const r1 = Math.min(rows - 1, Math.floor((Math.max(y0, y1) + r) / s) + 3);
      const vx = x1 - x0, vy = y1 - y0;
      const l2 = vx * vx + vy * vy;
      let n = 0;
      for (let row = r0; row <= r1; row++) {
        for (let col = c0; col <= c1; col++) {
          const i = row * cols + col;
          if (this.cut[i]) continue;
          const bx = this.bx[i], by = this.by[i];
          let t = l2 ? ((bx - x0) * vx + (by - y0) * vy) / l2 : 0;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const dx = bx - (x0 + t * vx), dy = by - (y0 + t * vy);
          const rr = r * (0.8 + (this.ph[i] / TAU) * 0.4); // ragged edge
          if (dx * dx + dy * dy > rr * rr) continue;
          this.cut[i] = 1;
          n++;
          if (this.particles.length < 700 && Math.random() < 0.3) {
            this.particles.push({
              x: bx, y: by + this.len[i] * 0.4,
              vx: (Math.random() - 0.5) * 2.4 + vx * 0.04,
              vy: -Math.random() * 2.2,
              a: this.ang[i], va: (Math.random() - 0.5) * 0.3,
              l: this.len[i] * (0.35 + Math.random() * 0.5),
              k: (Math.random() * 3) | 0
            });
          }
        }
      }
      if (!n) return 0;
      const c = this.sctx;
      c.globalCompositeOperation = "destination-out";
      c.lineCap = "round";
      c.lineWidth = r * 1.55;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1 + 0.01, y1);
      c.stroke();
      c.globalCompositeOperation = "source-over";

      this.cutCount += n;
      this.dirty = true;
      const p = this.cutCount / this.total;
      this.opts.onCut?.(n, x1, y1);
      this.opts.onProgress?.(p);
      if (p >= this.threshold && !this.demoing) this.finish();
      this.start();
      return n;
    }

    finish() {
      if (this.state !== "live") return;
      this.state = "falling";
      this.animStart = performance.now();
      this.opts.onProgress?.(1);
      this.start();
    }

    grow() {
      this.cut.fill(0);
      this.cutCount = 0;
      this.particles.length = 0;
      this.paintScalp();
      this.state = "growing";
      this.animStart = performance.now();
      this.opts.onProgress?.(0);
      this.start();
    }

    // A scripted pass of the clippers so people see what the hero does.
    demo(duration = 1500) {
      return new Promise((resolve) => {
        const { w, h } = this;
        const y0 = h * 0.5, y1 = h * 0.44;
        const start = performance.now();
        let prev = null;
        this.demoing = true;
        const step = (now) => {
          const k = Math.min(1, (now - start) / duration);
          const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          const x = -60 + e * (w + 120);
          const y = y0 + (y1 - y0) * e + Math.sin(e * Math.PI * 2) * h * 0.04;
          if (prev) this.cutSegment(prev.x, prev.y, x, y);
          prev = { x, y };
          this.pointer = { x, y };
          this.opts.onDemoMove?.(x, y, k < 1);
          if (k < 1) requestAnimationFrame(step);
          else {
            this.demoing = false;
            this.pointer = { x: -1e4, y: -1e4 };
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    }

    start() {
      if (this.running || !this.visible || document.hidden) return;
      if (this.state === "done") return;
      this.running = true;
      requestAnimationFrame((t) => this.frame(t));
    }

    frame(t) {
      if (!this.visible || document.hidden) { this.running = false; return; }
      const animating = this.state === "falling" || this.state === "growing";
      if (this.lite && !this.dirty && !animating && !this.particles.length) {
        this.running = false;
        return;
      }
      const t0 = performance.now();
      this.draw(t);
      this.dirty = false;

      if (!this.lite) {
        this.frameCost += performance.now() - t0;
        if (++this.frames === 40) {
          if (this.frameCost / 40 > 13) this.lite = true;
          this.frameCost = 0;
          this.frames = 0;
        }
      }
      if (this.state === "done") { this.running = false; return; }
      requestAnimationFrame((tt) => this.frame(tt));
    }

    draw(t) {
      const { ctx, w, h, dpr } = this;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      let fall = 0, alpha = 1, grow = 1;
      const now = performance.now();
      if (this.state === "falling") {
        const k = Math.min(1, (now - this.animStart) / 950);
        fall = k * k * h * 1.1;
        alpha = 1 - k;
        if (k === 1) {
          this.state = "done";
          ctx.clearRect(0, 0, w, h);
          this.particles.length = 0;
          this.opts.onDone?.();
          return;
        }
      } else if (this.state === "growing") {
        const k = Math.min(1, (now - this.animStart) / 1300);
        grow = 1 - Math.pow(1 - k, 3);
        alpha = Math.min(1, k * 2.5);
        if (k === 1) this.state = "live";
      }

      ctx.globalAlpha = alpha;
      ctx.drawImage(this.scalp, 0, 0, w, h);

      const { bx, by, len, ang, ph, cut } = this;
      const px = this.pointer.x, py = this.pointer.y;
      const R = 95, R2 = R * R;
      const time = this.lite ? 0 : t * 0.0011;
      const sway = this.lite ? 0 : 0.07;
      ctx.lineWidth = this.lineWidth;
      ctx.lineCap = "butt";

      for (let k = 0; k < this.buckets.length; k++) {
        const b = this.buckets[k];
        ctx.beginPath();
        for (let j = 0; j < b.length; j++) {
          const i = b[j];
          if (cut[i]) continue;
          const x = bx[i], y = by[i] + fall;
          if (y > h + 4) continue;
          const L = len[i] * grow;
          const a = ang[i] + (sway ? Math.sin(time + ph[i]) * sway : 0);
          let ux = Math.cos(a), uy = Math.sin(a);
          const dx = x - px, dy = y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            // strands near the pointer bend away from it
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / R) * 1.6;
            ux += (dx / d) * f;
            uy += (dy / d) * f;
            const m = Math.sqrt(ux * ux + uy * uy) || 1;
            ux /= m; uy /= m;
          }
          ctx.moveTo(x, y);
          ctx.lineTo(x + ux * L, y + uy * L);
        }
        ctx.strokeStyle = SHADES[k];
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // falling clippings
      if (this.particles.length) {
        ctx.lineWidth = this.lineWidth * 0.9;
        ctx.beginPath();
        const keep = [];
        for (const p of this.particles) {
          p.vy += 0.32;
          p.vx *= 0.985;
          p.x += p.vx;
          p.y += p.vy;
          p.a += p.va;
          if (p.y > h + 30) continue;
          keep.push(p);
          const cx = Math.cos(p.a) * p.l * 0.5, cy = Math.sin(p.a) * p.l * 0.5;
          ctx.moveTo(p.x - cx, p.y - cy);
          ctx.lineTo(p.x + cx, p.y + cy);
        }
        ctx.strokeStyle = SHADES[3];
        ctx.stroke();
        this.particles = keep;
      }
    }
  }

  window.HairField = HairField;
})();
