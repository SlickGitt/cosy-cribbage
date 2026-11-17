// Moments: a little scene that plays the first time you walk into a biome.
// Each one is anchored a few holes ahead of the walkers so the camera finds it.
//   meadow  a hot-air balloon drifts over, its shadow sliding across the fields
//   forest  a deer stops to watch you pass, then bounds off
//   river   a kingfisher dives from a reed and comes up with a fish
//   village starlings swirl over the rooftops at dusk
import { rect, oval, makeRng } from './pixel.js';
import { sprite } from './sprites.js';
import * as A from './art.js';

const INK = '#2B1D24';
// a ripple: just the outline of an ellipse, so it works on any water
function ring(c, x, y, rx, ry, col) {
  if (rx < 1) return;
  c.fillStyle = col; const n = Math.max(8, Math.round(rx * 3));
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; c.fillRect(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), 1, 1); }
}

// ---------- art ----------
function balloonArt(c) {
  const rows = [5, 9, 11, 13, 13, 15, 15, 15, 15, 13, 13, 11, 9, 7, 5, 3];
  const cols = ['#C8402F', '#F2E4CC', '#F2B63C', '#F2E4CC'];
  rows.forEach((w, j) => {
    const y = -30 + j, x0 = -Math.floor(w / 2);
    for (let i = 0; i < w; i++) {
      const band = Math.floor(((i + 0.5) / w) * 6) % 4;
      let col = cols[band];
      if (i === 0 || (j > 2 && i === 1 && w > 9)) col = band === 0 ? '#A8302A' : band === 2 ? '#D0962E' : '#D8C8B0';
      if (i === w - 2 && j > 1 && j < 10) col = '#FFF8EC';
      rect(c, x0 + i, y, 1, 1, col);
    }
  });
  rect(c, -1, -14, 3, 1, '#8A5A34');
  rect(c, -3, -13, 1, 5, '#6B4A2E'); rect(c, 3, -13, 1, 5, '#6B4A2E');
  rect(c, -3, -8, 7, 4, '#9A6A3E'); rect(c, -3, -8, 7, 1, '#B88A5A'); rect(c, -2, -6, 5, 1, '#7A5034');
}
function kingfisherArt(c, pose, flip) {
  const X = (dx, w = 1) => (flip ? -dx - w + 1 : dx);
  const blue = '#2E8EC8', bright = '#5CC8F0', orange = '#E8782E';
  if (pose === 'dive') {
    rect(c, X(0, 2), -7, 2, 4, blue); rect(c, X(0), -6, 1, 2, bright); rect(c, X(1), -4, 1, 2, orange); rect(c, X(0, 2), -3, 1, 2, INK);
    return;
  }
  if (pose === 'fly1' || pose === 'fly2') {
    rect(c, X(-3, 6), -6, 6, 2, blue); rect(c, X(-2, 4), -6, 4, 1, bright); rect(c, X(-1, 3), -4, 3, 1, orange);
    rect(c, X(3, 2), -5, 2, 1, INK);
    const wy = pose === 'fly1' ? -8 : -4; rect(c, X(-1, 3), wy, 3, 1, blue);
    return;
  }
  rect(c, X(-2, 4), -5, 4, 3, blue); rect(c, X(-1, 2), -6, 2, 1, blue); rect(c, X(-1, 3), -5, 3, 1, bright);
  rect(c, X(-1, 3), -3, 3, 2, orange); rect(c, X(1), -5, 1, 1, '#FFF4DC'); rect(c, X(0), -5, 1, 1, INK);
  rect(c, X(2, 2), -5, 2, 1, INK); rect(c, X(-3), -3, 1, 2, blue);
  if (pose === 'fish') { rect(c, X(3, 3), -4, 3, 1, '#C8D2DA'); rect(c, X(5), -5, 1, 1, '#C8D2DA'); }
  rect(c, X(0), -1, 1, 1, '#E8603A');
}
const balloonSprite = () => sprite('m|balloon', 24, 40, balloonArt);
const kfSprite = (pose, flip) => sprite(`m|kf|${pose}|${flip ? 1 : 0}`, 14, 14, (c) => kingfisherArt(c, pose, flip));

