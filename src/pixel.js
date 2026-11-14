// Low-resolution pixel drawing helpers. All coordinates are art pixels.

export function makeRng(seed) {
  let a = seed >>> 0;
  const r = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + r() * (hi - lo);
  r.int = (lo, hi) => Math.floor(r.range(lo, hi + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  return r;
}

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function rect(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function disc(c, cx, cy, r, col) {
  c.fillStyle = col;
  cx = Math.round(cx); cy = Math.round(cy); r = Math.max(0, Math.round(r));
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35);
    c.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
  }
}

export function oval(c, cx, cy, rx, ry, col) {
  c.fillStyle = col;
  cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -ry; dy <= ry; dy++) {
    const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))) + 0.35);
    c.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
  }
}

// Upward-pointing triangle: apex at (cx, top), base at y = top + h, half width hw.
export function tri(c, cx, top, hw, h, col) {
  c.fillStyle = col;
  for (let i = 0; i <= h; i++) {
    const w = Math.round((hw * i) / h);
    c.fillRect(Math.round(cx - w), Math.round(top + i), w * 2 + 1, 1);
  }
}

// rows: array of strings, pal: char -> colour. '.' is transparent.
export function sprite(c, rows, pal, x, y, flip = false) {
  x = Math.round(x); y = Math.round(y);
  const w = rows[0].length;
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < w; i++) {
      const ch = row[flip ? w - 1 - i : i];
      const col = pal[ch];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(x + i, y + j, 1, 1);
    }
  }
}

const DIGITS = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '001', '010', '010'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'],
};
export function number(c, n, x, y, col) {
  const s = String(n);
  c.fillStyle = col;
  [...s].forEach((d, k) => {
    DIGITS[d].forEach((row, j) => {
      for (let i = 0; i < 3; i++) if (row[i] === '1') c.fillRect(Math.round(x) + k * 4 + i, Math.round(y) + j, 1, 1);
    });
  });
  return s.length * 4 - 1;
}
