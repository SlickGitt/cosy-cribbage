// Scenery for the newer biomes: orchard, river, farm, moor, village, churchyard,
// village green and town. Same conventions as art.js: (x, y) is the base centre
// of the object in art pixels, drawn top-down with a slight front view.
import { rect, disc, oval, tri, shade } from './pixel.js';
import { tree, TREE_SETS } from './art.js';

const SH = 'rgba(20,10,10,0.28)';
const INK = '#2B1D24';

TREE_SETS.yew = ['#16302A', '#1E4434', '#2E5E44', '#4E7E58'];
TREE_SETS.apple = ['#2E5A34', '#3F7A42', '#5E9A52', '#9CCB72'];
TREE_SETS.willow = ['#5A7A2E', '#7A9E3A', '#A0C05A', '#D0E890'];

// ---------- orchard ----------
export function appleTree(c, x, y, rng) {
  tree(c, x, y, 'apple', 0.85, rng);
  for (let i = 0; i < 7; i++) rect(c, x + rng.range(-7, 6), y - 5 - rng.range(0, 12), 1, 1, rng.pick(['#D0302A', '#E8483A', '#F2B63C', '#D0302A']));
  for (let i = 0; i < 3; i++) rect(c, x + rng.range(-8, 8), y + rng.range(0, 4), 1, 1, rng.pick(['#C8402F', '#E8862E']));
}
export function crate(c, x, y, rng) {
  rect(c, x - 5, y + 1, 12, 2, SH);
  rect(c, x - 6, y - 5, 12, 6, '#B07A3E'); rect(c, x - 6, y - 3, 12, 1, '#8A5A2A'); rect(c, x - 6, y - 5, 1, 6, '#8A5A2A'); rect(c, x + 5, y - 5, 1, 6, '#8A5A2A');
  for (let i = 0; i < 5; i++) rect(c, x - 5 + i * 2, y - 6 - (i % 2), 2, 1, rng.pick(['#D0302A', '#E8483A', '#F2B63C']));
}
export function beehive(c, x, y) {
  rect(c, x - 3, y + 1, 9, 2, SH);
  rect(c, x - 4, y - 9, 8, 10, '#F2E6CC'); rect(c, x - 4, y - 6, 8, 1, '#C8BCA0'); rect(c, x - 4, y - 3, 8, 1, '#C8BCA0');
  rect(c, x - 5, y - 11, 10, 2, '#8A8272'); rect(c, x - 1, y - 1, 2, 1, INK);
  rect(c, x + 5, y - 9, 1, 1, '#F2B63C'); rect(c, x + 6, y - 11, 1, 1, '#F2B63C'); rect(c, x - 7, y - 7, 1, 1, '#F2B63C');
}
export function ladder(c, x, y) {
  rect(c, x - 3, y - 14, 1, 15, '#C89A64'); rect(c, x + 2, y - 14, 1, 15, '#C89A64');
  for (let j = 0; j < 5; j++) rect(c, x - 2, y - 12 + j * 3, 4, 1, '#9A6A44');
}

