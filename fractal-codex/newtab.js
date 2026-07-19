"use strict";
/* =====================================================================
   Codice dei Frattali v2 — living folios.

   Every new tab seeds a fresh 128-bit fractal that follows your cursor:
   moving the hand moves the constants of the fractal's equation, and the
   equation (shown lower-left) rewrites itself as the drawing morphs.
   A quotation appears word by word wherever the cursor passes, like ink
   surfacing on an enchanted page.

   Privacy: no permissions, no network, no collection. The only thing
   remembered (in this extension's own localStorage, on this device) are
   three tiny rotation lists: the last 60 equation signatures, the quote
   indices already shown, and the last few styles — so equations don't
   reappear within 60 tabs and no quote repeats until the whole library
   has been read.
   ===================================================================== */

/* ------------------------- seeded randomness ------------------------- */
function sfc32(a, b, c, d){
  return function(){
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ (b >>> 9);
    b = c + (c << 3) | 0;
    c = (c << 21) | (c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}
function freshSeed(){
  const u = new Uint32Array(4);
  crypto.getRandomValues(u);
  return u;
}
const seedHex = u => [...u].map(x => x.toString(16).padStart(8, "0")).join("");

class R {
  constructor(words){ this.next = sfc32(words[0], words[1], words[2], words[3]); }
  f(a = 0, b = 1){ return a + (b - a) * this.next(); }
  i(a, b){ return Math.floor(this.f(a, b + 1)); }
  pick(arr){ return arr[this.i(0, arr.length - 1)]; }
  chance(p){ return this.next() < p; }
  g(){ return (this.next() + this.next() + this.next() + this.next() - 2) / 1.2; }
  sign(){ return this.chance(0.5) ? 1 : -1; }
}

/* ------------------- tiny on-device rotation memory ------------------ */
const store = {
  get(k, fallback){
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch(_){ return fallback; }
  },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(_){} },
};
const EQ_HISTORY_KEY = "cf_eq_hist";       // last 60 equation signatures
const QUOTES_USED_KEY = "cf_quotes_used_v2";  // quote indices already shown (v2 library)
const FAM_RECENT_KEY = "cf_fam_recent";    // last few styles, for variety

/* --------------------------- palette --------------------------------- */
const PHI = (1 + Math.sqrt(5)) / 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
let P = {};
function makePalette(r){
  const ir = r.i(48, 66), ig = r.i(34, 46), ib = r.i(20, 28);
  const cr = r.i(148, 168), cg = r.i(72, 88), cb = r.i(48, 62);
  P = {
    inkRGB: [ir, ig, ib],
    ink: a => `rgba(${ir},${ig},${ib},${a})`,
    chalk: a => `rgba(${cr},${cg},${cb},${a})`,
    faded: a => `rgba(${ir + 60},${ig + 48},${ib + 34},${a})`,
    paperHi: `rgb(${r.i(228, 238)},${r.i(211, 221)},${r.i(172, 186)})`,
    paperLo: `rgb(${r.i(200, 214)},${r.i(180, 194)},${r.i(138, 154)})`,
  };
}

/* ----------------------- hand-drawn strokes -------------------------- */
let ctx = null;                       // active drawing target
const setCtx = c => { ctx = c; };

function handify(r, pts, jitter, step = 3){
  const out = [];
  let wob = 0;
  for (let i = 0; i < pts.length - 1; i++){
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(d / step));
    for (let j = 0; j < n; j++){
      const t = j / n;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      wob += r.g() * jitter * 0.45;
      wob *= 0.86;
      const dx = x1 - x0, dy = y1 - y0;
      const inv = 1 / (Math.hypot(dx, dy) || 1);
      out.push([x - dy * inv * wob, y + dx * inv * wob]);
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}

function inkLine(r, pts, w, color, jitter = 1){
  if (pts.length < 2) return;
  const hp = handify(r, pts, jitter);
  let press = r.f(0.75, 1.05);
  for (let i = 0; i < hp.length - 1; i++){
    const t = i / (hp.length - 1);
    const taper = Math.min(1, 4 * t) * Math.min(1, 4 * (1 - t)) * 0.35 + 0.65;
    press += r.g() * 0.05;
    press = Math.max(0.5, Math.min(1.25, press));
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.35, w * taper * press);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hp[i][0], hp[i][1]);
    ctx.lineTo(hp[i + 1][0], hp[i + 1][1]);
    ctx.stroke();
  }
}

function chalkLine(r, pts, w, alpha, jitter = 0.7){
  const hp = handify(r, pts, jitter, 4);
  ctx.strokeStyle = P.chalk(alpha);
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.beginPath();
  hp.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
}

