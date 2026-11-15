// Rest stops: each round is played at a spot beside the lane. The surface (picnic
// blanket, tree stump...) comes from the biome. This draws the scene; cards are
// laid over it as HTML so they stay crisp and readable.
import { makeRng, rect, disc, oval, shade, sprite } from './pixel.js';
import * as A from './art.js';

const GROUND = {
  meadow: ['#8FB04A', ['#9CBC54', '#82A040', '#A8C860']],
  forest: ['#55702E', ['#4A6428', '#607C36', '#3E5822']],
};
const PATH = { meadow: ['#7A5634', '#C49464', '#D6A874'], forest: ['#4A3420', '#8A6440', '#9E7650'] };

// Seated walker: head and body rows from the standing sprite, legs folded.
function seated(c, who, x, y) {
  const w = A.WALKERS[who];
  const rows = [...w.rows.slice(0, 15), '.oLLLLLLo.', 'oBBLooLBBo'];
  oval(c, x, y, 6, 2, 'rgba(20,10,10,0.28)');
  sprite(c, rows, w.pal, x - 5, y - rows.length + 1);
}

function lantern(c, x, y, col) {
  const g = c.createRadialGradient(x, y - 9, 1, x, y - 9, 14);
  g.addColorStop(0, 'rgba(255,212,138,0.7)'); g.addColorStop(1, 'rgba(255,212,138,0)');
  c.fillStyle = g; c.fillRect(x - 14, y - 23, 28, 28);
  rect(c, x, y - 12, 1, 13, '#2B1D24');
  rect(c, x - 1, y - 11, 3, 4, '#FFE9A8'); rect(c, x - 1, y - 12, 3, 1, '#2B1D24'); rect(c, x - 1, y - 7, 3, 1, '#2B1D24');
  for (let i = 0; i < 4; i++) rect(c, x + 1, y - 6 + i, 5 - i, 1, col);
}

function gingham(c, x, y, w, h) {
  rect(c, x + 3, y + 3, w, h, 'rgba(20,10,10,0.3)');
  const q = 10;
  for (let j = 0; j < h; j += q) for (let i = 0; i < w; i += q) {
    const a = (i / q) % 2, b = (j / q) % 2;
    rect(c, x + i, y + j, Math.min(q, w - i), Math.min(q, h - j), a && b ? '#C98272' : a || b ? '#E2AE9E' : '#F2E4CC');
  }
  for (let j = 0; j < h; j += 2) for (let i = (j / 2) % 2; i < w; i += 6) rect(c, x + i, y + j, 1, 1, 'rgba(255,255,255,0.12)');
  for (let i = 0; i < w; i += 3) { rect(c, x + i, y - 2, 1, 2, '#F5EBDA'); rect(c, x + i + 1, y + h, 1, 2, '#F5EBDA'); }
}

function stumpTable(c, cx, cy, rx, ry) {
  oval(c, cx + 4, cy + ry + 6, rx + 6, 6, 'rgba(20,10,10,0.3)');
  for (let k = 0; k < 10; k++) oval(c, cx, cy + k, rx + 3, ry + 3, '#5A3420');
  for (let i = -rx; i <= rx; i += 7) rect(c, cx + i, cy + ry - 2, 2, 12, '#4A2A18');
  rect(c, cx - rx - 10, cy + ry + 2, 10, 4, '#5A3420'); rect(c, cx + rx, cy + ry + 3, 12, 4, '#5A3420');
  oval(c, cx, cy, rx + 3, ry + 3, '#6B3E26');
  oval(c, cx, cy, rx, ry, '#D49A54');
  for (let k = 1; k < 9; k++) {
    const r1 = rx * (1 - k / 9), r2 = ry * (1 - k / 9);
    oval(c, cx, cy, Math.round(r1), Math.max(1, Math.round(r2)), k % 2 ? '#C08444' : '#D49A54');
  }
  rect(c, cx - 2, cy - 1, 4, 2, '#A86A34');
  for (let i = 0; i < 18; i++) rect(c, cx + rx * 0.2 + i * 1.4, cy - ry * 0.3 + i * 0.5, 1, 1, '#9A6230');
}