// ---------- river ----------
export function duck(c, x, y, flip, brown) {
  const body = brown ? '#9A6A44' : '#FFF8EC', head = brown ? '#3E6A3E' : '#FFF8EC';
  rect(c, x - 3, y + 2, 7, 1, 'rgba(255,255,255,0.35)');
  rect(c, x - 3, y - 1, 6, 3, body); rect(c, x - 2, y - 2, 4, 1, body);
  const hx = flip ? x - 4 : x + 2;
  rect(c, hx, y - 4, 2, 3, head); rect(c, flip ? hx - 1 : hx + 2, y - 3, 1, 1, '#F2A030'); rect(c, hx + (flip ? 0 : 1), y - 4, 1, 1, INK);
}
export function reeds(c, x, y, rng) {
  for (let i = 0; i < 5; i++) {
    const rx = x + i * 2 - 4, h = rng.int(4, 8);
    rect(c, rx, y - h, 1, h, rng.pick(['#5E8A3A', '#4E7A34', '#7A9A42']));
    if (i % 2) rect(c, rx, y - h - 2, 1, 3, '#6B3E26');
  }
}
export function lilypad(c, x, y, flower) {
  oval(c, x, y, 3, 2, '#4E8A3A'); rect(c, x, y - 1, 2, 1, '#3E7A5E');
  if (flower) { rect(c, x - 1, y - 1, 2, 1, '#F2A0B8'); rect(c, x, y - 2, 1, 1, '#FFF4DC'); }
}
export function willow(c, x, y, rng) {
  tree(c, x, y, 'willow', 1.15, rng);
  for (let i = 0; i < 12; i++) { const dx = rng.range(-12, 12); rect(c, x + dx, y - 18 + rng.range(0, 6), 1, rng.int(6, 13), rng.pick(['#7A9E3A', '#A0C05A', '#5A7A2E'])); }
}
export function jetty(c, x, top, len) {
  rect(c, x - 4, top + 2, 10, len, 'rgba(20,30,40,0.3)');
  rect(c, x - 5, top, 10, len, '#A8743E');
  for (let j = 0; j < len; j += 3) rect(c, x - 5, top + j, 10, 1, '#7A4E2A');
  for (const px of [x - 6, x + 5]) for (const py of [top + 2, top + len - 2]) rect(c, px, py - 1, 2, 4, '#5A3622');
}
export function rowboat(c, x, y) {
  oval(c, x + 1, y + 2, 9, 3, 'rgba(20,30,40,0.3)');
  oval(c, x, y, 9, 3, '#7A4E2A'); oval(c, x, y, 7, 2, '#C8945A'); rect(c, x - 1, y - 2, 2, 5, '#7A4E2A');
  rect(c, x - 5, y - 1, 9, 1, '#5A3622');
}

// ---------- farm ----------
export function field(c, x, y, w, h, kind, rng) {
  const P = {
    plough: ['#8A5A34', '#6E4426', '#A0704A'],
    wheat: ['#E2BC5C', '#C8A04A', '#F2D888'],
    cabbage: ['#7A5434', '#5E9A52', '#9CCB72'],
    stubble: ['#C8A860', '#A88A48', '#E2C880'],
  }[kind];
  rect(c, x - 1, y - 1, w + 2, h + 2, shade(P[0], 0.8));
  rect(c, x, y, w, h, P[0]);
  for (let j = 1; j < h; j += 3) {
    if (kind === 'cabbage') { for (let i = 2; i < w - 1; i += 4) { rect(c, x + i, y + j, 2, 2, P[1]); rect(c, x + i, y + j, 1, 1, P[2]); } }
    else rect(c, x, y + j, w, 1, P[1]);
  }
  for (let i = 0; i < w * h / 30; i++) rect(c, x + rng.range(0, w - 1), y + rng.range(0, h - 1), 1, 1, P[2]);
}
export function barn(c, x, y) {
  const X = Math.round(x - 18), Y = Math.round(y - 30);
  rect(c, X + 3, Y + 30, 38, 3, SH);
  rect(c, X, Y + 10, 36, 20, '#B8402E');
  for (let i = 3; i < 36; i += 4) rect(c, X + i, Y + 10, 1, 20, '#9A3024');
  for (let j = 0; j < 6; j++) { const inset = (6 - j) * 2.5; rect(c, X - 3 + inset, Y + j * 2, 42 - inset * 2, 2, j % 2 ? '#5A4A4A' : '#6A5A58'); }
  rect(c, X - 3, Y + 10, 42, 2, '#4A3A3A');
  rect(c, X + 11, Y + 15, 14, 15, '#F5EBDA'); rect(c, X + 12, Y + 16, 12, 14, '#9A3024');
  for (let k = 0; k < 12; k++) { rect(c, X + 12 + k, Y + 16 + k, 1, 1, '#F5EBDA'); rect(c, X + 23 - k, Y + 16 + k, 1, 1, '#F5EBDA'); }
  rect(c, X + 15, Y + 4, 6, 5, '#F5EBDA'); rect(c, X + 16, Y + 5, 4, 4, '#3A2433');
  rect(c, X + 14, Y + 30, 8, 2, '#E8C86A');
}
export function pig(c, x, y, flip) {
  oval(c, x, y + 3, 5, 1, SH);
  rect(c, x - 4, y - 2, 8, 4, '#F2A0B0'); rect(c, x - 3, y - 3, 6, 1, '#F2A0B0'); rect(c, x - 4, y + 1, 8, 1, '#D8808E');
  const hx = flip ? x - 6 : x + 3;
  rect(c, hx, y - 2, 3, 3, '#F2A0B0'); rect(c, flip ? hx - 1 : hx + 3, y - 1, 1, 2, '#D8808E'); rect(c, hx + 1, y - 3, 1, 1, '#D8808E');
  rect(c, x - 3, y + 2, 1, 2, '#D8808E'); rect(c, x + 2, y + 2, 1, 2, '#D8808E');
}
export function hen(c, x, y, brown) {
  rect(c, x - 1, y + 2, 4, 1, SH);
  rect(c, x - 1, y - 1, 4, 3, brown ? '#A8562A' : '#FFF8EC'); rect(c, x + 2, y - 3, 2, 2, brown ? '#A8562A' : '#FFF8EC');
  rect(c, x + 2, y - 4, 1, 1, '#D0302A'); rect(c, x + 4, y - 2, 1, 1, '#F2A030'); rect(c, x, y + 2, 1, 1, '#F2A030');
}
export function tractor(c, x, y, flip) {
  const f = flip ? -1 : 1, X = (d) => x + d * f;
  oval(c, x, y + 3, 10, 2, SH);
  rect(c, Math.min(X(-7), X(5)), y - 7, 13, 6, '#C8402F'); rect(c, Math.min(X(-7), X(-1)), y - 13, 7, 7, '#C8402F');
  rect(c, Math.min(X(-6), X(-2)), y - 12, 5, 4, '#9CCBE8'); rect(c, X(4), y - 11, 1, 4, INK);
  disc(c, X(-5), y - 1, 4, INK); disc(c, X(-5), y - 1, 2, '#F2B63C');
  disc(c, X(5), y, 2, INK); rect(c, X(5), y, 1, 1, '#F2B63C');
}
export function scarecrow(c, x, y) {
  rect(c, x, y - 12, 1, 13, '#6B3E26'); rect(c, x - 5, y - 9, 11, 1, '#6B3E26');
  rect(c, x - 3, y - 9, 7, 6, '#3E6A8E'); rect(c, x - 1, y - 15, 3, 3, '#F2D888');
  rect(c, x - 3, y - 16, 7, 1, '#6B3E26'); rect(c, x - 2, y - 18, 5, 2, '#6B3E26');
  rect(c, x - 6, y - 9, 1, 2, '#F2D888'); rect(c, x + 6, y - 9, 1, 2, '#F2D888');
}

