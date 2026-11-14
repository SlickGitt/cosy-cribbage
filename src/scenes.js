// The two pixel scenes: the room above the card table, and the walk view along the lane.
import { makeRng, rect, disc, oval } from './pixel.js';
import * as A from './art.js';
import { W as WORLD_W, BIOMES } from './lane.js';
import { makeLeaves } from './weather.js';
import { sfx } from './sound.js';

const fitCanvas = (cv) => { cv.style.imageRendering = 'pixelated'; };

// ---------------------------------------------------------------- room
export function createRoom(canvas) {
  const RW = 384, RH = 110;
  canvas.width = RW; canvas.height = RH; fitCanvas(canvas);
  const c = canvas.getContext('2d');
  const WX = 121, WY = 13, WW = 142, WH = 76;
  const leaves = makeLeaves(WW, WH, 14, 3);
  let biome = 'meadow', gap = 0, last = 0, raf = 0, staticLayer = null, sceneLayer = {};

  function drawStatic() {
    const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH;
    const g = cv.getContext('2d'), rng = makeRng(11);
    rect(g, 0, 0, RW, RH, '#4E6A58');
    for (let x = 0; x < RW; x += 12) rect(g, x, 0, 6, RH, '#587664');
    for (let x = 3; x < RW; x += 12) for (let y = 8; y < RH; y += 16) rect(g, x, y, 1, 1, '#C8B86A');
    rect(g, 0, 3, RW, 2, '#3A2433');
    // window frame
    rect(g, WX - 5, WY - 5, WW + 10, WH + 10, '#3A2433');
    rect(g, WX - 4, WY - 4, WW + 8, WH + 8, '#F5EBDA');
    rect(g, WX - 4, WY - 4, WW + 8, 1, '#FFFFFF');
    rect(g, WX - 10, WY + WH + 3, WW + 20, 4, '#F5EBDA'); rect(g, WX - 10, WY + WH + 7, WW + 20, 2, '#2E4034');
    // curtains, tied back
    const curtain = (x0, f) => {
      for (let y = 0; y < 86; y++) {
        const tie = 56, pinch = y < tie ? (y / tie) * 12 : (1 - (y - tie) / 30) * 12;
        const w = 22 - Math.max(0, pinch);
        const x = f > 0 ? x0 : x0 - w;
        rect(g, x, 8 + y, w, 1, '#D9A441');
        for (let k = 3; k < w; k += 5) rect(g, x + k, 8 + y, 1, 1, '#B8862F');
      }
      rect(g, f > 0 ? x0 + 4 : x0 - 16, 62, 12, 3, '#A8352B');
    };
    curtain(WX - 18, 1); curtain(WX + WW + 18, -1);
    rect(g, WX - 26, 5, WW + 52, 3, '#6B3E26'); rect(g, WX - 28, 4, 3, 5, '#F2B63C'); rect(g, WX + WW + 25, 4, 3, 5, '#F2B63C');
    // sill: plant and candle
    rect(g, WX + 6, WY + WH - 2, 9, 7, '#C86A48'); rect(g, WX + 5, WY + WH - 3, 11, 2, '#A8523A');
    [[0, 6, '#4E8A3A'], [2, 9, '#6AA84A'], [4, 7, '#4E8A3A'], [6, 5, '#6AA84A'], [8, 4, '#4E8A3A']].forEach(([dx, h, col]) => rect(g, WX + 6 + dx, WY + WH - 3 - h, 2, h, col));
    rect(g, WX + 9, WY + WH - 13, 2, 2, '#F2A0B8');
    // shelf with books, a sleeping cat and a plant
    rect(g, 14, 42, 80, 3, '#8A5A3B'); rect(g, 14, 42, 80, 1, '#B07A48'); rect(g, 14, 45, 80, 1, '#2E4034');
    [[12, '#C83A2E'], [10, '#3C8C9C'], [13, '#F2B63C'], [11, '#8E3E6E'], [9, '#E8603A'], [12, '#3E4A6E']].forEach(([h, col], i) => {
      rect(g, 18 + i * 4, 42 - h, 3, h, col); rect(g, 18 + i * 4, 44 - h, 3, 1, '#F5EBDA');
    });
    const cx = 52;
    rect(g, cx, 36, 15, 6, '#E8903A'); rect(g, cx + 11, 33, 6, 6, '#E8903A'); rect(g, cx + 11, 31, 2, 2, '#E8903A'); rect(g, cx + 15, 31, 2, 2, '#E8903A');
    rect(g, cx + 12, 35, 2, 1, '#2B1D24'); rect(g, cx + 15, 35, 2, 1, '#2B1D24'); rect(g, cx - 4, 40, 5, 2, '#E8903A');
    rect(g, cx + 3, 36, 2, 5, '#C8702A'); rect(g, cx + 7, 36, 2, 5, '#C8702A');
    rect(g, 78, 35, 9, 7, '#C86A48'); rect(g, 79, 27, 2, 8, '#4E8A3A'); rect(g, 82, 24, 2, 11, '#6AA84A'); rect(g, 85, 29, 2, 6, '#4E8A3A');
    // framed picture
    rect(g, 26, 56, 46, 32, '#6B3E26'); rect(g, 28, 58, 42, 28, '#F2B872'); rect(g, 28, 74, 42, 12, '#7E9648');
    for (let i = 0; i < 14; i++) rect(g, 34 + i * 1.5, 74 - Math.min(i, 13 - i), 2, Math.min(i, 13 - i), '#A87062');
    disc(g, 60, 64, 3, '#FFE9B8'); rect(g, 36, 78, 22, 2, '#C49464');
    // lamp and chalkboard
    const grad = g.createRadialGradient(334, 18, 2, 334, 18, 60);
    grad.addColorStop(0, 'rgba(255,212,138,0.55)'); grad.addColorStop(1, 'rgba(255,212,138,0)');
    g.fillStyle = grad; g.fillRect(270, 0, 114, 80);
    rect(g, 332, 20, 4, 9, '#3A2433');
    for (let i = 0; i < 9; i++) rect(g, 326 + i * 0.6, 11 + i, 16 - i * 1.2, 1, '#F2D49A');
    rect(g, 327, 11, 14, 1, '#FFF4DC');
    rect(g, 296, 34, 80, 60, '#6B3E26'); rect(g, 296, 34, 80, 1, '#B07A48'); rect(g, 299, 37, 74, 54, '#2E3A34');
    for (let i = 0; i < 6; i++) rect(g, 303 + rng.range(0, 60), 40 + rng.range(0, 46), rng.range(4, 10), 1, 'rgba(255,255,255,0.06)');
    rect(g, 302, 88, 10, 2, '#F5EBDA');
    // table edge
    rect(g, 0, 100, RW, 10, '#8A5A3B'); rect(g, 0, 100, RW, 2, '#C89058'); rect(g, 0, 108, RW, 2, '#6B4430');
    return cv;
  }

  function drawScene(b) {
    const cv = document.createElement('canvas'); cv.width = WW; cv.height = WH;
    const g = cv.getContext('2d'), rng = makeRng(b === 'forest' ? 21 : 22);
    ['#F4C27C', '#F2AE6A', '#EC985C', '#E08252', '#CE6C4C'].forEach((col, i) => rect(g, 0, i * 8, WW, 9, col));
    const sg = g.createRadialGradient(108, 18, 1, 108, 18, 24);
    sg.addColorStop(0, 'rgba(255,233,184,0.8)'); sg.addColorStop(1, 'rgba(255,233,184,0)'); g.fillStyle = sg; g.fillRect(80, 0, 60, 44);
    disc(g, 108, 18, 6, '#FFE9B8');
    rect(g, 14, 8, 22, 2, '#FFE3C8'); rect(g, 20, 6, 12, 2, '#FFE3C8'); rect(g, 60, 14, 16, 2, '#FFE3C8');
    for (let x = 0; x < WW; x++) { const h = 36 + Math.sin(x / 16) * 4 + Math.sin(x / 7) * 1.5; rect(g, x, h, 1, WH - h, '#A87062'); }
    for (let x = 0; x < WW; x++) { const h = 44 + Math.sin(x / 22 + 1) * 3; rect(g, x, h, 1, WH - h, '#7E9648'); }
    rect(g, 0, 52, WW, WH - 52, '#8FB04A');
    if (b === 'forest') {
      for (let x = -4; x < WW + 8; x += rng.int(7, 11)) {
        if (rng() < 0.35) A.pine(g, x, 56 + rng.int(-1, 1), 0.7, rng); else A.tree(g, x, 57 + rng.int(-1, 1), rng.pick(['orange', 'red', 'gold', 'green', 'plum']), 0.75, rng);
      }
    } else {
      for (let i = 0; i < 30; i++) rect(g, rng.range(0, WW), rng.range(52, 58), 1, 1, rng.pick(['#FFF4DC', '#F2A0B8', '#FFD45E']));
      A.tree(g, 20, 56, 'gold', 0.8, rng); A.tree(g, 118, 55, 'orange', 0.9, rng);
      A.fence(g, 30, 50, 9);
      A.sheep(g, 44, 52, false); A.sheep(g, 76, 54, true); A.cow(g, 96, 50, false, false);
    }
    rect(g, 0, 58, WW, 7, '#C49464'); rect(g, 0, 58, WW, 1, '#D6A874'); rect(g, 0, 64, WW, 1, '#7A5634');
    rect(g, 0, 65, WW, WH - 65, '#7E9E44');
    for (let i = 0; i < 30; i++) rect(g, rng.range(0, WW), rng.range(66, WH), 2, 1, rng.pick(['#F2B63C', '#EE7E32', '#D9502E', '#9AB85A']));
    return cv;
  }

  function frame(t) {
    const dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (!staticLayer) staticLayer = drawStatic();
    if (!sceneLayer[biome]) sceneLayer[biome] = drawScene(biome);
    c.drawImage(staticLayer, 0, 0);
    c.save(); c.beginPath(); c.rect(WX, WY, WW, WH); c.clip();
    c.drawImage(sceneLayer[biome], WX, WY);
    const bob = Math.floor(t / 600) % 2;
    const ahead = Math.max(-26, Math.min(26, gap * 0.6));
    A.walker(c, 'c', WX + 66 - ahead / 2, WY + 63, bob ? 0 : 1);
    A.walker(c, 'p', WX + 76 + ahead / 2, WY + 63, bob);
    leaves.update(dt); leaves.draw(c, WX, WY);
    c.restore();
    rect(c, WX + 46, WY, 2, WH, '#F5EBDA'); rect(c, WX + 94, WY, 2, WH, '#F5EBDA'); rect(c, WX, WY + 26, WW, 2, '#F5EBDA');
    const fl = 0.6 + Math.sin(t / 180) * 0.15 + Math.sin(t / 77) * 0.1;
    const cg = c.createRadialGradient(WX + WW - 12, WY + WH - 4, 1, WX + WW - 12, WY + WH - 4, 20);
    cg.addColorStop(0, `rgba(255,212,138,${fl})`); cg.addColorStop(1, 'rgba(255,212,138,0)'); c.fillStyle = cg; c.fillRect(WX + WW - 34, WY + WH - 26, 44, 40);
    rect(c, WX + WW - 15, WY + WH - 1, 5, 8, '#FFF4DC'); rect(c, WX + WW - 13, WY + WH - 4 - (fl > 0.7 ? 1 : 0), 2, 3, '#FFB040');
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    setState(b, g) { biome = b; gap = g; },
    stop() { cancelAnimationFrame(raf); },
  };
}