function circlePts(cx, cy, rad, a0 = 0, a1 = Math.PI * 2, n = 64){
  const pts = [];
  for (let i = 0; i <= n; i++){
    const a = a0 + (a1 - a0) * i / n;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return pts;
}
const chalkCircle = (r, cx, cy, rad, alpha) => chalkLine(r, circlePts(cx, cy, rad), 1, alpha, 0.9);

function hatchCircle(r, cx, cy, rad, angle, spacing, color, w = 0.6){
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.clip();
  const c = Math.cos(angle), s = Math.sin(angle);
  for (let o = -rad; o <= rad; o += spacing * r.f(0.85, 1.2)){
    const px = cx - s * o, py = cy + c * o;
    const L = Math.sqrt(Math.max(0, rad * rad - o * o)) + 2;
    inkLine(r, [[px - c * L, py - s * L], [px + c * L, py + s * L]], w, color, 0.6);
  }
  ctx.restore();
}

/* ------------------------------ paper -------------------------------- */
function paper(r, W, H){
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, P.paperHi);
  g.addColorStop(1, P.paperLo);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4){
    const n = (r.next() - 0.5) * 14;
    d[i] += n; d[i + 1] += n * 0.92; d[i + 2] += n * 0.8;
  }
  ctx.putImageData(img, 0, 0);

  for (let i = 0, n = r.i(6, 14); i < n; i++){
    const x = r.f(0, W), y = r.f(0, H), rad = r.f(40, Math.min(W, H) * 0.4);
    const gb = ctx.createRadialGradient(x, y, rad * r.f(0.1, 0.5), x, y, rad);
    const warm = r.chance(0.7);
    gb.addColorStop(0, "rgba(0,0,0,0)");
    gb.addColorStop(0.85, warm ? `rgba(150,110,55,${r.f(0.02, 0.06)})` : `rgba(90,80,60,${r.f(0.02, 0.05)})`);
    gb.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gb;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0, n = r.i(30, 90); i < n; i++){
    ctx.fillStyle = `rgba(${r.i(120, 160)},${r.i(80, 105)},${r.i(40, 60)},${r.f(0.04, 0.14)})`;
    ctx.beginPath();
    ctx.arc(r.f(0, W), r.f(0, H), r.f(0.5, 2.6), 0, 7);
    ctx.fill();
  }
  for (let i = 0, n = r.i(1, 3); i < n; i++){
    const vertical = r.chance(0.5);
    const p = r.f(0.2, 0.8);
    const pts = vertical
      ? [[W * p + r.f(-30, 30), 0], [W * p + r.f(-30, 30), H]]
      : [[0, H * p + r.f(-30, 30)], [W, H * p + r.f(-30, 30)]];
    chalkLine(r, pts, 1, 0.045, 6);
  }
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(60,40,15,0.30)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

/* ----------------------- mirror handwriting -------------------------- */
function scriptBlock(r, x, y, width, nLines, size = 7){
  ctx.save();
  ctx.translate(x + width, 0);
  ctx.scale(-1, 1);
  for (let line = 0; line < nLines; line++){
    const by = y + line * size * 2.1;
    let cx = 0;
    const lineEnd = width * r.f(0.82, 1);
    while (cx < lineEnd){
      const wordLen = r.i(2, 7);
      const pts = [];
      let px = cx, py = by;
      pts.push([px, py]);
      for (let k = 0; k < wordLen; k++){
        const kind = r.next();
        if (kind < 0.25){
          const asc = r.chance(0.3) ? -size * r.f(0.9, 1.6) : -size * r.f(0.2, 0.6);
          pts.push([px + size * 0.2, py + asc]);
          pts.push([px + size * 0.55, py + asc * 0.4]);
          pts.push([px + size * 0.5, py + size * 0.1]);
        } else if (kind < 0.4){
          pts.push([px + size * 0.3, py + size * r.f(0.8, 1.5)]);
          pts.push([px + size * 0.6, py + size * 0.2]);
        } else {
          pts.push([px + size * 0.25, py - size * r.f(0.3, 0.75)]);
          pts.push([px + size * 0.55, py + size * r.f(-0.1, 0.15)]);
        }
        px += size * r.f(0.5, 0.8);
        py = by + r.g() * size * 0.1;
      }
      inkLine(r, pts, 0.7, P.ink(r.f(0.4, 0.62)), 0.5);
      if (r.chance(0.3)){
        const dx = cx + r.f(0, px - cx);
        inkLine(r, [[dx, by - size * 1.1], [dx + size * 0.3, by - size * 1.2]], 0.6, P.ink(0.5), 0.3);
      }
      cx = px + size * r.f(0.7, 1.3);
    }
  }
  ctx.restore();
}

