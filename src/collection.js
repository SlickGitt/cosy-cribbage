// The Collection: feats and ranks, the field guide, and gear to wear.
import { save, persist } from './save.js';
import { REWARDS, FEATS, TIERS, RANKS, GUIDE, owns, hasFeat, howTo, rankOf } from './unlocks.js';
import { walkerCanvas } from './walkers.js';
import { critterIcon } from './critters.js';
import { gingham, tartan, patchwork, lantern } from './reststop.js';
import { LANTERNS } from './scene.js';
import { makeRng } from './pixel.js';
import * as A from './art.js';

const RUG_PAL = { red: ['#C98272', '#E2AE9E', '#F2E4CC'], blue: ['#6A8AB4', '#A8BCD8', '#EEF0F4'], mustard: ['#C89A3A', '#E2C478', '#F4E8C8'] };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const pxCanvas = (w, h, draw, cls = '') => { const cv = el('canvas', 'px-sprite ' + cls); cv.width = w; cv.height = h; draw(cv.getContext('2d')); return cv; };

// A small picture of any reward.
export function rewardIcon(id) {
  const r = REWARDS[id], [, v] = id.split(':');
  if (!r) return el('span');
  if (r.kind === 'walker') return walkerCanvas(id);
  if (r.kind === 'back') { const b = el('span', 'mini-back'); b.dataset.back = v; b.innerHTML = '<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M3 0h2v1H3zM2 1h4v1H2zM1 2h6v2H1zM2 4h4v1H2zM3 5h2v3H3z" fill="currentColor"/></svg>'; return b; }
  if (r.kind === 'rug') return pxCanvas(28, 18, (c) => { const g = c; if (v === 'tartan') tartan(g, 0, 0, 28, 18); else if (v === 'patchwork') patchwork(g, 0, 0, 28, 18, makeRng(4)); else gingham(g, 0, 0, 28, 18, RUG_PAL[v]); }, 'rug-icon');
  if (r.kind === 'lantern') return pxCanvas(12, 16, (c) => lantern(c, 6, 14, LANTERNS[v]), 'lantern-icon');
  return el('span', 'secret-icon', '?');
}

// Put on the chosen gear: card back on the page, blanket and lantern in the scene.
export function applyGear(scene) {
  document.body.dataset.back = save.gear.back;
  scene.setGear({ rug: save.gear.rug, lantern: save.gear.lantern });
}

let tab = 'feats';
export function openCollection(root, onChange) {
  const draw = () => {
    root.replaceChildren();
    const tabs = el('div', 'tabs');
    for (const [id, name] of [['feats', 'Feats and ranks'], ['guide', 'Field guide'], ['gear', 'Gear']]) {
      const b = el('button', 'tab', name); b.setAttribute('aria-pressed', tab === id);
      b.addEventListener('click', () => { tab = id; draw(); });
      tabs.append(b);
    }
    root.append(tabs);
    root.append(tab === 'feats' ? feats() : tab === 'guide' ? guide() : gearTab(() => { onChange(); draw(); }));
  };
  draw();
}

function feats() {
  const box = el('div', 'col-body');
  // rank
  const holes = save.stats.holes, { rank, next } = rankOf(holes);
  const rc = el('div', 'rank-card');
  rc.append(el('span', 'rank-label', 'Walker rank'), el('span', 'rank-name', rank.name));
  if (next) {
    const bar = el('div', 'bar'), fill = el('span'); fill.style.width = `${Math.min(100, ((holes - rank.holes) / (next.holes - rank.holes)) * 100)}%`; bar.append(fill);
    const nr = next.reward ? `${REWARDS[next.reward].name}${REWARDS[next.reward].kind === 'walker' ? ' walker' : ''}` : `${next.soon} (coming soon)`;
    rc.append(bar, el('span', 'rank-next', `${holes} of ${next.holes} holes to ${next.name}. Reward: ${nr}`));
  } else rc.append(el('span', 'rank-next', `${holes} holes walked. The highest rank there is.`));
  box.append(rc);
  // feats by tier
  for (const tier of Object.keys(TIERS)) {
    box.append(el('h3', 'tier-head ' + tier, TIERS[tier]));
    for (const f of FEATS.filter((x) => x.tier === tier)) {
      const done = hasFeat(f.id), row = el('div', 'feat' + (done ? ' done' : ''));
      const ic = el('span', 'feat-icon'); const icon = rewardIcon(f.reward); if (!done) icon.classList.add('locked'); ic.append(icon);
      const txt = el('span', 'feat-text'); txt.append(el('b', '', f.name), el('span', '', f.how));
      const rw = el('span', 'feat-reward', done ? REWARDS[f.reward].name : f.reward === 'secret' ? '???' : REWARDS[f.reward].name);
      row.append(ic, txt, rw);
      box.append(row);
    }
  }
  return box;
}

function guide() {
  const box = el('div', 'col-body');
  box.append(el('p', 'col-note', `${save.guide.length} of ${GUIDE.length} found. Click animals on the lane to add them. Fill the guide for the Field guide card back.`));
  const grid = el('div', 'guide-grid');
  for (const g of GUIDE) {
    const found = save.guide.includes(g.id), t = el('div', 'sticker' + (found ? ' found' : ''));
    const ic = critterIcon(g.id); if (!found) ic.classList.add('locked');
    t.append(ic, el('b', '', found ? g.name : '?'), el('span', '', g.hint));
    grid.append(t);
  }
  box.append(grid);
  return box;
}

function gearTab(changed) {
  const box = el('div', 'col-body');
  for (const [kind, title] of [['back', 'Card backs'], ['rug', 'Picnic blankets'], ['lantern', 'Lanterns']]) {
    box.append(el('h3', 'tier-head', title));
    const row = el('div', 'gear-grid');
    for (const [id, r] of Object.entries(REWARDS).filter(([, r]) => r.kind === kind)) {
      const [, v] = id.split(':'), have = owns(id), on = save.gear[kind] === v;
      const b = el('button', 'gear-tile' + (on ? ' sel' : '')); b.disabled = !have; b.setAttribute('aria-pressed', on);
      const ic = rewardIcon(id); if (!have) ic.classList.add('locked');
      b.append(ic, el('b', '', have ? r.name : 'Locked'));
      if (!have) b.append(el('span', '', howTo(id)));
      b.addEventListener('click', () => { save.gear[kind] = v; persist(); changed(); });
      row.append(b);
    }
    box.append(row);
  }
  return box;
}