// ---------------------------------------------------------------- walk view
export function createWalk(root) {
  const VW = WORLD_W, VH = 216;
  root.innerHTML = `
  <div class="walk-stage">
    <canvas class="walk-canvas" width="${VW}" height="${VH}" aria-label="The lane, with both walkers"></canvas>
    <div class="walk-tag you" data-tag="p">You</div>
    <div class="walk-tag" data-tag="c">Winnie</div>
    <div class="walk-banner" hidden><span class="small"></span><span class="big"></span></div>
    <div class="walk-bubble" hidden></div>
    <div class="walk-scores"><div class="chip you">You <b data-score="p">0</b></div><div class="chip">Winnie <b data-score="c">0</b></div></div>
    <div class="walk-bar"><span class="walk-summary"></span><button class="btn ghost" data-walk="skip">Skip</button><button class="btn" data-walk="go" hidden>Back to the table</button></div>
  </div>`;
  const cv = root.querySelector('canvas'), c = cv.getContext('2d'); fitCanvas(cv);
  const $ = (s) => root.querySelector(s);
  const banner = $('.walk-banner'), bubble = $('.walk-bubble');
  const leaves = makeLeaves(VW, VH, 22, 9);
  let lane, pos, disp, queue, camY, raf, last, pauseUntil, done, deer, resolveFn, seenForest, finalText, stepAt;

  function holeXY(f) {
    const i = Math.max(0, Math.min(121, Math.floor(f))), j = Math.min(121, i + 1), t = f - i;
    const a = lane.holes[i], b = lane.holes[j];
    return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t];
  }
  function showBanner(small, big, ms = 1800) {
    banner.querySelector('.small').textContent = small; banner.querySelector('.big').textContent = big;
    banner.hidden = false; banner.classList.remove('show'); void banner.offsetWidth; banner.classList.add('show');
    clearTimeout(banner._t); banner._t = setTimeout(() => { banner.hidden = true; }, ms);
  }
  function place(el, x, y) {
    el.style.left = `${(x / VW) * 100}%`; el.style.top = `${(y / VH) * 100}%`;
  }
  function onEnter(who, h) {
    sfx('step');
    if (h > 0 && lane.holes[h].biome !== lane.holes[h - 1].biome) {
      const b = lane.holes[h].biome;
      showBanner(who === 'p' ? 'You are entering' : 'Winnie is entering', b === 'forest' ? 'The forest' : 'The meadow');
      pauseUntil = performance.now() + 1000;
      if (b === 'forest' && !seenForest) {
        seenForest = true;
        const k = Math.min(121, h + 3), a = lane.holes[Math.max(0, k - 1)], bb = lane.holes[Math.min(121, k + 1)];
        const ang = Math.atan2(bb.y - a.y, bb.x - a.x), side = lane.holes[k].x < VW / 2 ? -1 : 1;
        deer = { x: lane.holes[k].x - Math.sin(ang) * 34 * side + 4, y: lane.holes[k].y + Math.cos(ang) * 34 * side };
        if (deer.x < 20 || deer.x > VW - 24) deer.x = lane.holes[k].x + (deer.x < 20 ? 22 : -34);
        bubble.textContent = 'A deer stops to watch you pass.';
        bubble.dataset.show = '1';
        sfx('chime');
        pauseUntil = performance.now() + 2200;
      }
    }
    if (h === 121) { showBanner(who === 'p' ? 'You made it' : 'Winnie made it', 'Home!', 4000); sfx('win'); }
  }
  function frame(t) {
    const dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    const mover = queue[0];
    if (mover && t >= pauseUntil) {
      const target = mover.to;
      if (pos[mover.who] < target) {
        if (t >= stepAt) {
          const before = Math.floor(pos[mover.who]);
          pos[mover.who] = Math.min(target, before + 1);
          disp[mover.who] = pos[mover.who];
          root.querySelector(`[data-score="${mover.who}"]`).textContent = disp[mover.who];
          stepAt = t + 170;
          onEnter(mover.who, pos[mover.who]);
        }
      } else {
        queue.shift(); pauseUntil = t + 500; stepAt = t + 650;
        if (!queue.length) finish();
      }
    }
    const focus = queue[0] ? queue[0].who : (pos.p >= pos.c ? 'p' : 'c');
    const [, fy] = holeXY(pos[focus]);
    const target = Math.max(0, Math.min(lane.height - VH, fy - VH * 0.55));
    camY += (target - camY) * Math.min(1, dt * 3.5);
    const cy = Math.round(camY);
    c.drawImage(lane.canvas, 0, cy, VW, VH, 0, 0, VW, VH);
    const maxH = Math.max(Math.floor(pos.p), Math.floor(pos.c));
    for (let i = 1; i <= maxH; i++) { const L = lane.leaves[i]; if (L.y - cy > -4 && L.y - cy < VH + 4) rect(c, L.x, L.y - cy, 2, 1, L.col); }
    if (deer) A.deer(c, deer.x, deer.y - cy);
    const order = ['c', 'p'].sort((a, b) => holeXY(pos[a])[1] - holeXY(pos[b])[1]);
    for (const w of order) {
      const [x, y] = holeXY(pos[w]);
      const moving = queue[0] && queue[0].who === w;
      const bob = moving ? (Math.floor(t / 120) % 2) : (Math.floor(t / 700 + (w === 'c' ? 1 : 0)) % 2);
      A.walker(c, w, x + (w === 'c' ? -4 : 4), y - cy + 1, bob);
      const tag = root.querySelector(`[data-tag="${w}"]`);
      tag.hidden = y - cy < 26 || y - cy > VH + 2;
      place(tag, x + (w === 'c' ? -4 : 4), y - cy - 24);
    }
    if (deer && bubble.dataset.show) { bubble.hidden = false; place(bubble, Math.min(VW - 70, Math.max(70, deer.x + 6)), deer.y - cy - 16); }
    leaves.update(dt); leaves.draw(c);
    raf = requestAnimationFrame(frame);
  }
  function finish() {
    done = true;
    $('[data-walk="skip"]').hidden = true;
    const go = $('[data-walk="go"]'); go.hidden = false; go.textContent = finalText || 'Back to the table'; go.focus();
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-walk]'); if (!b) return;
    if (b.dataset.walk === 'skip') {
      for (const q of queue) { pos[q.who] = q.to; disp[q.who] = q.to; root.querySelector(`[data-score="${q.who}"]`).textContent = q.to; }
      queue = []; finish();
    } else if (b.dataset.walk === 'go') {
      cancelAnimationFrame(raf); root.hidden = true; bubble.hidden = true; banner.hidden = true;
      const r = resolveFn; resolveFn = null; if (r) r();
    }
  });

  return {
    // Walk both players from their old scores to their new ones. Resolves when the player returns to the table.
    open(theLane, from, to, summary, opts = {}) {
      lane = theLane; pos = { ...from }; disp = { ...from };
      queue = ['p', 'c'].filter((w) => to[w] > from[w]).map((w) => ({ who: w, to: to[w] }));
      seenForest = opts.seenForest || false; deer = null; bubble.hidden = true; delete bubble.dataset.show; banner.hidden = true;
      finalText = opts.finalText || null; done = false;
      ['p', 'c'].forEach((w) => { root.querySelector(`[data-score="${w}"]`).textContent = from[w]; });
      $('.walk-summary').textContent = summary;
      $('[data-walk="skip"]').hidden = false; $('[data-walk="go"]').hidden = true;
      const start = queue[0] ? queue[0].who : 'p';
      camY = Math.max(0, Math.min(lane.height - VH, holeXY(pos[start])[1] - VH * 0.55));
      pauseUntil = performance.now() + 700; stepAt = 0; last = performance.now();
      root.hidden = false;
      raf = requestAnimationFrame(frame);
      if (!queue.length) finish();
      return new Promise((res) => { resolveFn = () => res({ seenForest }); });
    },
  };
}
