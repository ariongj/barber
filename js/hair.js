/*
 * The hero's hair field: thousands of strands drawn on a canvas over the page.
 * Moving the pointer (or dragging a finger) shaves them off; once enough is
 * cut, the rest falls away and reveals what is underneath.
 *
 * Performance: the uncut hair lives in an offscreen bitmap. Cutting repaints
 * only the area around the cut, the strands that bend around the pointer are
 * drawn in a small clipped circle, and nothing is drawn while nothing moves.
 */
(() => {
  "use strict";

  const SHADES = ["#17110d", "#211913", "#2d231b", "#45372a"];
  const SHADE_WEIGHTS = [0.38, 0.34, 0.21, 0.07];
  const SCALP = "#130f0c";
  const BEND = 90; // radius around the pointer where strands bend away

  const layer = (w, h, dpr) => {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * dpr));
    c.height = Math.max(1, Math.round(h * dpr));
    return c;
  };

  class HairField {
    constructor(host, canvas, opts = {}) {
      this.host = host;
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.opts = opts;
      this.threshold = opts.threshold ?? 0.5;
      this.state = "live";
      this.particles = [];
      this.pointer = null;
      this.last = null;
      this.down = false;
      this.visible = true;
      this.running = false;
      this.dirty = true;
      this.damage = null;
      this.build();
      this.bind();
      this.start();
    }

    build() {
      const r = this.host.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      Object.assign(this, { w, h, dpr });
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";
      this.base = layer(w, h, dpr);
      this.bctx = this.base.getContext("2d");
      this.scalp = layer(w, h, dpr);
      this.sctx = this.scalp.getContext("2d");

      const small = w < 700;
      const s = (this.spacing = small ? 7 : 8);
      this.radius = small ? 30 : 38;
      this.lineWidth = small ? 2 : 2.4;
      const minLen = small ? 17 : 21;
      const spread = small ? 10 : 11;
      this.maxLen = minLen + spread;
      const cols = (this.cols = Math.ceil(w / s) + 3);
      const rows = (this.rows = Math.ceil(h / s) + 3);
      const n = (this.total = cols * rows);

      this.bx = new Float32Array(n);
      this.by = new Float32Array(n);
      this.dx = new Float32Array(n);   // tip offset from the root
      this.dy = new Float32Array(n);
      this.len = new Float32Array(n);
      this.jit = new Float32Array(n);  // 0..1, used for ragged cut edges
      this.shade = new Uint8Array(n);
      this.cut = new Uint8Array(n);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;
          const x = (col - 2) * s + Math.random() * s;
          const y = (row - 2) * s + Math.random() * s;
          const L = minLen + Math.random() * spread;
          // a combed flow: strands lean in slow waves across the head
          const a = Math.PI / 2 + 0.55 * Math.sin(x * 0.0045 + y * 0.0021) + 0.32 * Math.sin(y * 0.011 - x * 0.002) + (Math.random() - 0.5) * 0.35;
          this.bx[i] = x;
          this.by[i] = y;
          this.len[i] = L;
          this.dx[i] = Math.cos(a) * L;
          this.dy[i] = Math.sin(a) * L;
          this.jit[i] = Math.random();
          let r2 = Math.random(), k = 0;
          while (k < SHADES.length - 1 && r2 > SHADE_WEIGHTS[k]) r2 -= SHADE_WEIGHTS[k++];
          this.shade[i] = k;
        }
      }
      this.cutCount = 0;
      this.paintScalp();
      this.paintBase(0, 0, w, h);
      this.dirty = true;
    }

    paintScalp() {
      const c = this.sctx;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = 1;
      c.fillStyle = SCALP;
      c.fillRect(0, 0, this.w, this.h);
    }

    // Snap a box to whole device pixels so partial repaints leave no seams.
    snap(x0, y0, x1, y1) {
      const d = this.dpr, W = this.canvas.width, H = this.canvas.height;
      const a = Math.max(0, Math.floor(x0 * d)), b = Math.max(0, Math.floor(y0 * d));
      const c = Math.min(W, Math.ceil(x1 * d)), e = Math.min(H, Math.ceil(y1 * d));
      return c > a && e > b ? [a, b, c, e] : null;
    }

    // copy a device-pixel box of the scalp bitmap (which has the shaved holes in it)
    blitScalp(c, box) {
      const d = this.dpr;
      const [a, b, cc, e] = box;
      c.drawImage(this.scalp, a, b, cc - a, e - b, a / d, b / d, (cc - a) / d, (e - b) / d);
    }

    // clear a device-pixel box, clip to it, and repaint scalp + strands inside
    repaint(c, box, grow, alpha, bend) {
      const d = this.dpr, m = this.maxLen;
      const [a, b, cc, e] = box;
      const x0 = a / d, y0 = b / d, x1 = cc / d, y1 = e / d;
      c.save();
      c.setTransform(d, 0, 0, d, 0, 0);
      c.beginPath();
      c.rect(x0, y0, x1 - x0, y1 - y0);
      c.clip();
      c.clearRect(x0, y0, x1 - x0, y1 - y0);
      c.globalAlpha = alpha;
      this.blitScalp(c, box);
      this.strokeStrands(c, x0 - m, y0 - m, x1 + m, y1 + m, grow, bend);
      c.restore();
    }

    // stroke every uncut strand whose root is inside the box
    strokeStrands(c, x0, y0, x1, y1, grow = 1, bend = null) {
      const { spacing: s, cols, rows, bx, by, dx, dy, cut, shade } = this;
      const c0 = Math.max(0, Math.floor(x0 / s)), c1 = Math.min(cols - 1, Math.ceil(x1 / s) + 2);
      const r0 = Math.max(0, Math.floor(y0 / s)), r1 = Math.min(rows - 1, Math.ceil(y1 / s) + 2);
      c.lineWidth = this.lineWidth;
      c.lineCap = "butt";
      const R2 = BEND * BEND;
      for (let k = 0; k < SHADES.length; k++) {
        c.beginPath();
        for (let row = r0; row <= r1; row++) {
          let i = row * cols + c0;
          for (let col = c0; col <= c1; col++, i++) {
            if (cut[i] || shade[i] !== k) continue;
            const x = bx[i], y = by[i];
            let tx = dx[i] * grow, ty = dy[i] * grow;
            if (bend) {
              const ox = x - bend.x, oy = y - bend.y;
              const d2 = ox * ox + oy * oy;
              if (d2 < R2) {
                const d = Math.sqrt(d2) || 1;
                const f = (1 - d / BEND) * 1.6;
                const L = this.len[i];
                let ux = tx / L + (ox / d) * f, uy = ty / L + (oy / d) * f;
                const m = Math.sqrt(ux * ux + uy * uy) || 1;
                tx = (ux / m) * L;
                ty = (uy / m) * L;
              }
            }
            c.moveTo(x, y);
            c.lineTo(x + tx, y + ty);
          }
        }
        c.strokeStyle = SHADES[k];
        c.stroke();
      }
    }

    // repaint a box of the offscreen hair bitmap
    paintBase(x0, y0, x1, y1, grow = 1, alpha = 1) {
      const box = this.snap(x0, y0, x1, y1);
      if (box) this.repaint(this.bctx, box, grow, alpha, null);
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
        if (this.demoing) return;
        const p = pos(e);
        const mouse = e.pointerType === "mouse";
        if (mouse || this.down) {
          if (this.last) this.cutSegment(this.last.x, this.last.y, p.x, p.y);
          this.last = p;
        }
        if (mouse || this.down) {
          this.pointer = p;
          this.dirty = true;
          this.start();
        }
      }, { passive: true });
      const end = () => {
        this.down = false;
        this.last = null;
      };
      host.addEventListener("pointerup", (e) => {
        end();
        if (e.pointerType !== "mouse") { this.pointer = null; this.dirty = true; this.start(); }
      });
      host.addEventListener("pointercancel", () => { end(); this.pointer = null; this.dirty = true; this.start(); });
      host.addEventListener("pointerleave", () => {
        end();
        this.pointer = null;
        this.dirty = true;
        this.start();
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
          const ox = bx - (x0 + t * vx), oy = by - (y0 + t * vy);
          const rr = r * (0.8 + this.jit[i] * 0.4); // ragged edge
          if (ox * ox + oy * oy > rr * rr) continue;
          this.cut[i] = 1;
          n++;
          if (this.particles.length < 360 && Math.random() < 0.22) {
            this.particles.push({
              x: bx + this.dx[i] * 0.5, y: by + this.dy[i] * 0.5,
              vx: (Math.random() - 0.5) * 2.4 + vx * 0.04,
              vy: -Math.random() * 2.2,
              a: Math.atan2(this.dy[i], this.dx[i]), va: (Math.random() - 0.5) * 0.3,
              l: this.len[i] * (0.35 + Math.random() * 0.5)
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

      // remember which part of the hair bitmap needs repainting this frame
      const pad = r + this.maxLen + 2;
      const box = [Math.min(x0, x1) - pad, Math.min(y0, y1) - pad, Math.max(x0, x1) + pad, Math.max(y0, y1) + pad];
      const d = this.damage;
      this.damage = d ? [Math.min(d[0], box[0]), Math.min(d[1], box[1]), Math.max(d[2], box[2]), Math.max(d[3], box[3])] : box;

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
      if (this.damage) { this.paintBase(...this.damage); this.damage = null; }
      this.state = "falling";
      this.animStart = performance.now();
      this.opts.onProgress?.(1);
      this.start();
    }

    grow() {
      this.cut.fill(0);
      this.cutCount = 0;
      this.particles.length = 0;
      this.damage = null;
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
          this.dirty = true;
          this.start();
          this.opts.onDemoMove?.(x, y, k < 1);
          if (k < 1) requestAnimationFrame(step);
          else {
            this.demoing = false;
            this.pointer = null;
            this.dirty = true;
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    }

    start() {
      if (this.running || !this.visible || document.hidden || this.state === "done") return;
      this.running = true;
      requestAnimationFrame(() => this.frame());
    }

    frame() {
      const animating = this.state === "falling" || this.state === "growing";
      if (!this.visible || document.hidden || (!this.dirty && !animating && !this.particles.length)) {
        this.running = false;
        return;
      }
      this.dirty = false;
      this.draw();
      if (this.state === "done") { this.running = false; return; }
      requestAnimationFrame(() => this.frame());
    }

    draw() {
      const { ctx, w, h, dpr } = this;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const now = performance.now();

      if (this.state === "falling") {
        const k = Math.min(1, (now - this.animStart) / 950);
        ctx.globalAlpha = 1 - k;
        ctx.drawImage(this.base, 0, k * k * h * 1.1, w, h);
        ctx.globalAlpha = 1;
        if (k === 1) {
          this.state = "done";
          ctx.clearRect(0, 0, w, h);
          this.particles.length = 0;
          this.opts.onDone?.();
          return;
        }
      } else if (this.state === "growing") {
        const k = Math.min(1, (now - this.animStart) / 1300);
        const g = 1 - Math.pow(1 - k, 3);
        this.paintBase(0, 0, w, h, g, Math.min(1, k * 2.5));
        if (k === 1) this.state = "live";
        ctx.drawImage(this.base, 0, 0, w, h);
      } else {
        if (this.damage) {
          this.paintBase(...this.damage);
          this.damage = null;
        }
        ctx.drawImage(this.base, 0, 0, w, h);

        // strands near the pointer bend away from it: redraw just that square
        const p = this.pointer;
        if (p) {
          const R = BEND + this.maxLen;
          const box = this.snap(p.x - R, p.y - R, p.x + R, p.y + R);
          if (box) this.repaint(ctx, box, 1, 1, p);
        }
      }

      // falling clippings
      if (this.particles.length) {
        ctx.lineWidth = this.lineWidth * 0.9;
        ctx.beginPath();
        const keep = [];
        for (const q of this.particles) {
          q.vy += 0.32;
          q.vx *= 0.985;
          q.x += q.vx;
          q.y += q.vy;
          q.a += q.va;
          if (q.y > h + 30) continue;
          keep.push(q);
          const cx = Math.cos(q.a) * q.l * 0.5, cy = Math.sin(q.a) * q.l * 0.5;
          ctx.moveTo(q.x - cx, q.y - cy);
          ctx.lineTo(q.x + cx, q.y + cy);
        }
        ctx.strokeStyle = SHADES[3];
        ctx.stroke();
        this.particles = keep;
      }
    }
  }

  window.HairField = HairField;
})();
