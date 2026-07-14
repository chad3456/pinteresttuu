"use strict";
/* =====================================================================
   Codice dei Frattali — every new tab draws a fractal folio that has
   never existed before, in the manner of Leonardo's notebooks.

   Privacy: the seed comes from crypto.getRandomValues, lives only in
   this tab, and is never stored or transmitted. No permissions, no
   network, no cookies, no localStorage.
   ===================================================================== */

const canvas = document.getElementById("folio");
const ctx = canvas.getContext("2d");

/* ------------------------- seeded randomness ------------------------- */
/* sfc32: small fast counter PRNG, seeded with 128 bits of entropy */
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
function seedHex(u){
  return [...u].map(x => x.toString(16).padStart(8, "0")).join("");
}

class R {
  constructor(words){ this.next = sfc32(words[0], words[1], words[2], words[3]); }
  f(a = 0, b = 1){ return a + (b - a) * this.next(); }
  i(a, b){ return Math.floor(this.f(a, b + 1)); }
  pick(arr){ return arr[this.i(0, arr.length - 1)]; }
  chance(p){ return this.next() < p; }
  g(){ // approximate gaussian
    return (this.next() + this.next() + this.next() + this.next() - 2) / 1.2;
  }
  sign(){ return this.chance(0.5) ? 1 : -1; }
}

/* --------------------------- palette --------------------------------- */
const PHI = (1 + Math.sqrt(5)) / 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
let P = {};                    // per-folio palette
function makePalette(r){
  const ir = r.i(48, 66), ig = r.i(34, 46), ib = r.i(20, 28);      // iron-gall ink
  const cr = r.i(148, 168), cg = r.i(72, 88), cb = r.i(48, 62);    // red chalk
  P = {
    ink: a => `rgba(${ir},${ig},${ib},${a})`,
    chalk: a => `rgba(${cr},${cg},${cb},${a})`,
    faded: a => `rgba(${ir + 60},${ig + 48},${ib + 34},${a})`,     // old, sun-faded ink
    paperHi: `rgb(${r.i(228, 238)},${r.i(211, 221)},${r.i(172, 186)})`,
    paperLo: `rgb(${r.i(200, 214)},${r.i(180, 194)},${r.i(138, 154)})`,
  };
}

/* ----------------------- hand-drawn strokes -------------------------- */
/* Resample a polyline to ~step px and wobble it perpendicular to its
   direction with a smoothed random walk — the tremor of a real hand. */
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

/* Ink line with tapered, slightly uneven width — drawn segment by
   segment so the nib pressure can vary along the stroke. */
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

/* Light construction line (single pass, no pressure variation) */
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

function chalkCircle(r, cx, cy, rad, alpha){
  chalkLine(r, circlePts(cx, cy, rad), 1, alpha, 0.9);
}

