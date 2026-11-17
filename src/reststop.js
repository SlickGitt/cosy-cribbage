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
// A boat afloat on the lake, in its own patch of water that fades out.
// Styles: 'teal' painted rowing boat, 'punt' flat punt with decked ends and
// cushions, 'clinker' varnished lapped-plank rowing boat, 'dinghy' red and cream.
export function hull(c, x, y, w, h, room = 30, style = 'raft') {
  if (style === 'raft') return raft(c, x, y, w, h);
  const square = style === 'punt';
  const bow = square ? 0 : Math.max(0, Math.min(28, room - 12)), Y0 = y - 4, Y1 = y + h + 5, X1 = x + w + 4;
  const edges = (yy, ins) => {
    const top = Y0 + ins, bot = Y1 - ins;
    if (yy < top || yy > bot) return null;
    const half = (bot - top) / 2, t = Math.abs(yy + 0.5 - (top + half)) / Math.max(1, half);
    const cr = square ? 0.9 : 0.78, cs = square ? 3 : 7;
    const corner = t > cr ? cs * (1 - Math.sqrt(Math.max(0, 1 - ((t - cr) / (1 - cr)) ** 2))) : 0;
    const l = x - 3 - bow * (1 - Math.pow(t, 1.7)) + ins + corner * (bow ? 0.4 : 1), r = X1 - ins - corner;
    return [Math.round(l), Math.round(r)];
  };
  const fill = (ins, col, dy = 0) => { for (let yy = Y0 + ins; yy <= Y1 - ins; yy++) { const e = edges(yy, ins); if (e) rect(c, e[0], yy + dy, e[1] - e[0], 1, col); } };
  const band = (ins, col) => { for (let yy = Y0 + ins; yy <= Y1 - ins; yy++) { const e = edges(yy, ins), f = edges(yy, ins + 1); if (e && f) { rect(c, e[0], yy, f[0] - e[0], 1, col); rect(c, f[1], yy, e[1] - f[1], 1, col); } else if (e) rect(c, e[0], yy, e[1] - e[0], 1, col); } };
  const rows = (ins, fn) => { for (let yy = Y0 + ins; yy <= Y1 - ins; yy++) { const e = edges(yy, ins); if (e) fn(yy, e[0], e[1]); } };
  // the water
  const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let yy = Y0 - 12; yy <= Y1 + 12; yy++) {
    const outer = edges(yy, -12), mid = edges(yy, -8), inner = edges(yy, -4);
    if (!outer) continue;
    for (let xx = outer[0]; xx < outer[1]; xx++) {
      const inMid = mid && xx >= mid[0] && xx < mid[1], inIn = inner && xx >= inner[0] && xx < inner[1], th = B[(yy & 3) * 4 + (xx & 3)];
      if (!inMid && th > 5) continue;
      if (inMid && !inIn && th > 11) continue;
      rect(c, xx, yy, 1, 1, inIn ? '#2E5670' : inMid ? '#3E6A84' : '#4E7A8E');
    }
  }
  for (let i = 0; i < (w + h) / 3; i++) {
    const side = i % 4, k = (i * 37) % 100 / 100;
    const px = side < 2 ? x - bow + k * (w + bow) : side === 2 ? x - bow * 0.6 - 8 : X1 + 4;
    const py = side === 0 ? Y0 - 5 - (i % 3) : side === 1 ? Y1 + 4 + (i % 3) : Y0 + k * (Y1 - Y0);
    rect(c, Math.round(px), Math.round(py), 2 + (i % 3), 1, i % 2 ? '#8CB8D4' : '#B8D8EC');
  }
  for (const [px, py] of [[X1 + 6, Y0 + 6], [x + w * 0.3, Y1 + 8], [x - bow * 0.4 - 4, Y1 + 2]]) { oval(c, Math.round(px), Math.round(py), 3, 2, '#4E8A3A'); rect(c, Math.round(px), Math.round(py) - 1, 2, 1, '#3E6A84'); }
  fill(-1, 'rgba(10,20,30,0.35)', 3);
  const lock = (col) => { for (const ox of [x + Math.round(w * 0.4), x + Math.round(w * 0.6)]) { rect(c, ox, Y0, 3, 2, col); rect(c, ox, Y1 - 1, 3, 2, col); } };
  const seats = (col, hi, cushion) => {
    for (const sx of [x + Math.round(w * 0.05), X1 - Math.round(w * 0.08) - 10]) rows(4, (yy, l, r) => { if (sx >= l && sx + 10 <= r) { rect(c, sx, yy, 10, 1, col); rect(c, sx + 1, yy, 1, 1, hi); if (cushion && yy > Y0 + 8 && yy < Y0 + 22) rect(c, sx + 1, yy, 8, 1, (yy & 1) && cushion[1] ? cushion[1] : cushion[0]); } });
  };
  const oars = (shaft, dark, blade) => {
    const oy = Y1 - 7;
    rect(c, x + Math.round(w * 0.22), oy, Math.round(w * 0.5), 2, shaft); rect(c, x + Math.round(w * 0.22), oy + 1, Math.round(w * 0.5), 1, dark);
    rect(c, x + Math.round(w * 0.72), oy - 1, 14, 4, blade); rect(c, x + Math.round(w * 0.72), oy + 2, 14, 1, dark);
  };

  if (style === 'punt') {
    // long and flat: dark rails, a slatted floor, a deck at each end, cushions, the pole
    fill(0, '#2A1A14'); fill(1, '#6B3E26'); band(2, '#8A5A32'); band(3, '#D8A870');
    fill(4, '#A8743E');
    rows(4, (yy, l, r) => { if ((yy - Y0) % 5 === 0) rect(c, l, yy, r - l, 1, '#8A5A32'); else if ((yy - Y0) % 5 === 1) rect(c, l, yy, r - l, 1, '#BC8A50'); });
    for (let rx = x + 30; rx < X1 - 30; rx += 34) rows(4, (yy, l, r) => { rect(c, rx, yy, 3, 1, '#7A4E2A'); rect(c, rx, yy, 1, 1, '#A8743E'); });
    // decks: the till at the stern (right), a short one at the front
    for (const [dx, dw] of [[x - 1, 14], [X1 - 24, 20]]) rows(4, (yy, l, r) => { const a = Math.max(l, dx), b = Math.min(r, dx + dw); if (b > a) { rect(c, a, yy, b - a, 1, '#C8945A'); for (let k = a + 2; k < b; k += 4) rect(c, k, yy, 1, 1, '#A8743E'); } });
    for (const ex of [x + 13, X1 - 25]) rows(4, (yy) => rect(c, ex, yy, 1, 1, '#5A3622'));
    // cushions against the front deck
    for (let k = 0; k < 3; k++) { const cy = Y0 + 10 + k * Math.round((Y1 - Y0 - 20) / 3), col = ['#B8402F', '#3E6A8E', '#C89A3A'][k]; rrect(c, x + 14, cy, 12, Math.round((Y1 - Y0 - 24) / 3), 3, col); rect(c, x + 16, cy + 2, 6, 1, 'rgba(255,255,255,0.35)'); }
    // the pole, lying along the floor
    const py = Y1 - 7; rect(c, x + 30, py, Math.round(w * 0.8), 2, '#D8B07A'); rect(c, x + 30, py + 1, Math.round(w * 0.8), 1, '#A8743E'); rect(c, x + 30 + Math.round(w * 0.8), py, 4, 2, '#5A5A5A');
  } else if (style === 'clinker') {
    // varnished, lapped planks running round the hull, green cushions, a coil of rope
    fill(0, '#2A1A14');
    const strakes = ['#7A4E2A', '#9A6A3A', '#7A4E2A', '#A8743E', '#8A5A32'];
    strakes.forEach((col, i) => band(1 + i, col)); band(1, '#C8945A');
    fill(6, '#C8945A');
    rows(6, (yy, l, r) => { const m = (Y0 + Y1) / 2, k = (yy - Y0) % 6; if (k === 0) rect(c, l + 1, yy, r - l - 2, 1, '#A8743E'); if (k === 3 && Math.abs(yy - m) < (Y1 - Y0) / 2 - 10) rect(c, l + 2, yy, r - l - 4, 1, '#D8A870'); });
    for (let rx = x + 14; rx < X1 - 8; rx += 26) rows(6, (yy, l, r) => { if (rx > l && rx < r - 2) rect(c, rx, yy, 2, 1, '#8A5A32'); });
    seats('#8A5A32', '#C8945A', ['#5E7A4E', '#6E8A5A']);
    oars('#E0BC86', '#A8743E', '#E8C890');
    lock('#C8A040');
    if (bow > 10) { const rx = x - bow + 14, ry = Math.round((Y0 + Y1) / 2); for (const r of [5, 3, 1]) { oval(c, rx, ry, r, Math.max(1, r - 1), r % 4 === 1 ? '#C8B080' : '#E0CC98'); } }
  } else if (style === 'dinghy') {
    // a painted dinghy: red outside, a gold line, cream inside, blue seats, striped cushions
    fill(0, '#2A1A1C'); fill(1, '#B8402F'); band(2, '#D0503A'); band(3, '#E8B040');
    fill(4, '#F2E6CC');
    rows(4, (yy, l, r) => { if ((yy - Y0) % 7 === 0) rect(c, l + 1, yy, r - l - 2, 1, '#DCCFB2'); });
    for (let rx = x + 14; rx < X1 - 8; rx += 24) rows(4, (yy, l, r) => { if (rx > l && rx < r - 2) rect(c, rx, yy, 2, 1, '#E2D6BC'); });
    seats('#3E6A8E', '#6A9AB8', ['#F2E6CC', '#B8402F']);
    oars('#E8D0A0', '#B8945A', '#3E6A8E');
    lock('#E8B040');
    if (bow > 10) { const ry = Math.round((Y0 + Y1) / 2); rect(c, x - bow + 6, ry - 1, 6, 1, '#E8B040'); rect(c, x - bow + 6, ry + 1, 6, 1, '#E8B040'); }
  } else {
    // teal painted rowing boat
    fill(0, '#22303A'); fill(1, '#3E6E78'); fill(3, '#5A8A90'); band(3, '#F2EEE0');
    fill(4, '#B8844A');
    rows(4, (yy, l, r) => {
      if ((yy - Y0) % 7 === 0) rect(c, l + 1, yy, r - l - 2, 1, '#9A6A3A');
      if ((yy - Y0) % 7 === 1) rect(c, l + 1, yy, r - l - 2, 1, '#C8945A');
      for (let rx = x + 10; rx < X1 - 6; rx += 22) if (rx > l + 1 && rx < r - 2) { rect(c, rx, yy, 2, 1, '#8A5A32'); rect(c, rx + 2, yy, 1, 1, '#A8743E'); }
    });
    seats('#7A4E2A', '#A8743E');
    oars('#D8B07A', '#A8743E', '#E8C890');
    lock('#2E2420');
  }
}
// A raft of logs lashed together, floating on the lake. Logs run the length of
// the table with rough, uneven ends; two cross-poles are roped across them.
export function raft(c, x, y, w, h) {
  const rng = makeRng(Math.round(w * 7 + h)), LH = 8, n = Math.max(3, Math.round((h + 8) / LH)), top = y + Math.round((h - n * LH) / 2);
  const logs = Array.from({ length: n }, (_, i) => ({ y: top + i * LH, l: x - 4 + rng.int(-3, 3), r: x + w + 4 + rng.int(-3, 3), tone: rng.int(0, 2) }));
  // water all round, fading out, with ripples and pads
  const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], X0 = x - 22, X1 = x + w + 22, Y0 = top - 14, Y1 = top + n * LH + 14;
  for (let yy = Y0; yy < Y1; yy++) for (let xx = X0; xx < X1; xx++) {
    const d = Math.min(xx - X0, X1 - 1 - xx, (yy - Y0) * 1.4, (Y1 - 1 - yy) * 1.4), th = B[(yy & 3) * 4 + (xx & 3)];
    if (d < 6 && th > d * 2) continue;
    rect(c, xx, yy, 1, 1, d < 9 ? '#4E7A8E' : d < 14 ? '#3E6A84' : '#2E5670');
  }
  for (let i = 0; i < (w + h) / 3; i++) {
    const side = i % 4, k = ((i * 37) % 100) / 100;
    const px = side < 2 ? x + k * w : side === 2 ? x - 14 : x + w + 10, py = side === 0 ? top - 7 - (i % 3) : side === 1 ? top + n * LH + 5 + (i % 3) : top + k * n * LH;
    rect(c, Math.round(px), Math.round(py), 2 + (i % 3), 1, i % 2 ? '#8CB8D4' : '#B8D8EC');
  }
  for (const [px, py] of [[x + w + 14, top + 4], [x + w * 0.3, top + n * LH + 9], [x - 16, top + n * LH + 2]]) { oval(c, Math.round(px), Math.round(py), 3, 2, '#4E8A3A'); rect(c, Math.round(px), Math.round(py) - 1, 2, 1, '#3E6A84'); }
  // shadow under the raft
  for (const L of logs) rect(c, L.l + 2, L.y + 3, L.r - L.l, LH, 'rgba(10,20,30,0.35)');
  // the logs: round in section, so lit along the top and dark underneath, with bark marks
  const TONES = [['#5A3E26', '#7A5634', '#94693F', '#AC8050'], ['#523822', '#6E4C2E', '#88603A', '#A07448'], ['#5E4228', '#80603A', '#9A7448', '#B48A58']];
  for (const L of logs) {
    const T = TONES[L.tone];
    const shade = [T[3], T[2], T[2], T[1], T[1], T[1], T[0], '#3A2618'];
    for (let j = 0; j < LH; j++) { const ins = j === 0 || j === LH - 1 ? 2 : j === 1 || j === LH - 2 ? 1 : 0; rect(c, L.l + ins, L.y + j, L.r - L.l - ins * 2, 1, shade[j]); }
    for (let k = 0; k < (L.r - L.l) / 9; k++) { const bx = L.l + 4 + rng.int(0, L.r - L.l - 10), by = L.y + rng.int(2, 5); rect(c, bx, by, rng.int(2, 5), 1, rng() < 0.5 ? T[0] : T[3]); }
    if (rng() < 0.5) { const kx = L.l + rng.int(10, L.r - L.l - 10); oval(c, kx, L.y + 3, 2, 1, T[0]); rect(c, kx, L.y + 3, 1, 1, '#3A2618'); }
    // cut ends: pale end grain with a ring and a dark heart
    for (const ex of [L.l, L.r - 4]) { rect(c, ex, L.y + 1, 4, LH - 2, '#D8B07A'); rect(c, ex + 1, L.y + 2, 2, LH - 4, '#C49A64'); rect(c, ex + 1, L.y + 3, 2, 2, '#8A6440'); rect(c, ex, L.y + 1, 4, 1, '#E8C890'); }
  }
  // two cross-poles, roped to every log
  const bot = top + n * LH;
  for (const px of [x + Math.round(w * 0.1), x + w - Math.round(w * 0.1) - 6]) {
    rect(c, px + 2, top - 2, 6, bot - top + 6, 'rgba(10,20,30,0.3)');
    rect(c, px, top - 3, 6, bot - top + 6, '#6E4C2E'); rect(c, px + 1, top - 3, 2, bot - top + 6, '#94693F'); rect(c, px + 5, top - 3, 1, bot - top + 6, '#4A3220');
    rect(c, px, top - 4, 6, 2, '#D8B07A'); rect(c, px, bot + 2, 6, 2, '#D8B07A');
    for (const L of logs) { const ry = L.y + 2; for (let k = 0; k < 4; k++) rect(c, px - 1 + k * 2, ry + (k % 2), 2, 1, '#E0CC98'); rect(c, px - 1, ry + 2, 8, 1, '#C8B080'); rect(c, px - 1, ry + 3, 8, 1, '#A89060'); }
  }
  // a paddle lying across the logs along the bottom
  const py = bot - 6, pl = x + Math.round(w * 0.24), pw = Math.round(w * 0.46);
  rect(c, pl + 1, py + 2, pw, 2, 'rgba(10,20,30,0.3)'); rect(c, pl, py, pw, 2, '#E0BC86'); rect(c, pl, py + 1, pw, 1, '#A8743E');
  rect(c, pl + pw, py - 2, 16, 6, '#E8C890'); rect(c, pl + pw, py + 3, 16, 1, '#A8743E'); rect(c, pl + pw + 15, py - 1, 1, 4, '#C8A070');
  rect(c, pl - 4, py - 1, 4, 4, '#A8743E');
}
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
  } else if (kind === 'rod') {
    // a fishing rod propped up, its line in the water, and a tin of bait
    rect(c, x + 2, y + 13, 16, 2, S);
    for (let i = 0; i < 18; i++) rect(c, x + 16 - i, y + 12 - Math.round(i * 0.9), 1, 1, i < 5 ? '#5A3622' : '#8A6A3E');
    rect(c, x + 13, y + 9, 3, 3, '#5A6A78'); rect(c, x + 14, y + 10, 1, 1, '#B0BEC8');
    for (let i = 0; i < 6; i++) rect(c, x - 2, y - 4 + i * 2, 1, 1, 'rgba(240,240,240,0.7)');
    rect(c, x - 3, y + 8, 3, 2, '#E8402F'); rect(c, x - 3, y + 8, 3, 1, '#FFF4DC');
    rect(c, x - 12, y + 8, 7, 5, '#8A9AA8'); rect(c, x - 12, y + 8, 7, 1, '#5A6A78'); rect(c, x - 10, y + 7, 2, 1, '#C87A8A');
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
  } else if (kind === 'tea') {
    // a tartan flask and a round tin of biscuits
    rect(c, x + 13, y + 13, 8, 2, S);
    rect(c, x + 14, y, 6, 13, '#2E4A6E'); rect(c, x + 14, y + 4, 6, 1, '#B8402E'); rect(c, x + 14, y + 8, 6, 1, '#B8402E'); rect(c, x + 16, y, 1, 13, '#4A6A8E');
    rect(c, x + 14, y - 3, 6, 3, '#C8C0B0'); rect(c, x + 15, y - 4, 4, 1, '#E8E2D4');
    rect(c, x - 9, y + 14, 16, 2, S);
    oval(c, x - 1, y + 8, 8, 5, '#2E5A8E'); oval(c, x - 1, y + 7, 8, 4, '#3E6AA0'); oval(c, x - 1, y + 6, 6, 3, '#D4A23A'); oval(c, x - 1, y + 6, 4, 1, '#F2D488');
    rect(c, x + 4, y + 10, 4, 2, '#C8945A'); rect(c, x + 5, y + 10, 1, 1, '#8A5A34');
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

// Tartan: green ground with crossing navy and red bands.
export function tartan(c, x, y, w, h) {
  rect(c, x + 3, y + 3, w, h, 'rgba(20,10,10,0.3)');
  rect(c, x, y, w, h, '#3E5A3E');
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  for (let i = 0; i < w; i += 16) { rect(c, x + i + 4, y, 6, h, 'rgba(30,40,80,0.55)'); rect(c, x + i + 12, y, 1, h, 'rgba(210,60,50,0.8)'); }
  for (let j = 0; j < h; j += 16) { rect(c, x, y + j + 4, w, 6, 'rgba(30,40,80,0.5)'); rect(c, x, y + j + 12, w, 1, 'rgba(210,60,50,0.8)'); }
  for (let j = 0; j < h; j += 2) for (let i = (j / 2) % 2; i < w; i += 4) rect(c, x + i, y + j, 1, 1, 'rgba(255,255,255,0.05)');
  c.restore();
  for (let i = 0; i < w; i += 3) { rect(c, x + i, y - 2, 1, 2, '#3E5A3E'); rect(c, x + i + 1, y + h, 1, 2, '#3E5A3E'); }
}

// Patchwork: squares of different fabrics, stitched.
export function patchwork(c, x, y, w, h, rng) {
  rect(c, x + 3, y + 3, w, h, 'rgba(20,10,10,0.3)');
  const cols = ['#C98272', '#E2C478', '#8EAE6E', '#7A94B4', '#F2E4CC', '#B07AA8', '#E8A060'];
  const q = 14;
  for (let j = 0; j < h; j += q) for (let i = 0; i < w; i += q) {
    const col = cols[Math.floor(rng() * cols.length)], ww = Math.min(q, w - i), hh = Math.min(q, h - j);
    rect(c, x + i, y + j, ww, hh, col);
    if (rng() < 0.5) for (let k = 2; k < ww - 1; k += 4) for (let l = 2; l < hh - 1; l += 4) rect(c, x + i + k, y + j + l, 1, 1, 'rgba(255,255,255,0.35)');
    for (let k = 0; k < ww; k += 2) rect(c, x + i + k, y + j, 1, 1, 'rgba(60,30,30,0.35)');
    for (let l = 0; l < hh; l += 2) rect(c, x + i, y + j + l, 1, 1, 'rgba(60,30,30,0.35)');
  }
}

// Welsh tapestry blanket: cream wool with bold bands and diamonds.
export function welsh(c, x, y, w, h) {
  rect(c, x + 3, y + 3, w, h, 'rgba(20,10,10,0.3)');
  rect(c, x, y, w, h, '#E6DAC2');
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  rect(c, x, y, w, 5, '#2E5A5A'); rect(c, x, y + h - 5, w, 5, '#2E5A5A'); rect(c, x, y + 5, w, 1, '#D4A23A'); rect(c, x, y + h - 6, w, 1, '#D4A23A');
  for (let j = 14; j < h - 10; j += 16) for (let i = 8; i < w; i += 16) {
    for (let k = 0; k < 6; k++) { rect(c, x + i - k, y + j - 6 + k, k * 2 + 1, 1, '#A8442E'); rect(c, x + i - k, y + j + 6 - k, k * 2 + 1, 1, '#A8442E'); }
    for (let k = 0; k < 3; k++) { rect(c, x + i - k, y + j - 3 + k, k * 2 + 1, 1, '#D4A23A'); rect(c, x + i - k, y + j + 3 - k, k * 2 + 1, 1, '#D4A23A'); }
    rect(c, x + i, y + j, 1, 1, '#2E5A5A');
  }
  for (let j = 0; j < h; j += 2) for (let i = (j / 2) % 2; i < w; i += 3) rect(c, x + i, y + j, 1, 1, 'rgba(90,70,50,0.08)');
  c.restore();
  for (let i = 0; i < w; i += 3) { rect(c, x + i, y - 2, 1, 2, '#E6DAC2'); rect(c, x + i + 1, y + h, 1, 2, '#E6DAC2'); }
}
