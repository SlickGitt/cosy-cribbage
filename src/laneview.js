// The live lane: a full-screen pixel view behind the card tray. Walkers step along
// it the moment points are scored, and the camera keeps them in the uncovered part
// of the screen.
import { rect } from './pixel.js';
import * as A from './art.js';
import { makeLeaves } from './weather.js';
import { sfx } from './sound.js';

export function createLaneView({ canvas, hud, freeRect }) {
  const c = canvas.getContext('2d');
  hud.innerHTML = `
    <div class="lane-tag you" data-tag="p" hidden>You</div>
    <div class="lane-tag" data-tag="c" hidden>Winnie</div>
    <div class="lane-banner" hidden><span class="small"></span><span class="big"></span></div>
    <div class="lane-bubble" hidden></div>
    <div class="lane-scores"><div class="chip you"><span>You</span><b data-score="p">0</b></div><div class="chip"><span>Winnie</span><b data-score="c">0</b></div></div>`;
  const $ = (s) => hud.querySelector(s);
  const banner = $('.lane-banner'), bubble = $('.lane-bubble'), scoresEl = $('.lane-scores');
  const tags = { p: $('[data-tag="p"]'), c: $('[data-tag="c"]') };
  const scoreEls = { p: $('[data-score="p"]'), c: $('[data-score="c"]') };

  let lane = null, scale = 3, aw = 0, ah = 0, camX = 0, camY = 0, last = 0;
  let pos = { p: 0, c: 0 }, target = { p: 0, c: 0 }, stepAt = { p: 0, c: 0 }, mover = null;
  let deer = null, seenForest = false, bannerTimer = 0, leaves = null, free = { x: 0, y: 0, w: 1, h: 1 };
  const listeners = [];

  function resize() {
    const W = window.innerWidth, H = window.innerHeight;
    scale = W >= H ? Math.max(W / 400, H / 236) : Math.max(1, W / 200);
    aw = Math.ceil(W / scale); ah = Math.ceil(H / scale);
    canvas.width = aw; canvas.height = ah;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    leaves = makeLeaves(aw, ah, Math.round((aw * ah) / 3000), 9);
    updateFree();
  }
  function updateFree() {
    const r = freeRect();
    free = { x: r.x / scale, y: r.y / scale, w: r.w / scale, h: r.h / scale };
    scoresEl.style.left = `${r.x + r.w - 14}px`; scoresEl.style.top = `${r.y + 14}px`;
    banner.style.left = `${r.x + r.w / 2}px`; banner.style.top = `${r.y + 16}px`;
  }

  function holeXY(f) {
    const i = Math.max(0, Math.min(121, Math.floor(f))), j = Math.min(121, i + 1), t = f - i;
    const a = lane.holes[i], b = lane.holes[j];
    return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t];
  }
  function showBanner(small, big, ms = 2200) {
    banner.querySelector('.small').textContent = small; banner.querySelector('.big').textContent = big;
    banner.hidden = false; banner.classList.remove('show'); void banner.offsetWidth; banner.classList.add('show');
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { banner.hidden = true; }, ms);
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
        deer = { x: holes[k].x - Math.sin(ang) * 34 + 4, y: holes[k].y + Math.cos(ang) * 34, until: performance.now() + 9000 };
        bubble.textContent = 'A deer stops to watch you pass.';
        sfx('chime');
      }
    }
    if (h === 121) { showBanner(who === 'p' ? 'You made it' : 'Winnie made it', 'Home!', 6000); sfx('win'); }
    listeners.forEach((fn) => fn(who, h));
  }
  function place(el, x, y) { el.style.left = `${(x - camX) * scale}px`; el.style.top = `${(y - camY) * scale}px`; }

  function frame(t) {
    const dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    if (!lane) { requestAnimationFrame(frame); return; }
    // Step whoever is behind their score, one hole at a time.
    // Both walkers step independently; the further behind, the quicker the steps.
    const moving = [];
    for (const w of ['p', 'c']) {
      if (pos[w] < target[w]) {
        moving.push(w);
        if (t >= stepAt[w]) {
          pos[w] = Math.min(target[w], Math.floor(pos[w]) + 1);
          scoreEls[w].textContent = pos[w];
          stepAt[w] = t + Math.max(60, 190 - (target[w] - pos[w]) * 15);
          onEnter(w, pos[w]);
          mover = w;
        }
      }
    }
    if (!moving.length) mover = null;
    // Camera: frame both walkers if they fit, otherwise follow whoever is moving, otherwise you.
    let fx, fy;
    const [px0, py0] = holeXY(pos.p), [cx0, cy0] = holeXY(pos.c);
    const bothFit = Math.abs(py0 - cy0) < free.h * 0.6 && Math.abs(px0 - cx0) < free.w * 0.7;
    if (mover && !bothFit) [fx, fy] = holeXY(pos[mover]);
    else {
      const [px, py] = holeXY(pos.p), [cx, cy] = holeXY(pos.c);
      if (Math.abs(py - cy) < free.h * 0.6 && Math.abs(px - cx) < free.w * 0.7) { fx = (px + cx) / 2; fy = (py + cy) / 2; } else { fx = px; fy = py; }
    }
    const tx = Math.max(0, Math.min(lane.canvas.width - aw, fx - (free.x + free.w / 2)));
    const ty = Math.max(0, Math.min(lane.height - ah, fy - (free.y + free.h * 0.62)));
    const k = Math.min(1, dt * 3);
    camX += (tx - camX) * k; camY += (ty - camY) * k;
    const ix = Math.round(camX), iy = Math.round(camY);
    rect(c, 0, 0, aw, ah, '#55702E');
    c.drawImage(lane.canvas, ix, iy, Math.min(aw, lane.canvas.width - ix), Math.min(ah, lane.height - iy), 0, 0, Math.min(aw, lane.canvas.width - ix), Math.min(ah, lane.height - iy));
    const maxH = Math.max(Math.floor(pos.p), Math.floor(pos.c));
    for (let i = 1; i <= maxH; i++) { const L = lane.leaves[i]; rect(c, L.x - ix, L.y - iy, 2, 1, L.col); }
    if (deer) {
      if (t > deer.until) { deer = null; bubble.hidden = true; }
      else { A.deer(c, deer.x - ix, deer.y - iy); bubble.hidden = false; place(bubble, deer.x + 6, deer.y - 12); }
    }
    const order = ['c', 'p'].sort((a, b) => holeXY(pos[a])[1] - holeXY(pos[b])[1]);
    for (const w of order) {
      const [x, y] = holeXY(pos[w]);
      const ox = w === 'c' ? -4 : 4;
      const bob = pos[w] < target[w] ? Math.floor(t / 120) % 2 : Math.floor(t / 700 + (w === 'c' ? 1 : 0)) % 2;
      A.walker(c, w, x + ox - ix, y - iy + 1, bob);
      tags[w].hidden = false; place(tags[w], x + ox, y - 23);
    }
    leaves.update(dt); leaves.draw(c);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);

  return {
    reset(newLane) {
      lane = newLane; pos = { p: 0, c: 0 }; target = { p: 0, c: 0 }; mover = null; deer = null; seenForest = false;
      bubble.hidden = true; banner.hidden = true; scoreEls.p.textContent = 0; scoreEls.c.textContent = 0;
      const [x, y] = holeXY(0);
      camX = Math.max(0, x - (free.x + free.w / 2)); camY = Math.max(0, y - free.y - free.h * 0.55);
      showBanner('A new lane', 'Off we go', 2400);
    },
    moveTo(who, score) { target[who] = Math.min(121, score); if (!stepAt[who] || stepAt[who] < performance.now()) stepAt[who] = performance.now() + 250; },
    onStep(fn) { listeners.push(fn); },
    relayout: updateFree,
  };
}
