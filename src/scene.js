// The game scene: one full-screen pixel canvas showing the lane.
// "Stop" mode: you and Winnie sit at a rest stop beside the lane (a picnic blanket in
// the meadow, a tree stump in the forest). Points scored this round light lanterns
// further along the lane. "Walk" mode: at the end of the round you both get up and
// walk to your lanterns.
import { rect, oval } from './pixel.js';
import * as A from './art.js';
import { makeLeaves } from './weather.js';
import { gingham, tartan, patchwork, welsh, stumpTable, planks, straw, stone, cloth, stripes, prop, seated, lantern } from './reststop.js';
import { BIOMES } from './biomes.js';
import { makeRng } from './pixel.js';
import { sfx, initAudio } from './sound.js';
import { makeCritters } from './critters.js';

const LINES = {
  Fifteen: ['Fifteen two!', 'Fifteen, lovely.', 'Ooh, fifteen.'], '31': ['Thirty-one! Lovely.', 'Thirty-one, ta very much.'],
  Pair: ['Ooh, a pair!', 'Snap!', 'A pair for me.'], 'Pair royal': ['Three of a kind! Cheeky.'], 'Double pair royal': ['Four of a kind! Well I never.'],
  Go: ['That one’s mine, ta.'], 'Last card': ['Last card, ta very much.'], 'His heels': ['His heels! Two for me, dear.'],
  Run: ['A little run, how nice.', 'Ooh, a run.'], 'His nobs': ['One for his nob.'],
};
// what Winnie says when you score well
const MINE = {
  '31': ['Oh, well played.', 'Thirty-one, very good.'], 'Pair royal': ['Ooh, you rascal.'], 'Double pair royal': ['Good heavens!'],
  'His heels': ['Lucky you!'],
};

const RUGS = { red: ['#C98272', '#E2AE9E', '#F2E4CC'], blue: ['#6A8AB4', '#A8BCD8', '#EEF0F4'], mustard: ['#C89A3A', '#E2C478', '#F4E8C8'] };
export const LANTERNS = { gold: '#F2B63C', teal: '#3EC8C0', rose: '#F27A9A', firefly: '#B8F060' };

