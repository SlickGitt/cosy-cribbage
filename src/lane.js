// Lane generator: one seed -> a winding lane of 121 holes through biome stretches,
// pre-rendered to a tall pixel canvas.
import { makeRng, rect, disc, oval, number } from './pixel.js';
import * as A from './art.js';
import * as S from './scenery.js';
import { BIOMES, MIDDLE } from './biomes.js';

export { BIOMES };
export const W = 720;            // world width in art pixels; the lane winds through the middle
const SPACING = 13;              // distance between holes along the lane

// Start in the meadow, finish on the village green, and walk through a shuffled
// run of the other biomes in between (stretches of 10 to 17 holes).
function planBiomes(rng) {
  const order = MIDDLE.slice();
  for (let i = order.length - 1; i > 0; i--) { const j = rng.int(0, i); [order[i], order[j]] = [order[j], order[i]]; }
  const segs = [];
  let h = rng.int(9, 13);
  segs.push({ biome: 'meadow', from: 0, to: h - 1 });
  const greenFrom = 121 - rng.int(9, 12);
  for (let k = 0; h < greenFrom; k++) {
    let len = rng.int(10, 17);
    if (greenFrom - (h + len) < 8) len = greenFrom - h;
    segs.push({ biome: order[k % order.length], from: h, to: h + len - 1 });
    h += len;
  }
  segs.push({ biome: 'green', from: greenFrom, to: 121 });
  return segs;
}

function buildPath(rng) {
  // Control points down the world, smoothed with Catmull-Rom, then holes at even spacing.
  const pts = [];
  let y = 26;
  let x = W / 2;
  while (y < 1800) {
    pts.push([x, y]);
    y += rng.range(70, 100);
    x = Math.max(W / 2 - 120, Math.min(W / 2 + 120, x + rng.range(-90, 90)));
  }
  const samples = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let t = 0; t < 1; t += 0.02) {
      const t2 = t * t, t3 = t2 * t;
      const f = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
      samples.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const holes = [{ x: samples[0][0], y: samples[0][1] }];
  let acc = 0;
  for (let i = 1; i < samples.length && holes.length < 122; i++) {
    const d = Math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1]);
    acc += d;
    if (acc >= SPACING) { acc -= SPACING; holes.push({ x: samples[i][0], y: samples[i][1] }); }
  }
  const lastY = holes[121].y;
  return { samples: samples.filter((s) => s[1] <= lastY + 40), holes };
}