export function drawRestStop(c, opts) {
  const { aw, ah, biome, seed = 3, lane, surface, seats, walked = 0, flags = [], nextBiome } = opts;
  const rng = makeRng(seed);
  const [g, patches] = GROUND[biome];
  rect(c, 0, 0, aw, ah, g);
  for (let i = 0; i < (aw * ah) / 900; i++) oval(c, rng.range(0, aw), rng.range(0, ah), rng.int(8, 24), rng.int(3, 7), rng.pick(patches));
  if (nextBiome) {
    const [g2, p2] = GROUND[nextBiome.biome], r = nextBiome.rect;
    c.save(); c.beginPath(); c.rect(r.x - 40, r.y - 40, r.w + 80, r.h + 80); c.clip();
    for (let i = 0; i < 40; i++) oval(c, rng.range(r.x, r.x + r.w), rng.range(r.y + 6, r.y + r.h), rng.int(14, 28), rng.int(8, 16), g2);
    c.restore();
    for (let i = 0; i < (r.w * r.h) / 900; i++) oval(c, rng.range(r.x, r.x + r.w), rng.range(r.y, r.y + r.h), rng.int(8, 20), rng.int(3, 6), rng.pick(p2));
  }
  if (biome === 'meadow') for (let i = 0; i < aw * ah / 60; i++) rect(c, rng.range(0, aw), rng.range(0, ah), 1, 2, rng.pick(['#B8D070', '#7E9A3E']));
  else for (let i = 0; i < aw * ah / 25; i++) rect(c, rng.range(0, aw), rng.range(0, ah), 2, 1, rng.pick(['#E8862E', '#C8402F', '#F2B63C', '#8E5A2E']));

  // lane
  const pts = lane.points;
  const pathAt = (i) => (nextBiome && pts[i][1] > nextBiome.rect.y && pts[i][0] < nextBiome.rect.x + nextBiome.rect.w ? PATH[nextBiome.biome] : PATH[biome]);
  for (const [layer, r] of [[0, 9], [1, 7], [2, 3]]) pts.forEach(([x, y], i) => disc(c, x, y, r, pathAt(i)[layer]));
  const holes = lane.holes;
  holes.forEach((h, i) => {
    const big = h.n % 5 === 0;
    rect(c, h.x - 2, h.y - 2, big ? 5 : 4, big ? 5 : 4, '#E8C08A');
    rect(c, h.x - 1.5, h.y - 1.5, big ? 4 : 3, big ? 4 : 3, '#4A3020');
    if (h.n <= walked) rect(c, h.x + rng.range(-6, 4), h.y + rng.range(-5, 5), 2, 1, rng.pick(['#FFC85A', '#EE7E32', '#D9402E']));
  });

  // scenery, kept off the lane, the surface and the seats
  const s = surface;
  const clear = (x, y, pad) => {
    if (x > s.x - 16 && x < s.x + s.w + 16 && y > s.y - 26 && y < s.y + s.h + 22) return false;
    if (seats.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 20)) return false;
    if (pts.some(([px, py]) => Math.hypot(px - x, py - y) < pad || Math.hypot(px - x, py - (y - 14)) < pad * 0.9)) return false;
    return !(opts.keepClear || []).some((r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h);
  };
  const items = [];
  const place = (n, pad, minD, fn, region) => {
    const got = [];
    for (let t = 0; got.length < n && t < n * 80; t++) {
      const R = region || { x: -6, y: -4, w: aw + 12, h: ah + 30 };
      const x = rng.range(R.x, R.x + R.w), y = rng.range(R.y, R.y + R.h);
      if (!clear(x, y, pad) || got.some((p) => Math.hypot(p[0] - x, p[1] - y) < minD)) continue;
      got.push([x, y]); items.push([y, () => fn(x, y)]);
    }
  };
  const area = aw * ah / 10000;
  const inNext = (fnM, fnF) => (x, y) => ((nextBiome && y > nextBiome.rect.y && x < nextBiome.rect.x + nextBiome.rect.w) ? fnF : fnM)(x, y);
  const meadowTree = (x, y) => A.tree(c, x, y, rng.pick(['gold', 'orange', 'lime', 'green']), rng.range(1, 1.3), rng);
  const forestTree = (x, y) => (rng() < 0.35 ? A.pine(c, x, y, rng.range(0.9, 1.25), rng) : A.tree(c, x, y, rng.pick(['orange', 'red', 'green', 'gold', 'plum']), rng.range(0.95, 1.3), rng));
  if (biome === 'meadow') {
    place(area * 14, 14, 8, inNext((x, y) => A.flowers(c, x, y, rng), (x, y) => A.fern(c, x, y)));
    place(area * 1.6, 28, 34, inNext(meadowTree, forestTree));
    place(area * 2.2, 18, 16, inNext((x, y) => A.bush(c, x, y, rng.pick(['green', 'lime']), rng, rng.pick([null, '#F2A0B8'])), forestTree));
    place(area * 1.8, 20, 18, inNext((x, y) => A.sheep(c, x, y, rng() < 0.5), (x, y) => A.mushrooms(c, x, y, rng)));
    place(area * 0.8, 24, 26, inNext((x, y) => A.cow(c, x, y, rng() < 0.5, rng() < 0.4), forestTree));
    place(area * 0.5, 22, 30, inNext((x, y) => A.hay(c, x, y), (x, y) => A.log(c, x, y)));
    place(area * 0.8, 16, 30, (x, y) => A.bird(c, x, y));
  } else {
    place(area * 5, 14, 9, (x, y) => A.fern(c, x, y));
    place(area * 1.4, 16, 16, (x, y) => A.mushrooms(c, x, y, rng));
    place(area * 1, 16, 20, (x, y) => rng.pick([A.log, A.stump, A.rock])(c, x, y));
    place(area * 2, 16, 14, (x, y) => A.bush(c, x, y, rng.pick(['green', 'red', 'orange']), rng, rng.pick([null, '#D0302A'])));
    place(area * 0.9, 14, 40, (x, y) => A.squirrel(c, x, y, rng() < 0.5));
    place(area * 9, 24, 15, inNext(forestTree, meadowTree));
  }
  items.sort((a, b) => a[0] - b[0]).forEach(([, fn]) => fn());

  // the surface
  if (biome === 'meadow') {
    gingham(c, s.x, s.y, s.w, s.h);
    const bx = s.x + s.w - 4, by = s.y + s.h - 10;
    rect(c, bx - 2, by + 6, 20, 3, 'rgba(20,10,10,0.3)');
    rect(c, bx, by - 6, 16, 12, '#B07A3E'); for (let i = 0; i < 16; i += 3) rect(c, bx + i, by - 6, 1, 12, '#8A5A2A');
    rect(c, bx + 2, by - 12, 12, 2, '#8A5A2A'); rect(c, bx + 2, by - 12, 2, 6, '#8A5A2A'); rect(c, bx + 12, by - 12, 2, 6, '#8A5A2A');
    rect(c, s.x - 8, s.y + 8, 6, 12, '#3E7A5E'); rect(c, s.x - 8, s.y + 6, 6, 3, '#C8C0B0');
    rect(c, s.x + 6, s.y + s.h + 4, 4, 4, '#D0302A'); rect(c, s.x + 12, s.y + s.h + 5, 4, 4, '#D0302A'); rect(c, s.x + 8, s.y + s.h + 3, 1, 2, '#4E8A3A');
  } else {
    stumpTable(c, s.x + s.w / 2, s.y + s.h / 2, Math.round(s.w / 2), Math.round(s.h / 2));
    A.mushrooms(c, s.x + s.w - 12, s.y + s.h + 6, rng);
    A.log(c, s.x - 26, s.y + s.h / 2 + 4);
  }
  // seats, walkers, lanterns
  seated(c, 'c', seats[0][0], seats[0][1]);
  seated(c, 'p', seats[1][0], seats[1][1]);
  for (const f of flags) lantern(c, f.x, f.y, f.who === 'p' ? '#F2B63C' : '#B07AC8');
  for (const f of flags) for (const d of f.dots || []) rect(c, d[0], d[1], 2, 2, f.who === 'p' ? 'rgba(255,212,138,0.9)' : 'rgba(200,160,220,0.9)');
}

// Lane geometry for a rest stop: a gentle curve with numbered holes.
export function stopLane({ from, to, count, start, startN, dir = 'down' }) {
  const points = [], holes = [];
  const N = 400;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = from[0] + (to[0] - from[0]) * t + (dir === 'down' ? Math.sin(t * 5) * 10 : 0);
    const y = from[1] + (to[1] - from[1]) * t + (dir === 'across' ? Math.sin(t * 6) * 8 : 0);
    points.push([x, y]);
  }
  let acc = 0, n = startN;
  for (let i = 1; i < points.length && holes.length < count; i++) {
    acc += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    if (acc >= 13) { acc -= 13; if (i / N >= start) holes.push({ x: points[i][0], y: points[i][1], n: n++ }); }
  }
  return { points, holes };
}
