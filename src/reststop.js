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
export function seated(c, who, x, y) {
  const w = A.WALKERS[who];
  const rows = w.seat;
  oval(c, x, y, 6, 2, 'rgba(20,10,10,0.28)');
  sprite(c, rows, w.pal, x - 5, y - rows.length + 1);
}

export function lantern(c, x, y, col) {
  const g = c.createRadialGradient(x, y - 9, 1, x, y - 9, 14);
  g.addColorStop(0, 'rgba(255,212,138,0.7)'); g.addColorStop(1, 'rgba(255,212,138,0)');
  c.fillStyle = g; c.fillRect(x - 14, y - 23, 28, 28);
  rect(c, x, y - 12, 1, 13, '#2B1D24');
  rect(c, x - 1, y - 11, 3, 4, '#FFE9A8'); rect(c, x - 1, y - 12, 3, 1, '#2B1D24'); rect(c, x - 1, y - 7, 3, 1, '#2B1D24');
  for (let i = 0; i < 4; i++) rect(c, x + 1, y - 6 + i, 5 - i, 1, col);
}

export function gingham(c, x, y, w, h, pal = ['#C98272', '#E2AE9E', '#F2E4CC']) {
  rect(c, x + 3, y + 3, w, h, 'rgba(20,10,10,0.3)');
  const q = 10;
  for (let j = 0; j < h; j += q) for (let i = 0; i < w; i += q) {
    const a = (i / q) % 2, b = (j / q) % 2;
    rect(c, x + i, y + j, Math.min(q, w - i), Math.min(q, h - j), a && b ? pal[0] : a || b ? pal[1] : pal[2]);
  }
  for (let j = 0; j < h; j += 2) for (let i = (j / 2) % 2; i < w; i += 6) rect(c, x + i, y + j, 1, 1, 'rgba(255,255,255,0.12)');
  for (let i = 0; i < w; i += 3) { rect(c, x + i, y - 2, 1, 2, '#F5EBDA'); rect(c, x + i + 1, y + h, 1, 2, '#F5EBDA'); }
}

// Rows of a rounded rectangle, drawn pixel by pixel so the edge stays crisp.
export function rrect(c, x, y, w, h, r, col) {
  for (let j = 0; j < h; j++) {
    const d = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
    const inset = d ? Math.round(r - Math.sqrt(Math.max(0, r * r - d * d))) : 0;
    rect(c, x + inset, y + j, w - inset * 2, 1, col);
  }
}

// A wide slab of a felled tree, used as the forest table.
export function stumpTable(c, x, y, w, h) {
  const r = Math.min(16, Math.round(h / 3));
  rrect(c, x + 2, y + 5, w, h, r, 'rgba(20,10,10,0.3)');
  rrect(c, x - 2, y - 2, w + 4, h + 6, r + 2, '#4A2A18');
  rrect(c, x - 2, y - 2, w + 4, h + 3, r + 2, '#6B3E26');
  for (let i = 4; i < w; i += 7) rect(c, x + i, y + h + 1, 2, 2, '#3A2012');
  rrect(c, x, y, w, h, r, '#D49A54');
  const rings = 7, stepX = (w / 2 - 10) / rings, stepY = (h / 2 - 6) / rings;
  for (let k = 1; k <= rings; k++) {
    const ix = Math.round(k * stepX), iy = Math.round(k * stepY);
    rrect(c, x + ix, y + iy, w - ix * 2, h - iy * 2, Math.max(2, r - k), k % 2 ? '#C88C4A' : '#D49A54');
  }
  for (let i = 0; i < 26; i++) rect(c, x + w * 0.62 + i * 1.3, y + h * 0.3 + i * 0.6, 1, 1, '#9A6230');
  rect(c, x + 6, y + 3, w * 0.3, 1, 'rgba(255,240,210,0.35)');
}

// Jetty decking: boards across, with posts at the corners and water at the ends.
export function planks(c, x, y, w, h) {
  rect(c, x - 6, y + h - 2, w + 12, 8, '#2E5A7A'); rect(c, x - 6, y + h + 1, w + 12, 1, '#9CCBE8');
  rect(c, x + 3, y + 4, w, h, 'rgba(20,10,10,0.3)');
  rect(c, x, y, w, h, '#B07E46');
  for (let j = 0; j < h; j += 6) { rect(c, x, y + j, w, 1, '#7A4E2A'); for (let i = (j / 6) % 2 ? 10 : 30; i < w; i += 40) rect(c, x + i, y + j + 1, 1, 5, '#8A5A32'); }
  for (let j = 3; j < h; j += 6) for (let i = 2; i < w; i += 40) rect(c, x + i, y + j, 1, 1, '#5A3622');
  rect(c, x, y, w, 1, '#D0A06A');
  for (const px of [x - 3, x + w - 1]) for (const py of [y - 2, y + h - 6]) { rect(c, px, py, 4, 8, '#5A3622'); rect(c, px, py, 4, 1, '#7A4E32'); }
}