/* Parallel hatching clipped to a circle — Leonardo's left-handed
   shading runs high-left to low-right. */
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

  // fibre noise
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4){
    const n = (r.next() - 0.5) * 14;
    d[i] += n; d[i + 1] += n * 0.92; d[i + 2] += n * 0.8;
  }
  ctx.putImageData(img, 0, 0);

  // water stains and old blotches
  const nBlots = r.i(6, 14);
  for (let i = 0; i < nBlots; i++){
    const x = r.f(0, W), y = r.f(0, H), rad = r.f(40, Math.min(W, H) * 0.4);
    const gb = ctx.createRadialGradient(x, y, rad * r.f(0.1, 0.5), x, y, rad);
    const warm = r.chance(0.7);
    gb.addColorStop(0, "rgba(0,0,0,0)");
    gb.addColorStop(0.85, warm ? `rgba(150,110,55,${r.f(0.02, 0.06)})` : `rgba(90,80,60,${r.f(0.02, 0.05)})`);
    gb.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gb;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  // foxing: sparse small age spots
  for (let i = 0, n = r.i(30, 90); i < n; i++){
    ctx.fillStyle = `rgba(${r.i(120, 160)},${r.i(80, 105)},${r.i(40, 60)},${r.f(0.04, 0.14)})`;
    ctx.beginPath();
    ctx.arc(r.f(0, W), r.f(0, H), r.f(0.5, 2.6), 0, 7);
    ctx.fill();
  }

  // long creases
  for (let i = 0, n = r.i(1, 3); i < n; i++){
    const vertical = r.chance(0.5);
    const p = r.f(0.2, 0.8);
    const pts = vertical
      ? [[W * p + r.f(-30, 30), 0], [W * p + r.f(-30, 30), H]]
      : [[0, H * p + r.f(-30, 30)], [W, H * p + r.f(-30, 30)]];
    chalkLine(r, pts, 1, 0.045, 6);
  }

  // vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(60,40,15,0.30)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

/* ----------------------- mirror handwriting -------------------------- */
/* Leonardo wrote right-to-left in mirror script. We draw asemic script —
   looping nib strokes that read as handwriting without being any real
   alphabet — and mirror the whole block. Every word is seeded, so even
   the marginalia of a folio are unique. */
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
        // each "letter": a rightward glide with a loop or cusp
        const kind = r.next();
        if (kind < 0.25){          // loop (like e / l)
          const asc = r.chance(0.3) ? -size * r.f(0.9, 1.6) : -size * r.f(0.2, 0.6);
          pts.push([px + size * 0.2, py + asc]);
          pts.push([px + size * 0.55, py + asc * 0.4]);
          pts.push([px + size * 0.5, py + size * 0.1]);
        } else if (kind < 0.4){    // descender (like g / p)
          pts.push([px + size * 0.3, py + size * r.f(0.8, 1.5)]);
          pts.push([px + size * 0.6, py + size * 0.2]);
        } else {                   // arch / cusp (like n / i / u)
          pts.push([px + size * 0.25, py - size * r.f(0.3, 0.75)]);
          pts.push([px + size * 0.55, py + size * r.f(-0.1, 0.15)]);
        }
        px += size * r.f(0.5, 0.8);
        py = by + r.g() * size * 0.1;
      }
      inkLine(r, pts, 0.7, P.ink(r.f(0.4, 0.62)), 0.5);
      // occasional i-dot or abbreviation tilde
      if (r.chance(0.3)){
        const dx = cx + r.f(0, px - cx);
        inkLine(r, [[dx, by - size * 1.1], [dx + size * 0.3, by - size * 1.2]], 0.6, P.ink(0.5), 0.3);
      }
      cx = px + size * r.f(0.7, 1.3);   // word gap
    }
  }
  ctx.restore();
}