function folioMark(r, W, H){
  ctx.save();
  ctx.font = `${Math.round(Math.min(W, H) * 0.019 + 8)}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = P.faded(0.85);
  ctx.textAlign = "right";
  const folio = r.i(1, 190) + " " + (r.chance(0.5) ? "r" : "v");
  ctx.fillText(folio, W - Math.min(W, H) * 0.045, Math.min(W, H) * 0.07);
  ctx.restore();
  return folio;
}

function marginStudy(r, x, y, s){
  chalkCircle(r, x, y, s, 0.5);
  const n = r.pick([3, 4, 5, 6]);
  const rot = r.f(0, Math.PI);
  const pts = [];
  for (let i = 0; i <= n; i++){
    const a = rot + i / n * Math.PI * 2;
    pts.push([x + Math.cos(a) * s, y + Math.sin(a) * s]);
  }
  inkLine(r, pts, 0.8, P.ink(0.55), 0.6);
  inkLine(r, [[x - s * 1.25, y], [x + s * 1.25, y]], 0.5, P.ink(0.35), 0.5);
  for (const t of [-s, -s / PHI, s / PHI, s]){
    inkLine(r, [[x + t, y - 2.5], [x + t, y + 2.5]], 0.6, P.ink(0.5), 0.3);
  }
}

const fmt = (v, d = 2) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(d);
const deg = rad => fmt(rad * 180 / Math.PI, 1) + "°";

/* =====================================================================
   The studies. Each is { name, init(r, W, H) -> st, render(st, r, m, t),
   equation(st, m, t) -> string }. `m` is the eased cursor in [0,1]².
   init() draws the static marginalia onto the current (paper) ctx;
   render() redraws only the living fractal every animation frame.
   ===================================================================== */

/* ---------------- l'Albero — cursor is the wind --------------------- */
const Albero = {
  name: "albero",
  init(r, W, H){
    const S = Math.min(W, H);
    scriptBlock(r, W * 0.06, H * r.f(0.1, 0.16), W * r.f(0.2, 0.3), r.i(3, 6));
    marginStudy(r, W * r.f(0.08, 0.14), H * r.f(0.72, 0.82), S * 0.045);
    const st = {
      S, baseX: W * r.f(0.4, 0.6), baseY: H * 0.86,
      spread0: r.f(0.42, 0.58), lenDecay0: r.f(0.75, 0.82),
      trunkW: S * r.f(0.012, 0.018), len0: S * r.f(0.13, 0.17),
      depth: 9, leafInk: r.chance(0.4),
      groundSeed: r.i(1, 1e9),
    };
    // hatched ground is static
    const gr = new R([st.groundSeed, 11, 22, 33]);
    const gw = S * 0.26;
    for (let i = 0, n = 18; i < n; i++){
      const gx = st.baseX + gr.f(-gw, gw);
      const gy = st.baseY + gr.f(0, S * 0.03);
      inkLine(gr, [[gx, gy], [gx + gr.f(10, 42) * gr.sign(), gy + gr.f(1, 6)]], 0.6, P.ink(gr.f(0.2, 0.4)), 0.8);
    }
    return st;
  },
  /* the cursor writes the equation: x sets the wind lean + spread,
     y sets the length ratio; a slow breath drifts them when idle */
  params(st, m, t){
    return {
      lean: (m.x - 0.5) * 0.85 + Math.sin(t * 0.4) * 0.03,
      spread: st.spread0 * (0.7 + m.x * 0.6),
      decay: st.lenDecay0 * (0.88 + (1 - m.y) * 0.22),
      curl: (m.x - 0.5) * 0.5,
    };
  },
  render(st, r, m, t){
    const p = this.params(st, m, t);
    const maxDepth = st.depth;
    const leafInk = st.leafInk;
    function branch(x, y, ang, len, w, depth){
      if (depth <= 0 || w < 0.55 || len < 3){
        const nL = r.i(2, 4);
        for (let i = 0; i < nL; i++){
          const a = ang + r.f(-1.4, 1.4);
          const lx = x + Math.cos(a) * r.f(2, 9);
          const ly = y + Math.sin(a) * r.f(2, 9);
          inkLine(r, [[lx, ly], [lx + Math.cos(a + 0.8) * 5, ly + Math.sin(a + 0.8) * 5]],
                  0.7, leafInk ? P.ink(r.f(0.3, 0.55)) : P.chalk(r.f(0.35, 0.6)), 0.7);
        }
        return;
      }
      const segs = 4;
      const pts = [[x, y]];
      let px = x, py = y, pa = ang;
      for (let i = 0; i < segs; i++){
        pa += p.curl / segs * r.f(0.4, 1.6) + r.g() * 0.05;
        px += Math.cos(pa) * len / segs;
        py += Math.sin(pa) * len / segs;
        pts.push([px, py]);
      }
      inkLine(r, pts, w, P.ink(Math.min(0.8, 0.42 + w * 0.05)), Math.min(1.6, w * 0.25 + 0.5));
      const nKids = w > 2 && r.chance(0.18) ? 3 : 2;
      let remaining = 1;
      for (let k = 0; k < nKids; k++){
        const frac = k === nKids - 1 ? remaining : r.f(0.3, 0.7) * remaining;
        remaining -= frac;
        const wK = w * Math.sqrt(Math.max(0.02, frac));
        const aK = pa + p.spread * (k / (nKids - 1) - 0.5) * 2 * r.f(0.75, 1.25) + r.g() * 0.08;
        branch(px, py, aK, len * p.decay * r.f(0.85, 1.1), wK, depth - 1);
      }
    }
    for (const s of [-1, 1]){
      inkLine(r, [[st.baseX + s * st.trunkW * 2.6, st.baseY + 4], [st.baseX + s * st.trunkW * 0.7, st.baseY - st.S * 0.03]],
              st.trunkW * 0.5, P.ink(0.6), 1);
    }
    branch(st.baseX, st.baseY, -Math.PI / 2 + p.lean, st.len0, st.trunkW, maxDepth);
  },
  equation(st, m, t){
    const p = this.params(st, m, t);
    return `w² = Σ wᵢ² &nbsp;·&nbsp; θ = ±${deg(p.spread)} &nbsp;·&nbsp; ℓₙ₊₁ = ${fmt(p.decay)}·ℓₙ &nbsp;·&nbsp; vento ${deg(p.lean)}`;
  },
};

/* -------------- il Diluvio — eddies chase the hand ------------------ */
const Diluvio = {
  name: "diluvio",
  init(r, W, H){
    const S = Math.min(W, H);
    scriptBlock(r, W * r.f(0.06, 0.1), H * r.f(0.06, 0.1), W * r.f(0.24, 0.34), r.i(4, 7));
    const lx = W * r.f(0.7, 0.9);
    chalkLine(r, [[lx, H * 0.1], [lx, H * 0.88]], 1, 0.28, 1.5);
    chalkLine(r, [[W * 0.08, H * 0.9], [W * 0.92, H * 0.9]], 1, 0.22, 2);
    const majors = [];
    const nMajor = r.i(3, 4);
    for (let i = 0; i < nMajor; i++){
      const t = (i + r.f(0.2, 0.8)) / nMajor;
      majors.push({
        x: W * (0.14 + t * 0.72), y: H * (0.3 + Math.sin(t * Math.PI) * 0.25),
        rad: S * r.f(0.10, 0.17), dir: r.sign(),
      });
    }
    return { S, W, H, majors, k0: r.f(0.17, 0.23), flowTilt: r.f(-0.12, 0.12), nFlow: r.i(20, 32) };
  },
  params(st, m, t){
    return {
      k: st.k0 * (0.7 + m.y * 0.9),                       // cursor height = tightness
      swirl: Math.sin(t * 0.3) * 0.15,
      mx: m.x * st.W, my: m.y * st.H,
    };
  },
  render(st, r, m, t){
    const p = this.params(st, m, t);
    for (let i = 0; i < st.nFlow; i++){
      const y0 = st.H * (0.08 + 0.87 * i / st.nFlow);
      const amp = r.f(4, 16);
      const pts = [];
      for (let x = -20; x <= st.W + 20; x += 30){
        pts.push([x, y0 + x * st.flowTilt + Math.sin(x * 0.012 + i + t * 0.15) * amp + r.g() * 2]);
      }
      inkLine(r, pts, 0.6, P.ink(r.f(0.10, 0.20)), 0.9);
    }
    const S = st.S;
    const eddy = (cx, cy, rad, dir, depth) => {
      const turns = r.f(2.1, 3.0);
      const rot = r.f(0, Math.PI * 2) + p.swirl;
      const pts = [];
      const n = Math.max(24, Math.round(rad * 0.8));
      for (let i = 0; i <= n; i++){
        const th = turns * Math.PI * 2 * i / n;
        const rr = rad * Math.exp(-p.k * th);
        pts.push([cx + Math.cos(dir * th + rot) * rr, cy + Math.sin(dir * th + rot) * rr]);
      }
      inkLine(r, pts, Math.max(0.7, rad * 0.018), P.ink(Math.min(0.85, 0.45 + rad / S)), Math.min(1.6, rad * 0.008 + 0.5));
      const nC = Math.round(rad * r.f(0.18, 0.3));
      for (let i = 0; i < nC; i++){
        const a = r.f(0, Math.PI * 2);
        const rr = rad * r.f(0.92, 1.12);
        const bx = cx + Math.cos(a) * rr, by = cy + Math.sin(a) * rr;
        const ta = a + dir * Math.PI / 2;
        const len = rad * r.f(0.10, 0.22);
        inkLine(r,
          [[bx, by],
           [bx + Math.cos(ta) * len * 0.45, by + Math.sin(ta) * len * 0.45],
           [bx + Math.cos(ta + dir * 0.45) * len * 0.75, by + Math.sin(ta + dir * 0.45) * len * 0.75],
           [bx + Math.cos(ta + dir * 0.85) * len, by + Math.sin(ta + dir * 0.85) * len]],
          0.6, P.ink(r.f(0.25, 0.45)), 0.25);
      }
      if (depth <= 0) return;
      const kids = r.i(2, 3);
      for (let i = 0; i < kids; i++){
        const a = r.f(0, Math.PI * 2);
        eddy(cx + Math.cos(a) * rad * r.f(0.85, 1.15),
             cy + Math.sin(a) * rad * r.f(0.85, 1.15),
             rad * r.f(0.3, 0.45), -dir, depth - 1);
      }
    };
    // the nearest eddy is drawn into the cursor's wake
    let nearest = 0, best = Infinity;
    st.majors.forEach((e, i) => {
      const d = Math.hypot(e.x - p.mx, e.y - p.my);
      if (d < best){ best = d; nearest = i; }
    });
    st.majors.forEach((e, i) => {
      const pull = i === nearest ? 0.5 : 0.12;
      const ex = e.x + (p.mx - e.x) * pull;
      const ey = e.y + (p.my - e.y) * pull;
      eddy(ex, ey, e.rad, e.dir, 2);
    });
    for (let i = 0, n = 5; i < n; i++){
      eddy(st.W * r.f(0.1, 0.9), st.H * r.f(0.68, 0.85), S * r.f(0.03, 0.05), r.sign(), 0);
    }
  },
  equation(st, m, t){
    const p = this.params(st, m, t);
    return `r(θ) = r₀ · e^(−${fmt(p.k)}·θ) &nbsp;·&nbsp; vortici figli: rₖ = ${fmt(0.375)}·r, senso −1ᵏ`;
  },
};

/* ------------- il Girasole — the rosette drifts to the hand ---------- */
const Girasole = {
  name: "girasole",
  init(r, W, H){
    const S = Math.min(W, H);
    scriptBlock(r, W * r.f(0.62, 0.68), H * r.f(0.74, 0.8), W * r.f(0.2, 0.28), r.i(3, 5));
    marginStudy(r, W * r.f(0.85, 0.9), H * r.f(0.12, 0.2), S * 0.04);
    // golden-rectangle construction is static
    let rw = S * r.f(0.58, 0.72), rh = rw / PHI;
    if (r.chance(0.5)) [rw, rh] = [rh, rw];
    let rx = W / 2 - rw / 2, ry = H / 2 - rh / 2;
    chalkLine(r, [[rx, ry], [rx + rw, ry], [rx + rw, ry + rh], [rx, ry + rh], [rx, ry]], 0.9, 0.34, 1.2);
    for (let i = 0; i < 6; i++){
      if (rw > rh){ chalkLine(r, [[rx + rh, ry], [rx + rh, ry + rh]], 0.8, 0.3, 1); rx += rh; rw -= rh; }
      else { chalkLine(r, [[rx, ry + rw], [rx + rw, ry + rw]], 0.8, 0.3, 1); ry += rw; rh -= rw; }
    }
    return {
      S, W, H, count: r.i(380, 620),
      scale0: S * r.f(0.24, 0.29), rot0: r.f(0, Math.PI * 2), dir: r.sign(),
      nMini: r.i(2, 3),
    };
  },
  /* cursor x detunes the golden angle by ±1.5°; the rosette leans
     toward the hand */
  params(st, m, t){
    return {
      angle: GOLDEN_ANGLE + (m.x - 0.5) * 0.0524 + Math.sin(t * 0.25) * 0.002,
      scale: st.scale0 * (0.85 + (1 - m.y) * 0.3),
      cx: st.W * (0.42 + (m.x - 0.5) * 0.24),
      cy: st.H * (0.48 + (m.y - 0.5) * 0.18),
    };
  },
  render(st, r, m, t){
    const p = this.params(st, m, t);
    const rosette = (x, y, count, scale, alpha) => {
      const c = scale / Math.sqrt(count);
      for (let i = 1; i <= count; i++){
        const th = i * p.angle;
        const rad = c * Math.sqrt(i);
        const px = x + Math.cos(th) * rad, py = y + Math.sin(th) * rad;
        const sz = Math.max(1.1, scale * 0.016 * (0.4 + rad / scale));
        const ta = th + Math.PI / 2 + r.f(-0.2, 0.2);
        inkLine(r,
          [[px - Math.cos(ta) * sz, py - Math.sin(ta) * sz],
           [px + Math.cos(ta) * sz * 0.4, py + Math.sin(ta) * sz * 0.4],
           [px + Math.cos(ta + 0.9) * sz, py + Math.sin(ta + 0.9) * sz]],
          Math.max(0.5, sz * 0.34), P.ink(alpha * r.f(0.7, 1)), 0.4);
      }
      chalkCircle(r, x, y, scale * 1.04, 0.3);
    };
    rosette(p.cx, p.cy, st.count, p.scale, 0.6);
    const b = Math.log(PHI) / (Math.PI / 2);
    const spr = [];
    for (let th = 0; th <= Math.PI * 2 * 2.6; th += 0.09){
      const rad = p.scale * 0.18 * Math.exp(b * th);
      if (rad > st.S * 0.62) break;
      spr.push([p.cx + Math.cos(st.dir * th + st.rot0) * rad, p.cy + Math.sin(st.dir * th + st.rot0) * rad]);
    }
    chalkLine(r, spr, 1.3, 0.5, 1);
    for (let i = 1; i <= st.nMini; i++){
      const q = spr[Math.min(spr.length - 1, Math.round(spr.length * (0.5 + i * 0.16)))];
      if (!q) break;
      rosette(q[0], q[1], 90, p.scale * Math.pow(0.42, i) * 1.4, 0.55);
    }
  },
  equation(st, m, t){
    const p = this.params(st, m, t);
    return `θₙ = n · ${fmt(p.angle * 180 / Math.PI, 2)}° &nbsp;·&nbsp; rₙ = c·√n &nbsp;·&nbsp; spirale: r = a·φ^(2θ/π)`;
  },
};

/* ------- le Proporzioni — the construction turns with the hand ------- */
const Proporzioni = {
  name: "proporzioni",
  init(r, W, H){
    const S = Math.min(W, H);
    scriptBlock(r, W * r.f(0.06, 0.1), H * r.f(0.78, 0.84), W * r.f(0.24, 0.32), r.i(3, 5));
    scriptBlock(r, W * r.f(0.68, 0.74), H * r.f(0.08, 0.12), W * r.f(0.16, 0.22), r.i(2, 4));
    const cx = W / 2, cy = H * 0.5, R0 = S * r.f(0.3, 0.36);
    chalkCircle(r, cx, cy, R0 * 1.08, 0.5);
    const sq = R0 * 0.96;
    chalkLine(r, [[cx - sq, cy - sq], [cx + sq, cy - sq], [cx + sq, cy + sq], [cx - sq, cy + sq], [cx - sq, cy - sq]], 1, 0.4, 1.2);
    for (let i = 0, n = r.pick([8, 12, 16]); i < n; i++){
      const a = i / n * Math.PI * 2;
      chalkLine(r, [[cx, cy], [cx + Math.cos(a) * R0 * 1.08, cy + Math.sin(a) * R0 * 1.08]], 0.6, 0.14, 1);
    }
    hatchCircle(r, cx + R0 * 0.72, cy - R0 * 0.72, R0 * 0.2, -Math.PI / 4, 4.2, P.ink(0.13), 0.45);
    const n = r.pick([5, 6, 7, 8, 9]);
    return {
      S, cx, cy, R0, n,
      star: r.chance(0.65), skip: r.i(2, Math.max(2, Math.floor(n / 2))),
      depth: r.i(6, 8),
    };
  },
  /* the hand is the compass: its bearing from the centre sets the twist
     of every generation; its distance sets the shrink ratio */
  params(st, m, t){
    const dx = m.x - 0.5, dy = m.y - 0.5;
    const bearing = Math.atan2(dy, dx);
    const dist = Math.min(1, Math.hypot(dx, dy) * 2.2);
    return {
      twist: bearing * 0.5 + Math.PI / st.n + Math.sin(t * 0.2) * 0.02,
      ratio: Math.cos(Math.PI / st.n) * (0.86 + dist * 0.13),
    };
  },
  render(st, r, m, t){
    const p = this.params(st, m, t);
    let rad = st.R0, rot = 0;
    for (let d = 0; d < st.depth; d++){
      const alpha = 0.72 - d * 0.055;
      const verts = [];
      for (let i = 0; i < st.n; i++){
        const a = rot + i / st.n * Math.PI * 2;
        verts.push([st.cx + Math.cos(a) * rad, st.cy + Math.sin(a) * rad]);
      }
      for (let i = 0; i < st.n; i++){
        inkLine(r, [verts[i], verts[(i + 1) % st.n]], 1.1 - d * 0.08, P.ink(alpha), 0.7);
      }
      if (st.star){
        for (let i = 0; i < st.n; i++){
          inkLine(r, [verts[i], verts[(i + st.skip) % st.n]], 0.8 - d * 0.06, P.ink(alpha * 0.75), 0.6);
        }
      }
      for (const [vx, vy] of verts){
        ctx.fillStyle = P.ink(alpha * 0.9);
        ctx.beginPath(); ctx.arc(vx, vy, Math.max(0.7, 1.6 - d * 0.15), 0, 7); ctx.fill();
      }
      rad *= p.ratio;
      rot += p.twist;
    }
    ctx.fillStyle = P.ink(0.8);
    ctx.beginPath(); ctx.arc(st.cx, st.cy, 2, 0, 7); ctx.fill();
  },
  equation(st, m, t){
    const p = this.params(st, m, t);
    return `rₙ₊₁ = ${fmt(p.ratio)}·rₙ &nbsp;·&nbsp; θₙ₊₁ = θₙ + ${deg(p.twist)} &nbsp;·&nbsp; ${st.n}-gono${st.star ? ", corde {" + st.n + "/" + st.skip + "}" : ""}`;
  },
};

/* -------- la Mandorla — a Julia set, c held between the fingers ------ */
const Mandorla = {
  name: "mandorla",
  init(r, W, H){
    const S = Math.min(W, H);
    scriptBlock(r, W * r.f(0.06, 0.1), H * r.f(0.1, 0.14), W * r.f(0.22, 0.3), r.i(3, 5));
    marginStudy(r, W * r.f(0.08, 0.13), H * r.f(0.76, 0.84), S * 0.04);
    const gw = 300, gh = Math.round(gw * H / W);
    return {
      S, W, H, gw, gh,
      cv: Object.assign(document.createElement("canvas"), { width: gw, height: gh }),
      phi0: r.f(0, Math.PI * 2), rBase: r.f(0.76, 0.8),
      zoom: r.f(1.25, 1.6), iters: 44,
      bandSeed: r.f(0, 1),
    };
  },
  /* the cursor literally holds c: its angle around the screen turns c
     around the cardioid; its height scales |c| */
  params(st, m, t){
    const phi = st.phi0 + (m.x - 0.5) * Math.PI * 1.6 + Math.sin(t * 0.15) * 0.05;
    const mag = st.rBase * (0.88 + (1 - m.y) * 0.24);
    return { cre: mag * Math.cos(phi), cim: mag * Math.sin(phi) };
  },
  render(st, r, m, t){
    const p = this.params(st, m, t);
    const { gw, gh, iters } = st;
    const g2 = st.cv.getContext("2d");
    const img = g2.createImageData(gw, gh);
    const d = img.data;
    const [ir, ig, ib] = P.inkRGB;
    const aspect = st.W / st.H;
    for (let y = 0; y < gh; y++){
      const zi0 = (y / gh - 0.5) * 2 / st.zoom;
      for (let x = 0; x < gw; x++){
        let zr = (x / gw - 0.5) * 2 * aspect / st.zoom;
        let zi = zi0;
        let n = 0;
        while (n < iters && zr * zr + zi * zi < 4){
          const t2 = zr * zr - zi * zi + p.cre;
          zi = 2 * zr * zi + p.cim;
          zr = t2;
          n++;
        }
        const o = (y * gw + x) * 4;
        if (n >= iters){                       // interior: deep ink wash
          d[o] = ir; d[o + 1] = ig; d[o + 2] = ib; d[o + 3] = 205;
        } else if (n > 3){                     // engraved bands outside
          const band = ((n + st.bandSeed * 7) % 6) / 6;
          const a = Math.min(1, n / iters * 2.4) * (0.16 + band * 0.5);
          d[o] = ir; d[o + 1] = ig; d[o + 2] = ib; d[o + 3] = Math.round(a * 255);
        } else {
          d[o + 3] = 0;
        }
      }
    }
    g2.putImageData(img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(st.cv, 0, 0, st.W, st.H);
    ctx.restore();
    chalkCircle(r, st.W / 2, st.H / 2, st.S * 0.4, 0.3);
  },
  equation(st, m, t){
    const p = this.params(st, m, t);
    return `zₙ₊₁ = zₙ² + c &nbsp;·&nbsp; c = ${fmt(p.cre, 3)} ${p.cim < 0 ? "−" : "+"} ${fmt(Math.abs(p.cim), 3)}i`;
  },
};

/* --------- la Felce — an IFS fern that bows toward the hand ---------- */
const Felce = {
  name: "felce",
  init(r, W, H){
    const S = Math.min(W, H);
    scriptBlock(r, W * r.f(0.62, 0.7), H * r.f(0.1, 0.16), W * r.f(0.2, 0.26), r.i(3, 5));
    chalkCircle(r, W * 0.5, H * 0.52, S * 0.4, 0.3);
    return {
      S, W, H,
      a0: r.f(0.82, 0.87), rot0: r.f(-0.06, 0.06),
      nPts: 11000, size: S * r.f(0.085, 0.105),
      baseX: W * r.f(0.42, 0.58), flip: r.sign(),
    };
  },
  /* cursor x is the wind shearing the fronds; cursor y feeds the stem's
     contraction — the four affine maps rewrite themselves as you move */
  params(st, m, t){
    return {
      shear: (m.x - 0.5) * 0.22 + Math.sin(t * 0.35) * 0.012,
      a: st.a0 * (0.94 + (1 - m.y) * 0.09),
      rot: st.rot0 + (m.x - 0.5) * 0.10,
    };
  },
  render(st, r, m, t){
    const p = this.params(st, m, t);
    const cosr = Math.cos(p.rot), sinr = Math.sin(p.rot);
    const maps = [
      { p: 0.01, f: (x, y) => [0, 0.16 * y] },
      { p: 0.86, f: (x, y) => [p.a * (x * cosr - y * sinr) + 0.04 * y + p.shear * y,
                               p.a * (x * sinr + y * cosr) - 0.04 * x + 1.6] },
      { p: 0.93, f: (x, y) => [0.2 * x - 0.26 * y, 0.23 * x + 0.22 * y + 1.6] },
      { p: 1.00, f: (x, y) => [-0.15 * x + 0.28 * y, 0.26 * x + 0.24 * y + 0.44] },
    ];
    const [ir, ig, ib] = P.inkRGB;
    ctx.fillStyle = `rgba(${ir},${ig},${ib},0.34)`;
    let x = 0, y = 0;
    const ox = st.baseX, oy = st.H * 0.92, sc = st.size * st.flip;
    for (let i = 0; i < st.nPts; i++){
      const q = r.next();
      for (const mp of maps){
        if (q <= mp.p){ [x, y] = mp.f(x, y); break; }
      }
      if (i > 20){
        ctx.fillRect(ox + x * sc, oy - y * st.size, 1.3, 1.3);
      }
    }
  },
  equation(st, m, t){
    const p = this.params(st, m, t);
    return `f₂: (x,y) → (${fmt(p.a)}x + ${fmt(0.04 + p.shear)}y, −0.04x + ${fmt(p.a)}y + 1.6) &nbsp;·&nbsp; 4 mappe affini`;
  },
};

const FAMILIES = [Albero, Diluvio, Girasole, Proporzioni, Mandorla, Felce];

/* =====================================================================
   Folio lifecycle
   ===================================================================== */
const mainCv = document.getElementById("folio");
const mainCtx = mainCv.getContext("2d");
const paperCv = document.createElement("canvas");
const eqEl = document.getElementById("equation");
const chipEl = document.getElementById("seedChip");

let folio = null;                  // { seed, family, st, r0words }
const mouse = { x: 0.5, y: 0.42, tx: 0.5, ty: 0.42, moved: false };
let t0 = performance.now();
let needsDraw = true;

function pickFamily(r){
  const recent = store.get(FAM_RECENT_KEY, []);
  const fresh = FAMILIES.filter(f => !recent.includes(f.name));
  const pool = fresh.length ? fresh : FAMILIES;
  const fam = pool[r.i(0, pool.length - 1)];
  const next = [...recent, fam.name].slice(-3);
  store.set(FAM_RECENT_KEY, next);
  return fam;
}

/* the equation shown at birth must not have appeared within 60 tabs */
function equationSignature(fam, st){
  const mid = { x: 0.5, y: 0.42 };
  return fam.name + "|" + fam.equation(st, mid, 0).replace(/&nbsp;/g, " ");
}

function newFolio(){
  let seed = freshSeed();
  const W = Math.round(innerWidth), H = Math.round(innerHeight);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  mainCv.width = W * dpr; mainCv.height = H * dpr;
  paperCv.width = W * dpr; paperCv.height = H * dpr;

  const hist = store.get(EQ_HISTORY_KEY, []);
  let fam = null, st = null, sig = null, r = null;

  for (let attempt = 0; attempt < 8; attempt++){
    r = new R(seed);
    makePalette(r);
    // paper + static marginalia go on the paper layer
    const pctx = paperCv.getContext("2d");
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setCtx(pctx);
    paper(r, W, H);
    fam = pickFamilyOnce(r, attempt);
    st = fam.init(r, W, H);
    st.folioNo = folioMark(r, W, H);
    sig = equationSignature(fam, st);
    if (!hist.includes(sig)) break;          // practically always first try
    seed = freshSeed();
  }
  store.set(EQ_HISTORY_KEY, [...hist, sig].slice(-60));

  folio = { seed, fam, st, W, H, dpr, renderWords: Uint32Array.from(seed) };
  chipEl.textContent = `${fam.name} · folio ${st.folioNo} · seme ${seedHex(seed).slice(0, 12)}`;
  document.title = `Folio ${st.folioNo} — ${fam.name}`;
  t0 = performance.now();
  needsDraw = true;
  placeQuote(new R(seed.map(x => x ^ 0x9e3779b9)));
}

/* family choice: honour the LRU on the first attempt only, so equation
   collisions can still escape to any family */
let famChoiceCache = null;
function pickFamilyOnce(r, attempt){
  if (attempt === 0){ famChoiceCache = pickFamily(r); return famChoiceCache; }
  return FAMILIES[r.i(0, FAMILIES.length - 1)];
}

/* ------------------------- the living frame -------------------------- */
let lastEq = "";
function frame(){
  requestAnimationFrame(frame);
  if (!folio) return;
  // ease the cursor; drift gently when idle
  mouse.x += (mouse.tx - mouse.x) * 0.07;
  mouse.y += (mouse.ty - mouse.y) * 0.07;
  const t = (performance.now() - t0) / 1000;
  const moving = Math.abs(mouse.tx - mouse.x) + Math.abs(mouse.ty - mouse.y) > 0.0004;
  if (!(moving || needsDraw || (t % 0.24) < 0.017)) return;   // idle: ~4 fps drift
  needsDraw = false;

  const { fam, st, W, H, dpr } = folio;
  mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mainCtx.clearRect(0, 0, W, H);
  mainCtx.drawImage(paperCv, 0, 0, W, H);
  // the folio itself leans a few pixels toward the hand
  mainCtx.save();
  mainCtx.translate((mouse.x - 0.5) * 10, (mouse.y - 0.5) * 7);
  setCtx(mainCtx);
  const r = new R(folio.renderWords);
  fam.render(st, r, mouse, t);
  mainCtx.restore();

  const eq = `<span class="fam">${fam.name}</span>` + fam.equation(st, mouse, t);
  if (eq !== lastEq){ eqEl.innerHTML = eq; lastEq = eq; }
  if (window.__stats){ window.__stats.frames++; }
}

/* =====================================================================
   The quotation — enchanted ink
   ===================================================================== */
const quoteEl = document.getElementById("quote");
const wordsEl = document.getElementById("quoteWords");
const authorEl = document.getElementById("quoteAuthor");
let wordSpans = [];
let revealTimer = null;
let cascadeTimer = null;

function pickQuote(r){
  const used = store.get(QUOTES_USED_KEY, []);
  let unused = QUOTES.map((_, i) => i).filter(i => !used.includes(i));
  if (!unused.length){ unused = QUOTES.map((_, i) => i); store.set(QUOTES_USED_KEY, []); }
  const idx = unused[r.i(0, unused.length - 1)];
  store.set(QUOTES_USED_KEY, [...store.get(QUOTES_USED_KEY, []), idx]);
  return QUOTES[idx];
}

function placeQuote(r){
  const q = pickQuote(r);
  wordsEl.textContent = "";
  authorEl.textContent = "— " + q.a;
  authorEl.classList.remove("lit");
  wordSpans = q.t.split(" ").map(word => {
    const s = document.createElement("span");
    s.className = "w";
    s.textContent = word + " ";
    wordsEl.appendChild(s);
    return s;
  });
  // a corner the fractal leaves breathable
  const spots = [
    { left: "6vw", top: "58vh", right: "", bottom: "" },
    { left: "58vw", top: "12vh", right: "", bottom: "" },
    { left: "8vw", top: "16vh", right: "", bottom: "" },
    { left: "56vw", top: "62vh", right: "", bottom: "" },
  ];
  const spot = spots[r.i(0, spots.length - 1)];
  Object.assign(quoteEl.style, { left: spot.left, top: spot.top });

  clearTimeout(revealTimer);
  clearInterval(cascadeTimer);
  // after a while the page finishes writing itself, one word at a time
  revealTimer = setTimeout(() => {
    cascadeTimer = setInterval(() => {
      const next = wordSpans.find(s => !s.classList.contains("lit"));
      if (!next){ clearInterval(cascadeTimer); return; }
      lightWord(next, false);
    }, 260);
  }, 11000);
}

function lightWord(span, burst = true){
  if (span.classList.contains("lit")) return;
  span.classList.add("lit", "flash");
  setTimeout(() => span.classList.remove("flash"), 1200);
  if (burst){
    const rect = span.getBoundingClientRect();
    sparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 7);
  }
  if (wordSpans.every(s => s.classList.contains("lit"))){
    authorEl.classList.add("lit");
  }
}

function revealNear(x, y){
  const RADIUS = 95;
  for (const s of wordSpans){
    if (s.classList.contains("lit")) continue;
    const rect = s.getBoundingClientRect();
    const dx = x - (rect.left + rect.width / 2);
    const dy = y - (rect.top + rect.height / 2);
    if (dx * dx + dy * dy < RADIUS * RADIUS) lightWord(s);
  }
}

/* --------------------------- wand sparkles --------------------------- */
const sparkCv = document.getElementById("spark");
const sparkCtx = sparkCv.getContext("2d");
let sparks = [];
function fitSpark(){
  sparkCv.width = innerWidth;
  sparkCv.height = innerHeight;
}
function sparkleBurst(x, y, n){
  for (let i = 0; i < n; i++){
    const a = Math.random() * Math.PI * 2;
    const v = 0.4 + Math.random() * 1.6;
    sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.4,
                  life: 1, decay: 0.012 + Math.random() * 0.02,
                  size: 0.8 + Math.random() * 1.8, star: Math.random() < 0.25 });
  }
}
function sparkFrame(){
  requestAnimationFrame(sparkFrame);
  if (!sparks.length){ sparkCtx.clearRect(0, 0, sparkCv.width, sparkCv.height); return; }
  sparkCtx.clearRect(0, 0, sparkCv.width, sparkCv.height);
  sparks = sparks.filter(s => s.life > 0);
  for (const s of sparks){
    s.x += s.vx; s.y += s.vy; s.vy += 0.015; s.life -= s.decay;
    const a = Math.max(0, s.life);
    sparkCtx.fillStyle = `rgba(255,${200 + Math.round(30 * a)},${90 + Math.round(60 * a)},${a * 0.85})`;
    if (s.star){
      sparkCtx.fillRect(s.x - s.size * 2, s.y - 0.5, s.size * 4, 1);
      sparkCtx.fillRect(s.x - 0.5, s.y - s.size * 2, 1, s.size * 4);
    } else {
      sparkCtx.beginPath();
      sparkCtx.arc(s.x, s.y, s.size * (0.5 + a * 0.7), 0, 7);
      sparkCtx.fill();
    }
  }
}

/* ---------------------------- wiring --------------------------------- */
let lastSpawn = 0;
addEventListener("pointermove", e => {
  mouse.tx = Math.min(1, Math.max(0, e.clientX / innerWidth));
  mouse.ty = Math.min(1, Math.max(0, e.clientY / innerHeight));
  revealNear(e.clientX, e.clientY);
  const now = performance.now();
  if (now - lastSpawn > 24){
    lastSpawn = now;
    sparkleBurst(e.clientX + (Math.random() - 0.5) * 6, e.clientY + (Math.random() - 0.5) * 6, 1);
  }
});

document.getElementById("regen").addEventListener("click", newFolio);
document.getElementById("save").addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = `codice-frattali-${seedHex(folio.seed).slice(0, 16)}.png`;
  a.href = mainCv.toDataURL("image/png");
  a.click();
});
addEventListener("keydown", e => {
  if (e.key === "n" || e.key === "N") newFolio();
  if (e.key === "s" || e.key === "S") document.getElementById("save").click();
});
let resizeTimer = 0;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    fitSpark();
    if (folio) redrawSameSeed(folio.seed);   // same seed, redrawn for the new size
  }, 140);
});
function redrawSameSeed(seed){
  // rebuild the folio deterministically from its existing seed without
  // touching the rotation lists
  const W = Math.round(innerWidth), H = Math.round(innerHeight);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  mainCv.width = W * dpr; mainCv.height = H * dpr;
  paperCv.width = W * dpr; paperCv.height = H * dpr;
  const r = new R(seed);
  makePalette(r);
  const pctx = paperCv.getContext("2d");
  pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  setCtx(pctx);
  paper(r, W, H);
  const fam = folio.fam;
  const st = fam.init(r, W, H);
  st.folioNo = folioMark(r, W, H);
  folio = { seed, fam, st, W, H, dpr, renderWords: Uint32Array.from(seed) };
  needsDraw = true;
}

window.__stats = { frames: 0 };
fitSpark();
newFolio();
requestAnimationFrame(frame);
requestAnimationFrame(sparkFrame);
