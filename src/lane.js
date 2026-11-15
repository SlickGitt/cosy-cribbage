// Lane generator: one seed -> a winding lane of 121 holes through biome stretches,
// pre-rendered to a tall pixel canvas.
import { makeRng, rect, disc, oval, number } from './pixel.js';
import * as A from './art.js';

export const W = 720;            // world width in art pixels; the lane winds through the middle
const SPACING = 13;              // distance between holes along the lane

export const BIOMES = {
  meadow: { name: 'the meadow', ground: '#8FB04A', patches: ['#9CBC54', '#82A040', '#A8C860'], path: ['#7A5634', '#C49464', '#D6A874'], specks: ['#A07A50', '#E8C08A'] },
  forest: { name: 'the forest', ground: '#55702E', patches: ['#4A6428', '#607C36', '#3E5822'], path: ['#4A3420', '#8A6440', '#9E7650'], specks: ['#6B4A2E', '#C8402F', '#E8862E'] },
};

function planBiomes(rng) {
  // Stretches of 8 to 20 holes, alternating, starting and ending in the meadow.
  const segs = [];
  let h = 0, b = 'meadow';
  while (h <= 121) {
    const len = rng.int(10, 20);
    const end = Math.min(121, h + len - 1);
    segs.push({ biome: b, from: h, to: end });
    h = end + 1;
    b = b === 'meadow' ? 'forest' : 'meadow';
  }
  const last = segs[segs.length - 1];
  if (last.biome !== 'meadow') { last.to = Math.max(last.from, 112); segs.push({ biome: 'meadow', from: last.to + 1, to: 121 }); }
  if (last.to - last.from < 5 && segs.length > 1) { segs[segs.length - 2].to = 121; segs.pop(); }
  return segs.filter((s) => s.from <= s.to);
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

  // Small ground detail per biome.
  const items = [];
  const add = (y, fn) => items.push([y, fn]);
  const place = (seg, n, pad, minD, fn) => {
    const [t, b] = band(seg); const pts = [];
    for (let tries = 0; pts.length < n && tries < n * 60; tries++) {
      const x = rng.range(-6, W + 6), y = rng.range(t + 4, b - 2);
      if (near(x, y, pad) || blocked(x, y) || pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < minD)) continue;
      pts.push([x, y]); add(y, () => fn(x, y));
    }
  };
  for (const seg of segs) {
    const [t, b] = band(seg), area = (b - t) * W / 10000;
    if (seg.biome === 'meadow') {
      for (let i = 0; i < area * 60; i++) rect(c, rng.range(0, W), rng.range(t, b), 1, 2, rng.pick(['#B8D070', '#7E9A3E']));
      place(seg, area * 9, 14, 8, (x, y) => A.flowers(c, x, y, rng));
      place(seg, area * 1.6, 30, 34, (x, y) => A.tree(c, x, y, rng.pick(['gold', 'orange', 'lime', 'green']), rng.range(1.0, 1.3), rng));
      place(seg, area * 2, 20, 18, (x, y) => A.bush(c, x, y, rng.pick(['green', 'lime']), rng, rng.pick([null, '#F2A0B8', '#FFD45E'])));
      place(seg, area * 1.6, 22, 16, (x, y) => A.sheep(c, x, y, rng() < 0.5));
      place(seg, area * 0.8, 26, 24, (x, y) => A.cow(c, x, y, rng() < 0.5, rng() < 0.4));
      place(seg, area * 0.5, 26, 30, (x, y) => A.hay(c, x, y));
      place(seg, area * 0.8, 16, 14, (x, y) => A.rock(c, x, y));
      place(seg, area * 0.4, 24, 40, (x, y) => A.fence(c, x, y, rng.int(3, 6)));
      place(seg, area * 0.6, 14, 30, (x, y) => A.bird(c, x, y));
    } else {
      for (let i = 0; i < area * 160; i++) rect(c, rng.range(0, W), rng.range(t, b), 2, 1, rng.pick(['#E8862E', '#C8402F', '#F2B63C', '#8E5A2E']));
      place(seg, area * 4, 16, 10, (x, y) => A.fern(c, x, y));
      place(seg, area * 1.2, 18, 20, (x, y) => rng.pick([A.log, A.stump, A.rock])(c, x, y));
      place(seg, area * 1, 16, 20, (x, y) => A.mushrooms(c, x, y, rng));
      place(seg, area * 2, 18, 14, (x, y) => A.bush(c, x, y, rng.pick(['green', 'red', 'orange']), rng, rng.pick([null, '#D0302A', '#7A3E8E'])));
      place(seg, area * 0.8, 14, 40, (x, y) => A.squirrel(c, x, y, rng() < 0.5));
      place(seg, area * 9, 26, 15, (x, y) => (rng() < 0.35 ? A.pine(c, x, y, rng.range(0.9, 1.25), rng, rng() < 0.12)
        : A.tree(c, x, y, rng.pick(['orange', 'red', 'green', 'gold', 'plum', 'orange', 'lime']), rng.range(0.9, 1.25), rng)));
    }
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