// ---------- moor ----------
export function gorse(c, x, y, rng) {
  oval(c, x + 2, y + 2, 6, 2, SH);
  disc(c, x, y - 3, 4, '#2E4A2A'); disc(c, x - 3, y - 1, 3, '#2E4A2A'); disc(c, x + 3, y - 1, 3, '#3A5A30');
  for (let i = 0; i < 7; i++) rect(c, x + rng.range(-5, 5), y + rng.range(-6, 1), 1, 1, rng.pick(['#F2C030', '#FFE070']));
}
export function heather(c, x, y, rng) {
  for (let i = 0; i < 6; i++) rect(c, x + rng.range(-4, 4), y + rng.range(-2, 2), 2, 1, rng.pick(['#8E5A86', '#A86A9A', '#C890B8']));
}
export function boulder(c, x, y, s = 1) {
  oval(c, x + 2, y + 2, Math.round(8 * s), 3, SH);
  oval(c, x, y - 2, Math.round(8 * s), Math.round(5 * s), '#7A7466'); oval(c, x - 1, y - 3, Math.round(6 * s), Math.round(3 * s), '#9A9282');
  rect(c, x - 3 * s, y - 5 * s, 3, 1, '#C0B8A6'); rect(c, x + 2, y - 2, 2, 1, '#B8C060');
}
export function tor(c, x, y) {
  oval(c, x + 3, y + 2, 16, 4, SH);
  rect(c, x - 14, y - 6, 28, 7, '#7A7466'); rect(c, x - 10, y - 12, 20, 6, '#8A8476'); rect(c, x - 6, y - 17, 12, 5, '#9A9282');
  for (const [dy, w] of [[-6, 28], [-12, 20], [-17, 12]]) rect(c, x - w / 2, y + dy, w, 1, '#B8B0A0');
  rect(c, x - 4, y - 9, 1, 3, '#5A5448'); rect(c, x + 7, y - 4, 1, 4, '#5A5448');
}
export function stoneWall(c, x, y, n, rng) {
  rect(c, x + 1, y + 3, n * 4, 2, SH);
  for (let i = 0; i < n; i++) {
    const g = rng.pick(['#8A8476', '#9A9282', '#7A7466']);
    rect(c, x + i * 4, y - 2, 4, 5, g); rect(c, x + i * 4, y - 2, 4, 1, shade(g, 1.2)); rect(c, x + i * 4 + 3, y - 1, 1, 4, shade(g, 0.8));
  }
}
export function pony(c, x, y, flip) {
  oval(c, x, y + 6, 7, 1, SH);
  rect(c, x - 5, y - 2, 10, 5, '#7A4A2A'); rect(c, x - 5, y + 3, 1, 3, '#5A3420'); rect(c, x - 2, y + 3, 1, 3, '#5A3420'); rect(c, x + 2, y + 3, 1, 3, '#5A3420'); rect(c, x + 4, y + 3, 1, 3, '#5A3420');
  const hx = flip ? x - 8 : x + 4;
  rect(c, hx, y - 6, 4, 5, '#7A4A2A'); rect(c, flip ? hx : hx + 2, y - 7, 2, 1, '#3A2418'); rect(c, flip ? hx + 3 : hx, y - 5, 1, 4, '#3A2418');
  rect(c, flip ? x + 5 : x - 6, y - 1, 1, 4, '#3A2418');
}
export function cairn(c, x, y) {
  oval(c, x + 1, y + 1, 5, 1, SH);
  rect(c, x - 4, y - 2, 8, 3, '#8A8476'); rect(c, x - 3, y - 5, 6, 3, '#9A9282'); rect(c, x - 2, y - 7, 4, 2, '#A8A090'); rect(c, x - 1, y - 9, 2, 2, '#B8B0A0');
}

