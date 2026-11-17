// The lake: water shape, lily pad pegs, and the little rowing boats the walkers
// take across.
import { rect, oval } from './pixel.js';

const DEEP = [46, 86, 112], MID = [62, 106, 132], EDGE = [78, 122, 142], MUD = [106, 90, 58], RIM = [94, 122, 52];

// A lake centred at (cx, cy): a squashed, wobbly superellipse. Returns
// { inside(x, y, pad), d(x, y) } where d < 1 is water.
export function lakeShape(cx, cy, rx, ry, rng) {
  const p0 = rng.range(0, 6.28), p1 = rng.range(0, 6.28), p2 = rng.range(0, 6.28), P = 2.6;
  const edge = (a) => 1 + 0.07 * Math.sin(3 * a + p0) + 0.045 * Math.sin(5 * a + p1) + 0.03 * Math.sin(7 * a + p2);
  const d = (x, y) => {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    return Math.pow(Math.pow(Math.abs(dx), P) + Math.pow(Math.abs(dy), P), 1 / P) / edge(Math.atan2(dy, dx));
  };
  return { d, inside: (x, y, pad = 0) => d(x, y) < 1 + pad / Math.min(rx, ry), cx, cy, rx, ry };
}

// Paint the water, a muddy rim and a grassy lip, dithered like the river.
export function paintLake(c, L) {
  const x0 = Math.max(0, Math.floor(L.cx - L.rx * 1.25)), x1 = Math.min(c.canvas.width, Math.ceil(L.cx + L.rx * 1.25));
  const y0 = Math.max(0, Math.floor(L.cy - L.ry * 1.25)), y1 = Math.min(c.canvas.height, Math.ceil(L.cy + L.ry * 1.25));
  const img = c.getImageData(x0, y0, x1 - x0, y1 - y0), px = img.data, W = x1 - x0;
  const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const d = L.d(x, y), k = 2 / Math.min(L.rx, L.ry);
    let col = null;
    if (d < 1) {
      const th = (B[(y & 3) * 4 + (x & 3)] + 0.5) / 16, v = d + (th - 0.5) * 0.12;
      col = v > 0.88 ? EDGE : v > 0.6 ? MID : DEEP;
    } else if (d < 1 + k) col = MUD;
    else if (d < 1 + k * 2.2) col = RIM;
    if (!col) continue;
    const i = ((y - y0) * W + (x - x0)) * 4; px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = 255;
  }
  c.putImageData(img, x0, y0);
}

// A lily pad that is a hole on the board: a round pad with a notch and a dark
// peg hole in the middle. Every fifth one is bigger and has a flower.
export function lilyPeg(c, x, y, big) {
  x = Math.round(x); y = Math.round(y);
  const rx = big ? 5 : 4, ry = big ? 3 : 2;
  oval(c, x + 1, y + 1, rx, ry, 'rgba(20,40,50,0.35)');
  oval(c, x, y, rx, ry, '#3E7A34'); oval(c, x, y - 1, rx - 1, ry - 1, '#5E9A42');
  rect(c, x + 1, y - ry, rx - 1, 1, '#3E6A84'); rect(c, x + 2, y - ry + 1, rx - 3, 1, '#3E6A84');
  rect(c, x - 2, y - 1, 1, 1, '#7AB45A');
  rect(c, x - 1, y - 1, big ? 3 : 2, 2, '#2E4A22');
  if (big) { rect(c, x - rx + 1, y - 2, 2, 1, '#F2A0B8'); rect(c, x - rx + 1, y - 3, 1, 1, '#FFF4DC'); rect(c, x - rx + 2, y - 3, 1, 1, '#F2A0B8'); }
}

// A walker rowing a little boat, seen from the front as they come towards you.
// drawWalker(c, x, feetY) draws the walker; we clip off their legs.
export function rowing(c, x, y, t, moving, drawWalker) {
  x = Math.round(x); y = Math.round(y);
  const bob = Math.round(Math.sin(t / 500 + x) * 0.6);
  y += bob;
  // ripples and a wake behind
  c.fillStyle = 'rgba(220,236,246,0.45)';
  c.fillRect(x - 9, y + 5, 3, 1); c.fillRect(x + 7, y + 5, 3, 1);
  if (moving) { c.fillRect(x - 5, y - 9, 2, 1); c.fillRect(x + 4, y - 9, 2, 1); c.fillRect(x - 7, y - 12, 2, 1); c.fillRect(x + 6, y - 12, 2, 1); }
  oval(c, x + 1, y + 4, 8, 2, 'rgba(20,40,50,0.35)');
  // back half of the hull, then the walker sitting in it, then the front
  oval(c, x, y - 1, 7, 5, '#6B3E26'); oval(c, x, y - 1, 6, 4, '#B07E46'); rect(c, x - 5, y - 3, 11, 1, '#8A5A32');
  c.save(); c.beginPath(); c.rect(x - 10, y - 30, 20, 30); c.clip(); drawWalker(c, x, y + 6); c.restore();
  rect(c, x - 6, y, 13, 3, '#8A5A32'); rect(c, x - 5, y + 3, 11, 1, '#6B3E26'); rect(c, x - 3, y + 4, 7, 1, '#6B3E26'); rect(c, x - 6, y, 13, 1, '#C8945A');
  // oars: swing forward and back while rowing
  const st = moving ? Math.sin(t / 160) : 0.3, dy = Math.round(st * 2);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) rect(c, x + s * (6 + i), y - 1 + Math.round((dy * i) / 5), 1, 1, '#C8945A');
    rect(c, x + s * 12 - (s < 0 ? 1 : 0), y - 1 + dy, 2, 2, '#8A5A32');
  }
}

// A weeping willow: a low dome with a curtain of long, drooping strands that
// nearly reach the ground, the trunk just showing through.
export function weepingWillow(c, x, y, rng) {
  oval(c, x + 2, y, 15, 3, 'rgba(20,10,10,0.25)');
  rect(c, x - 1, y - 18, 4, 18, '#6B4A2E'); rect(c, x - 1, y - 18, 1, 18, '#8A6440'); rect(c, x + 3, y - 12, 3, 1, '#6B4A2E'); rect(c, x - 4, y - 14, 3, 1, '#6B4A2E');
  oval(c, x, y - 27, 14, 7, '#6A8E34'); oval(c, x - 2, y - 29, 10, 5, '#88A848'); oval(c, x - 4, y - 31, 5, 2, '#A8C25E');
  const cols = ['#A0C05A', '#7A9E3A', '#5A7A2E', '#8AAE48', '#C8C060'];
  for (let dx = -18; dx <= 18; dx++) {
    if (Math.abs(dx) < 4 && rng() < 0.55) continue;
    const top = y - 27 + Math.round(7 * Math.sqrt(Math.max(0, 1 - (dx / 19) ** 2)) * 0.6) - 3, bot = y - 3 - Math.round(Math.abs(dx) * 0.25) - rng.int(0, 5);
    const col = cols[(dx + 40 + rng.int(0, 2)) % cols.length];
    rect(c, x + dx, top, 1, Math.max(2, bot - top), col);
    if (rng() < 0.4) rect(c, x + dx, top + rng.int(2, 8), 1, 1, '#C8D878');
    if (rng() < 0.15) rect(c, x + dx, bot - 1, 1, 1, '#E0B43C');
  }
}
