// What you can earn and how. Feats come from cribbage moments, ranks from holes
// walked over all games, and the field guide from finding the animals.
import { save, persist } from './save.js';

// Everything that can be owned. Walkers are drawn from walkers.js; the rest is gear.
export const REWARDS = {
  fox: { kind: 'walker', name: 'Fox' },
  hedgehog: { kind: 'walker', name: 'Hedgehog' },
  badger: { kind: 'walker', name: 'Badger' },
  winnie: { kind: 'walker', name: 'Winnie' },
  'back:plum': { kind: 'back', name: 'Plum', free: true },
  'back:forest': { kind: 'back', name: 'Forest' },
  'back:gold': { kind: 'back', name: 'Gold leaf' },
  'back:skunk': { kind: 'back', name: 'Skunk' },
  'back:midnight': { kind: 'back', name: 'Midnight' },
  'back:guide': { kind: 'back', name: 'Field guide' },
  'back:starry': { kind: 'back', name: 'Starry' },
  'rug:tartan': { kind: 'rug', name: 'Tartan', free: true },
  'rug:red': { kind: 'rug', name: 'Red gingham', free: true },
  'rug:blue': { kind: 'rug', name: 'Blue gingham' },
  'rug:mustard': { kind: 'rug', name: 'Mustard' },
  'rug:welsh': { kind: 'rug', name: 'Welsh blanket' },
  'rug:patchwork': { kind: 'rug', name: 'Patchwork' },
  'lantern:gold': { kind: 'lantern', name: 'Gold', free: true },
  'lantern:teal': { kind: 'lantern', name: 'Teal' },
  'lantern:rose': { kind: 'lantern', name: 'Rose' },
  'lantern:firefly': { kind: 'lantern', name: 'Firefly' },
  secret: { kind: 'secret', name: 'A secret place' },
};

export const TIERS = { common: 'Common', rare: 'Rare', legendary: 'Legendary' };
const st = (f) => ({ end: true, check: f });
export const FEATS = [
  { id: 'firstwin', tier: 'common', name: 'Home first', how: 'Win a game', reward: 'fox', ...st((s) => s.wins >= 1) },
  { id: 'skunk', tier: 'common', name: 'Skunked', how: 'Skunk Winnie (win by more than 30)', reward: 'hedgehog', ...st((s) => s.skunks >= 1) },
  { id: 'heels', tier: 'common', name: 'His heels', how: 'Turn up a jack as the starter on your deal', reward: 'back:forest' },
  { id: 'thirtyone', tier: 'common', name: 'Thirty-one', how: 'Peg the count to exactly 31', reward: 'lantern:teal' },
  { id: 'pairroyal', tier: 'common', name: 'Pair royal', how: 'Peg three of a kind', reward: 'rug:blue' },
  { id: 'fivewins', tier: 'common', name: 'Regular', how: 'Win 5 games', reward: 'winnie', ...st((s) => s.wins >= 5) },
  { id: 'twenty', tier: 'rare', name: 'Twenty', how: 'Score 20 or more in one hand or crib', reward: 'back:gold' },
  { id: 'flush5', tier: 'rare', name: 'Five of a suit', how: 'Score a flush of 5', reward: 'rug:welsh' },
  { id: 'dpr', tier: 'rare', name: 'Double pair royal', how: 'Peg four of a kind', reward: 'lantern:firefly' },
  { id: 'dskunk', tier: 'rare', name: 'Double skunk', how: 'Win by more than 60', reward: 'back:skunk', ...st((s) => s.doubleSkunks >= 1) },
  { id: 'streak3', tier: 'rare', name: 'On a roll', how: 'Win 3 games in a row', reward: 'rug:patchwork', ...st((s) => s.streak >= 3) },
  { id: 'sharpwin', tier: 'rare', name: 'Sharper than Winnie', how: 'Beat Winnie when she plays sharp', reward: 'back:midnight', ...st((s) => s.sharpWins >= 1) },
  { id: 'twentyeight', tier: 'legendary', name: 'Twenty-eight', how: 'Score a 28 hand', reward: 'back:starry' },
  { id: 'perfect', tier: 'legendary', name: 'The perfect hand', how: 'Score a 29, the highest hand there is', reward: 'secret' },
];

