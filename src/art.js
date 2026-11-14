// Code-drawn pixel art: scenery, animals and walker sprites (top-down, art-pixel scale).
import { rect, disc, oval, tri, sprite, shade } from './pixel.js';

export const TREE_SETS = {
  orange: ['#B8462A', '#E8662E', '#FF9A44', '#FFD08A'],
  gold: ['#B07A1E', '#E8AE30', '#FFD45E', '#FFF0A0'],
  red: ['#8E2A28', '#C83A2E', '#E8664A', '#FF9A7A'],
  green: ['#2E5A3C', '#3F7A4E', '#5E9A62', '#9CCB82'],
  lime: ['#4A7A2E', '#6A9E3A', '#8CC04E', '#C0E080'],
  plum: ['#7A2E4A', '#A83E5E', '#D06080', '#F09AB0'],
};
const SHADOW = 'rgba(20,10,10,0.28)';

function canopy(c, lobes, set, rng) {
  const [d, m, h, hh] = set;
  const o = shade(d, 0.55);
  for (const [x, y, r] of lobes) disc(c, x, y, r + 1, o);
  for (const [x, y, r] of lobes) disc(c, x, y, r, d);
  for (const [x, y, r] of lobes) disc(c, x - 1, y - 1, r - 2, m);
  for (const [x, y, r] of lobes) {
    disc(c, x - r * 0.35, y - r * 0.4, Math.max(1, r * 0.3), h);
    rect(c, x - r * 0.5, y - r * 0.6, 1, 1, hh);
    rect(c, x + rng.range(-r * 0.3, r * 0.5), y + rng.range(0, r * 0.5), 2, 1, d);
    rect(c, x + rng.range(-r * 0.6, r * 0.2), y + rng.range(-r * 0.2, r * 0.3), 1, 1, h);
  }
}

