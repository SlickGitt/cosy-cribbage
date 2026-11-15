// Live animals on the lane. Each one has a little routine (grazing, pecking, hiding)
// and reacts when clicked or when a walker comes close. Frames are baked sprites.
import { rect, oval, disc, makeRng } from './pixel.js';
import { sprite } from './sprites.js';
import { sfx } from './sound.js';

const SH = 'rgba(20,10,10,0.25)', INK = '#2B1D24';

// ---------- frames ----------
const DRAW = {
  sheep(c, f, flip) {
    const X = (dx) => (flip ? -dx : dx);
    oval(c, 0, 1, 6, 1, SH);
    const legs = f === 'walk' ? [[-3, 0], [3, 1]] : [[-3, 0], [3, 0]];
    for (const [dx, dy] of legs) rect(c, X(dx) - (flip ? 1 : 0), -2 + dy, 1, 2 - dy, '#3A2E2E');
    rect(c, -5, -7, 10, 5, '#FFF8EC'); rect(c, -4, -8, 3, 1, '#FFF8EC'); rect(c, 1, -8, 3, 1, '#FFF8EC'); rect(c, -4, -3, 8, 1, '#E0D6C6');
    rect(c, -3, -7, 2, 1, '#FFFFFF');
    const hy = f === 'graze' ? -4 : -8, hx = flip ? -8 : 4;
    rect(c, hx, hy, 4, 3, '#3A2E2E'); rect(c, flip ? hx + 3 : hx, hy - 1, 1, 1, '#3A2E2E'); rect(c, flip ? hx : hx + 3, hy + 1, 1, 1, '#F0E0D0');
  },
  cow(c, f, flip) {
    const X = (dx) => (flip ? -dx : dx);
    oval(c, 0, 1, 9, 2, SH);
    for (const dx of [-5, -3, 3, 5]) rect(c, X(dx), -2, 1, 2, '#3A2E2E');
    rect(c, -7, -9, 14, 7, '#FFF8EC'); rect(c, X(-5) - (flip ? 3 : 0), -9, 4, 3, INK); rect(c, X(2) - (flip ? 3 : 0), -6, 3, 3, INK);
    const hx = flip ? -11 : 6, hy = f === 'graze' ? -6 : -10;
    rect(c, hx, hy, 5, 5, '#FFF8EC'); rect(c, hx, hy, 5, 2, INK); rect(c, hx + 1, hy + 3, 3, 2, '#F2A0B8');
    rect(c, hx - 1, hy - 1, 1, 1, '#E9DCC4'); rect(c, hx + 5, hy - 1, 1, 1, '#E9DCC4');
    const tx = flip ? 7 : -8, sw = f === 'tail' ? -2 : 0;
    rect(c, tx, -8, 1, 4, '#3A2E2E'); rect(c, tx + (flip ? 1 : -1) * (sw ? 1 : 0), -4 + sw, 1, 2, INK);
  },
  bird(c, f, flip) { // an English robin: round, brown, red breast
    const X = (dx, w = 1) => (flip ? -dx - w + 1 : dx);
    if (f === 'fly1' || f === 'fly2') {
      rect(c, X(-2, 4), -12, 4, 2, '#7A5A3E'); rect(c, X(1, 2), -12, 2, 1, '#D85A2A');
      if (f === 'fly1') { rect(c, X(-4, 2), -14, 2, 1, '#6A4A32'); rect(c, X(1, 2), -14, 2, 1, '#6A4A32'); } else { rect(c, X(-4, 2), -11, 2, 1, '#6A4A32'); rect(c, X(1, 2), -11, 2, 1, '#6A4A32'); }
      return;
    }
    oval(c, 0, 1, 2, 0, SH);
    const peck = f === 'peck' ? 1 : 0;
    rect(c, X(-2, 5), -4, 5, 3, '#7A5A3E'); rect(c, X(-1, 4), -5 + peck, 4, 1, '#7A5A3E');
    rect(c, X(0, 3), -3, 3, 2, '#D85A2A'); rect(c, X(1, 2), -4 + peck, 2, 1, '#D85A2A');
    rect(c, X(2), -4 + peck, 1, 1, INK); rect(c, X(3), -3 + peck, 1, 1, '#3A2E2E'); rect(c, X(-3), -3, 1, 1, '#5A4030');
    rect(c, X(0), -1, 1, 1, '#3A2E2E'); rect(c, X(1), -1, 1, 1, '#3A2E2E');
  },
  magpie(c, f, flip) {
    const X = (dx, w = 1) => (flip ? -dx - w + 1 : dx);
    if (f === 'fly1' || f === 'fly2') {
      rect(c, X(-3, 6), -13, 6, 2, '#1E1A22'); rect(c, X(-1, 2), -13, 2, 1, '#F5F2EA'); rect(c, X(-7, 4), -12, 4, 1, '#1E1A22');
      const wy = f === 'fly1' ? -15 : -11; rect(c, X(-3, 3), wy, 3, 1, '#F5F2EA'); rect(c, X(1, 3), wy, 3, 1, '#F5F2EA');
      return;
    }
    oval(c, 0, 1, 3, 0, SH);
    const peck = f === 'peck' ? 1 : 0;
    rect(c, X(-2, 5), -4, 5, 3, '#1E1A22'); rect(c, X(-1, 3), -3, 3, 2, '#F5F2EA'); rect(c, X(2, 2), -6 + peck, 2, 2, '#1E1A22');
    rect(c, X(4), -5 + peck, 1, 1, '#3A3A40'); rect(c, X(-7, 5), -5, 5, 1, '#2A3A5A'); rect(c, X(-8, 2), -6, 2, 1, '#2A3A5A');
    rect(c, X(0), -1, 1, 1, INK); rect(c, X(1), -1, 1, 1, INK);
  },
  pheasant(c, f, flip) {
    const X = (dx, w = 1) => (flip ? -dx - w + 1 : dx);
    if (f === 'fly1' || f === 'fly2') {
      rect(c, X(-3, 7), -14, 7, 3, '#A8562A'); rect(c, X(3, 2), -16, 2, 3, '#2E5A4E'); rect(c, X(4), -16, 1, 1, '#C8302A');
      rect(c, X(-9, 6), -13, 6, 1, '#8A5A2E'); const wy = f === 'fly1' ? -17 : -11; rect(c, X(-2, 5), wy, 5, 1, '#C89A5A');
      return;
    }
    oval(c, 0, 1, 5, 1, SH);
    const peck = f === 'peck' ? 2 : 0;
    rect(c, X(-3, 7), -6, 7, 4, '#A8562A'); rect(c, X(-2, 5), -5, 5, 1, '#C8743A'); for (let i = 0; i < 3; i++) rect(c, X(-2 + i * 2), -4, 1, 1, '#5A2E1A');
    rect(c, X(3, 2), -10 + peck, 2, 5, '#2E5A4E'); rect(c, X(3, 2), -6 + peck, 2, 1, '#F5F2EA'); rect(c, X(4), -9 + peck, 1, 2, '#C8302A'); rect(c, X(5), -9 + peck, 1, 1, '#E8C060');
    rect(c, X(-10, 7), -6, 7, 1, '#8A5A2E'); rect(c, X(-12, 3), -7, 3, 1, '#8A5A2E'); for (let i = 0; i < 4; i++) rect(c, X(-9 + i * 2), -6, 1, 1, '#4A2E1A');
    rect(c, X(-1), -2, 1, 2, '#6A5A4A'); rect(c, X(1), -2, 1, 2, '#6A5A4A');
  },
  hare(c, f, flip) {
    const X = (dx, w = 1) => (flip ? -dx - w + 1 : dx);
    oval(c, 0, 1, 5, 1, SH);
    const up = f === 'hop' ? -3 : 0, stretch = f === 'hop' ? 2 : 0;
    rect(c, X(-4, 8 + stretch), -5 + up, 8 + stretch, 5, '#A07A54'); rect(c, X(-3, 6), -6 + up, 6, 1, '#B48C64');
    rect(c, X(3 + stretch, 3), -8 + up, 3, 4, '#A07A54'); rect(c, X(5 + stretch), -7 + up, 1, 1, '#E8B030');
    rect(c, X(3 + stretch), -13 + up, 1, 5, '#A07A54'); rect(c, X(4 + stretch), -12 + up, 1, 4, '#B48C64'); rect(c, X(3 + stretch), -13 + up, 1, 1, '#1E1A22'); rect(c, X(4 + stretch), -12 + up, 1, 1, '#1E1A22');
    rect(c, X(-5, 2), -4 + up, 2, 2, '#F5F0E6'); rect(c, X(-3, 2), 0 + up, 3, 1, '#8A6A48');
  },
  squirrel(c, f, flip) {
    const X = (dx, w = 1) => (flip ? -dx - w + 1 : dx);
    oval(c, 0, 1, 4, 1, SH);
    if (f === 'run1' || f === 'run2') {
      const up = f === 'run1' ? -1 : 0;
      rect(c, X(-3, 6), -4 + up, 6, 3, '#C8642A'); rect(c, X(2, 3), -6 + up, 3, 3, '#C8642A'); rect(c, X(4), -5 + up, 1, 1, INK);
      rect(c, X(-7, 4), -6 + up - (f === 'run1' ? 1 : 0), 4, 3, '#E07A34'); rect(c, X(-8, 2), -7 + up, 2, 2, '#E07A34');
      rect(c, X(-2), -1, 1, 1, '#8A3E1A'); rect(c, X(2), -1 + up, 1, 1, '#8A3E1A');
      return;
    }
    const flick = f === 'flick' ? -1 : 0;
    rect(c, X(-1, 4), -5, 4, 5, '#C8642A'); rect(c, X(0, 3), -8, 3, 3, '#C8642A'); rect(c, X(2), -7, 1, 1, INK); rect(c, X(0), -9, 1, 1, '#C8642A');
    rect(c, X(0, 2), -4, 2, 3, '#F2D2A8');
    rect(c, X(-4, 3), -8 + flick, 3, 7, '#E07A34'); rect(c, X(-3, 2), -10 + flick, 2, 2, '#E07A34'); rect(c, X(-4), -3, 1, 1, '#B85A24');
  },
  rabbit(c, f, flip) {
    const X = (dx, w = 1) => (flip ? -dx - w + 1 : dx);
    oval(c, 0, 1, 4, 1, SH);
    const up = f === 'hop' ? -2 : 0;
    rect(c, X(-3, 6), -4 + up, 6, 4, '#A8886A'); rect(c, X(1, 3), -6 + up, 3, 3, '#A8886A');
    rect(c, X(1), -9 + up, 1, 3, '#A8886A'); rect(c, X(2), -9 + up, 1, 3, '#C8A88A'); rect(c, X(3), -5 + up, 1, 1, INK);
    rect(c, X(-4, 2), -3 + up, 2, 2, '#FFF8EC'); if (f === 'twitch') rect(c, X(4), -4, 1, 1, '#F2A0B8');
  },
  butterfly(c, f) {
    const col = f === 'a' ? '#F2B63C' : '#F2B63C';
    if (f === 'a') { rect(c, -2, -1, 2, 2, col); rect(c, 1, -1, 2, 2, col); rect(c, -2, -1, 1, 1, '#E8603A'); rect(c, 2, -1, 1, 1, '#E8603A'); }
    else { rect(c, -1, -2, 1, 2, col); rect(c, 1, -2, 1, 2, col); }
    rect(c, 0, -1, 1, 2, INK);
  },
};
const BOX = { sheep: [22, 20], cow: [30, 22], bird: [14, 24], magpie: [22, 24], pheasant: [30, 26], squirrel: [20, 18], rabbit: [16, 18], hare: [24, 22], butterfly: [10, 10] };
const TYPE = { magpie: 'bird', pheasant: 'bird', hare: 'rabbit' };
const frame = (kind, f, flip) => sprite(`cr|${kind}|${f}|${flip ? 1 : 0}`, BOX[kind][0], BOX[kind][1], (c) => DRAW[kind](c, f, flip), { outline: kind !== 'butterfly' });