// ---------- village ----------
const WALLS = ['#F2E6CC', '#F2D4C4', '#F2E2A8', '#E8E2D8'];
const ROOFS = [['#C89A54', 'thatch'], ['#5A5A6A', 'slate'], ['#B8553A', 'tile']];
export function house(c, x, y, rng, opts = {}) {
  const w = opts.w || 30, X = Math.round(x - w / 2), Y = Math.round(y - 26);
  const wall = opts.wall || rng.pick(WALLS), [roof, kind] = opts.roof || rng.pick(ROOFS);
  rect(c, X + 2, Y + 26, w, 3, SH);
  rect(c, X, Y + 11, w, 15, wall); rect(c, X, Y + 24, w, 2, shade(wall, 0.8));
  for (let j = 0; j < 5; j++) {
    const inset = (5 - j) * 1.2;
    rect(c, X - 3 + inset, Y + j * 2.4, w + 6 - inset * 2, 3, j % 2 ? roof : shade(roof, 0.9));
    if (kind === 'thatch') for (let k = 0; k < w; k += 3) rect(c, X - 1 + inset + k, Y + j * 2.4 + 2, 1, 1, shade(roof, 0.75));
    if (kind === 'slate') rect(c, X - 3 + inset, Y + j * 2.4 + 2, w + 6 - inset * 2, 1, shade(roof, 0.8));
  }
  rect(c, X - 3, Y + 11, w + 6, 1, shade(roof, 0.65));
  rect(c, X + w - 8, Y - 4, 4, 6, '#9A6A54'); rect(c, X + w - 9, Y - 5, 6, 1, '#7A4A3A');
  const door = rng.pick(['#3E7A5E', '#3E5A8E', '#B8402E', '#6B3E26']);
  rect(c, X + w / 2 - 3, Y + 16, 6, 10, shade(door, 0.7)); rect(c, X + w / 2 - 2, Y + 17, 4, 9, door); rect(c, X + w / 2 + 1, Y + 21, 1, 1, '#F2B63C');
  for (const wx of [X + 3, X + w - 9]) {
    rect(c, wx - 1, Y + 14, 7, 6, '#5A3622'); rect(c, wx, Y + 15, 5, 4, opts.lit ? '#FFD48A' : '#9CCBE8'); rect(c, wx + 2, Y + 15, 1, 4, '#5A3622');
    for (let i = 0; i < 3; i++) rect(c, wx + i * 2, Y + 20, 1, 1, rng.pick(['#F2A0B8', '#E8603A', '#FFF4DC', '#FFD45E']));
  }
  return { X, Y, w };
}
export function tearoom(c, x, y, rng) {
  const { X, Y, w } = house(c, x, y, rng, { w: 36, wall: '#F2E6CC', roof: ['#B8553A', 'tile'], lit: true });
  for (let i = 0; i < w; i += 3) rect(c, X + i, Y + 11, 3, 3, (i / 3) % 2 ? '#FFF4DC' : '#C8402F');
  rect(c, X, Y + 14, w, 1, 'rgba(20,10,10,0.25)');
  rect(c, X + w + 2, Y + 10, 1, 16, '#5A3622'); rect(c, X + w - 3, Y + 10, 10, 7, '#FFF4DC'); rect(c, X + w - 3, Y + 10, 10, 1, INK);
  rect(c, X + w, Y + 12, 4, 3, '#8E3E6E'); rect(c, X + w + 4, Y + 13, 1, 1, '#8E3E6E');
  // a table outside with two chairs
  const tx = X + w / 2 + 14, ty = Y + 31;
  rect(c, tx - 4, ty + 3, 9, 1, SH);
  rect(c, tx - 4, ty - 2, 8, 3, '#FFF4DC'); rect(c, tx - 1, ty + 1, 2, 3, '#5A3622');
  rect(c, tx - 7, ty - 1, 2, 4, '#6B3E26'); rect(c, tx + 5, ty - 1, 2, 4, '#6B3E26');
  rect(c, tx - 2, ty - 3, 2, 1, '#8E3E6E');
}
export function picket(c, x, y, n) {
  rect(c, x, y + 3, n * 3, 1, SH);
  for (let i = 0; i < n; i++) { rect(c, x + i * 3, y - 4, 2, 6, '#FFF8EC'); rect(c, x + i * 3, y - 4, 2, 1, '#E0D6C6'); }
  rect(c, x, y - 2, n * 3 - 1, 1, '#E0D6C6');
}
export function lamppost(c, x, y, lit = true) {
  if (lit) disc(c, x, y - 15, 5, 'rgba(255,212,138,0.25)');
  rect(c, x + 1, y + 1, 3, 1, SH);
  rect(c, x, y - 14, 1, 15, INK); rect(c, x - 1, y, 3, 1, INK);
  rect(c, x - 2, y - 17, 5, 1, INK); rect(c, x - 1, y - 16, 3, 2, lit ? '#FFE9A8' : '#9CCBE8'); rect(c, x - 2, y - 14, 5, 1, INK);
}
export function hedge(c, x, y, w) {
  rect(c, x + 1, y + 2, w, 2, SH);
  rect(c, x, y - 5, w, 7, '#3E6A34'); rect(c, x + 1, y - 6, w - 2, 1, '#4E7E3E'); rect(c, x + 1, y - 5, w - 2, 2, '#5E9A4E');
  for (let i = 2; i < w - 1; i += 4) rect(c, x + i, y - 2, 1, 1, '#2E5A2A');
}
export function cat(c, x, y, ginger) {
  const col = ginger ? '#E8862E' : '#2B2A30';
  rect(c, x - 2, y - 2, 4, 3, col); rect(c, x + 1, y - 4, 3, 3, col); rect(c, x + 1, y - 5, 1, 1, col); rect(c, x + 3, y - 5, 1, 1, col);
  rect(c, x - 4, y - 3, 2, 1, col); rect(c, x - 4, y - 4, 1, 1, col); rect(c, x + 2, y - 3, 1, 1, '#9AD06A');
}
export function cottageGarden(c, x, y, rng) {
  for (let i = 0; i < 9; i++) rect(c, x + rng.range(-7, 7), y + rng.range(-3, 3), 1, 1, rng.pick(['#F2A0B8', '#E8603A', '#FFF4DC', '#FFD45E', '#B8A0E8']));
  for (let i = 0; i < 5; i++) rect(c, x + rng.range(-7, 7), y + rng.range(-2, 3), 1, 2, '#4E8A3A');
}