export function tree(c, x, y, setName, s, rng) {
  const set = TREE_SETS[setName];
  const r = Math.round(7 * s);
  oval(c, x + 3, y + 2, r + 4, Math.max(2, Math.round(r / 3)), SHADOW);
  rect(c, x - 2, y - 5, 4, 7, '#4A2E1C');
  rect(c, x - 1, y - 4, 1, 5, '#7A4E32');
  rect(c, x - 4, y + 1, 3, 1, '#4A2E1C'); rect(c, x + 2, y + 1, 3, 1, '#4A2E1C');
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

export function fence(c, x, y, n) {
  for (let i = 0; i < n; i++) { rect(c, x + i * 8, y, 2, 7, '#9A6438'); rect(c, x + i * 8, y, 2, 1, '#C89A64'); }
  rect(c, x - 1, y + 2, n * 8 - 5, 1, '#B07A48'); rect(c, x - 1, y + 4, n * 8 - 5, 1, '#B07A48');
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

export function gate(c, x, y) {
  rect(c, x - 14, y - 3, 2, 9, '#6B3E26'); rect(c, x + 12, y - 3, 2, 9, '#6B3E26');
  for (let i = 0; i < 3; i++) rect(c, x - 12, y - 1 + i * 2, 11, 1, '#E8C08A');
  rect(c, x - 12, y - 1, 1, 5, '#E8C08A'); rect(c, x - 2, y - 1, 1, 5, '#E8C08A');
  fence(c, x - 46, y - 1, 4); fence(c, x + 16, y - 1, 4);
}

export function cottage(c, x, y, rng) {
  // x, y = centre of the front step
  const w = 46, X = Math.round(x - w / 2), Y = Math.round(y - 34);
  rect(c, X + 3, Y + 34, w, 4, SHADOW);
  rect(c, X, Y + 14, w, 20, '#F2E6CC');
  rect(c, X, Y + 30, w, 4, '#9A9282');
  [0, 15, 30, w - 2].forEach((bx) => rect(c, X + bx, Y + 14, 2, 17, '#5A3622'));
  rect(c, X, Y + 14, w, 2, '#5A3622');
  const roof = '#B8553A', rd = shade(roof, 0.75), rl = shade(roof, 1.2);
  for (let j = 0; j < 5; j++) {
    const inset = (5 - j) * 1.5;
    rect(c, X - 4 + inset, Y + j * 3, w + 8 - inset * 2, 3, j % 2 ? roof : shade(roof, 0.9));
    rect(c, X - 4 + inset, Y + j * 3 + 2, w + 8 - inset * 2, 1, rd);
    for (let k = 0; k < 10; k++) rect(c, X - 2 + inset + k * 5 + (j % 2 ? 2 : 0), Y + j * 3, 1, 2, rd);
  }
  rect(c, X + 3, Y - 1, w - 6, 1, rl);
  rect(c, X + w - 14, Y - 7, 5, 9, '#9A9282'); rect(c, X + w - 15, Y - 8, 7, 2, '#7A7262');
  for (const wx of [X + 4, X + w - 12]) {
    rect(c, wx - 1, Y + 18, 10, 8, '#5A3622'); rect(c, wx, Y + 19, 8, 6, '#FFD48A'); rect(c, wx + 3, Y + 19, 1, 6, '#5A3622');
    rect(c, wx - 1, Y + 26, 10, 2, '#6B3E26');
    for (let i = 0; i < 4; i++) rect(c, wx + i * 2, Y + 25, 1, 1, rng.pick(['#F2A0B8', '#E8603A', '#FFF4DC', '#FFD45E']));
  }
  rect(c, X + w / 2 - 4, Y + 19, 9, 13, '#5A3622'); rect(c, X + w / 2 - 3, Y + 20, 7, 12, '#3E7A5E'); rect(c, X + w / 2 + 2, Y + 26, 1, 1, '#F2B63C');
  rect(c, X + w / 2 - 5, Y + 32, 11, 2, '#C8C0B0');
}

export function signpost(c, x, y, n, numberFn) {
  rect(c, x + 1, y + 1, 3, 1, SHADOW);
  rect(c, x, y - 10, 2, 11, '#6B3E26');
  rect(c, x - 7, y - 16, 16, 8, '#2B1D24'); rect(c, x - 6, y - 15, 14, 6, '#FFF4DC');
  const w = String(n).length * 4 - 1;
  numberFn(c, n, x + 1 - Math.floor(w / 2), y - 15 + 0.5, '#2B1D24');
}

// ---------- walker sprites (10 x 20) ----------
const BODY = ['..oKKKKo..', '.oKKKKKKo.', 'oCCKKCCCCo', 'oCCKKCCCCo', 'oCCCCCCCCo', 'oCcCCCCcCo', 'oCcCCCCcCo', 'oCCCCCCCCo', '.oCCCCCCo.', '..oLLLLo..', '..oLooLo..', '..oLooLo..', '.oBBooBBo.'];
const HEADS = {
  bobble: ['...oPPo...', '..oHHHHo..', '.oHHHHHHo.', '.oHHHHHHo.', '.oSSSSSSo.', '.oSoSSoSo.', '.oSSSSSSo.'],
  bun: ['....oo....', '...oGGo...', '..oGGGGo..', '.oGGGGGGo.', '.oGSSSSGo.', '.oSoSSoSo.', '.oSSSSSSo.'],
};
const BASE = { o: '#2B1D24', S: '#F0C8A0', L: '#3A2433', B: '#6B3E26' };
export const WALKERS = {
  p: { rows: [...HEADS.bobble, ...BODY], pal: { ...BASE, H: '#E8603A', P: '#FFF4DC', K: '#C83A2E', C: '#F2B63C', c: '#C98E22' } },
  c: { rows: [...HEADS.bun, ...BODY], pal: { ...BASE, G: '#C9C2CC', K: '#F2B63C', C: '#8E3E6E', c: '#6E2E56' } },
};
export function walker(c, who, x, y, bob = 0) {
  // (x, y) = feet centre
  const w = WALKERS[who];
  oval(c, x, y, 5, 1, SHADOW);
  sprite(c, w.rows, w.pal, x - 5, y - 20 - bob);
}