// The top of a big round bale: straw, with twine.
export function straw(c, x, y, w, h, rng) {
  rrect(c, x + 3, y + 4, w, h, 6, 'rgba(20,10,10,0.3)');
  rrect(c, x, y, w, h, 6, '#E2C064');
  for (let i = 0; i < w * h / 6; i++) rect(c, x + 2 + rng() * (w - 6), y + 2 + rng() * (h - 4), rng.int(2, 4), 1, rng.pick(['#C8A04A', '#F2D888', '#D4AE52']));
  for (let i = w / 5; i < w; i += w / 5) rect(c, x + i, y, 1, h, '#8A6A3A');
  rect(c, x + 6, y + 1, w - 12, 1, '#F8E8A8');
}

// A wide flat granite slab with lichen.
export function stone(c, x, y, w, h, rng) {
  rrect(c, x + 3, y + 5, w, h, 8, 'rgba(20,10,10,0.3)');
  rrect(c, x - 1, y - 1, w + 2, h + 4, 9, '#6A6458');
  rrect(c, x, y, w, h, 8, '#A49C8A');
  for (let i = 0; i < w * h / 20; i++) rect(c, x + 3 + rng() * (w - 6), y + 3 + rng() * (h - 6), 1, 1, rng.pick(['#948C7A', '#B4AC9A', '#8A8272']));
  for (let i = 0; i < 9; i++) { const lx = x + 6 + rng() * (w - 12), ly = y + 4 + rng() * (h - 8); oval(c, lx, ly, rng.int(2, 4), rng.int(1, 2), rng.pick(['#C8C070', '#A8B860', '#E0D890'])); }
  let cx = x + w * 0.62, cy = y + 2;
  for (let i = 0; i < h - 4; i++) { cx += rng.int(-1, 1); rect(c, cx, cy + i, 1, 1, '#6A6458'); }
  rect(c, x + 8, y + 1, w * 0.4, 1, '#C8C0AE');
}

// A tea room tablecloth: white with a scalloped edge and a little pattern.
export function cloth(c, x, y, w, h) {
  rect(c, x + 3, y + 4, w, h, 'rgba(20,10,10,0.3)');
  rect(c, x, y, w, h, '#FBF4E6');
  rect(c, x + 4, y + 4, w - 8, 1, '#D88A9A'); rect(c, x + 4, y + h - 5, w - 8, 1, '#D88A9A');
  rect(c, x + 4, y + 4, 1, h - 8, '#D88A9A'); rect(c, x + w - 5, y + 4, 1, h - 8, '#D88A9A');
  for (let i = 8; i < w - 8; i += 12) for (let j = 10; j < h - 8; j += 12) { rect(c, x + i, y + j, 1, 1, '#E8C0C8'); rect(c, x + i + 6, y + j + 6, 1, 1, '#B8C8E0'); }
  for (let i = 0; i < w; i += 4) { rect(c, x + i, y + h, 3, 1, '#FBF4E6'); rect(c, x + i + 1, y + h + 1, 1, 1, '#FBF4E6'); rect(c, x + i, y - 1, 3, 1, '#FBF4E6'); }
}

// Deckchair stripes.
export function stripes(c, x, y, w, h) {
  rect(c, x + 3, y + 3, w, h, 'rgba(20,10,10,0.3)');
  const cols = ['#6A94B4', '#F5EBDA', '#D46E5E', '#F5EBDA'];
  for (let i = 0; i < w; i += 10) rect(c, x + i, y, Math.min(10, w - i), h, cols[(i / 10) % cols.length]);
  for (let j = 0; j < h; j += 2) for (let i = (j / 2) % 2; i < w; i += 5) rect(c, x + i, y + j, 1, 1, 'rgba(255,255,255,0.1)');
  for (let i = 0; i < w; i += 3) { rect(c, x + i, y - 2, 1, 2, '#F5EBDA'); rect(c, x + i + 1, y + h, 1, 2, '#F5EBDA'); }
}