export function generateLane(seed) {
  const rng = makeRng(seed);
  const segs = planBiomes(rng);
  const { samples, holes } = buildPath(rng);
  const height = Math.ceil(holes[121].y + 70);
  const biomeAt = (h) => (segs.find((s) => h >= s.from && h <= s.to) || segs[segs.length - 1]).biome;
  holes.forEach((hole, i) => { hole.biome = biomeAt(i); });

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = height;
  const c = canvas.getContext('2d');

  const near = (x, y, pad) => {
    for (const s of samples) { if (Math.abs(s[1] - y) > pad) continue; if (Math.hypot(s[0] - x, s[1] - y) < pad) return true; }
    return false;
  };
  const band = (seg) => {
    const top = seg.from === 0 ? 0 : (holes[seg.from - 1].y + holes[seg.from].y) / 2;
    const bot = seg.to === 121 ? height : (holes[seg.to].y + holes[seg.to + 1].y) / 2;
    return [Math.round(top), Math.round(bot)];
  };

  // Ground, with a dithered edge where biomes meet.
  for (const seg of segs) {
    const B = BIOMES[seg.biome], [t, b] = band(seg);
    rect(c, 0, t, W, b - t, B.ground);
    for (let i = 0; i < (b - t) / 12; i++) oval(c, rng.range(0, W), rng.range(t, b), rng.int(8, 26), rng.int(3, 8), rng.pick(B.patches));
  }
  for (let k = 1; k < segs.length; k++) {
    const [t] = band(segs[k]), up = BIOMES[segs[k - 1].biome].ground;
    for (let y = t; y < t + 6; y++) for (let x = (y % 2); x < W; x += 2) if ((x + y) % 4 < 2 - (y - t) / 3) rect(c, x, y, 1, 1, up);
  }

  const side = (i, off) => {
    const a = holes[Math.max(0, i - 1)], b = holes[Math.min(121, i + 1)];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    return [holes[i].x - Math.sin(ang) * off, holes[i].y + Math.cos(ang) * off];
  };
  const signs = [];
  for (let i = 10; i <= 120; i += 10) {
    let [x, y] = side(i, 20);
    if (x < 14 || x > W - 14) [x, y] = side(i, -20);
    signs.push([x, y, i]);
  }
  const home = holes[121];
  const blockers = [...signs.map(([x, y]) => [x, y - 8, 22]), [holes[0].x, holes[0].y, 50], [home.x, home.y + 14, 44]];
  const blocked = (x, y) => blockers.some(([bx, by, r]) => Math.hypot(bx - x, by - y) < r);
  const laneAt = (y) => { let best = samples[0], bd = 1e9; for (const s of samples) { const d = Math.abs(s[1] - y); if (d < bd) { bd = d; best = s; } } return best[0]; };
  const laneDist = (x, y) => { let d = 1e9; for (const s of samples) { if (Math.abs(s[1] - y) > 80) continue; d = Math.min(d, Math.hypot(s[0] - x, s[1] - y)); } return d; };

  // Standing things are queued and drawn after the lane, sorted by y.
  const items = [], afterPath = [], occ = [];
  const add = (y, fn) => items.push([y, fn]);
  const hits = (r) => occ.some((o) => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y);
  for (const seg of segs) {
    const B = BIOMES[seg.biome], [t, b] = band(seg);
    const ctx = { c, rng, W, t, b, seg, area: (b - t) * W / 10000, add, laneAt, samples,
      after: (fn) => afterPath.push(fn), holeYs: holes.slice(seg.from, seg.to + 1).map((h) => h.y), water: null };
    // Is this footprint (w x h, standing on x, y) clear of the lane, signs, water and other things?
    ctx.spot = (x, y, pad, fp = [4, 4], maxD = Infinity) => {
      const r = { x: x - fp[0] / 2, y: y - fp[1], w: fp[0], h: fp[1] };
      if (y < t + 2 || y > b - 1 || blocked(x, y) || hits(r)) return false;
      const pts = [[x, y], [r.x, y], [r.x + r.w, y], [r.x, r.y], [r.x + r.w, r.y], [x, r.y + r.h / 2]];
      if (pts.some(([px, py]) => near(px, py, px === x && py === y ? pad : Math.min(pad, 12)))) return false;
      if (ctx.water && pts.some(([px, py]) => ctx.water(px, py))) return false;
      if (maxD !== Infinity && laneDist(x, y) > pad + maxD) return false;
      if (fp[0] > 6 || fp[1] > 6) occ.push(r);
      return true;
    };
    ctx.place = (n, pad, minD, fn, fp, maxD) => {
      const got = [];
      for (let tries = 0; got.length < n && tries < n * 60; tries++) {
        const x = maxD ? laneAt(rng.range(t, b)) + rng.pick([-1, 1]) * rng.range(pad, pad + maxD) : rng.range(-6, W + 6);
        const y = maxD ? rng.range(t + 4, b - 2) : rng.range(t + 4, b - 2);
        if (got.some((p) => Math.hypot(p[0] - x, p[1] - y) < minD) || !ctx.spot(x, y, pad, fp, maxD)) continue;
        got.push([x, y]); add(y, () => fn(x, y));
      }
    };
    ctx.spotNearLane = (pad, maxD, fp) => {
      for (let tries = 0; tries < 200; tries++) {
        const y = rng.range(t + fp[1], b - 4), x = laneAt(y) + rng.pick([-1, 1]) * rng.range(pad, pad + maxD);
        if (x > 20 && x < W - 20 && ctx.spot(x, y, pad, fp, maxD)) return [x, y];
      }
      return null;
    };
    // Ground-level patches, drawn now so the lane is laid over them.
    ctx.field = (w, h, kind) => {
      for (let tries = 0; tries < 60; tries++) {
        const x = rng.range(-10, W - w + 10), y = rng.range(t + 4, b - h - 4);
        const r = { x: x - 2, y: y - 2, w: w + 4, h: h + 4 };
        let ok = !hits(r);
        for (let i = 0; ok && i <= w; i += 8) for (let j = 0; ok && j <= h; j += 8) if (near(x + i, y + j, 12) || blocked(x + i, y + j)) ok = false;
        if (!ok) continue;
        occ.push(r); S.field(c, Math.round(x), Math.round(y), w, h, kind, rng); return true;
      }
      return false;
    };
    ctx.pondAt = (rx, ry, maxD) => {
      for (let tries = 0; tries < 120; tries++) {
        const y = rng.range(t + ry + 6, b - ry - 6);
        const x = maxD ? laneAt(y) + rng.pick([-1, 1]) * rng.range(rx + 18, rx + 18 + maxD) : rng.range(rx + 10, W - rx - 10);
        const r = { x: x - rx - 4, y: y - ry - 4, w: rx * 2 + 8, h: ry * 2 + 8 };
        if (hits(r) || [[0, 0], [-rx, 0], [rx, 0], [0, -ry], [0, ry]].some(([dx, dy]) => near(x + dx, y + dy, 14) || blocked(x + dx, y + dy))) continue;
        occ.push(r); S.pond(c, x, y, rx, ry, rng);
        add(y - ry, () => { S.reeds(c, x - rx + 3, y - ry + 2, rng); S.reeds(c, x + rx - 6, y + ry - 1, rng); });
        for (let i = 0; i < 3; i++) { const dx = rng.range(-rx + 6, rx - 6), dy = rng.range(-ry + 3, ry - 3); add(y + dy, () => S.duck(c, x + dx, y + dy, rng() < 0.5, i === 0)); }
        return true;
      }
      return false;
    };
    B.decorate(ctx);
  }

  // The lane itself, coloured per biome, then peg holes.
  const pathColours = (y) => {
    let best = 0, bd = 1e9;
    holes.forEach((h, i) => { const d = Math.abs(h.y - y); if (d < bd) { bd = d; best = i; } });
    return BIOMES[holes[best].biome];
  };
  for (const [layer, r] of [[0, 9], [1, 7], [2, 3]]) {
    for (let i = 0; i < samples.length; i += 1) {
      const [x, y] = samples[i];
      disc(c, x, y, r, pathColours(y).path[layer]);
    }
  }
  for (let i = 0; i < samples.length * 1.5; i++) {
    const s = samples[Math.floor(rng() * samples.length)];
    rect(c, s[0] + rng.range(-6, 6), s[1] + rng.range(-6, 6), 1, 1, rng.pick(pathColours(s[1]).specks));
  }
  afterPath.forEach((fn) => fn());
  holes.forEach((h, i) => {
    if (i === 0) return;
    const big = i % 5 === 0;
    rect(c, h.x - (big ? 2 : 1.5) - 0.5, h.y - (big ? 2 : 1.5) - 0.5, big ? 5 : 4, big ? 5 : 4, '#E8C08A');
    rect(c, h.x - (big ? 1.5 : 1), h.y - (big ? 1.5 : 1), big ? 4 : 3, big ? 4 : 3, '#4A3020');
  });

  // Landmarks: gate, numbered posts, home.
  for (const [x, y, i] of signs) add(y + 1, () => A.signpost(c, x, y, i, number));
  add(holes[0].y + 3, () => A.gate(c, holes[0].x, holes[0].y + 3));
  add(home.y + 30, () => A.cottage(c, home.x, home.y + 30, rng));

  items.sort((a, b) => a[0] - b[0]).forEach(([, fn]) => fn());

  // Leaf trail positions, revealed as walkers pass.
  const leaves = holes.map((h, i) => ({ x: h.x + rng.range(-6, 6), y: h.y + rng.range(-5, 5), col: i < 40 ? rng.pick(['#FFC85A', '#F2B63C']) : i < 80 ? rng.pick(['#EE7E32', '#E8893F']) : rng.pick(['#D9402E', '#C83A2E']) }));

  return { seed, canvas, height, holes, segs, biomeAt, leaves };
}