// ---------- behaviour ----------
export function makeCritters(specs, objects, seed, hooks) {
  const rng = makeRng(seed);
  const list = specs.map((s) => ({ ...s, type: TYPE[s.kind] || s.kind, hx: s.x, hy: s.y, flip: rng() < 0.5, f: 'stand', z: 0, t: rng.range(0, 3), st: 'idle', hidden: false, ph: rng.range(0, 6) }));
  const covers = objects.filter((o) => o.cover);
  const coverNear = (x, y, not, r = 70) => {
    const near = covers.filter((o) => o !== not && Math.hypot(o.x - x, o.y - y) < r && Math.hypot(o.x - x, o.y - y) > 14);
    return near.length ? near[Math.floor(rng() * near.length)] : null;
  };
  for (const cr of list) if (cr.type === 'squirrel') { cr.cover = coverNear(cr.x, cr.y, null, 50); if (cr.cover) { cr.x = cr.cover.x; cr.y = cr.cover.y + 1; } cr.hidden = true; cr.st = 'hide'; cr.t = rng.range(4, 12); }
  const say = (cr, text) => hooks.say(text, cr.x, cr.y - 14);
  const moveTo = (cr, x, y, speed, st) => { cr.tx = x; cr.ty = y; cr.speed = speed; cr.st = st; cr.flip = x < cr.x; };
  const away = (cr, dist, fromX = cr.x - (cr.flip ? -1 : 1), fromY = cr.y) => {
    const a = Math.atan2(cr.y - fromY, cr.x - fromX) + rng.range(-0.7, 0.7);
    return [cr.x + Math.cos(a) * dist, cr.y + Math.sin(a) * dist * 0.6];
  };
  const safe = (x, y) => hooks.clear(x, y);

  function poke(cr, by = 'click') {
    if (cr.gone) return false;
    if (by === 'click' && hooks.found) hooks.found(cr.kind);
    if (cr.type === 'sheep') {
      if (by === 'click') { sfx('baa'); say(cr, rng.pick(['Baa!', 'Baaa!', 'Baa-aa!'])); }
      cr.hop = 0.35;
      let [x, y] = away(cr, rng.range(12, 20));
      if (!safe(x, y)) [x, y] = [cr.hx + rng.range(-8, 8), cr.hy + rng.range(-4, 4)];
      setTimeout(() => moveTo(cr, x, y, 24, 'trot'), 300);
      for (const o of list) if (o !== cr && o.type === 'sheep' && Math.hypot(o.x - cr.x, o.y - cr.y) < 26 && rng() < 0.6) setTimeout(() => { o.hop = 0.3; o.flip = !o.flip; }, rng.range(150, 450));
    } else if (cr.type === 'cow') {
      if (by === 'click') { sfx('moo'); say(cr, rng.pick(['Moo.', 'Mooo!'])); }
      cr.tail = 1.2; cr.flip = !cr.flip;
    } else if (cr.type === 'bird') {
      if (cr.st === 'fly') return false;
      if (by === 'click') { sfx('flap'); if (cr.kind === 'pheasant') { sfx('pheasant'); say(cr, 'Kok-kok!'); } else if (cr.kind === 'magpie') { sfx('chak'); say(cr, 'Chak!'); } else sfx('tweet'); }
      cr.st = 'fly'; cr.flip = rng() < 0.5; cr.vx = (cr.flip ? -1 : 1) * rng.range(35, 55); cr.vy = rng.range(-30, -20);
      for (const o of list) if (o !== cr && o.type === 'bird' && o.st !== 'fly' && Math.hypot(o.x - cr.x, o.y - cr.y) < 30) setTimeout(() => poke(o, 'flock'), rng.range(80, 300));
    } else if (cr.type === 'squirrel') {
      if (by === 'click') { sfx('chitter'); say(cr, rng.pick(['Chk chk!', 'Eek!'])); }
      dash(cr);
    } else if (cr.type === 'rabbit') {
      if (cr.st === 'bolt' || cr.hidden) return false;
      if (by === 'click') sfx('pop');
      if (cr.kind === 'hare') { const [x, y] = away(cr, 60); moveTo(cr, x, y, 80, 'bolt'); cr.cover = null; return true; }
      const cv = coverNear(cr.x, cr.y, null, 90);
      if (cv) { cr.cover = cv; moveTo(cr, cv.x, cv.y + 1, 55, 'bolt'); } else { const [x, y] = away(cr, 30); moveTo(cr, x, y, 55, 'bolt'); }
    } else if (cr.type === 'butterfly') {
      cr.flee = 3;
    }
    return true;
  }
  function dash(cr) {
    const to = coverNear(cr.x, cr.y, cr.cover) || coverNear(cr.x, cr.y, cr.cover, 120);
    if (!to) return;
    cr.hidden = false; cr.from = cr.cover; cr.cover = to; moveTo(cr, to.x + rng.range(-3, 3), to.y + 1, rng.range(85, 110), 'run');
  }

  function update(dt, t, walkers) {
    for (const cr of list) {
      cr.t -= dt;
      if (cr.hop) cr.hop = Math.max(0, cr.hop - dt);
      if (cr.tail) cr.tail = Math.max(0, cr.tail - dt);
      // walkers passing close scare the shy ones
      if (walkers) for (const w of walkers) {
        const d = Math.hypot(w[0] - cr.x, w[1] - cr.y);
        if (d < 22 && (cr.type === 'bird' || cr.type === 'rabbit') && cr.st !== 'fly') poke(cr, 'walker');
        if (d < 18 && cr.type === 'squirrel' && !cr.hidden && cr.st !== 'run') poke(cr, 'walker');
      }
      // moving somewhere
      if (cr.tx !== undefined && (cr.st === 'trot' || cr.st === 'wander' || cr.st === 'run' || cr.st === 'bolt')) {
        const dx = cr.tx - cr.x, dy = cr.ty - cr.y, d = Math.hypot(dx, dy), step = cr.speed * dt;
        if (d <= step) {
          cr.x = cr.tx; cr.y = cr.ty; cr.tx = undefined;
          if (cr.st === 'run') { cr.st = 'peek'; cr.t = rng.range(0.8, 2.2); }
          else if (cr.st === 'bolt') { cr.hidden = !!cr.cover; cr.st = cr.cover ? 'hide' : 'idle'; cr.t = rng.range(6, 12); }
          else { cr.st = 'idle'; cr.t = rng.range(1, 3); }
        } else { cr.x += (dx / d) * step; cr.y += (dy / d) * step; }
      }
      const k = cr.type;
      if (k === 'sheep' || k === 'cow') {
        if (cr.st === 'idle' && cr.t <= 0) {
          if (rng() < 0.25) { const x = cr.hx + rng.range(-10, 10), y = cr.hy + rng.range(-4, 4); if (safe(x, y)) moveTo(cr, x, y, k === 'cow' ? 4 : 5, 'wander'); }
          cr.t = rng.range(4, 9);
        }
        const moving = cr.st === 'trot' || cr.st === 'wander';
        cr.f = cr.tail ? (Math.floor(t * 8) % 2 ? 'tail' : 'stand') : moving ? (Math.floor(t * (cr.st === 'trot' ? 10 : 4)) % 2 ? 'walk' : 'stand') : (Math.sin(t * 0.7 + cr.ph) > 0.1 ? 'graze' : 'stand');
        if (k === 'cow' && cr.f === 'walk') cr.f = 'stand';
        cr.z = cr.hop ? Math.round(Math.sin((1 - cr.hop / 0.35) * Math.PI) * 3) : 0;
      } else if (k === 'bird') {
        if (cr.st === 'fly') {
          cr.x += cr.vx * dt; cr.y += cr.vy * dt; cr.vy -= 6 * dt; cr.f = Math.floor(t * 10) % 2 ? 'fly1' : 'fly2';
          if (Math.abs(cr.x - cr.hx) > 220) { cr.st = 'away'; cr.gone = true; cr.t = rng.range(15, 30); }
        } else if (cr.st === 'away') {
          if (cr.t <= 0) { const p = hooks.spot(cr.hx, cr.hy); if (p) { cr.x = p[0]; cr.y = p[1]; } else { cr.x = cr.hx; cr.y = cr.hy; } cr.gone = false; cr.st = 'idle'; }
        } else {
          if (cr.t <= 0) { cr.t = rng.range(0.4, 1.6); if (rng() < 0.3) { cr.x += rng.range(-3, 3); cr.flip = !cr.flip; } }
          cr.f = Math.sin(t * 5 + cr.ph) > 0.6 ? 'peck' : 'stand';
        }
      } else if (k === 'squirrel') {
        if (cr.st === 'hide' && cr.t <= 0) dash(cr);
        else if (cr.st === 'peek') { cr.f = Math.sin(t * 9) > 0.7 ? 'flick' : 'sit'; if (cr.t <= 0) { if (rng() < 0.8) { cr.hidden = true; cr.st = 'hide'; cr.t = rng.range(8, 18); } else dash(cr); } }
        if (cr.st === 'run') cr.f = Math.floor(t * 14) % 2 ? 'run1' : 'run2';
      } else if (k === 'rabbit') {
        if (cr.st === 'hide' && cr.t <= 0) {
          cr.hidden = false; const [x, y] = [cr.x + (rng() < 0.5 ? -1 : 1) * rng.range(8, 14), cr.y + rng.range(-2, 4)];
          if (safe(x, y)) moveTo(cr, x, y, 14, 'wander'); else cr.st = 'idle';
        }
        if (cr.st === 'idle' && cr.t <= 0) { cr.t = rng.range(1.5, 4); if (rng() < 0.4) { const x = cr.x + rng.range(-8, 8), y = cr.y + rng.range(-3, 3); if (safe(x, y)) moveTo(cr, x, y, 16, 'wander'); } }
        const moving = cr.st === 'wander' || cr.st === 'bolt';
        cr.f = moving ? (Math.floor(t * (cr.st === 'bolt' ? 10 : 6)) % 2 ? 'hop' : 'sit') : (Math.sin(t * 6 + cr.ph) > 0.85 ? 'twitch' : 'sit');
      } else if (k === 'butterfly') {
        if (cr.flee) { cr.flee = Math.max(0, cr.flee - dt); cr.fy = (cr.fy || 0) - dt * 20; } else cr.fy = (cr.fy || 0) * (1 - dt);
        cr.x = cr.hx + Math.sin(t * 0.5 + cr.ph) * 10 + Math.sin(t * 1.3 + cr.ph) * 2;
        cr.y = cr.hy + Math.cos(t * 0.6 + cr.ph) * 5;
        cr.z = 8 + Math.round(Math.abs(Math.sin(t * 3 + cr.ph)) * 3) - Math.round(cr.fy);
        cr.f = Math.floor(t * 8 + cr.ph) % 2 ? 'a' : 'b';
      }
    }
  }

  function visible(cr) { return !cr.gone && !cr.hidden; }
  return {
    list,
    // depth-sort keys and drawers for the scene
    drawables(x0, y0, x1, y1, out) {
      for (const cr of list) {
        if (!visible(cr) || cr.x < x0 - 20 || cr.x > x1 + 20 || cr.y < y0 - 20 || cr.y > y1 + 30) continue;
        const s = frame(cr.kind, cr.f, cr.flip), fly = cr.st === 'fly';
        out.push({ y: fly ? cr.y + 60 : cr.kind === 'butterfly' ? cr.y + 12 : cr.y, draw: (c, ix, iy) => c.drawImage(s.cv, Math.round(cr.x - s.ax - ix), Math.round(cr.y - s.ay - (cr.z || 0) - iy)) });
      }
    },
    hit(ax, ay) {
      let best = null, bd = 1e9;
      for (const cr of list) {
        if (!visible(cr)) continue;
        const d = Math.hypot(cr.x - ax, (cr.y - 4 - (cr.z || 0)) - ay);
        if (d < (cr.kind === 'cow' || cr.kind === 'pheasant' ? 11 : 8) && d < bd) { bd = d; best = cr; }
      }
      return best;
    },
    poke,
    // something in this bush or tree? flush it out
    flush(obj) {
      let any = false;
      for (const cr of list) if ((cr.hidden && cr.cover === obj) || (cr.type === 'squirrel' && cr.hidden && Math.hypot(cr.x - obj.x, cr.y - obj.y) < 8)) {
        if (cr.type === 'squirrel') { sfx('chitter'); dash(cr); any = true; }
        else if (cr.type === 'rabbit') { cr.hidden = false; const [x, y] = away(cr, 24, obj.x, obj.y - 10); moveTo(cr, x, y, 50, 'bolt'); cr.cover = null; any = true; }
      }
      return any;
    },
    update,
  };
}

// A picture of an animal for the field guide.
import * as A from './art.js';
export function critterIcon(kind) {
  const cv = document.createElement('canvas'); cv.className = 'px-sprite critter-icon';
  if (kind === 'deer') { cv.width = 18; cv.height = 18; A.deer(cv.getContext('2d'), 2, 9); return cv; }
  if (kind === 'mushroom') { cv.width = 14; cv.height = 10; A.mushrooms(cv.getContext('2d'), 3, 4, makeRng(3)); return cv; }
  const f = kind === 'butterfly' ? 'a' : kind === 'squirrel' ? 'sit' : 'stand', s = frame(kind, f, false);
  cv.width = s.cv.width; cv.height = s.cv.height; cv.getContext('2d').drawImage(s.cv, 0, 0);
  return cv;
}
