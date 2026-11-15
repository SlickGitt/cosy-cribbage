// The game scene: one full-screen pixel canvas showing the lane.
// "Stop" mode: you and Winnie sit at a rest stop beside the lane (a picnic blanket in
// the meadow, a tree stump in the forest). Points scored this round light lanterns
// further along the lane. "Walk" mode: at the end of the round you both get up and
// walk to your lanterns.
import { rect, oval } from './pixel.js';
import * as A from './art.js';
import { makeLeaves } from './weather.js';
import { gingham, stumpTable, seated, lantern } from './reststop.js';
import { sfx } from './sound.js';

const LINES = {
  Fifteen: ['Fifteen two!', 'Fifteen, lovely.'], '31': ['Thirty-one!'], Pair: ['Ooh, a pair!', 'A pair for me.'],
  'Pair royal': ['Three of a kind!'], 'Double pair royal': ['Four! Goodness me.'], Go: ['That one’s mine.'],
  'Last card': ['Last card, thank you.'], 'His heels': ['His heels, two for me!'], Run: ['A little run!'],
};

export function createScene({ canvas, hud }) {
  const c = canvas.getContext('2d');
  hud.innerHTML = `
    <div class="lane-tag you" data-tag="p" hidden>You</div>
    <div class="lane-tag" data-tag="c" hidden>Winnie</div>
    <div class="lantern-tag you" data-lt="p" hidden></div>
    <div class="lantern-tag" data-lt="c" hidden></div>
    <div class="lane-banner" hidden><span class="small"></span><span class="big"></span></div>
    <div class="lane-bubble" hidden></div>
    <div class="speech" hidden></div>`;
  const $ = (s) => hud.querySelector(s);
  const banner = $('.lane-banner'), bubble = $('.lane-bubble'), speech = $('.speech');
  const tags = { p: $('[data-tag="p"]'), c: $('[data-tag="c"]') };
  const ltags = { p: $('[data-lt="p"]'), c: $('[data-lt="c"]') };

  let lane = null, scale = 4, aw = 0, ah = 0, camX = 0, camY = 0, last = 0, L = null;
  let mode = 'stop', surfaceAlpha = 1, stop = { from: { p: 0, c: 0 }, hole: 0, biome: 'meadow' }, banked = { p: 0, c: 0 };
  let pos = { p: 0, c: 0 }, target = { p: 0, c: 0 }, stepAt = { p: 0, c: 0 }, walkDone = null;
  let deer = null, seenForest = false, bannerTimer = 0, speechTimer = 0, leaves = null;

  // ---- layout: where the lane, the surface and the hand go on this screen
  function layout() {
    const W = window.innerWidth, H = window.innerHeight, portrait = H > W * 1.1;
    scale = portrait ? Math.max(2, W / 140) : Math.max(2.4, H / 225);
    aw = Math.ceil(W / scale); ah = Math.ceil(H / scale);
    canvas.width = aw; canvas.height = ah; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    leaves = makeLeaves(aw, ah, Math.round((aw * ah) / 2600), 9);
    let free, surface, hand;
    if (portrait) {
      const strip = Math.round(H * 0.24);
      free = { x: 0, y: 0, w: W, h: strip };
      surface = { x: 10, y: strip + 58, w: W - 20, h: Math.round(H * 0.3) };
      hand = { x: 0, y: surface.y + surface.h + 8, w: W, h: H - (surface.y + surface.h + 8) };
    } else {
      const fw = Math.max(260, Math.round(W * 0.3));
      free = { x: 0, y: 0, w: fw, h: H };
      surface = { x: fw + 20, y: 132, w: W - fw - 40, h: Math.round(H * 0.64) - 132 };
      hand = { x: fw, y: surface.y + surface.h + 6, w: W - fw, h: H - (surface.y + surface.h + 6) };
    }
    L = { W, H, portrait, free, surface, hand,
      seats: [{ who: 'c', x: surface.x + surface.w * 0.32, y: surface.y + 4 }, { who: 'p', x: surface.x + surface.w * 0.68, y: surface.y + 4 }] };
    return L;
  }

  const holeXY = (f) => {
    const i = Math.max(0, Math.min(121, Math.floor(f))), j = Math.min(121, i + 1), t = f - i;
    const a = lane.holes[i], b = lane.holes[j];
    return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t];
  };
  const toScreen = (x, y) => [(x - camX) * scale, (y - camY) * scale];
  function place(el, x, y) { const [sx, sy] = toScreen(x, y); el.style.left = `${sx}px`; el.style.top = `${sy}px`; }

  function showBanner(small, big, ms = 2200) {
    banner.querySelector('.small').textContent = small; banner.querySelector('.big').textContent = big;
    banner.hidden = false; banner.classList.remove('show'); void banner.offsetWidth; banner.classList.add('show');
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { banner.hidden = true; }, ms);
  }
  function say(text, ms = 2400) {
    if (mode !== 'stop' || !L) return;
    speech.textContent = text; speech.hidden = false;
    const s = L.seats[0]; speech.style.left = `${s.x - 20}px`; speech.style.top = `${s.y - 74}px`;
    clearTimeout(speechTimer); speechTimer = setTimeout(() => { speech.hidden = true; }, ms);
  }

  function onEnter(who, h) {
    sfx('step');
    const holes = lane.holes;
    if (h > 0 && holes[h].biome !== holes[h - 1].biome) {
      const b = holes[h].biome;
      showBanner(who === 'p' ? 'You are entering' : 'Winnie is entering', b === 'forest' ? 'The forest' : 'The meadow');
      if (b === 'forest' && !seenForest) {
        seenForest = true;
        const k = Math.min(121, h + 3), a = holes[Math.max(0, k - 1)], bb = holes[Math.min(121, k + 1)];
        const ang = Math.atan2(bb.y - a.y, bb.x - a.x);
        deer = { x: holes[k].x - Math.sin(ang) * 34 + 4, y: holes[k].y + Math.cos(ang) * 34, until: performance.now() + 7000 };
        bubble.textContent = 'A deer stops to watch you pass.';
        sfx('chime');
      }
    }
    if (h === 121) { showBanner(who === 'p' ? 'You made it' : 'Winnie made it', 'Home!', 6000); sfx('win'); }
  }

  function drawSurface(biome) {
    const s = L.surface, x = s.x / scale, y = s.y / scale, w = s.w / scale, h = s.h / scale;
    if (biome === 'forest') {
      stumpTable(c, x + w / 2, y + h / 2 - 3, Math.round(w / 2 - 3), Math.round(h / 2 - 6));
    } else {
      gingham(c, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      const bx = x + w - 10, by = y + h - 4;
      rect(c, bx, by - 6, 16, 12, '#B07A3E'); for (let i = 0; i < 16; i += 3) rect(c, bx + i, by - 6, 1, 12, '#8A5A2A');
      rect(c, bx + 2, by - 12, 12, 2, '#8A5A2A'); rect(c, bx + 2, by - 12, 2, 6, '#8A5A2A'); rect(c, bx + 12, by - 12, 2, 6, '#8A5A2A');
      rect(c, x + 4, y + h + 3, 4, 4, '#D0302A'); rect(c, x + 10, y + h + 4, 4, 4, '#D0302A');
    }
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
      const ps = [stop.from.p, stop.from.c, banked.p, banked.c].map(holeXY);
      fx = ps.reduce((a, p) => a + p[0], 0) / 4; fy = ps.reduce((a, p) => a + p[1], 0) / 4;
      free = L.free;
    } else {
      const [px, py] = holeXY(pos.p), [cx, cy] = holeXY(pos.c);
      if (Math.abs(py - cy) < ah * 0.6) { fx = (px + cx) / 2; fy = (py + cy) / 2; }
      else { const lead = (pos.p < target.p) ? 'p' : (pos.c < target.c ? 'c' : 'p'); [fx, fy] = holeXY(pos[lead]); }
      free = { x: 0, y: 0, w: L.W, h: L.H };
    }
    const tx = Math.max(0, Math.min(lane.canvas.width - aw, fx - (free.x + free.w / 2) / scale));
    const ty = Math.max(0, Math.min(lane.height - ah, fy - (free.y + free.h * 0.5) / scale));
    const k = Math.min(1, dt * 3);
    camX += (tx - camX) * k; camY += (ty - camY) * k;
    const ix = Math.round(camX), iy = Math.round(camY);

    rect(c, 0, 0, aw, ah, '#55702E');
    const sw = Math.min(aw, lane.canvas.width - ix), sh = Math.min(ah, lane.height - iy);
    c.drawImage(lane.canvas, ix, iy, sw, sh, 0, 0, sw, sh);
    const walkedTo = mode === 'walk' ? Math.max(pos.p, pos.c) : Math.max(stop.from.p, stop.from.c);
    for (let i = 1; i <= walkedTo; i++) { const Lf = lane.leaves[i]; rect(c, Lf.x - ix, Lf.y - iy, 2, 1, Lf.col); }

    // lanterns for points banked this round
    for (const w of ['p', 'c']) {
      const show = mode === 'stop' && banked[w] > stop.from[w];
      ltags[w].hidden = !show;
      if (!show) continue;
      for (let i = stop.from[w] + 1; i < banked[w]; i++) { const [hx, hy] = holeXY(i); rect(c, hx - 1 - ix, hy - 1 - iy, 2, 2, w === 'p' ? '#FFD48A' : '#D8B0E8'); }
      const [lx, ly] = holeXY(banked[w]);
      const side = w === 'p' ? 9 : -9;
      lantern(c, lx + side - ix, ly + 2 - iy, w === 'p' ? '#F2B63C' : '#B07AC8');
      ltags[w].textContent = `${w === 'p' ? 'You' : 'Winnie'} to ${banked[w]}`;
      place(ltags[w], lx + side, ly - 14);
    }
    if (deer) {
      if (t > deer.until) { deer = null; bubble.hidden = true; }
      else { A.deer(c, deer.x - ix, deer.y - iy); bubble.hidden = false; place(bubble, deer.x + 6, deer.y - 12); }
    }
    // walkers on the lane while walking
    for (const w of ['c', 'p']) {
      const showW = mode === 'walk' || surfaceAlpha < 0.6;
      tags[w].hidden = !showW;
      if (!showW) continue;
      const [x, y] = holeXY(pos[w]), ox = w === 'c' ? -4 : 4;
      const bob = pos[w] < target[w] ? Math.floor(t / 120) % 2 : Math.floor(t / 700 + (w === 'c' ? 1 : 0)) % 2;
      A.walker(c, w, x + ox - ix, y - iy + 1, bob);
      place(tags[w], x + ox, y - 23);
    }
    // the rest stop
    if (surfaceAlpha > 0.02) {
      c.save(); c.globalAlpha = surfaceAlpha;
      const s = L.surface;
      if (!L.portrait) { c.fillStyle = 'rgba(20,12,18,0.18)'; c.fillRect(L.free.w / scale, 0, aw, ah); }
      else { c.fillStyle = 'rgba(20,12,18,0.18)'; c.fillRect(0, L.free.h / scale, aw, ah); }
      drawSurface(stop.biome);
      c.restore();
    }
    leaves.update(dt); leaves.draw(c);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => { layout(); });
  layout();
  requestAnimationFrame(frame);

  return {
    layout: () => L,
    relayout: layout,
    reset(newLane) {
      lane = newLane; deer = null; seenForest = false; bubble.hidden = true; banner.hidden = true; speech.hidden = true;
      pos = { p: 0, c: 0 }; target = { p: 0, c: 0 };
      this.setStop({ p: 0, c: 0 });
      const [x, y] = holeXY(0); camX = Math.max(0, x - L.free.w / 2 / scale); camY = Math.max(0, y - L.free.h / 2 / scale);
    },
    // Sit down at a new rest stop near both walkers.
    setStop(from) {
      const hole = Math.round((from.p + from.c) / 2);
      stop = { from: { ...from }, hole, biome: lane.holes[Math.max(1, hole)].biome };
      banked = { ...from }; pos = { ...from }; target = { ...from }; mode = 'stop';
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
    react(label, who) {
      if (who !== 'c') return;
      const key = label.startsWith('Run') ? 'Run' : label;
      const opts = LINES[key]; if (opts) say(opts[Math.floor(Math.random() * opts.length)]);
    },
  };
}