// ---------- churchyard ----------
export function church(c, x, y) {
  const X = Math.round(x - 22), Y = Math.round(y - 30), st = '#A8A090', sd = '#8A8272';
  rect(c, X + 3, Y + 30, 46, 3, SH);
  rect(c, X + 12, Y + 12, 32, 18, st);
  for (let j = 0; j < 18; j += 3) for (let i = (j / 3) % 2 * 3; i < 32; i += 6) rect(c, X + 12 + i, Y + 12 + j, 1, 3, sd);
  for (let j = 0; j < 5; j++) { const inset = (5 - j) * 1.2; rect(c, X + 9 + inset, Y + 2 + j * 2, 38 - inset * 2, 2, j % 2 ? '#5A5A6A' : '#4E4E5E'); }
  rect(c, X + 9, Y + 12, 38, 1, '#3E3E4E');
  for (const wx of [X + 24, X + 35]) { rect(c, wx, Y + 16, 4, 7, '#5A7AA0'); rect(c, wx + 1, Y + 15, 2, 1, '#5A7AA0'); rect(c, wx + 1, Y + 18, 2, 1, '#9CCBE8'); }
  // tower and spire
  rect(c, X, Y - 2, 14, 32, st); rect(c, X + 13, Y - 2, 1, 32, sd);
  for (let j = 0; j < 32; j += 4) rect(c, X, Y - 2 + j, 14, 1, sd);
  rect(c, X - 1, Y - 3, 16, 2, '#C0B8A6');
  tri(c, X + 7, Y - 22, 7, 19, '#5A5A6A'); tri(c, X + 6, Y - 18, 3, 14, '#6E6E7E');
  rect(c, X + 7, Y - 27, 1, 5, '#F2B63C'); rect(c, X + 5, Y - 25, 5, 1, '#F2B63C');
  rect(c, X + 4, Y + 6, 6, 5, INK); disc(c, X + 7, Y + 8, 2, '#F5EBDA'); rect(c, X + 7, Y + 7, 1, 2, INK);
  rect(c, X + 4, Y + 20, 6, 10, '#5A3622'); rect(c, X + 5, Y + 19, 4, 1, '#5A3622'); rect(c, X + 5, Y + 21, 4, 9, '#7A4E32');
}
export function gravestone(c, x, y, kind) {
  rect(c, x - 2, y + 1, 7, 1, SH);
  if (kind === 'cross') { rect(c, x, y - 8, 2, 9, '#A8A090'); rect(c, x - 2, y - 6, 6, 2, '#A8A090'); rect(c, x, y - 8, 1, 8, '#C0B8A6'); return; }
  const tilt = kind === 'tilt' ? 1 : 0;
  rect(c, x - 2 + tilt, y - 7, 5, 8, '#9A9282'); rect(c, x - 1 + tilt, y - 8, 3, 1, '#9A9282');
  rect(c, x - 1 + tilt, y - 5, 3, 1, '#7A7466'); rect(c, x - 1 + tilt, y - 3, 3, 1, '#7A7466');
  rect(c, x - 2 + tilt, y - 7, 1, 7, '#B8B0A0'); rect(c, x + 2 + tilt, y - 1, 1, 1, '#B8C060');
}
export function yew(c, x, y, rng) {
  oval(c, x + 2, y + 2, 9, 3, SH);
  rect(c, x - 1, y - 4, 3, 5, '#4A2E1C');
  disc(c, x, y - 11, 8, shade(TREE_SETS.yew[0], 0.6)); disc(c, x, y - 11, 7, TREE_SETS.yew[0]); disc(c, x - 1, y - 12, 5, TREE_SETS.yew[1]);
  disc(c, x - 3, y - 14, 2, TREE_SETS.yew[2]); rect(c, x + 2, y - 9, 1, 1, '#C8402F'); rect(c, x - 4, y - 8, 1, 1, '#C8402F');
}
export function lychgate(c, x, y) {
  rect(c, x - 11, y + 1, 24, 2, SH);
  rect(c, x - 10, y - 9, 2, 10, '#6B3E26'); rect(c, x + 9, y - 9, 2, 10, '#6B3E26');
  for (let j = 0; j < 4; j++) rect(c, x - 13 + j, y - 13 + j, 27 - j * 2, 1, j % 2 ? '#5A5A6A' : '#4E4E5E');
  rect(c, x - 13, y - 10, 27, 1, '#3E3E4E');
}
export function crow(c, x, y) {
  rect(c, x, y, 3, 2, '#1E1A22'); rect(c, x + 2, y - 1, 2, 2, '#1E1A22'); rect(c, x + 4, y, 1, 1, '#5A5A6A');
}