// Icons for the field guide.
export function momentIcon(kind) {
  const cv = document.createElement('canvas'); cv.className = 'px-sprite critter-icon';
  if (kind === 'kingfisher') { const s = kfSprite('perch', false); cv.width = s.cv.width; cv.height = s.cv.height; cv.getContext('2d').drawImage(s.cv, 0, 0); return cv; }
  if (kind === 'starling') {
    cv.width = 16; cv.height = 12; const c = cv.getContext('2d');
    for (const [x, y] of [[3, 3], [7, 5], [11, 2], [5, 8], [10, 8], [13, 6], [8, 2]]) { rect(c, x, y, 2, 1, INK); rect(c, x + 1, y - 1, 1, 1, INK); }
    return cv;
  }
  return null;
}

// ---------- the moments ----------
// ctx: { lane, at (hole index), sfx, find, waterNear(y) }
export const MOMENTS = {
  meadow(ctx) {
    const h = ctx.lane.holes[ctx.at], dir = h.x < 360 ? 1 : -1, rng = makeRng(ctx.lane.seed + 5);
    const x0 = h.x - dir * 130, x1 = h.x + dir * 150, y0 = h.y - 4, y1 = h.y - 36, dur = 18;
    let bx = x0, by = y0, flame = 0;
    ctx.sfx('burner');
    return {
      text: 'A hot-air balloon drifts over the meadow.', dur,
      update(age, dt) {
        const k = Math.min(1, age / dur);
        bx = x0 + (x1 - x0) * k; by = y0 + (y1 - y0) * k + Math.sin(age * 0.8) * 1.5;
        flame = Math.max(0, flame - dt);
        if (rng() < dt * 0.25) { flame = 0.5; ctx.sfx('burner'); }
      },
      anchor: () => [bx, by - 34],
      // its shadow on the ground, well below and to one side
      under(c, ix, iy, age) { const a = Math.min(1, age, ctx.fade(age, dur)); c.globalAlpha = 0.18 * a; oval(c, bx + 14 - ix, by + 44 - iy, 7, 2, '#1E1430'); c.globalAlpha = 1; },
      sky(c, ix, iy, age) {
        const s = balloonSprite(), a = ctx.fade(age, dur);
        c.globalAlpha = a; c.drawImage(s.cv, Math.round(bx - s.ax - ix), Math.round(by - s.ay - iy));
        if (flame > 0) { rect(c, Math.round(bx - ix), Math.round(by - 15 - iy), 1, 2, '#FFD45E'); rect(c, Math.round(bx - ix), Math.round(by - 16 - iy), 1, 1, '#FFF4DC'); }
        c.globalAlpha = 1;
      },
    };
  },

  forest(ctx) {
    // an open spot beside the lane, so the trees don't hide it
    const L = ctx.lane;
    const inFront = (sx, sy) => L.objects.some((o) => o.cover && o.y > sy - 2 && o.y < sy + 34 && Math.abs(o.x - sx - 5) < 20);
    const open = (sx, sy) => L.free(sx, sy) && L.free(sx + 10, sy) && L.free(sx - 2, sy) && !inFront(sx, sy);
    // if the trees are too thick, it steps out onto the lane instead
    let [x, y] = ctx.side(Math.min(121, ctx.at + 1), -5), text = 'A deer steps out onto the lane ahead.';
    findSpot: for (const off of [22, -22, 28, -28, 34, -34, 18, -18, 42, -42]) for (const k of [0, 1, -1, 2, 3]) {
      const [sx, sy] = ctx.side(Math.min(121, ctx.at + k), off);
      if (open(sx, sy)) { x = sx; y = sy; text = 'A deer stops to watch you pass.'; break findSpot; }
    }
    const away = x < L.holes[ctx.at].x ? -1 : 1, dur = 8;
    let dx = 0, z = 0;
    ctx.find('deer'); ctx.sfx('chime');
    return {
      text, dur,
      update(age) { const b = Math.max(0, age - 5.6); dx = away * b * 26; z = b > 0 ? Math.round(Math.abs(Math.sin(b * 9)) * 3) : 0; },
      anchor: () => [x + dx + 6, y - 20],
      ground(list, c, ix, iy, age) { const a = ctx.fade(age, dur); list.push({ y: y + 6, draw: () => { c.globalAlpha = a; A.deer(c, Math.round(x + dx - ix), Math.round(y - z - iy)); c.globalAlpha = 1; } }); },
    };
  },

  river(ctx) {
    const h = ctx.lane.holes[ctx.at], w = ctx.waterNear(h.y);
    if (!w) return null;
    const side = h.x < 360 ? 1 : -1, px = Math.round(h.x + side * 34), wy = w.ry(px);
    const perch = [px, Math.round(wy - w.hw - 3)], hit = [px + side * 7, Math.round(wy - 1)];
    const flip = side < 0, splash = [], dur = 11;
    let kx = perch[0], ky = perch[1], pose = 'perch', splashed = false, found = false;
    ctx.sfx('chime');
    const lerp = (a, b, k) => a + (b - a) * k;
    return {
      text: 'A kingfisher! Gone in a flash of blue.', dur,
      update(age, dt, t) {
        if (age < 2.2) { pose = 'perch'; kx = perch[0]; ky = perch[1]; }
        else if (age < 2.55) { const k = (age - 2.2) / 0.35; pose = 'dive'; kx = lerp(perch[0], hit[0], k); ky = lerp(perch[1] - 4 * Math.sin(k * Math.PI), hit[1], k * k); }
        else if (age < 3.1) {
          if (!splashed) { splashed = true; ctx.sfx('splash'); for (let i = 0; i < 7; i++) splash.push({ x: hit[0], y: hit[1], vx: (Math.random() - 0.5) * 22, vy: -Math.random() * 22 - 8, life: 0.6 }); }
          pose = 'hidden';
        } else if (age < 3.5) { const k = (age - 3.1) / 0.4; pose = 'fly1'; kx = lerp(hit[0], perch[0], k); ky = lerp(hit[1], perch[1], k) - Math.sin(k * Math.PI) * 5; }
        else if (age < 6.5) { pose = 'fish'; kx = perch[0]; ky = perch[1]; if (!found) { found = true; ctx.find('kingfisher'); ctx.sfx('tweet'); } }
        else { const k = age - 6.5; pose = Math.floor(t * 14) % 2 ? 'fly1' : 'fly2'; kx = perch[0] - side * k * 70; ky = w.ry(kx) - w.hw * 0.4 - 4; }
        for (const s of splash) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 70 * dt; }
      },
      anchor: () => [kx, ky - 10],
      ground(list, c, ix, iy, age, t) {
        // the reed stem it sits on
        list.push({ y: perch[1] + 3, draw: () => { rect(c, perch[0] - ix, perch[1] - iy, 1, 6, '#6B5A2E'); rect(c, perch[0] - 1 - ix, perch[1] + 2 - iy, 1, 4, '#4E6A2E'); rect(c, perch[0] + 1 - ix, perch[1] - 2 - iy, 1, 3, '#8A7A3E'); } });
        if (age > 2.5 && age < 3.6) {
          const r = (age - 2.5) * 10;
          list.push({ y: hit[1], draw: () => { c.globalAlpha = Math.max(0, 1 - (age - 2.5)); ring(c, hit[0] - ix, hit[1] + 1 - iy, r, Math.max(1, r / 3), 'rgba(220,236,246,0.8)'); c.globalAlpha = 1; } });
        }
        list.push({ y: hit[1] + 2, draw: () => { for (const s of splash) if (s.life > 0) rect(c, Math.round(s.x - ix), Math.round(s.y - iy), 1, 1, '#D8ECF6'); } });
        if (pose === 'hidden') return;
        const s = kfSprite(pose, pose === 'fish' || pose === 'perch' ? flip : !flip), a = ctx.fade(age, dur);
        list.push({ y: perch[1] + 4, draw: () => { c.globalAlpha = a; c.drawImage(s.cv, Math.round(kx - s.ax - ix), Math.round(ky - s.ay - iy)); c.globalAlpha = 1; } });
      },
    };
  },

  lake(ctx) {
    // a fish leaps out beside the boats and drops back with a plop
    const H = ctx.lane.holes, lk = ctx.lane.waters.find((w) => w.inside);
    if (!lk) return null;
    let at = ctx.at; while (at < 121 && !H[at].wet) at++;
    if (!H[at].wet) return null;
    let sx = null, sy = null;
    for (const off of [22, -22, 30, -30, 16, -16]) { const [x, y] = ctx.side(at, off); if (lk.inside(x, y) && lk.inside(x + 14, y)) { sx = x; sy = y; break; } }
    if (sx === null) return null;
    const dir = sx > H[at].x ? 1 : -1, dur = 6.5, rings = [];
    let fx = sx, fy = sy, z = 0, ang = 0, out = false, plopped = false;
    ctx.sfx('splash');
    return {
      text: 'A fish leaps beside the boat!', dur,
      update(age) {
        if (age < 0.4) { if (!rings.length) rings.push({ x: sx, y: sy, a: 0 }); }
        const k = (age - 0.4) / 0.9;
        out = k > 0 && k < 1;
        if (out) { fx = sx + dir * k * 14; fy = sy; z = Math.sin(k * Math.PI) * 12; ang = k; }
        if (k >= 1 && !plopped) { plopped = true; rings.push({ x: sx + dir * 14, y: sy, a: age }); ctx.sfx('splash'); }
      },
      anchor: () => [sx + dir * 7, sy - 18],
      ground(list, c, ix, iy, age) {
        for (const r of rings) {
          const e = age - r.a, rr = e * 9;
          if (e > 1.6) continue;
          list.push({ y: r.y - 1, draw: () => { c.globalAlpha = Math.max(0, 1 - e / 1.6); ring(c, r.x - ix, r.y - iy, rr, Math.max(1, rr / 3), 'rgba(220,236,246,0.85)'); if (rr > 4) ring(c, r.x - ix, r.y - iy, rr * 0.55, Math.max(1, rr / 5.5), 'rgba(220,236,246,0.5)'); c.globalAlpha = 1; } });
        }
        if (!out) return;
        list.push({ y: fy + 1, draw: () => {
          const x = Math.round(fx - ix), y = Math.round(fy - z - iy), up = ang < 0.5;
          // a little silver fish, nose up then nose down
          rect(c, x - 2, y - 1, 5, 2, '#B8C8D2'); rect(c, x - 2, y - 1, 5, 1, '#E2ECF2');
          rect(c, x + (dir > 0 ? 3 : -3), y + (up ? -1 : 0), 1, 1, '#B8C8D2');
          rect(c, x + (dir > 0 ? -3 : 3), y + (up ? 0 : -1), 1, 2, '#8A9AA8'); rect(c, x + (dir > 0 ? -4 : 4), y + (up ? 1 : -2), 1, 2, '#8A9AA8');
          rect(c, x + (dir > 0 ? 2 : -2), y - 1, 1, 1, '#2B1D24');
          c.fillStyle = 'rgba(220,236,246,0.8)'; c.fillRect(Math.round(fx - ix) - dir * 3, Math.round(fy - z * 0.6 - iy), 1, 1);
          oval(c, Math.round(fx - ix), Math.round(fy - iy), 2, 1, 'rgba(20,40,50,0.25)');
        } });
      },
    };
  },

  village(ctx) {
    const h = ctx.lane.holes[ctx.at], rng = makeRng(ctx.lane.seed + 11), N = 260, dur = 13;
    const birds = Array.from({ length: N }, () => ({ a: rng.range(0, 6.28), r: Math.pow(rng(), 0.7), ph: rng.range(0, 6.28) }));
    let cx = h.x - 50, cy = h.y - 56;
    ctx.sfx('murmur');
    return {
      text: 'Starlings swirl over the rooftops.', dur, find: 'starling',
      update(age) { cx = h.x - 50 + age * 8; cy = h.y - 56 + Math.sin(age * 0.4) * 8; if (age > 2 && !this.found) { this.found = true; ctx.find('starling'); } },
      anchor: () => [cx, cy - 34],
      sky(c, ix, iy, age, t) {
        // one flock that breathes, folds and turns: a blob that stretches and rotates,
        // with a ripple running through it
        const a = ctx.fade(age, dur, 2.5), T = age;
        const sx = 52 + Math.sin(T * 0.7) * 20, sy = 16 + Math.cos(T * 0.9) * 6, rot = Math.sin(T * 0.33) * 0.7;
        const cr = Math.cos(rot), sr = Math.sin(rot);
        c.fillStyle = '#241A2C';
        for (let i = 0; i < N; i++) {
          if (i / N > a) continue;
          const b = birds[i], ang = b.a + T * (0.5 + b.r * 0.3);
          let x = Math.cos(ang) * b.r * sx, y = Math.sin(ang) * b.r * sy;
          y += Math.sin(x * 0.08 + T * 2.2) * 5;
          const X = cx + x * cr - y * sr, Y = cy + x * sr + y * cr;
          // little ticks: wings up or wings level
          const px = Math.round(X - ix), py = Math.round(Y - iy);
          if (Math.sin(t * 0.025 + b.ph) > 0) { c.fillRect(px - 1, py - 1, 1, 1); c.fillRect(px, py, 1, 1); c.fillRect(px + 1, py - 1, 1, 1); }
          else c.fillRect(px - 1, py, 3, 1);
        }
      },
    };
  },
};