/* folio number, in ordinary (unmirrored) numerals like the codices */
function folioMark(r, W, H, title){
  ctx.save();
  ctx.font = `${Math.round(Math.min(W, H) * 0.019 + 8)}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = P.faded(0.85);
  ctx.textAlign = "right";
  const folio = r.i(1, 190) + " " + (r.chance(0.5) ? "r" : "v");
  ctx.fillText(folio, W - Math.min(W, H) * 0.045, Math.min(W, H) * 0.07);
  ctx.restore();
  return folio;
}

/* small margin study: circle with inscribed figure and ratio ticks */
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

/* =====================================================================
   Study I — l'Albero. A branching tree obeying Leonardo's own rule:
   the cross-sections of the children sum to the parent's
   (w1² + w2² = w²), which he recorded in the Trattato della Pittura.
   ===================================================================== */
function drawTree(r, W, H){
  const S = Math.min(W, H);
  const baseX = W * r.f(0.36, 0.64);
  const baseY = H * 0.86;
  const lean = r.f(-0.12, 0.12);
  const spread = r.f(0.38, 0.62);
  const lenDecay = r.f(0.74, 0.84);
  const curl = r.f(-0.35, 0.35);
  const maxDepth = r.i(8, 10);
  const leafInk = r.chance(0.4);

  // ground: hatched bank
  const gw = S * r.f(0.2, 0.3);
  for (let i = 0, n = r.i(14, 24); i < n; i++){
    const gx = baseX + r.f(-gw, gw);
    const gy = baseY + r.f(0, S * 0.03);
    inkLine(r, [[gx, gy], [gx + r.f(10, 42) * r.sign(), gy + r.f(1, 6)]], 0.6, P.ink(r.f(0.2, 0.4)), 0.8);
  }

  // construction: chalk circle around the crown (he framed canopies in circles)
  const crownR = S * r.f(0.26, 0.34);
  const crownY = baseY - S * r.f(0.42, 0.5);
  chalkCircle(r, baseX + lean * S * 0.3, crownY, crownR, 0.35);
  chalkLine(r, [[baseX, baseY + 6], [baseX + lean * S * 0.3, crownY]], 0.8, 0.25, 2);

  function branch(x, y, ang, len, w, depth){
    if (depth <= 0 || w < 0.5 || len < 3){
      // terminal tuft: little comma leaves
      const nL = r.i(2, 5);
      for (let i = 0; i < nL; i++){
        const a = ang + r.f(-1.4, 1.4);
        const lx = x + Math.cos(a) * r.f(2, 9);
        const ly = y + Math.sin(a) * r.f(2, 9);
        inkLine(r, [[lx, ly], [lx + Math.cos(a + 0.8) * 5, ly + Math.sin(a + 0.8) * 5]],
                0.7, leafInk ? P.ink(r.f(0.3, 0.55)) : P.chalk(r.f(0.35, 0.6)), 0.7);
      }
      return;
    }
    // curved segment
    const segs = 4;
    const pts = [[x, y]];
    let px = x, py = y, pa = ang;
    for (let i = 0; i < segs; i++){
      pa += curl / segs * r.f(0.4, 1.6) + r.g() * 0.05;
      px += Math.cos(pa) * len / segs;
      py += Math.sin(pa) * len / segs;
      pts.push([px, py]);
    }
    inkLine(r, pts, w, P.ink(Math.min(0.8, 0.42 + w * 0.05)), Math.min(1.6, w * 0.25 + 0.5));
    // Leonardo's rule: children conserve cross-section
    const nKids = w > 2 && r.chance(0.18) ? 3 : 2;
    let remaining = 1;
    for (let k = 0; k < nKids; k++){
      const frac = k === nKids - 1 ? remaining : r.f(0.3, 0.7) * remaining;
      remaining -= frac;
      const wK = w * Math.sqrt(Math.max(0.02, frac));
      const aK = pa + spread * (k / (nKids - 1) - 0.5) * 2 * r.f(0.75, 1.25) + r.g() * 0.08;
      branch(px, py, aK, len * lenDecay * r.f(0.85, 1.1), wK, depth - 1);
    }
  }

  const trunkW = S * r.f(0.012, 0.02);
  // root flare
  for (const s of [-1, 1]){
    inkLine(r, [[baseX + s * trunkW * 2.6, baseY + 4], [baseX + s * trunkW * 0.7, baseY - S * 0.03]],
            trunkW * 0.5, P.ink(0.6), 1);
  }
  branch(baseX, baseY, -Math.PI / 2 + lean, S * r.f(0.13, 0.18), trunkW, maxDepth);

  // shadow hatching beside the trunk
  hatchCircle(r, baseX + S * 0.09, baseY - S * 0.02, S * 0.06, -Math.PI / 4, 5, P.ink(0.16), 0.5);

  scriptBlock(r, W * 0.06, H * r.f(0.1, 0.16), W * r.f(0.2, 0.3), r.i(3, 6));
  marginStudy(r, W * r.f(0.08, 0.14), H * r.f(0.72, 0.82), S * 0.045);
  return "albero";
}

/* =====================================================================
   Study II — il Diluvio. Recursive water: each eddy is a logarithmic
   spiral that sheds smaller eddies from its rim, as in the deluge
   drawings of Windsor.
   ===================================================================== */
function drawDeluge(r, W, H){
  const S = Math.min(W, H);

  // underlying current: long wavy strokes
  const flowTilt = r.f(-0.14, 0.14);
  for (let i = 0, n = r.i(24, 44); i < n; i++){
    const y0 = H * r.f(0.08, 0.95);
    const amp = r.f(4, 18);
    const pts = [];
    for (let x = -20; x <= W + 20; x += 24){
      pts.push([x, y0 + x * flowTilt + Math.sin(x * 0.012 + i) * amp + r.g() * 2]);
    }
    inkLine(r, pts, 0.6, P.ink(r.f(0.10, 0.22)), 0.9);
  }

  function eddy(cx, cy, rad, dir, depth){
    const turns = r.f(2.1, 3.2);
    const k = r.f(0.16, 0.24);              // tightness of the log spiral
    const rot = r.f(0, Math.PI * 2);
    const doubleLine = rad > S * 0.05;
    for (let pass = 0; pass < (doubleLine ? 2 : 1); pass++){
      const pts = [];
      const n = Math.max(26, Math.round(rad * 0.9));
      for (let i = 0; i <= n; i++){
        const th = turns * Math.PI * 2 * i / n;
        const rr = rad * Math.exp(-k * th) * (1 - pass * 0.07);
        pts.push([cx + Math.cos(dir * th + rot) * rr, cy + Math.sin(dir * th + rot) * rr]);
      }
      inkLine(r, pts, Math.max(0.7, rad * 0.018) * (pass ? 0.6 : 1),
              P.ink(Math.min(0.85, 0.45 + rad / S)), Math.min(1.6, rad * 0.008 + 0.5));
    }
    // braided crests: short comma strokes combed along the outer rim
    if (rad > S * 0.035){
      const nC = Math.round(rad * r.f(0.24, 0.4));
      for (let i = 0; i < nC; i++){
        const a = r.f(0, Math.PI * 2);
        const rr = rad * r.f(0.92, 1.12);
        const bx = cx + Math.cos(a) * rr, by = cy + Math.sin(a) * rr;
        const ta = a + dir * Math.PI / 2;             // tangent, following the swirl
        const len = rad * r.f(0.10, 0.22);
        inkLine(r,
          [[bx, by],
           [bx + Math.cos(ta) * len * 0.6 , by + Math.sin(ta) * len * 0.6],
           [bx + Math.cos(ta + dir * 0.7) * len, by + Math.sin(ta + dir * 0.7) * len]],
          0.6, P.ink(r.f(0.25, 0.45)), 0.6);
      }
    }
    // crest hatching on the outer shoulder
    if (rad > S * 0.06 && r.chance(0.7)){
      const ha = r.f(-Math.PI / 3, -Math.PI / 6);
      hatchCircle(r, cx + Math.cos(ha) * rad * 0.55, cy + Math.sin(ha) * rad * 0.55,
                  rad * 0.3, -Math.PI / 4, 4.5, P.ink(0.16), 0.45);
    }
    if (depth <= 0) return;
    const kids = r.i(2, 4);
    for (let i = 0; i < kids; i++){
      const a = r.f(0, Math.PI * 2);
      eddy(cx + Math.cos(a) * rad * r.f(0.85, 1.15),
           cy + Math.sin(a) * rad * r.f(0.85, 1.15),
           rad * r.f(0.3, 0.45), -dir, depth - 1);
    }
  }

  const nMajor = r.i(3, 5);
  for (let i = 0; i < nMajor; i++){
    const t = (i + r.f(0.2, 0.8)) / nMajor;
    eddy(W * (0.14 + t * 0.72) + r.g() * W * 0.04,
         H * (0.3 + Math.sin(t * Math.PI) * 0.25) + r.g() * H * 0.08,
         S * r.f(0.11, 0.19), r.sign(), r.i(2, 3));
  }
  // the river bed: a run of small counter-eddies along the lower band
  for (let i = 0, n = r.i(4, 8); i < n; i++){
    eddy(W * r.f(0.1, 0.9), H * r.f(0.68, 0.85), S * r.f(0.03, 0.06), r.sign(), 1);
  }

  // a chalk plumb line and level, as in his hydraulic notes
  const lx = W * r.f(0.7, 0.9);
  chalkLine(r, [[lx, H * 0.1], [lx, H * 0.88]], 1, 0.28, 1.5);
  chalkLine(r, [[W * 0.08, H * 0.9], [W * 0.92, H * 0.9]], 1, 0.22, 2);

  scriptBlock(r, W * r.f(0.06, 0.1), H * r.f(0.06, 0.1), W * r.f(0.24, 0.34), r.i(4, 7));
  return "diluvio";
}

/* =====================================================================
   Study III — il Girasole. Phyllotaxis at the golden angle, framed by
   the golden-rectangle construction and its spiral; smaller rosettes
   recur along the spiral's path.
   ===================================================================== */
function drawPhyllotaxis(r, W, H){
  const S = Math.min(W, H);
  const cx = W * r.f(0.4, 0.6), cy = H * r.f(0.42, 0.56);

  // golden rectangle construction in chalk: cut off a square, divide the
  // remainder, and repeat — the classic compass-and-rule subdivision
  let rw = S * r.f(0.58, 0.72), rh = rw / PHI;
  if (r.chance(0.5)) [rw, rh] = [rh, rw];
  let rx = cx - rw / 2, ry = cy - rh / 2;
  chalkLine(r, [[rx, ry], [rx + rw, ry], [rx + rw, ry + rh], [rx, ry + rh], [rx, ry]], 0.9, 0.34, 1.2);
  for (let i = 0; i < r.i(5, 7); i++){
    if (rw > rh){
      chalkLine(r, [[rx + rh, ry], [rx + rh, ry + rh]], 0.8, 0.3, 1);   // cut a square from the left
      rx += rh; rw -= rh;
    } else {
      chalkLine(r, [[rx, ry + rw], [rx + rw, ry + rw]], 0.8, 0.3, 1);   // cut a square from the top
      ry += rw; rh -= rw;
    }
  }

  // main rosette
  function rosette(x, y, count, scale, alpha){
    const c = scale / Math.sqrt(count);
    for (let i = 1; i <= count; i++){
      const th = i * GOLDEN_ANGLE;
      const rad = c * Math.sqrt(i);
      const px = x + Math.cos(th) * rad, py = y + Math.sin(th) * rad;
      const sz = Math.max(1.1, scale * 0.016 * (0.4 + rad / scale));
      // each seed is a little comma stroke, tangent to its ring
      const ta = th + Math.PI / 2 + r.f(-0.2, 0.2);
      inkLine(r,
        [[px - Math.cos(ta) * sz, py - Math.sin(ta) * sz],
         [px + Math.cos(ta) * sz * 0.4, py + Math.sin(ta) * sz * 0.4],
         [px + Math.cos(ta + 0.9) * sz, py + Math.sin(ta + 0.9) * sz]],
        Math.max(0.5, sz * 0.34), P.ink(alpha * r.f(0.7, 1)), 0.4);
    }
    chalkCircle(r, x, y, scale * 1.04, 0.3);
  }

  const mainScale = S * r.f(0.24, 0.3);
  rosette(cx, cy, r.i(420, 760), mainScale, 0.6);

  // golden spiral in chalk, sweeping out of the rosette
  const b = Math.log(PHI) / (Math.PI / 2);
  const spr = [];
  const rot = r.f(0, Math.PI * 2), dir = r.sign();
  for (let th = 0; th <= Math.PI * 2 * 2.6; th += 0.08){
    const rad = mainScale * 0.18 * Math.exp(b * th);
    if (rad > S * 0.62) break;
    spr.push([cx + Math.cos(dir * th + rot) * rad, cy + Math.sin(dir * th + rot) * rad]);
  }
  chalkLine(r, spr, 1.3, 0.5, 1);

  // recursive rosettes seeded along the spiral
  const nMini = r.i(2, 4);
  for (let i = 1; i <= nMini; i++){
    const p = spr[Math.min(spr.length - 1, Math.round(spr.length * (0.5 + i * 0.16)))];
    if (!p) break;
    rosette(p[0], p[1], r.i(60, 160), mainScale * Math.pow(0.42, i) * 1.4, 0.55);
  }

  // diameter with phi tick marks
  const da = r.f(0, Math.PI);
  const dpts = [[cx - Math.cos(da) * mainScale * 1.5, cy - Math.sin(da) * mainScale * 1.5],
                [cx + Math.cos(da) * mainScale * 1.5, cy + Math.sin(da) * mainScale * 1.5]];
  chalkLine(r, dpts, 0.8, 0.3, 1);

  scriptBlock(r, W * r.f(0.62, 0.68), H * r.f(0.74, 0.8), W * r.f(0.2, 0.28), r.i(3, 5));
  marginStudy(r, W * r.f(0.85, 0.9), H * r.f(0.12, 0.2), S * 0.04);
  return "girasole";
}

/* =====================================================================
   Study IV — le Proporzioni. Vitruvian construction: circle and square,
   then a regular polygon whose chords breed a smaller rotated polygon,
   again and again — a compass-and-straightedge fractal.
   ===================================================================== */
function drawProportions(r, W, H){
  const S = Math.min(W, H);
  const cx = W / 2 + r.f(-W * 0.06, W * 0.06);
  const cy = H * 0.5 + r.f(-H * 0.04, H * 0.04);
  const R0 = S * r.f(0.3, 0.36);

  // homo ad circulum, homo ad quadratum
  chalkCircle(r, cx, cy, R0 * 1.08, 0.5);
  const sq = R0 * 0.96;
  chalkLine(r, [[cx - sq, cy - sq], [cx + sq, cy - sq], [cx + sq, cy + sq], [cx - sq, cy + sq], [cx - sq, cy - sq]], 1, 0.4, 1.2);
  // radial construction lines
  for (let i = 0, n = r.pick([8, 12, 16]); i < n; i++){
    const a = i / n * Math.PI * 2;
    chalkLine(r, [[cx, cy], [cx + Math.cos(a) * R0 * 1.08, cy + Math.sin(a) * R0 * 1.08]], 0.6, 0.14, 1);
  }

  const n = r.pick([5, 6, 7, 8, 9]);
  const star = r.chance(0.65);
  const skip = star ? r.i(2, Math.max(2, Math.floor(n / 2))) : 1;
  const ratio = Math.cos(Math.PI / n);   // inscribed circle of the n-gon
  let rad = R0, rot = r.f(0, Math.PI * 2);
  const depth = r.i(6, 9);
  const twist = r.chance(0.75) ? Math.PI / n : r.f(-0.4, 0.4);

  for (let d = 0; d < depth; d++){
    const alpha = 0.72 - d * 0.055;
    const verts = [];
    for (let i = 0; i < n; i++){
      const a = rot + i / n * Math.PI * 2;
      verts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    // polygon edges
    for (let i = 0; i < n; i++){
      inkLine(r, [verts[i], verts[(i + 1) % n]], 1.1 - d * 0.08, P.ink(alpha), 0.7);
    }
    // star chords
    if (star){
      for (let i = 0; i < n; i++){
        inkLine(r, [verts[i], verts[(i + skip) % n]], 0.8 - d * 0.06, P.ink(alpha * 0.75), 0.6);
      }
    }
    // compass pricks at the vertices
    for (const [vx, vy] of verts){
      ctx.fillStyle = P.ink(alpha * 0.9);
      ctx.beginPath(); ctx.arc(vx, vy, Math.max(0.7, 1.6 - d * 0.15), 0, 7); ctx.fill();
    }
    rad *= star ? ratio * r.f(0.92, 0.99) : ratio;
    rot += twist;
  }

  // centre prick and a shaded lunette
  ctx.fillStyle = P.ink(0.8);
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, 7); ctx.fill();
  hatchCircle(r, cx + R0 * 0.72, cy - R0 * 0.72, R0 * 0.2, -Math.PI / 4, 4.2, P.ink(0.13), 0.45);

  scriptBlock(r, W * r.f(0.06, 0.1), H * r.f(0.78, 0.84), W * r.f(0.24, 0.32), r.i(3, 5));
  scriptBlock(r, W * r.f(0.68, 0.74), H * r.f(0.08, 0.12), W * r.f(0.16, 0.22), r.i(2, 4));
  return "proporzioni";
}

/* ----------------------------- render -------------------------------- */
const STUDIES = [drawTree, drawDeluge, drawPhyllotaxis, drawProportions];
let currentSeed = freshSeed();

function render(){
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = Math.round(innerWidth), H = Math.round(innerHeight);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const r = new R(currentSeed);
  makePalette(r);
  paper(r, W, H);
  const study = STUDIES[r.i(0, STUDIES.length - 1)](r, W, H);
  const folio = folioMark(r, W, H, study);

  const hex = seedHex(currentSeed);
  document.getElementById("seedChip").textContent =
    `${study} · folio ${folio} · seme ${hex.slice(0, 12)}`;
  document.title = `Folio ${folio} — ${study}`;
}

function regenerate(){
  currentSeed = freshSeed();
  render();
}

document.getElementById("regen").addEventListener("click", regenerate);
document.getElementById("save").addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = `codice-frattali-${seedHex(currentSeed).slice(0, 16)}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
});
addEventListener("keydown", e => {
  if (e.key === "n" || e.key === "N") regenerate();
  if (e.key === "s" || e.key === "S") document.getElementById("save").click();
});
let resizeTimer = 0;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 120);   // same seed, redrawn for the new size
});

render();