// ---------- village green ----------
export function bandstand(c, x, y) {
  oval(c, x + 2, y + 3, 16, 4, SH);
  oval(c, x, y, 15, 5, '#E8DCC4'); oval(c, x, y - 1, 15, 5, '#F5EBDA'); rect(c, x - 15, y - 1, 31, 2, '#C8BCA0');
  for (const dx of [-13, -7, 0, 7, 13]) rect(c, x + dx, y - 15, 1, 14, '#FFF8EC');
  rect(c, x - 14, y - 6, 29, 1, '#FFF8EC');
  for (let j = 0; j < 8; j++) {
    const w = 3 + j * 2;
    for (let i = -w; i <= w; i++) rect(c, x + i, y - 24 + j, 1, 1, Math.floor((i + 40) / 3) % 2 ? '#C8402F' : '#FFF4DC');
  }
  rect(c, x - 18, y - 16, 37, 1, '#8E2A28');
  rect(c, x, y - 29, 1, 5, INK); rect(c, x + 1, y - 29, 3, 2, '#F2B63C');
}
export function pond(c, x, y, rx, ry, rng) {
  oval(c, x, y, rx + 2, ry + 2, '#6E8A44'); oval(c, x, y, rx + 1, ry + 1, '#7A6A42');
  oval(c, x, y, rx, ry, '#2E5A7A'); oval(c, x - 1, y - 1, rx - 2, ry - 2, '#3E7AA0');
  for (let i = 0; i < rx; i++) rect(c, x + rng.range(-rx + 3, rx - 4), y + rng.range(-ry + 2, ry - 2), 3, 1, '#9CCBE8');
}
export function bench(c, x, y) {
  rect(c, x - 6, y + 1, 13, 1, SH);
  rect(c, x - 6, y - 5, 12, 2, '#9A6438'); rect(c, x - 6, y - 2, 12, 2, '#B07A48'); rect(c, x - 6, y - 5, 12, 1, '#C89A64');
  rect(c, x - 5, y, 1, 2, INK); rect(c, x + 4, y, 1, 2, INK);
}
export function bunting(c, x1, x2, y, rng) {
  rect(c, x1, y - 16, 1, 17, '#6B3E26'); rect(c, x2, y - 16, 1, 17, '#6B3E26');
  const cols = ['#C8402F', '#F2B63C', '#3E7AA0', '#FFF4DC', '#5E9A52'];
  for (let x = x1 + 1, k = 0; x < x2 - 2; x += 4, k++) {
    const sag = Math.round(Math.sin(((x - x1) / (x2 - x1)) * Math.PI) * 4);
    rect(c, x, y - 15 + sag, 4, 1, '#5A3622');
    const col = cols[k % cols.length];
    rect(c, x, y - 14 + sag, 3, 1, col); rect(c, x + 1, y - 13 + sag, 1, 1, col);
  }
}
export function bonfire(c, x, y) {
  oval(c, x + 1, y + 2, 9, 2, SH);
  for (let i = -7; i <= 7; i += 2) { const h = 12 - Math.abs(i); rect(c, x + i * 0.6, y - h, 1, h, i % 4 ? '#7A4E32' : '#5A3622'); }
  rect(c, x - 8, y - 1, 16, 2, '#6B3E26'); rect(c, x - 1, y - 14, 2, 3, '#7A4E32');
}
export function maypole(c, x, y) {
  rect(c, x + 1, y + 1, 4, 1, SH);
  rect(c, x, y - 26, 1, 27, '#FFF8EC'); rect(c, x - 1, y - 27, 3, 1, '#F2B63C');
  const cols = ['#C8402F', '#3E7AA0', '#F2B63C', '#5E9A52'];
  cols.forEach((col, k) => { for (let j = 0; j < 12; j++) rect(c, x + (k < 2 ? -1 : 1) * Math.round(j * (0.4 + k * 0.2)), y - 25 + j * 2, 1, 1, col); });
}

