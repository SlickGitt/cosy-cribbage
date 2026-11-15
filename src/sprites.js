// Sprites: scenery is drawn once into small canvases, given a soft dark outline,
// and then drawn each frame in depth order. Identical things share one sprite.
import { makeRng } from './pixel.js';

const PAD = 6; // room below the base point for shadows

// Draw fn(c) in world-style coordinates around (0, 0) = the base centre, into a
// w x h canvas. Returns { cv, ax, ay } where (ax, ay) is the base point in the canvas.
export function bake(w, h, fn, { outline = true } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  const ax = Math.floor(w / 2), ay = h - PAD;
  c.translate(ax, ay);
  fn(c);
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (outline) outlineCanvas(c, w, h);
  return { cv, ax, ay };
}

// Selective outline: every empty pixel touching a solid one becomes a dark,
// slightly purple version of its neighbour. Shadows (semi-transparent) are ignored.
export function outlineCanvas(c, w, h) {
  const img = c.getImageData(0, 0, w, h), d = img.data, src = new Uint8ClampedArray(d);
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 170;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (solid(x, y)) continue;
    let n = -1;
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) if (solid(x + dx, y + dy)) { n = ((y + dy) * w + x + dx) * 4; break; }
    if (n < 0) continue;
    const i = (y * w + x) * 4;
    d[i] = Math.round(src[n] * 0.32 + 18); d[i + 1] = Math.round(src[n + 1] * 0.26 + 10); d[i + 2] = Math.round(src[n + 2] * 0.34 + 24); d[i + 3] = 235;
  }
  c.putImageData(img, 0, 0);
}

// A shared library: the same key always gives the same sprite.
const LIB = new Map();
export function sprite(key, w, h, fn, opts) {
  let s = LIB.get(key);
  if (!s) { s = bake(w, h, (c) => fn(c, makeRng(hashKey(key))), opts); LIB.set(key, s); }
  return s;
}
function hashKey(k) { let h = 2166136261; for (const ch of k) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
