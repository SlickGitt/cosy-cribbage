// Code-drawn pixel art: scenery, animals and walker sprites (top-down, art-pixel scale).
import { rect, disc, oval, tri, sprite, shade, mix } from './pixel.js';

// English autumn: mostly green still, turning olive, ochre, bronze and copper.
export const TREE_SETS = {
  oak: ['#34452A', '#4C6234', '#6C8244', '#A2AE68'],
  oakturn: ['#6A5420', '#94762A', '#BC983A', '#E2C66E'],
  beech: ['#7A3A16', '#A45222', '#CC7432', '#ECA862'],
  ash: ['#4A5A2A', '#687C34', '#92A448', '#CCD07E'],
  birch: ['#7E6420', '#A8862C', '#CCAA44', '#EED888'],
  hawthorn: ['#2E4228', '#405A34', '#58764A', '#8AA46C'],
  fieldmaple: ['#9A4A1A', '#C8682A', '#E89040', '#F8C478'],
  cherry: ['#7E2A22', '#AA3E2A', '#D0603A', '#F09A6A'],
  sycamore: ['#8A6418', '#BC8E24', '#E0B43C', '#F6DC84'],
  bracken: ['#7A3A16', '#A45422', '#CC7834', '#EAAA60'],
  green: ['#2E5A3C', '#3F7A4E', '#5E9A62', '#9CCB82'],
  lime: ['#4A6A2E', '#62883A', '#82A64C', '#B4CC78'],
  // older sets kept for the other biomes
  orange: ['#9A4A26', '#C0662E', '#DA8A44', '#F2BE84'],
  gold: ['#9A7420', '#C69A34', '#E2BE58', '#F6E09A'],
  red: ['#7E3424', '#A8442E', '#C8644A', '#E8967A'],
  plum: ['#6A3444', '#8E4656', '#B0687A', '#D49AA6'],
};
const SHADOW = 'rgba(20,10,10,0.28)';

// Lobed canopy lit from the top left: cool shadow, body, warm highlight, sparkle.
function canopy(c, lobes, set, rng) {
  const [d, m, h, hh] = set;
  const sd = mix(d, '#2A2050', 0.35), hw = mix(h, '#FFE8A0', 0.25);
  for (const [x, y, r] of lobes) disc(c, x, y, r, sd);
  for (const [x, y, r] of lobes) disc(c, x - 0.5, y - 1, r - 1, d);
  for (const [x, y, r] of lobes) disc(c, x - 1, y - 1.5, r - 2, m);
  for (const [x, y, r] of lobes) {
    disc(c, x - r * 0.38, y - r * 0.45, Math.max(1, r * 0.38), h);
    for (let k = 0; k < r; k++) { const a = rng.range(3.4, 5.6), rr = rng.range(r * 0.3, r * 0.85); rect(c, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 1, 1, hw); }
    for (let k = 0; k < r; k++) { const a = rng.range(0, 1.8), rr = rng.range(r * 0.4, r * 0.9); rect(c, x + Math.cos(a) * rr, y + Math.sin(a) * rr, rng() < 0.5 ? 2 : 1, 1, sd); }
    rect(c, x - r * 0.5, y - r * 0.6, 1, 1, hh);
  }
}

export function birch(c, x, y, s, rng) {
  const r = Math.round(5.5 * s);
  oval(c, x + 3, y + 2, r + 2, 2, SHADOW);
  rect(c, x - 1, y - 14, 3, 15, '#ECE6DA'); rect(c, x + 1, y - 14, 1, 15, '#C8C0B4');
  for (let k = 0; k < 5; k++) rect(c, x - 1 + (k % 2), y - 12 + k * 3, rng() < 0.5 ? 2 : 1, 1, '#2E2A2A');
  const j = () => rng.range(-1, 1);
  canopy(c, [[x + j(), y - 14 - r + j(), r], [x - r * 0.7, y - 11 - r * 0.4, Math.round(r * 0.7)], [x + r * 0.7, y - 12 - r * 0.5, Math.round(r * 0.7)], [x + j(), y - 16 - r * 1.4, Math.round(r * 0.6)]], TREE_SETS.birch, rng);
}