// ---------- town ----------
const FRONTS = ['#3E6A8E', '#8E3E6E', '#3E7A5E', '#B8402E', '#2B4A5E', '#C8902E'];
export function shop(c, x, y, rng, kind) {
  const w = 26, X = Math.round(x - w / 2), Y = Math.round(y - 34);
  const brick = rng.pick(['#B86A4E', '#C8846A', '#A8A090', '#D8C8A8']);
  rect(c, X + 2, Y + 34, w, 3, SH);
  rect(c, X, Y + 4, w, 30, brick);
  for (let j = 6; j < 18; j += 3) for (let i = (j % 2) * 2; i < w; i += 5) rect(c, X + i, Y + j, 3, 1, shade(brick, 0.88));
  rect(c, X - 1, Y, w + 2, 4, '#5A5A6A'); rect(c, X - 1, Y + 3, w + 2, 1, '#3E3E4E');
  rect(c, X + 3, Y + 7, 7, 7, '#F5EBDA'); rect(c, X + 4, Y + 8, 5, 5, '#9CCBE8'); rect(c, X + 16, Y + 7, 7, 7, '#F5EBDA'); rect(c, X + 17, Y + 8, 5, 5, '#9CCBE8');
  const front = rng.pick(FRONTS);
  rect(c, X, Y + 17, w, 17, front); rect(c, X, Y + 17, w, 3, shade(front, 0.75));
  for (let i = 3; i < w - 3; i += 4) rect(c, X + i, Y + 18, 2, 1, '#F2D888');
  // awning
  for (let i = 0; i < w; i += 2) rect(c, X + i, Y + 20, 2, 3, (i / 2) % 2 ? '#FFF4DC' : shade(front, 1.25));
  rect(c, X + 2, Y + 24, 14, 9, '#5A3622'); rect(c, X + 3, Y + 25, 12, 8, '#9CCBE8');
  if (kind === 'books') for (let i = 0; i < 11; i += 2) rect(c, X + 3 + i, Y + 29 - (i % 3), 2, 4 + (i % 3), rng.pick(['#C8402F', '#3E5A8E', '#F2B63C', '#5E9A52', '#8E3E6E']));
  else if (kind === 'bakery') for (let i = 0; i < 4; i++) oval(c, X + 5 + i * 3, Y + 31, 1, 1, '#C8904A');
  else if (kind === 'grocer') { for (let i = 0; i < 12; i++) rect(c, X + 3 + i, Y + 31, 1, 2, rng.pick(['#D0302A', '#F2B63C', '#5E9A52', '#E8862E'])); rect(c, X + 3, Y + 33, 12, 1, '#B07A3E'); }
  else rect(c, X + 5, Y + 30, 6, 3, '#F5EBDA');
  rect(c, X + 18, Y + 24, 6, 10, shade(front, 0.6)); rect(c, X + 19, Y + 25, 4, 9, shade(front, 0.85)); rect(c, X + 22, Y + 29, 1, 1, '#F2B63C');
}
export function postbox(c, x, y) {
  rect(c, x - 1, y + 1, 5, 1, SH);
  rect(c, x - 2, y - 8, 5, 9, '#C8302A'); rect(c, x - 2, y - 9, 5, 1, '#A82018'); rect(c, x - 1, y - 6, 3, 1, INK); rect(c, x - 2, y, 5, 1, INK);
}
export function phonebox(c, x, y) {
  rect(c, x - 3, y + 1, 9, 2, SH);
  rect(c, x - 4, y - 16, 8, 17, '#C8302A'); rect(c, x - 4, y - 17, 8, 1, '#A82018');
  for (let j = 0; j < 3; j++) rect(c, x - 3, y - 13 + j * 4, 6, 3, '#9CCBE8');
  rect(c, x - 3, y - 15, 6, 1, '#F5EBDA');
}
export function planter(c, x, y, rng) {
  rect(c, x - 4, y + 1, 9, 1, SH);
  rect(c, x - 4, y - 3, 8, 4, '#6B3E26'); rect(c, x - 4, y - 3, 8, 1, '#8A5A34');
  for (let i = 0; i < 6; i++) rect(c, x - 4 + rng.range(0, 7), y - 6 + rng.range(0, 3), 1, 1, rng.pick(['#E8603A', '#F2A0B8', '#FFD45E', '#5E9A52']));
}
