// Progress kept in this browser: chosen walker, settings, lifetime stats and unlocks.
const KEY = 'cosy-cribbage-v1';
const STARTERS = ['bobble', 'flatcap', 'wellies', 'beret'];

const fresh = () => ({
  v: 1,
  walker: 'bobble',
  settings: { music: true, sound: true, winnie: 'normal' },
  stats: { games: 0, wins: 0, losses: 0, holes: 0, bestHand: 0, skunks: 0, doubleSkunks: 0, streak: 0 },
  unlocked: [...STARTERS],
});

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const d = JSON.parse(raw), f = fresh();
    return { ...f, ...d, settings: { ...f.settings, ...d.settings }, stats: { ...f.stats, ...d.stats }, unlocked: [...new Set([...STARTERS, ...(d.unlocked || [])])] };
  } catch (e) { return fresh(); }
}

export const save = read();
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* private mode: progress lasts this visit only */ } }