export function tree(c, x, y, setName, s, rng) {
  const set = TREE_SETS[setName];
  const r = Math.round(7 * s);
  oval(c, x + 4, y + 2, r + 4, Math.max(2, Math.round(r / 3)), SHADOW);
  rect(c, x - 2, y - 6, 4, 8, '#4A2E1C'); rect(c, x + 1, y - 6, 1, 8, '#3A2016');
  rect(c, x - 1, y - 5, 1, 6, '#8A5E3A');
  rect(c, x - 4, y + 1, 3, 1, '#4A2E1C'); rect(c, x + 2, y + 1, 3, 1, '#3A2016'); rect(c, x - 3, y, 1, 1, '#4A2E1C');
  const j = () => rng.range(-1, 1);
  canopy(c, [
    [x + j(), y - r - 3 + j(), r],
    [x - r * 0.8 + j(), y - r * 0.6 + j(), Math.round(r * 0.7)],
    [x + r * 0.8 + j(), y - r * 0.7 + j(), Math.round(r * 0.7)],
    [x - r * 0.45 + j(), y - r * 1.7 + j(), Math.round(r * 0.66)],
    [x + r * 0.5 + j(), y - r * 1.75 + j(), Math.round(r * 0.6)],
  ], set, rng);
}

const PINES = [['#1E4A3A', '#2E6A4E', '#4A8A62'], ['#24523A', '#357548', '#58985E'], ['#A8782A', '#D9A441', '#F2C766']];
export function pine(c, x, y, s, rng, autumn = false) {
  const [d, m, h] = autumn ? PINES[2] : rng.pick(PINES.slice(0, 2));
  const o = shade(d, 0.55);
  oval(c, x + 2, y + 2, Math.round(7 * s), 2, SHADOW);
  rect(c, x - 1, y - 3, 3, 5, '#4A2E1C');
  const tiers = [[9, -14, 12], [7, -21, 10], [5, -27, 8]];
  for (const [hw, top, ht] of tiers) {
    const W = Math.round(hw * s), T = Math.round(top * s), H = Math.round(ht * s);
    tri(c, x, y + T - 1, W + 1, H + 1, o);
    tri(c, x, y + T, W, H, d);
    tri(c, x - 1, y + T + 2, Math.max(1, W - 3), Math.max(1, H - 3), m);
    rect(c, x - Math.round(W * 0.4), y + T + H - 2, 1, 1, h);
  }
}

export function bush(c, x, y, setName, rng, berry) {
  const set = TREE_SETS[setName];
  oval(c, x + 2, y + 2, 7, 2, SHADOW);
  canopy(c, [[x, y - 3, 4], [x - 4, y - 1, 3], [x + 4, y - 1, 3]], set, rng);
  if (berry) for (let i = 0; i < 4; i++) rect(c, x + rng.range(-6, 5), y + rng.range(-6, 1), 1, 1, berry);
}

export function flowers(c, x, y, rng) {
  const col = rng.pick(['#FFF4DC', '#F2A0B8', '#FFD45E', '#B8A0E8', '#E8603A']);
  for (let i = 0; i < 4; i++) rect(c, x + rng.range(-4, 4), y + rng.range(-2, 2), 1, 1, col);
  rect(c, x, y + 2, 1, 2, '#4E8A3A');
}

export function rock(c, x, y) {
  oval(c, x + 1, y + 2, 5, 2, SHADOW);
  oval(c, x, y, 5, 3, '#8A8272'); oval(c, x - 1, y - 1, 3, 2, '#A8A090'); rect(c, x - 2, y - 2, 2, 1, '#D0C8B8');
}

export function log(c, x, y) {
  rect(c, x + 1, y + 4, 18, 2, SHADOW);
  rect(c, x, y, 18, 5, '#7A4E32'); rect(c, x, y + 1, 18, 1, '#9A6A44'); rect(c, x + 17, y, 2, 5, '#E8C08A');
  rect(c, x + 3, y - 1, 4, 1, '#6E9A3A'); rect(c, x + 10, y - 1, 2, 1, '#D0302A');
}

export function stump(c, x, y) {
  oval(c, x + 1, y + 3, 5, 2, SHADOW);
  rect(c, x - 3, y - 1, 7, 4, '#6A4426'); oval(c, x, y - 1, 3, 2, '#E8C08A'); rect(c, x, y - 1, 1, 1, '#C89A64');
}

export function mushrooms(c, x, y, rng) {
  for (let i = 0; i < 3; i++) {
    const mx = x + i * 3 + rng.range(-1, 1), my = y + rng.range(-1, 1);
    rect(c, mx, my + 1, 1, 2, '#F5EBDA'); rect(c, mx - 1, my, 3, 1, '#D0302A'); rect(c, mx, my, 1, 1, '#FFFFFF');
  }
}

