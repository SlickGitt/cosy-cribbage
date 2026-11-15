// What can be unlocked and how. Each check looks at lifetime stats after a game ends.
import { save, persist } from './save.js';

export const UNLOCKS = [
  { id: 'fox', kind: 'walker', how: 'Win a game', check: (s) => s.wins >= 1 },
  { id: 'hedgehog', kind: 'walker', how: 'Skunk Winnie', check: (s) => s.skunks >= 1 },
  { id: 'badger', kind: 'walker', how: 'Walk 500 holes in total', check: (s) => s.holes >= 500 },
  { id: 'winnie', kind: 'walker', how: 'Win 5 games', check: (s) => s.wins >= 5 },
];
export const howTo = (id) => (UNLOCKS.find((u) => u.id === id) || {}).how || '';
export const isUnlocked = (id) => save.unlocked.includes(id);

// Record a finished game and return anything newly unlocked.
export function recordGame({ won, myScore, theirScore, bestHand }) {
  const s = save.stats;
  s.games++; s.holes += myScore; s.bestHand = Math.max(s.bestHand, bestHand || 0);
  if (won) { s.wins++; s.streak++; if (theirScore < 91) s.skunks++; if (theirScore < 61) s.doubleSkunks++; }
  else { s.losses++; s.streak = 0; }
  const fresh = UNLOCKS.filter((u) => !save.unlocked.includes(u.id) && u.check(s));
  fresh.forEach((u) => save.unlocked.push(u.id));
  persist();
  return fresh;
}
