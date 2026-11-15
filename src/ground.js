// Ground and lane textures, written straight into the lane canvas pixels.
// Each biome can give a `tones` ramp (dark to light); the ground picks a tone from
// two layers of noise, dithered so patches fade into each other. Biome edges wobble,
// and the lane is a textured dirt track with a frayed edge.
import { hexRGB, bayer, makeNoise } from './pixel.js';

export function paintGround(c, W, H, segs, band, BIOMES, seed) {
  const img = c.getImageData(0, 0, W, H), d = img.data;
  const n1 = makeNoise(seed), n2 = makeNoise(seed + 99), n3 = makeNoise(seed + 7);
  const ramps = {};
  for (const s of segs) { const B = BIOMES[s.biome]; ramps[s.biome] = (B.tones || [B.ground]).map(hexRGB); }
  // wavy boundary heights between stretches
  const edges = segs.slice(1).map((s) => band(s)[0]);
  const E = edges.map((e, k) => Float32Array.from({ length: W }, (_, x) => e + (n3(x / 28, k * 3.1) - 0.5) * 18));
  const edgeAt = (k, x) => E[k][Math.max(0, Math.min(W - 1, Math.round(x)))];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // which stretch, with a dithered seam
      let k = 0;
      while (k < edges.length && y >= E[k][x] + (bayer(x, y) - 0.5) * 6) k++;
      const R = ramps[segs[k].biome];
      const v = n1.fbm(x / 90, y / 90) * 0.8 + n2(x / 5, y / 5) * 0.2;
      const t = Math.max(0, Math.min(R.length - 1, Math.floor(v * R.length + (bayer(x, y) - 0.5) * 0.7)));
      const col = R[t], i = (y * W + x) * 4;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  return { edgeAt, edges };
}

// The lane: a dirt track laid over whatever is already drawn.
export function paintPath(c, W, H, samples, colourAt, seed) {
  const mask = document.createElement('canvas'); mask.width = W; mask.height = H;
  const m = mask.getContext('2d');
  const ring = (r, col) => { m.fillStyle = col; for (const [x, y] of samples) { m.beginPath(); m.arc(x, y, r, 0, 7); m.fill(); } };
  ring(10.5, '#ff0000'); ring(8, '#ffff00'); ring(3.2, '#ffffff');
  const md = m.getImageData(0, 0, W, H).data;
  const img = c.getImageData(0, 0, W, H), d = img.data;
  const n = makeNoise(seed + 5), cache = new Map();
  const ramp = (y) => { const k = Math.round(y / 8); if (!cache.has(k)) cache.set(k, colourAt(k * 8).map(hexRGB)); return cache.get(k); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const edge = md[i] > 128, body = md[i + 1] > 128, worn = md[i + 2] > 128;
    if (!edge) continue;
    const P = ramp(y), b = bayer(x, y);
    let col;
    if (!body) { if (b > 0.5 + (n(x / 5, y / 5) - 0.5) * 0.6) continue; col = P[0]; }
    else {
      const v = n.fbm(x / 6, y / 6) + (worn ? 0.22 : 0) + (b - 0.5) * 0.35;
      col = P[Math.max(0, Math.min(P.length - 1, Math.floor(v * P.length)))];
    }
    d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2];
  }
  c.putImageData(img, 0, 0);
}