export function fern(c, x, y) {
  [[-3, -1, 2, '#3E7A34'], [-2, -3, 4, '#4E8A3A'], [0, -4, 5, '#6AA84A'], [2, -3, 4, '#4E8A3A'], [3, -1, 2, '#3E7A34']]
    .forEach(([dx, dy, h, col]) => rect(c, x + dx, y + dy, 1, h, col));
}

export function hay(c, x, y) {
  rect(c, x + 1, y + 7, 14, 2, SHADOW);
  rect(c, x, y, 14, 8, '#E8C86A'); rect(c, x, y + 2, 14, 1, '#C8A04A'); rect(c, x, y + 5, 14, 1, '#C8A04A'); rect(c, x + 2, y, 4, 1, '#FFF0A0');
}

// A short run of dry stone wall, n stones long, starting at (x, y).
export function fence(c, x, y, n) {
  const W = n * 8 - 2;
  rect(c, x + 1, y + 7, W, 2, SHADOW);
  rect(c, x, y + 1, W, 6, '#857C6C');
  for (let j = 0; j < 3; j++) for (let i = (j % 2) * 2; i < W; i += 4) {
    const g = ['#A49C8A', '#958D7C', '#B2AA98'][(i + j) % 3];
    rect(c, x + i, y + 1 + j * 2, 3, 2, g); rect(c, x + i, y + 1 + j * 2, 3, 1, mix(g, '#FFFFFF', 0.18));
  }
  for (let i = 0; i < W; i += 2) rect(c, x + i, y, 1, 1, (i / 2) % 2 ? '#7A7262' : '#958D7C');
  rect(c, x + 3, y + 2, 1, 1, '#9AAA5A'); rect(c, x + W - 5, y + 4, 2, 1, '#9AAA5A');
}

// A five-bar field gate, weathered grey wood.
export function fiveBar(c, x, y, w = 22) {
  rect(c, x + 1, y + 6, w, 1, SHADOW);
  for (let i = 0; i < 5; i++) rect(c, x, y - 6 + i * 2.4, w, 1, i === 0 ? '#C8BCA4' : '#A89A84');
  rect(c, x, y - 6, 1, 11, '#A89A84'); rect(c, x + w - 1, y - 6, 1, 11, '#A89A84');
  for (let k = 0; k < w - 2; k++) rect(c, x + 1 + k, y + 4 - Math.round((k / (w - 2)) * 9), 1, 1, '#B8AC96');
}
export function sheep(c, x, y, flip) {
  oval(c, x + 4, y + 6, 6, 1, SHADOW);
  rect(c, x, y, 9, 5, '#FFF8EC'); rect(c, x + 1, y - 1, 3, 1, '#FFF8EC'); rect(c, x + 5, y - 1, 3, 1, '#FFF8EC'); rect(c, x + 1, y + 4, 7, 1, '#E0D6C6');
  rect(c, flip ? x - 3 : x + 8, y, 3, 3, '#3A2E2E');
  rect(c, x + 1, y + 5, 1, 2, '#3A2E2E'); rect(c, x + 7, y + 5, 1, 2, '#3A2E2E');
}

export function cow(c, x, y, flip, brown) {
  const p = brown ? '#8A4A2A' : '#2B1D24';
  oval(c, x + 6, y + 9, 8, 2, SHADOW);
  rect(c, x, y, 13, 7, '#FFF8EC'); rect(c, x + 1, y, 4, 3, p); rect(c, x + 8, y + 3, 3, 3, p);
  const hx = flip ? x - 4 : x + 12;
  rect(c, hx, y - 1, 5, 5, '#FFF8EC'); rect(c, hx, y - 1, 5, 2, p); rect(c, hx + 1, y + 2, 3, 2, '#F2A0B8');
  rect(c, hx - 1, y - 2, 1, 1, '#E9DCC4'); rect(c, hx + 5, y - 2, 1, 1, '#E9DCC4');
  [1, 4, 8, 11].forEach((dx) => rect(c, x + dx, y + 7, 1, 2, '#3A2E2E'));
}