export function createScene({ canvas, hud, onFind = () => {} }) {
  const c = canvas.getContext('2d');
  hud.innerHTML = `
    <div class="lane-tag you" data-tag="p" hidden>You</div>
    <div class="lane-tag" data-tag="c" hidden>Winnie</div>
    <div class="lantern-tag you" data-lt="p" hidden></div>
    <div class="lantern-tag" data-lt="c" hidden></div>
    <div class="lane-banner" hidden><span class="small"></span><span class="big"></span><span class="line"></span></div>
    <div class="lane-bubble" hidden></div>
    <div class="speech" hidden></div>`;
  const $ = (s) => hud.querySelector(s);
  const banner = $('.lane-banner'), bubble = $('.lane-bubble'), speech = $('.speech');
  const tags = { p: $('[data-tag="p"]'), c: $('[data-tag="c"]') };
  const ltags = { p: $('[data-lt="p"]'), c: $('[data-lt="c"]') };

  let lane = null, scale = 4, aw = 0, ah = 0, camX = 0, camY = 0, last = 0, L = null;
  let mode = 'stop', surfaceAlpha = 1, stop = { from: { p: 0, c: 0 }, hole: 0, biome: 'meadow' }, banked = { p: 0, c: 0 };
  let pos = { p: 0, c: 0 }, target = { p: 0, c: 0 }, stepAt = { p: 0, c: 0 }, walkDone = null;
  let gear = { rug: 'tartan', lantern: 'gold' }, raining = false, rainAmt = 0, drops = [], mist = null, mistAmt = 0, ambientAt = performance.now() + 30000, surf = { key: '', cv: null }, titleY = -1, titleX = 0, looping = false, clouds = null, crit = null, parts = [], light = null, smokeAt = 0, deer = null, seenForest = false, visited = new Set(['meadow']), bannerTimer = 0, speechTimer = 0, leaves = null;

  // ---- layout: where the lane, the surface, the hand and the action bar go on this screen.
  // u is the UI scale (1 at 1440x900); card widths are worked out here so the
  // canvas surface and the HTML laid over it always agree.
  function layout() {
    const W = window.innerWidth, H = window.innerHeight, portrait = H > W * 1.1;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const u = portrait ? clamp(W / 400, 0.8, 1.4) : clamp(Math.min(W / 1440, H / 900), 0.8, 2);
    scale = portrait ? Math.max(2, W / 140) : Math.max(2.4, H / 225);
    // two spare art pixels each way so the view can scroll by fractions of a pixel
    aw = Math.ceil(W / scale) + 2; ah = Math.ceil(H / scale) + 2;
    canvas.width = aw; canvas.height = ah; canvas.style.width = aw * scale + 'px'; canvas.style.height = ah * scale + 'px';
    leaves = makeLeaves(aw, ah, Math.round((aw * ah) / 2600), 9);
    const seatH = Math.round(17 * scale);
    const oppH = (cw) => 18 * u + 0.6 * cw * 1.42 + 12 * u;      // Winnie's row on the surface
    const surfH = (cw) => oppH(cw) + 30 * u + cw * 1.42 + 26 * u; // + label, main row, padding
    let free, surface, hand, bar, cw, ch, top;
    if (portrait) {
      top = Math.round(124 * u);
      const sw = W - Math.round(16 * u);
      cw = Math.min((sw - 120 * u) / 3.9, 96 * u);
      ch = Math.min((W - 12 * u) / 5.3, cw * 1.35);
      const handH = ch * 1.42 * 0.92 + 26 * u, barH = 48 * u, sh = surfH(cw);
      const stack = seatH + sh + 10 * u + barH + 6 * u + handH;
      const strip = Math.max(top + 100 * u, H - stack);
      free = { x: 0, y: top, w: W, h: strip - top };
      surface = { x: Math.round((W - sw) / 2), y: Math.round(strip + seatH), w: sw, h: Math.round(sh) };
      bar = { x: 0, y: Math.round(surface.y + sh + 10 * u), w: W, h: Math.round(barH) };
      hand = { x: 0, y: bar.y + bar.h + Math.round(6 * u), w: W, h: H - (bar.y + bar.h + Math.round(6 * u)) };
    } else {
      top = Math.round(78 * u);
      const fw = Math.max(Math.round(300 * u), Math.round(W * 0.3)), RW = W - fw, pad = 28 * u;
      const barH = 52 * u;
      const avail = H - top - seatH - barH - 30 * u;
      cw = (avail - 120 * u) / (2.27 + 1.42 * 1.25 * 0.9);
      cw = Math.min(cw, (RW - 2 * pad - 230 * u) / 5.4, 132 * u);
      ch = cw * 1.25;
      const sw = Math.min(RW - 2 * pad, cw * 5.8 + 250 * u), sh = surfH(cw);
      const handH = ch * 1.42 * 0.9 + 30 * u;
      const barY = H - handH - barH;
      const room = barY - 14 * u - (top + seatH);
      const sy = top + seatH + Math.max(0, (room - sh) * 0.6);
      free = { x: 0, y: top, w: fw, h: H - top };
      surface = { x: Math.round(fw + (RW - sw) / 2), y: Math.round(sy), w: Math.round(sw), h: Math.round(sh) };
      bar = { x: fw, y: Math.round(barY), w: RW, h: Math.round(barH) };
      hand = { x: fw, y: Math.round(barY + barH), w: RW, h: Math.round(H - barY - barH) };
    }
    L = { W, H, u, portrait, top, free, surface, hand, bar, cw, ch, oppH: oppH(cw), seatH,
      seats: [{ who: 'c', x: surface.x + surface.w * 0.25, y: surface.y + 4 }, { who: 'p', x: surface.x + surface.w * 0.75, y: surface.y + 4 }] };
    return L;
  }

  const holeXY = (f) => {
    const i = Math.max(0, Math.min(121, Math.floor(f))), j = Math.min(121, i + 1), t = f - i;
    const a = lane.holes[i], b = lane.holes[j];
    return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t];
  };
  const toScreen = (x, y) => [(x - camX) * scale, (y - camY) * scale];
  function place(el, x, y) { const [sx, sy] = toScreen(x, y); el.style.left = `${sx}px`; el.style.top = `${sy}px`; }
  // Keep a tag inside the free area; if its lantern is out of view, pin it to the edge.
  function placeIn(el, x, y, R) {
    let [sx, sy] = toScreen(x, y);
    const hw = el.offsetWidth / 2 + 8, th = el.offsetHeight + 8;
    const cx = Math.max(R.x + hw, Math.min(R.x + R.w - hw, sx)), cy = Math.max(R.y + th, Math.min(R.y + R.h - 8, sy));
    el.classList.toggle('edge', Math.abs(cx - sx) > 2 || Math.abs(cy - sy) > 2);
    el.style.left = `${cx}px`; el.style.top = `${cy}px`;
  }

  function showBanner(small, big, line = '', ms = line ? 3000 : 2200) {
    banner.querySelector('.small').textContent = small; banner.querySelector('.big').textContent = big;
    const ln = banner.querySelector('.line'); ln.textContent = line; ln.hidden = !line;
    banner.hidden = false; banner.classList.remove('show'); void banner.offsetWidth; banner.classList.add('show');
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { banner.hidden = true; }, ms);
  }
  function say(text, ms = 2400) {
    if (mode !== 'stop' || !L) return;
    speech.textContent = text; speech.hidden = false;
    const s = L.seats[0]; speech.style.left = `${s.x}px`; speech.style.top = `${s.y - L.seatH - 6}px`;
    clearTimeout(speechTimer); speechTimer = setTimeout(() => { speech.hidden = true; }, ms);
  }

  function onEnter(who, h) {
    sfx('step');
    const holes = lane.holes;
    if (h > 0 && holes[h].biome !== holes[h - 1].biome) {
      const b = holes[h].biome;
      const B = BIOMES[b], first = !visited.has(b); visited.add(b);
      showBanner(who === 'p' ? 'You are entering' : 'Winnie is entering', B.title, first ? B.line : '');
      if (first && b === 'forest') setTimeout(() => sfx('bell'), 900);
      if (b === 'forest' && !seenForest) {
        seenForest = true;
        const k = Math.min(121, h + 3), a = holes[Math.max(0, k - 1)], bb = holes[Math.min(121, k + 1)];
        const ang = Math.atan2(bb.y - a.y, bb.x - a.x);
        deer = { x: holes[k].x - Math.sin(ang) * 34 + 4, y: holes[k].y + Math.cos(ang) * 34, until: performance.now() + 7000 }; onFind('deer');
        bubble.textContent = 'A deer stops to watch you pass.';
        sfx('chime');
      }
    }
    if (h === 121) { showBanner(who === 'p' ? 'You made it' : 'Winnie made it', 'Home!', '', 6000); sfx('win'); }
  }

  function drawSurface(biome) {
    const s = L.surface, x = Math.round(s.x / scale), y = Math.round(s.y / scale), w = Math.round(s.w / scale), h = Math.round(s.h / scale);
    const key = [biome, x, y, w, h, aw, ah, stop.hole, A.WALKERS.p.name, gear.rug].join('|');
    if (surf.key !== key) {
      surf.key = key; surf.cv = document.createElement('canvas'); surf.cv.width = aw; surf.cv.height = ah;
      paintSurface(surf.cv.getContext('2d'), biome, x, y, w, h);
    }
    c.drawImage(surf.cv, 0, 0);
  }
  function paintSurface(c, biome, x, y, w, h) {
    const B = BIOMES[biome] || BIOMES.meadow, rng = makeRng(stop.hole * 7 + 3);
    if (B.surface === 'slab') stumpTable(c, x, y, w, h);
    else if (B.surface === 'planks') planks(c, x, y, w, h);
    else if (B.surface === 'straw') straw(c, x, y, w, h, rng);
    else if (B.surface === 'stone') stone(c, x, y, w, h, rng);
    else if (B.surface === 'cloth') cloth(c, x, y, w, h);
    else if (B.surface === 'stripes') stripes(c, x, y, w, h);
    else if (biome === 'meadow' && gear.rug === 'tartan') tartan(c, x, y, w, h);
    else if (biome === 'meadow' && gear.rug === 'welsh') welsh(c, x, y, w, h);
    else if (biome === 'meadow' && gear.rug === 'patchwork') patchwork(c, x, y, w, h, rng);
    else gingham(c, x, y, w, h, biome === 'meadow' ? RUGS[gear.rug] || B.rug : B.rug);
    // something set down in the empty corner beside you
    prop(c, B.prop, Math.round(Math.min(x + w * 0.9 - 8, x + w - 32)), y + 6, rng);
    for (const st of L.seats) seated(c, st.who, st.x / scale, st.y / scale);
  }

  function frame(t) {
    const dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (!lane || !L) { requestAnimationFrame(frame); return; }
    // walking
    if (mode === 'walk') {
      let moving = false;
      for (const w of ['p', 'c']) {
        if (pos[w] < target[w]) {
          moving = true;
          if (t >= stepAt[w]) {
            pos[w] = Math.min(target[w], Math.floor(pos[w]) + 1);
            stepAt[w] = t + Math.max(70, 170 - (target[w] - pos[w]) * 10);
            onEnter(w, pos[w]);
          }
        }
      }
      if (!moving && walkDone && t > Math.max(stepAt.p, stepAt.c) + 500) { const d = walkDone; walkDone = null; d(); }
    }
    surfaceAlpha += ((mode === 'stop' ? 1 : 0) - surfaceAlpha) * Math.min(1, dt * 6);

    // camera
    let fx, fy, free;
    if (mode === 'stop') {
      free = L.free;
      // Frame the lanterns first, then where the round started, if it all fits.
      const fwA = free.w / scale - 40, fhA = free.h / scale - 50;
      const box = (ps) => { const xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
      const lan = [banked.p, banked.c].map(holeXY), all = [...lan, ...[stop.from.p, stop.from.c].map(holeXY)];
      let b = box(all);
      if (b[2] - b[0] > fwA || b[3] - b[1] > fhA) b = box(lan);
      if (b[2] - b[0] > fwA || b[3] - b[1] > fhA) b = box([lan[0]]);
      fx = (b[0] + b[2]) / 2; fy = (b[1] + b[3]) / 2 - 6;
    } else if (mode === 'title') {
      // a steady glide straight down the lane, easing sideways to follow its bends
      const H0 = lane.holes, top = H0[0].y, end = H0[112].y;
      if (titleY < 0) { titleY = top + ah * 0.4; titleX = laneX(titleY); }
      titleY += dt * 9;
      titleX += (laneX(titleY + 40) - titleX) * Math.min(1, dt * 0.35);
      if (titleY > end && !looping) { looping = true; canvas.style.transition = 'opacity .7s'; canvas.style.opacity = '0';
        setTimeout(() => { titleY = top + ah * 0.4; titleX = laneX(titleY); canvas.style.opacity = '1'; looping = false; }, 750); }
      fx = titleX; fy = titleY + 20;
      free = { x: 0, y: 0, w: L.W, h: L.H };
    } else {
      const [px, py] = holeXY(pos.p), [cx, cy] = holeXY(pos.c);
      if (Math.abs(py - cy) < ah * 0.6) { fx = (px + cx) / 2; fy = (py + cy) / 2; }
      else { const lead = (pos.p < target.p) ? 'p' : (pos.c < target.c ? 'c' : 'p'); [fx, fy] = holeXY(pos[lead]); }
      free = { x: 0, y: 0, w: L.W, h: L.H };
    }
    const tx = Math.max(0, Math.min(lane.canvas.width - aw, fx - (free.x + free.w / 2) / scale));
    const ty = Math.max(0, Math.min(lane.height - ah, fy - (free.y + free.h * 0.5) / scale));
    const k = mode === 'title' ? 1 : Math.min(1, dt * 3);
    if (camX < 0) { camX = tx; camY = ty; }
    camX += (tx - camX) * k; camY += (ty - camY) * k;
    // While moving, draw at whole pixels and slide the canvas by the fraction left
    // over, so scrolling is smooth. At a rest stop, snap so the table lines up.
    const glide = mode !== 'stop' || surfaceAlpha < 0.02;
    const ix = glide ? Math.floor(camX) : Math.round(camX), iy = glide ? Math.floor(camY) : Math.round(camY);
    canvas.style.transform = glide ? `translate(${(-(camX - ix) * scale).toFixed(2)}px,${(-(camY - iy) * scale).toFixed(2)}px)` : '';

    rect(c, 0, 0, aw, ah, '#55702E');
    const sw = Math.min(aw, lane.canvas.width - ix), sh = Math.min(ah, lane.height - iy);
    c.drawImage(lane.canvas, ix, iy, sw, sh, 0, 0, sw, sh);
    const walkedTo = mode === 'walk' ? Math.max(pos.p, pos.c) : Math.max(stop.from.p, stop.from.c);
    for (let i = 1; i <= walkedTo; i++) { const Lf = lane.leaves[i]; rect(c, Lf.x - ix, Lf.y - iy, 2, 1, Lf.col); }

    // everything standing, in depth order: scenery, animals, walkers, lanterns
    const list = [], x0 = ix, y0 = iy, x1 = ix + aw, y1 = iy + ah;
    for (const o of lane.objects) {
      if (o.x + 34 < x0 || o.x - 34 > x1 || o.y - 60 > y1 || o.y + 12 < y0) continue;
      list.push({ y: o.y, draw: () => drawObj(o, t, ix, iy, dt) });
    }
    const walkersAt = mode === 'walk' || (mode === 'stop' && surfaceAlpha < 0.6) ? ['p', 'c'].map((w) => { const [x, y] = holeXY(pos[w]); return [x + (w === 'c' ? -4 : 4), y]; }) : null;
    crit.update(dt, t / 1000, walkersAt);
    crit.drawables(x0, y0, x1, y1, list);
    for (const w of ['p', 'c']) {
      const show = mode === 'stop' && banked[w] > stop.from[w];
      ltags[w].hidden = !show;
      if (!show) continue;
      for (let i = stop.from[w] + 1; i < banked[w]; i++) { const [hx, hy] = holeXY(i); rect(c, hx - 1 - ix, hy - 1 - iy, 2, 2, w === 'p' ? '#FFD48A' : '#D8B0E8'); }
      const [lx, ly] = holeXY(banked[w]);
      const side = w === 'p' ? 9 : -9;
      list.push({ y: ly + 2, draw: () => lantern(c, lx + side - ix, ly + 2 - iy, w === 'p' ? LANTERNS[gear.lantern] || '#F2B63C' : '#B07AC8') });
      ltags[w].textContent = `${w === 'p' ? 'You' : 'Winnie'} to ${banked[w]}`;
      placeIn(ltags[w], lx + side, ly - 14, L.free);
    }
    if (deer) {
      if (t > deer.until) { deer = null; bubble.hidden = true; }
      else { list.push({ y: deer.y + 6, draw: () => A.deer(c, deer.x - ix, deer.y - iy) }); bubble.hidden = false; placeIn(bubble, deer.x + 6, deer.y - 12, mode === 'stop' ? L.free : { x: 0, y: L.top + 70 * L.u, w: L.W, h: L.H - L.top - 70 * L.u }); }
    }
    for (const w of ['c', 'p']) {
      const showW = !!walkersAt;
      tags[w].hidden = !showW;
      if (!showW) continue;
      const [x, y] = holeXY(pos[w]), ox = w === 'c' ? -4 : 4;
      const bob = pos[w] < target[w] ? Math.floor(t / 120) % 2 : Math.floor(t / 700 + (w === 'c' ? 1 : 0)) % 2;
      list.push({ y: y + 1, draw: () => A.walker(c, w, x + ox - ix, y - iy + 1, bob) });
      place(tags[w], x + ox, y - 23);
    }
    list.sort((a, b) => a.y - b.y).forEach((d) => d.draw(c, ix, iy));

    // particles: leaves shaken loose, puffs, chimney smoke
    const home = lane.objects.find((o) => o.smoke);
    if (home && t > smokeAt && Math.abs(home.y - (iy + ah / 2)) < ah) { smokeAt = t + 450; parts.push({ x: home.x + 9, y: home.y - 43, vx: 3, vy: -6, life: 3, max: 3, col: '#E8E2D8', size: 2 }); }
    parts = parts.filter((p) => (p.life -= dt) > 0);
    for (const p of parts) {
      p.ph = (p.ph || 0) + dt * 4; p.x += (p.vx + (p.leaf ? Math.sin(p.ph) * 8 : 0)) * dt; p.y += p.vy * dt; if (p.leaf && p.y < p.floor) p.vy = Math.min(p.vy + 30 * dt, 14); else if (p.leaf) p.vy = 0;
      c.globalAlpha = Math.min(1, p.life / Math.min(1, p.max)); rect(c, p.x - ix, p.y - iy, p.size || (p.leaf && Math.sin(p.ph) > 0 ? 2 : 1), p.leaf ? 1 : (p.size || 1), p.col); c.globalAlpha = 1;
    }
    // light: shafts in forest clearings, warm light from the top left, a soft vignette
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const sh2 of lane.shafts) {
      if (Math.abs(sh2.x - (ix + aw / 2)) > aw || Math.abs(sh2.y - (iy + ah / 2)) > ah) continue;
      const a = 0.05 + Math.sin(t / 1300 + sh2.ph) * 0.02, x = sh2.x - ix, y = sh2.y - iy;
      c.fillStyle = `rgba(255,236,170,${a.toFixed(3)})`;
      for (const [o, w] of [[-10, 9], [6, 6]]) { c.beginPath(); c.moveTo(x + o - 30, y - 70); c.lineTo(x + o - 30 + w, y - 70); c.lineTo(x + o + w + 4, y + 6); c.lineTo(x + o + 4, y + 6); c.fill(); }
    }
    c.restore();
    // soft cloud shadows drifting slowly over the lane
    if (!clouds) clouds = c.createPattern(makeClouds(lane.seed), 'repeat');
    const drift = t / 1000 * 4;
    c.save(); c.translate(-((ix - drift) % 512) - 512, -((iy - drift * 0.35) % 384) - 384); c.fillStyle = clouds; c.fillRect(0, 0, aw + 1024, ah + 768); c.restore();
    const midY = iy + ah / 2, near = lane.holes.reduce((a, h) => (Math.abs(h.y - midY) < Math.abs(a.y - midY) ? h : a), lane.holes[0]), inForest = near.biome === 'forest';
    mistAmt += ((inForest ? 1 : 0) - mistAmt) * Math.min(1, dt * 0.5);
    if (mistAmt > 0.02) {
      if (!mist) mist = c.createPattern(makeClouds(lane.seed + 77, [236, 238, 240], 0.9), 'repeat');
      const md = t / 1000 * 2.5;
      c.save(); c.globalAlpha = mistAmt * 0.8; c.translate(-((ix + md) % 512) - 512, -((iy) % 384) - 384); c.fillStyle = mist; c.fillRect(0, 0, aw + 1024, ah + 768); c.restore();
    }
    if (!light || light.width !== aw || light.height !== ah) light = makeLight(aw, ah);
    c.drawImage(light, 0, 0);

    // the rest stop
    if (surfaceAlpha > 0.02) {
      c.save(); c.globalAlpha = surfaceAlpha;
      const s = L.surface;
      // soften the scenery behind the play area, fading in from the lane view
      const e = L.portrait ? (L.free.y + L.free.h) / scale : L.free.w / scale, f = 24;
      const g = L.portrait ? c.createLinearGradient(0, e - f, 0, e + f) : c.createLinearGradient(e - f, 0, e + f, 0);
      g.addColorStop(0, 'rgba(20,12,18,0)'); g.addColorStop(1, 'rgba(20,12,18,0.2)');
      c.fillStyle = g; c.fillRect(0, 0, aw, ah);
      drawSurface(stop.biome);
      c.restore();
    }
    leaves.update(dt); leaves.draw(c);
    // drizzle on some rounds
    rainAmt += ((raining ? 1 : 0) - rainAmt) * Math.min(1, dt * 0.6);
    if (rainAmt > 0.02) {
      if (drops.length < 140) for (let i = drops.length; i < 140; i++) drops.push({ x: Math.random() * aw, y: Math.random() * ah, v: 90 + Math.random() * 50 });
      c.fillStyle = `rgba(200,212,228,${(0.4 * rainAmt).toFixed(3)})`;
      const n = Math.round(drops.length * rainAmt);
      for (let i = 0; i < n; i++) { const d = drops[i]; d.y += d.v * dt; d.x -= d.v * dt * 0.25; if (d.y > ah) { d.y = -3; d.x = Math.random() * (aw + 20); } c.fillRect(Math.round(d.x), Math.round(d.y), 1, 3); }
      c.fillStyle = `rgba(110,120,140,${(0.07 * rainAmt).toFixed(3)})`; c.fillRect(0, 0, aw, ah);
    }
    // the odd wood pigeon or rook, now and then
    if (t > ambientAt) { ambientAt = t + 50000 + Math.random() * 70000; if (lane && mode !== 'title') sfx(Math.random() < 0.6 ? 'coo' : 'caw'); }
    requestAnimationFrame(frame);
  }

  // Where the lane is across, at a given height.
  function laneX(y) {
    const H0 = lane.holes;
    for (let i = 1; i < H0.length; i++) if (H0[i].y >= y) { const a = H0[i - 1], b = H0[i], t = (y - a.y) / Math.max(1, b.y - a.y); return a.x + (b.x - a.x) * Math.max(0, Math.min(1, t)); }
    return H0[H0.length - 1].x;
  }
  // A scenery sprite. Tall things sway at the top; a shaken tree rocks for a moment.
  function drawObj(o, t, ix, iy, dt) {
    const s = o.s, bx = o.x - s.ax - ix, by = o.y - s.ay - iy;
    if (o.shake) o.shake = Math.max(0, o.shake - dt);
    let dx = 0;
    if (o.sway === 1) dx = Math.round(Math.sin(t / 900 + o.ph + o.x * 0.02) * 0.8);
    else if (o.sway === 2) dx = Math.round(Math.sin(t / 650 + o.x * 0.08) * 0.9);
    if (o.shake) dx = Math.round(Math.sin(t / 40) * 2 * Math.min(1, o.shake * 2));
    if (!dx) { c.drawImage(s.cv, bx, by); return; }
    const split = Math.max(1, s.ay - (o.sway === 2 ? 3 : 11)), w = s.cv.width, h = s.cv.height;
    c.drawImage(s.cv, 0, split, w, h - split, bx, by + split, w, h - split);
    c.drawImage(s.cv, 0, 0, w, split, bx + dx, by, w, split);
  }

  // A tileable sheet of soft cloud shadows: clusters of round puffs, with the
  // soft edge dithered in two steps so it still reads as pixel art.
  function makeClouds(seed, rgb = [24, 18, 52], k = 1) {
    const W2 = 512, H2 = 384, cv = document.createElement('canvas'); cv.width = W2; cv.height = H2;
    const g = cv.getContext('2d'), img = g.createImageData(W2, H2), d = img.data, rng = makeRng(seed * 13 + 1);
    const puffs = [];
    for (let k = 0; k < 4; k++) {
      const cx = rng.range(0, W2), cy = rng.range(0, H2), n = rng.int(5, 8);
      for (let i = 0; i < n; i++) puffs.push([cx + rng.range(-60, 60), cy + rng.range(-20, 20), rng.range(22, 40)]);
    }
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      let a = 0;
      for (const [px, py, r] of puffs) {
        let dx = Math.abs(x - px), dy = Math.abs(y - py); dx = Math.min(dx, W2 - dx); dy = Math.min(dy, H2 - dy) * 1.6;
        const q = 1 - Math.hypot(dx, dy) / r; if (q > a) a = q;
      }
      if (a <= 0) continue;
      const th = (B[(y & 3) * 4 + (x & 3)] + 0.5) / 16, lvl = a > 0.35 ? 2 : a * 2.86 > th ? 1 : 0;
      if (!lvl) continue;
      const i = (y * W2 + x) * 4; d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = Math.round((lvl === 2 ? 58 : 30) * k);
    }
    g.putImageData(img, 0, 0);
    return cv;
  }
  function makeLight(w, h) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    const warm = g.createRadialGradient(w * 0.1, -h * 0.1, 0, w * 0.1, -h * 0.1, Math.max(w, h) * 1.1);
    warm.addColorStop(0, 'rgba(255,220,160,0.11)'); warm.addColorStop(0.6, 'rgba(255,210,150,0.03)'); warm.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = warm; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(190,198,210,0.06)'; g.fillRect(0, 0, w, h);
    const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(40,22,48,0)'); v.addColorStop(1, 'rgba(40,22,48,0.18)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    return cv;
  }

  // Clicking the scenery: animals react, trees rustle, mushrooms puff.
  const CLICK = { tree: [11, 26], bush: [8, 10], hedge: [7, 10], mush: [6, 6] };
  function hitAt(e) {
    if (!lane || !crit) return null;
    const ax = e.clientX / scale + camX, ay = e.clientY / scale + camY;
    const cr = crit.hit(ax, ay);
    if (cr) return { cr };
    let best = null;
    for (const o of lane.objects) {
      const box = CLICK[o.kind]; if (!box) continue;
      if (Math.abs(ax - o.x) < box[0] && ay < o.y + 2 && ay > o.y - box[1] && (!best || o.y > best.y)) best = o;
    }
    return best ? { o: best, ax, ay } : null;
  }
  canvas.addEventListener('pointermove', (e) => { const h = hitAt(e); canvas.style.cursor = h ? 'pointer' : ''; });
  canvas.addEventListener('pointerdown', (e) => {
    initAudio();
    const h = hitAt(e); if (!h) return;
    if (h.cr) { crit.poke(h.cr); return; }
    const o = h.o;
    if (o.kind === 'mush') {
      sfx('pop'); onFind('mushroom');
      for (let i = 0; i < 8; i++) parts.push({ x: o.x + Math.random() * 6 - 3, y: o.y - 3, vx: Math.random() * 16 - 8, vy: -Math.random() * 14 - 4, life: 0.9, max: 0.9, col: '#F2EEDC' });
      return;
    }
    o.shake = 0.6; sfx('rustle');
    const cols = ['#B47238', '#C49A44', '#94502A', '#A88A3A', '#6C8244', '#8E5228'];
    const n = o.kind === 'tree' ? 6 : 3, top = o.kind === 'tree' ? 24 : 9;
    for (let i = 0; i < n; i++) parts.push({ leaf: true, x: o.x + Math.random() * 18 - 9, y: o.y - top + Math.random() * 8, vx: Math.random() * 6 - 3, vy: 4, floor: o.y + Math.random() * 6, life: 3, max: 3, col: cols[Math.floor(Math.random() * cols.length)] });
    crit.flush(o);
  });
  function sayAt(text, x, y) {
    const d = document.createElement('div'); d.className = 'critter-say'; d.textContent = text;
    hud.appendChild(d); place(d, x, y); setTimeout(() => d.remove(), 1300);
  }

  window.addEventListener('resize', () => { layout(); });
  layout();
  requestAnimationFrame(frame);

  return {
    layout: () => L,
    get debug() { return { crit, camX, camY, scale, lane }; },
    relayout: layout,
    reset(newLane) {
      lane = newLane; clouds = null; mist = null; deer = null; seenForest = false; visited = new Set(['meadow']); parts = [];
      crit = makeCritters(lane.critters, lane.objects, lane.seed, { found: onFind, say: sayAt, clear: (x, y) => lane.free(x, y), spot: (x, y) => lane.spotNear(x, y) }); bubble.hidden = true; banner.hidden = true; speech.hidden = true;
      pos = { p: 0, c: 0 }; target = { p: 0, c: 0 };
      this.setStop({ p: 0, c: 0 });
      const [x, y] = holeXY(0); camX = Math.max(0, x - L.free.w / 2 / scale); camY = Math.max(0, y - L.free.h / 2 / scale);
    },
    // Sit down at a new rest stop near both walkers.
    setStop(from) {
      const hole = Math.round((from.p + from.c) / 2);
      stop = { from: { ...from }, hole, biome: lane.holes[Math.max(1, hole)].biome };
      banked = { ...from }; pos = { ...from }; target = { ...from }; mode = 'stop';
      raining = from.p + from.c > 0 && Math.random() < 0.25;
      return stop.biome;
    },
    setBanked(score) { banked = { p: Math.min(121, score.p), c: Math.min(121, score.c) }; },
    // Get up and walk to the lanterns. Resolves when both have arrived.
    walk(to) {
      speech.hidden = true;
      mode = 'walk'; pos = { ...stop.from }; target = { p: Math.min(121, to.p), c: Math.min(121, to.c) };
      const now = performance.now(); stepAt = { p: now + 700, c: now + 700 };
      return new Promise((res) => { walkDone = res; });
    },
    say,
    // Menu backdrop: drift slowly down the lane with nobody on it.
    setGear(g) { gear = { ...gear, ...g }; surf.key = ''; },
    resume() { if (mode === 'title') { mode = 'stop'; camX = camY = -1; } },
    title() { raining = false; mode = 'title'; titleY = -1; camX = camY = -1; speech.hidden = true; banner.hidden = true; bubble.hidden = true; deer = null; },
    react(label, who) {
      const key = label.startsWith('Run') ? 'Run' : label;
      const opts = (who === 'c' ? LINES : MINE)[key];
      if (opts && (who === 'c' || Math.random() < 0.5)) say(opts[Math.floor(Math.random() * opts.length)]);
    },
  };
}