export const RANKS = [
  { name: 'Rambler', holes: 0 },
  { name: 'Stroller', holes: 200, reward: 'rug:mustard' },
  { name: 'Hiker', holes: 500, reward: 'badger' },
  { name: 'Wanderer', holes: 1000, reward: 'lantern:rose' },
  { name: 'Wayfarer', holes: 2000, soon: 'A companion' },
  { name: 'Pathfinder', holes: 3500, soon: 'A mount' },
  { name: 'Trailblazer', holes: 6000, soon: 'Something special' },
];

export const GUIDE = [
  { id: 'sheep', name: 'Sheep', hint: 'Grazing in the meadow' },
  { id: 'cow', name: 'Cow', hint: 'Not every meadow has them' },
  { id: 'rabbit', name: 'Rabbit', hint: 'Shy, near the bushes' },
  { id: 'bird', name: 'Robin', hint: 'Pecking by the lane' },
  { id: 'magpie', name: 'Magpie', hint: 'One for sorrow, two for joy' },
  { id: 'pheasant', name: 'Pheasant', hint: 'Strutting at the field edge' },
  { id: 'hare', name: 'Hare', hint: 'Out in the open meadow' },
  { id: 'butterfly', name: 'Butterfly', hint: 'Over the flowers' },
  { id: 'squirrel', name: 'Squirrel', hint: 'Darting between trees' },
  { id: 'deer', name: 'Deer', hint: 'Watching from the forest' },
  { id: 'duck', name: 'Mallard', hint: 'Paddling on the river' },
  { id: 'heron', name: 'Heron', hint: 'Still as a post by the water' },
  { id: 'cat', name: 'Village cat', hint: 'Sunning itself by a cottage' },
  { id: 'mushroom', name: 'Puffball', hint: 'In a forest clearing' },
];
const GUIDE_FEAT = { id: 'naturalist', tier: 'rare', name: 'Naturalist', how: 'Fill the field guide', reward: 'back:guide' };
FEATS.splice(FEATS.findIndex((f) => f.tier === 'legendary'), 0, GUIDE_FEAT);

export const owns = (id) => (REWARDS[id] && REWARDS[id].free) || save.unlocked.includes(id);
export const isUnlocked = owns;
export const hasFeat = (id) => save.feats.includes(id);
export function howTo(rewardId) {
  const f = FEATS.find((x) => x.reward === rewardId); if (f) return f.how;
  const r = RANKS.find((x) => x.reward === rewardId); return r ? `Reach ${r.name} (${r.holes} holes walked)` : '';
}
export function rankOf(holes) {
  let i = 0; while (i + 1 < RANKS.length && holes >= RANKS[i + 1].holes) i++;
  return { rank: RANKS[i], next: RANKS[i + 1] || null, i };
}

const grant = (rewardId) => { if (rewardId && !save.unlocked.includes(rewardId)) save.unlocked.push(rewardId); };

// A feat happened. Returns { feat, reward } the first time, otherwise null.
export function award(id) {
  const f = FEATS.find((x) => x.id === id);
  if (!f || hasFeat(id)) return null;
  save.feats.push(id); grant(f.reward); persist();
  return { title: f.name, reward: f.reward, tier: f.tier };
}

// An animal found for the field guide. Returns what to announce, if anything.
export function discover(kind) {
  if (!GUIDE.some((g) => g.id === kind) || save.guide.includes(kind)) return [];
  save.guide.push(kind); persist();
  const out = [{ title: `Field guide: ${GUIDE.find((g) => g.id === kind).name}`, reward: null, guide: true }];
  if (GUIDE.every((g) => save.guide.includes(g.id))) { const a = award('naturalist'); if (a) out.push(a); }
  return out;
}

// Record a finished game. Returns new feats and ranks reached.
export function recordGame({ won, myScore, theirScore, bestHand, level }) {
  const s = save.stats, before = rankOf(s.holes).i;
  s.games++; s.holes += myScore; s.bestHand = Math.max(s.bestHand, bestHand || 0);
  if (won) { s.wins++; s.streak++; if (theirScore < 91) s.skunks++; if (theirScore < 61) s.doubleSkunks++; if (level === 'sharp') s.sharpWins = (s.sharpWins || 0) + 1; }
  else { s.losses++; s.streak = 0; }
  const out = [];
  for (const f of FEATS) if (f.end && f.check(s)) { const a = award(f.id); if (a) out.push(a); }
  const after = rankOf(s.holes).i;
  for (let i = before + 1; i <= after; i++) { const r = RANKS[i]; grant(r.reward); out.push({ title: `Rank: ${r.name}`, reward: r.reward || null, rank: true }); }
  persist();
  return out;
}