export function squirrel(c, x, y, flip) {
  const f = flip ? -1 : 1, X = (dx) => x + dx * f;
  oval(c, x, y + 4, 4, 1, SHADOW);
  rect(c, Math.min(X(-5), X(-2)), y - 4, 3, 7, '#D9702F'); rect(c, Math.min(X(-4), X(-1)), y - 6, 4, 3, '#D9702F');
  rect(c, Math.min(X(-1), X(3)), y, 4, 4, '#A8562A'); rect(c, Math.min(X(2), X(5)), y - 3, 3, 3, '#A8562A');
  rect(c, X(4), y - 2, 1, 1, '#2B1D24'); rect(c, Math.min(X(1), X(2)), y + 1, 2, 2, '#F5E0C0');
}

export function deer(c, x, y) {
  oval(c, x + 5, y + 8, 7, 2, SHADOW);
  rect(c, x, y, 10, 4, '#A86A3A'); rect(c, x + 1, y + 1, 1, 1, '#F5EBDA'); rect(c, x + 4, y + 1, 1, 1, '#F5EBDA'); rect(c, x - 1, y, 1, 2, '#F5EBDA');
  rect(c, x + 8, y - 4, 3, 5, '#A86A3A'); rect(c, x + 10, y - 5, 3, 2, '#A86A3A'); rect(c, x + 12, y - 5, 1, 1, '#2B1D24');
  rect(c, x + 9, y - 8, 1, 3, '#6B3E26'); rect(c, x + 8, y - 8, 2, 1, '#6B3E26'); rect(c, x + 11, y - 8, 1, 3, '#6B3E26'); rect(c, x + 11, y - 8, 2, 1, '#6B3E26');
  [1, 3, 7, 9].forEach((dx) => rect(c, x + dx, y + 4, 1, 4, '#7A4A2A'));
}

export function bird(c, x, y, col = '#5A3A2A') {
  rect(c, x, y, 3, 2, col); rect(c, x + 2, y - 1, 2, 2, col); rect(c, x + 4, y - 1, 1, 1, '#F2B63C');
}

// The start of the walk: an open five-bar gate between stretches of stone wall.
export function gate(c, x, y) {
  rect(c, x - 14, y - 9, 3, 15, '#6E6250'); rect(c, x + 12, y - 9, 3, 15, '#6E6250');
  rect(c, x - 14, y - 9, 3, 1, '#9A8E78'); rect(c, x + 12, y - 9, 3, 1, '#9A8E78');
  fiveBar(c, x + 15, y - 1, 20);
  fence(c, x - 50, y - 3, 5); fence(c, x + 37, y - 3, 3);
}

export function cottage(c, x, y, rng) {
  // x, y = centre of the front step
  const w = 46, X = Math.round(x - w / 2), Y = Math.round(y - 34);
  rect(c, X + 3, Y + 34, w, 4, SHADOW);
  rect(c, X, Y + 14, w, 20, '#F2E6CC');
  rect(c, X, Y + 30, w, 4, '#9A9282');
  [0, 15, 30, w - 2].forEach((bx) => rect(c, X + bx, Y + 14, 2, 17, '#5A3622'));
  rect(c, X, Y + 14, w, 2, '#5A3622');
  // thatch: thick, rounded, combed straw
  const roof = '#C49A5A', rd = shade(roof, 0.72), rl = shade(roof, 1.18);
  for (let j = 0; j < 6; j++) {
    const inset = Math.max(0, (4 - j) * 2);
    rect(c, X - 5 + inset, Y - 2 + j * 3, w + 10 - inset * 2, 3, j % 2 ? roof : shade(roof, 0.92));
    for (let k = 0; k < w + 8 - inset * 2; k += 2) rect(c, X - 4 + inset + k, Y - 2 + j * 3 + ((k / 2) % 2), 1, 2, rd);
  }
  rect(c, X - 5, Y + 15, w + 10, 2, rd);
  for (let k = 0; k < w + 10; k += 3) rect(c, X - 5 + k, Y + 16, 2, 1, shade(roof, 0.6));
  rect(c, X + 6, Y - 3, w - 12, 1, rl); rect(c, X + 2, Y - 1, w - 4, 1, rl);
  rect(c, X + w - 14, Y - 7, 5, 9, '#9A9282'); rect(c, X + w - 15, Y - 8, 7, 2, '#7A7262');
  for (const wx of [X + 4, X + w - 12]) {
    rect(c, wx - 1, Y + 18, 10, 8, '#5A3622'); rect(c, wx, Y + 19, 8, 6, '#FFD48A'); rect(c, wx + 3, Y + 19, 1, 6, '#5A3622');
    rect(c, wx - 1, Y + 26, 10, 2, '#6B3E26');
    for (let i = 0; i < 4; i++) rect(c, wx + i * 2, Y + 25, 1, 1, rng.pick(['#F2A0B8', '#E8603A', '#FFF4DC', '#FFD45E']));
  }
  rect(c, X + w / 2 - 4, Y + 19, 9, 13, '#5A3622'); rect(c, X + w / 2 - 3, Y + 20, 7, 12, '#3E7A5E'); rect(c, X + w / 2 + 2, Y + 26, 1, 1, '#F2B63C');
  rect(c, X + w / 2 - 5, Y + 32, 11, 2, '#C8C0B0');
}

