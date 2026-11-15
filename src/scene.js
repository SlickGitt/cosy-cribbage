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

  // ---- layout: where the lane, the surface, the hand and the action bar go on this screen.
  // u is the UI scale (1 at 1440x900); card widths are worked out here so the
  // canvas surface and the HTML laid over it always agree.
  function layout() {
    const W = window.innerWidth, H = window.innerHeight, portrait = H > W * 1.1;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const u = portrait ? clamp(W / 400, 0.8, 1.4) : clamp(Math.min(W / 1440, H / 900), 0.8, 2);
    scale = portrait ? Math.max(2, W / 140) : Math.max(2.4, H / 225);
    aw = Math.ceil(W / scale); ah = Math.ceil(H / scale);
    canvas.width = aw; canvas.height = ah; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    leaves = makeLeaves(aw, ah, Math.round((aw * ah) / 2600), 9);
    const seatH = Math.round(17 * scale);
    const oppH = (cw) => 14 * u + 0.6 * cw * 1.42 + 10 * u;      // Winnie's row on the surface
    const surfH = (cw) => oppH(cw) + 28 * u + cw * 1.42 + 18 * u; // + label, main row, padding
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

  function showBanner(small, big, ms = 2200) {
    banner.querySelector('.small').textContent = small; banner.querySelector('.big').textContent = big;
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
    const s = L.surface, x = Math.round(s.x / scale), y = Math.round(s.y / scale), w = Math.round(s.w / scale), h = Math.round(s.h / scale);
    if (biome === 'forest') {
      stumpTable(c, x, y, w, h);
    } else {
      gingham(c, x, y, w, h);
      // a basket and two apples in the empty corner beside you
      const bx = Math.round(x + w * 0.9 - 8), by = y + 6;
      rect(c, bx - 1, by + 13, 18, 2, 'rgba(20,10,10,0.25)');
      rect(c, bx, by + 1, 16, 12, '#B07A3E'); for (let i = 0; i < 16; i += 3) rect(c, bx + i, by + 1, 1, 12, '#8A5A2A');
      rect(c, bx, by + 1, 16, 1, '#8A5A2A');
      rect(c, bx + 2, by - 5, 12, 2, '#8A5A2A'); rect(c, bx + 2, by - 5, 2, 6, '#8A5A2A'); rect(c, bx + 12, by - 5, 2, 6, '#8A5A2A');
      rect(c, bx - 9, by + 8, 4, 4, '#D0302A'); rect(c, bx - 8, by + 7, 1, 1, '#4E8A3A'); rect(c, bx - 5, by + 10, 4, 4, '#C8402F');
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
      free = L.free;
      // Frame the lanterns first, then where the round started, if it all fits.
      const fwA = free.w / scale - 40, fhA = free.h / scale - 50;
      const box = (ps) => { const xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
      const lan = [banked.p, banked.c].map(holeXY), all = [...lan, ...[stop.from.p, stop.from.c].map(holeXY)];
      let b = box(all);
      if (b[2] - b[0] > fwA || b[3] - b[1] > fhA) b = box(lan);
      if (b[2] - b[0] > fwA || b[3] - b[1] > fhA) b = box([lan[0]]);
      fx = (b[0] + b[2]) / 2; fy = (b[1] + b[3]) / 2 - 6;
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
      placeIn(ltags[w], lx + side, ly - 14, L.free);
    }
    if (deer) {
      if (t > deer.until) { deer = null; bubble.hidden = true; }
      else { A.deer(c, deer.x - ix, deer.y - iy); bubble.hidden = false; placeIn(bubble, deer.x + 6, deer.y - 12, mode === 'stop' ? L.free : { x: 0, y: L.top, w: L.W, h: L.H - L.top }); }
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
      // soften the scenery behind the play area, fading in from the lane view
      const e = L.portrait ? (L.free.y + L.free.h) / scale : L.free.w / scale, f = 24;
      const g = L.portrait ? c.createLinearGradient(0, e - f, 0, e + f) : c.createLinearGradient(e - f, 0, e + f, 0);
      g.addColorStop(0, 'rgba(20,12,18,0)'); g.addColorStop(1, 'rgba(20,12,18,0.2)');
      c.fillStyle = g; c.fillRect(0, 0, aw, ah);
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