// Small things set down in the empty corner beside you.
export function prop(c, kind, x, y, rng) {
  const S = 'rgba(20,10,10,0.25)';
  if (kind === 'basket' || kind === 'crate') {
    rect(c, x - 1, y + 13, 18, 2, S);
    rect(c, x, y + 1, 16, 12, '#B07A3E'); for (let i = 0; i < 16; i += 3) rect(c, x + i, y + 1, 1, 12, '#8A5A2A');
    rect(c, x, y + 1, 16, 1, '#8A5A2A');
    if (kind === 'crate') { for (let i = 0; i < 7; i++) rect(c, x + 1 + i * 2, y - 1 - (i % 2), 2, 2, rng.pick(['#D0302A', '#E8483A', '#F2B63C'])); }
    else { rect(c, x + 2, y - 5, 12, 2, '#8A5A2A'); rect(c, x + 2, y - 5, 2, 6, '#8A5A2A'); rect(c, x + 12, y - 5, 2, 6, '#8A5A2A'); }
    rect(c, x - 9, y + 8, 4, 4, '#D0302A'); rect(c, x - 8, y + 7, 1, 1, '#4E8A3A'); rect(c, x - 5, y + 10, 4, 4, '#C8402F');
  } else if (kind === 'teapot') {
    rect(c, x, y + 12, 16, 2, S);
    oval(c, x + 8, y + 7, 6, 5, '#F5EBDA'); oval(c, x + 8, y + 7, 6, 1, '#D88A9A'); rect(c, x + 6, y + 1, 4, 1, '#F5EBDA'); rect(c, x + 7, y, 2, 1, '#D88A9A');
    rect(c, x + 14, y + 5, 3, 1, '#F5EBDA'); rect(c, x + 16, y + 3, 1, 2, '#F5EBDA'); rect(c, x, y + 5, 2, 4, '#F5EBDA');
    for (const cx of [x - 8, x + 20]) { rect(c, cx, y + 9, 6, 1, '#E8DCC4'); rect(c, cx + 1, y + 6, 4, 3, '#F5EBDA'); rect(c, cx + 2, y + 6, 2, 1, '#8A5A34'); }
  } else if (kind === 'churn') {
    rect(c, x + 1, y + 13, 12, 2, S);
    rect(c, x + 2, y + 2, 10, 11, '#C8C8C8'); rect(c, x + 2, y + 5, 10, 1, '#9A9A9A'); rect(c, x + 4, y - 1, 6, 3, '#B0B0B0'); rect(c, x + 3, y - 2, 8, 1, '#9A9A9A'); rect(c, x + 3, y + 3, 2, 8, '#E8E8E8');
    rect(c, x - 8, y + 8, 6, 5, '#E8C86A'); rect(c, x - 8, y + 10, 6, 1, '#C8A04A');
  } else if (kind === 'flask') {
    rect(c, x + 2, y + 13, 8, 2, S);
    rect(c, x + 3, y, 6, 13, '#3E6A4E'); rect(c, x + 3, y - 2, 6, 2, '#C8C0B0'); rect(c, x + 4, y + 1, 1, 11, '#5E8A6A');
    rect(c, x - 6, y + 8, 6, 4, '#C8C0B0'); rect(c, x - 5, y + 8, 4, 1, '#8A5A34');
  } else if (kind === 'bucket') {
    rect(c, x + 1, y + 13, 14, 2, S);
    rect(c, x + 2, y + 3, 11, 10, '#8A9AA8'); rect(c, x + 2, y + 3, 11, 2, '#2E5A7A'); rect(c, x + 3, y + 6, 2, 6, '#B0BEC8');
    rect(c, x + 1, y - 2, 13, 1, '#5A6A78'); rect(c, x + 1, y - 2, 1, 5, '#5A6A78'); rect(c, x + 13, y - 2, 1, 5, '#5A6A78');
    rect(c, x - 10, y + 10, 9, 1, '#C89A64'); rect(c, x - 2, y + 9, 1, 1, '#C8402F');
  } else if (kind === 'posy') {
    rect(c, x + 2, y + 13, 10, 2, S);
    rect(c, x + 4, y + 6, 6, 7, '#8A9AA8'); rect(c, x + 4, y + 6, 6, 1, '#B0BEC8');
    for (let i = 0; i < 9; i++) rect(c, x + 2 + rng.range(0, 9), y - 2 + rng.range(0, 7), 2, 2, rng.pick(['#F2A0B8', '#FFF4DC', '#B8A0E8', '#FFD45E']));
    rect(c, x + 6, y + 3, 1, 3, '#4E8A3A');
  } else if (kind === 'flags') {
    for (const [dx, col] of [[2, '#C8402F'], [9, '#3E7AA0']]) { rect(c, x + dx, y - 4, 1, 17, '#6B3E26'); rect(c, x + dx + 1, y - 4, 5, 3, col); rect(c, x + dx + 1, y - 1, 3, 1, col); }
    rect(c, x, y + 13, 14, 2, S);
  } else if (kind === 'cups') {
    for (const cx of [x, x + 9]) { rect(c, cx, y + 13, 7, 1, S); rect(c, cx, y + 4, 6, 9, '#F5EBDA'); rect(c, cx, y + 7, 6, 3, '#8A5A34'); rect(c, cx - 1, y + 3, 8, 1, '#3E3E4E'); }
    rect(c, x - 9, y + 5, 7, 8, '#C8A87A'); rect(c, x - 9, y + 5, 7, 1, '#A8885A');
  } else if (kind === 'mushrooms') {
    for (let i = 0; i < 3; i++) { const mx = x + i * 5, my = y + 8 + (i % 2) * 2; rect(c, mx, my + 1, 1, 3, '#F5EBDA'); rect(c, mx - 2, my, 5, 2, '#D0302A'); rect(c, mx - 1, my, 1, 1, '#FFFFFF'); }
  }
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
    stumpTable(c, s.x, s.y, s.w, s.h);
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