// A small stone milestone with the number cut into it.
export function signpost(c, x, y, n, numberFn) {
  const w = String(n).length * 4 + 3, X = Math.round(x - w / 2);
  rect(c, X + 2, y + 1, w, 2, SHADOW);
  rect(c, X, y - 11, w, 12, '#A49C8A'); rect(c, X + 1, y - 12, w - 2, 1, '#A49C8A');
  rect(c, X, y - 11, 1, 12, '#C2BAA8'); rect(c, X + w - 1, y - 11, 1, 12, '#857C6C'); rect(c, X, y, w, 1, '#857C6C');
  rect(c, X + 1, y - 12, w - 2, 1, '#C2BAA8');
  numberFn(c, n, X + 2, y - 9, '#4A4238');
  rect(c, X + 1, y - 2, 2, 1, '#9AAA5A'); rect(c, X + w - 3, y - 1, 2, 1, '#7E8E4A');
}

// The footpath fingerpost at the start: a green arm pointing along the lane.
export function fingerpost(c, x, y, left) {
  rect(c, x + 1, y + 1, 3, 1, SHADOW);
  rect(c, x, y - 22, 2, 23, '#2E4E36'); rect(c, x, y - 22, 1, 23, '#46705A');
  const ax = left ? x - 17 : x + 2;
  rect(c, ax, y - 20, 15, 6, '#2E5E3E'); rect(c, ax, y - 20, 15, 1, '#4E8A5E');
  if (left) { rect(c, ax - 1, y - 19, 1, 4, '#2E5E3E'); rect(c, ax - 2, y - 18, 1, 2, '#2E5E3E'); }
  else { rect(c, ax + 15, y - 19, 1, 4, '#2E5E3E'); rect(c, ax + 16, y - 18, 1, 2, '#2E5E3E'); }
  for (let i = 0; i < 3; i++) rect(c, ax + 2 + i * 4, y - 18, 3, 1, '#F2EEDC');
  for (let i = 0; i < 2; i++) rect(c, ax + 3 + i * 5, y - 16, 4, 1, '#F2EEDC');
  rect(c, x - 1, y - 23, 4, 1, '#2E4E36');
}

// ---------- walker sprites live in walkers.js ----------
import { WALKERS } from './walkers.js';
export { WALKERS };

export function walker(c, who, x, y, bob = 0) {
  // (x, y) = feet centre
  const w = WALKERS[who];
  oval(c, x, y, 5, 1, SHADOW);
  sprite(c, w.rows, w.pal, x - 5, y - 20 - bob);
}

// A tuft of tall grass that sways.
export function tallGrass(c, x, y, rng, dry = false) {
  const cols = dry ? ['#B89A4A', '#D4B45C', '#8A7A3A'] : ['#4E7A34', '#6A9A3E', '#8CB84C', '#B4D268'];
  for (let i = 0; i < 6; i++) { const dx = i - 3 + rng.range(-0.4, 0.4), h = rng.int(3, 7); rect(c, x + dx, y - h, 1, h, cols[i % cols.length]); }
  if (rng() < 0.4) rect(c, x + rng.int(-2, 2), y - 8, 1, 1, rng.pick(['#FFF4DC', '#F2B63C', '#E8603A']));
}

// A clump of hedge for field edges.
export function hedgeClump(c, x, y, rng) {
  oval(c, x + 2, y + 1, 7, 2, SHADOW);
  canopy(c, [[x, y - 4, 5], [x - 4, y - 2, 4], [x + 4, y - 2, 4]], TREE_SETS[rng.pick(['hawthorn', 'hawthorn', 'fieldmaple', 'bracken', 'oakturn'])], rng);
  if (rng() < 0.6) for (let i = 0; i < 4; i++) rect(c, x + rng.range(-5, 5), y + rng.range(-7, -1), 1, 1, rng.pick(['#B82A22', '#B82A22', '#F2F0E0']));
}
