// Weather particles drawn in art pixels. The slice ships falling leaves.
import { makeRng, rect } from './pixel.js';

const LEAF_COLS = ['#D8702E', '#E8A040', '#B8442A', '#CC8A2E', '#9A4A20'];

export function makeLeaves(w, h, count, seed = 7) {
  const rng = makeRng(seed);
  const spawn = (p, top) => {
    p.x = rng.range(-10, w + 10); p.y = top ? rng.range(-h, 0) : rng.range(0, h);
    p.vy = rng.range(8, 16); p.vx = rng.range(2, 8); p.ph = rng.range(0, 6.28); p.col = rng.pick(LEAF_COLS);
    return p;
  };
  const ps = Array.from({ length: count }, () => spawn({}, false));
  return {
    wind: 0,
    update(dt) {
      const gustX = this.wind * 55, fall = 1 + this.wind * 0.5;
      for (const p of ps) {
        p.ph += dt * (3 + this.wind * 4); p.y += p.vy * dt * fall; p.x += (p.vx + gustX + Math.sin(p.ph) * 10) * dt;
        if (p.y > h + 4 || p.x > w + 12) { spawn(p, true); if (this.wind > 0.5 && Math.random() < 0.6) { p.x = -8; p.y = Math.random() * h; } }
      }
    },
    draw(c, ox = 0, oy = 0) {
      for (const p of ps) {
        const flat = Math.sin(p.ph) > 0;
        rect(c, ox + p.x, oy + p.y, flat ? 2 : 1, flat ? 1 : 2, p.col);
      }
    },
  };
}
