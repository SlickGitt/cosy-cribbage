// Walkers: the avatars you can play as, plus Winnie. Each is a 10 x 20 pixel
// sprite (rows of palette keys, '.' is clear), converted from the design canvas.
import { sprite } from './pixel.js';

const WINNIE_ROWS = ['....oo....', '...oGGo...', '..oGGGGo..', '.oGGGGGGo.', '.oGSSSSGo.', '.oSoSSoSo.', '.oSSSSSSo.',
  '..oKKKKo..', '.oKKKKKKo.', 'oCCKKCCCCo', 'oCCKKCCCCo', 'oCCCCCCCCo', 'oCcCCCCcCo', 'oCcCCCCcCo', 'oCCCCCCCCo', '.oCCCCCCo.', '..oLLLLo..', '..oLooLo..', '..oLooLo..', '.oBBooBBo.'];

export const WALKERS = {
  bobble: { name: 'Bobble', rows: ["...aiia...", "..affffa..", ".affffffa.", ".affffffa.", ".agggggga.", ".agaggaga.", ".agggggga.", "..adddda..", ".adddddda.", "ahhddhhhha", "ahhddhhhha", "ahhhhhhhha", "ahehhhheha", "ahehhhheha", "ahhhhhhhha", ".ahhhhhha.", "..abbbba..", "..abaaba..", "..abaaba..", ".accaacca."], pal: {"a": "#2B1D24", "b": "#3A2433", "c": "#6B3E26", "d": "#C83A2E", "e": "#C98E22", "f": "#E8603A", "g": "#F0C8A0", "h": "#F2B63C", "i": "#FFF4DC"} },
  flatcap: { name: 'Flat cap', rows: ["..........", "..aaaaaa..", ".affffffa.", "affffffffa", ".ahhhhhha.", ".ahahhaha.", ".ahhhhhha.", "..acccca..", ".acccccca.", "aggccgggga", "aggccgggga", "agggggggga", "ageggggega", "ageggggega", "agggggggga", ".agggggga.", "..abbbba..", "..abaaba..", "..abaaba..", ".addaadda."], pal: {"a": "#2B1D24", "b": "#3A2433", "c": "#3F7A4E", "d": "#6B3E26", "e": "#7A5E40", "f": "#7A6A52", "g": "#9A7A56", "h": "#F0C8A0"} },
  wellies: { name: 'Wellies', rows: ["..........", "..aaaaaa..", "..ahhhha..", "ahhhhhhhha", ".agggggga.", ".agaggaga.", ".agggggga.", "..aeeeea..", ".aeeeeeea.", "affeeffffa", "affeeffffa", "affffffffa", "afdffffdfa", "afdffffdfa", "affffffffa", ".affffffa.", "..acccca..", "..acaaca..", "..acaaca..", ".abbaabba."], pal: {"a": "#2B1D24", "b": "#2E6A3A", "c": "#3A2433", "d": "#3A7A46", "e": "#3C8C9C", "f": "#4E9A5A", "g": "#F0C8A0", "h": "#F2D45E"} },
  beret: { name: 'Beret', rows: ["......a...", "...aaaaa..", "..afffffa.", ".afffffffa", ".agggggga.", ".agaggaga.", ".agggggga.", "..ahhhha..", ".ahhhhhha.", "addhhdddda", "addhhdddda", "adddddddda", "adbddddbda", "adbddddbda", "adddddddda", ".adddddda.", "..acccca..", "..acaaca..", "..acaaca..", ".aeeaaeea."], pal: {"a": "#2B1D24", "b": "#2E3858", "c": "#3A2433", "d": "#3E4A6E", "e": "#6B3E26", "f": "#B23A4A", "g": "#F0C8A0", "h": "#F5EBDA"} },
  fox: { name: 'Fox', rows: [".a......a.", ".afa..afa.", ".affaaffa.", ".affffffa.", ".afaffafa.", ".afggggfa.", "..agaaga..", "..abbbba..", ".abbbbbba.", "addbbdddda", "addbbdddda", "adddddddda", "adcddddcda", "adcddddcda", "adddddddda", ".adddddda.", "..aaaaaa..", "..aaaaaa..", "..aaaaaa..", ".aeeaaeea."], pal: {"a": "#2B1D24", "b": "#3F7A4E", "c": "#465886", "d": "#5A6EA0", "e": "#6B3E26", "f": "#E8702A", "g": "#FFF4DC"} },
  hedgehog: { name: 'Hedgehog', rows: ["..a.a.a...", ".adadada..", "adddddddda", "adddddddda", "addhhhhdda", "adhahhahda", ".ahhaahha.", "..agggga..", ".agggggga.", "affggffffa", "affggffffa", "affffffffa", "afeffffefa", "afeffffefa", "affffffffa", ".affffffa.", "..abbbba..", "..abaaba..", "..abaaba..", ".accaacca."], pal: {"a": "#2B1D24", "b": "#3A2433", "c": "#6B3E26", "d": "#7A5236", "e": "#A88038", "f": "#C8A050", "g": "#E8603A", "h": "#E8C49A"} },
  badger: { name: 'Badger', rows: ["..aa..aa..", ".aaaggaaa.", ".aaaggaaa.", ".agaggaga.", ".agaggaga.", ".agggggga.", "..agaaga..", "..affffa..", ".affffffa.", "aeeffeeeea", "aeeffeeeea", "aeeeeeeeea", "aeceeeecea", "aeceeeecea", "aeeeeeeeea", ".aeeeeeea.", "..abbbba..", "..abaaba..", "..abaaba..", ".addaadda."], pal: {"a": "#2B1D24", "b": "#3A2433", "c": "#56702E", "d": "#6B3E26", "e": "#6E8A3E", "f": "#E8603A", "g": "#F5EBDA"} },
  winnie: { name: 'Winnie', rows: WINNIE_ROWS, pal: { o: '#2B1D24', S: '#F0C8A0', L: '#3A2433', B: '#6B3E26', G: '#C9C2CC', K: '#F2B63C', C: '#8E3E6E', c: '#6E2E56' } },
};
WALKERS.c = WALKERS.winnie;
WALKERS.p = WALKERS.bobble;

// Sitting down: the top 15 rows, then folded legs in the walker's own trouser and boot colours.
for (const w of Object.values(WALKERS)) {
  if (w.seat) continue;
  const o = w.rows[0].replace(/\./g, '')[0] || w.rows[1].replace(/\./g, '')[0], L = w.rows[16][3], B = w.rows[19][2];
  w.seat = [...w.rows.slice(0, 15), `.${o}${L.repeat(6)}${o}.`, `${o}${B}${B}${L}${o}${o}${L}${B}${B}${o}`];
}

// Sitting with your back to us, at your side of the rug: the face and eyes become the
// back of the head (fur for the animals, hair for everyone else).
const HAIR = '#5A3A28';
function skinLike(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d < 0.05 || l < 0.62) return false;
  const h = (((mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60) + 360) % 360;
  return h >= 15 && h <= 45;
}
for (const w of Object.values(WALKERS)) {
  if (w.back) continue;
  w.pal.z = w.pal.z || HAIR;
  const o = w.rows[0].replace(/\./g, '')[0] || w.rows[1].replace(/\./g, '')[0];
  const skin = new Set(Object.keys(w.pal).filter((k) => skinLike(w.pal[k])));
  const top = [...w.rows[2]].filter((k) => k !== '.' && k !== o && !skin.has(k));
  const fur = top.find((k) => w.rows.slice(4, 7).some((r) => r.includes(k)));
  const back = fur || (top.length ? 'z' : o);
  w.back = w.seat.map((row, i) => {
    if (i < 3 || i > 6) return row;
    const ch = [...row], first = ch.findIndex((k) => k !== '.'), last = ch.length - 1 - [...ch].reverse().findIndex((k) => k !== '.');
    return ch.map((k, j) => (skin.has(k) || (k === o && j > first && j < last)) ? back : k).join('');
  });
}

export function setPlayerWalker(id) { WALKERS.p = WALKERS[id] || WALKERS.bobble; }

// Draw a walker into a small canvas for menus. Locked ones are a dark silhouette.
export function walkerCanvas(id, locked = false) {
  const w = WALKERS[id], cv = document.createElement('canvas');
  cv.width = 10; cv.height = 20; cv.className = 'px-sprite';
  const pal = locked ? Object.fromEntries(Object.keys(w.pal).map((k) => [k, '#1E1420'])) : w.pal;
  sprite(cv.getContext('2d'), w.rows, pal, 0, 0);
  return cv;
}

// Friend games: the other player's walker. If you both chose the same one, theirs gets
// different clothes (skin, hair and outline stay the same) so you can tell who's who.
export function friendWalker(id, mine) {
  const w = WALKERS[id] && id !== 'winnie' ? WALKERS[id] : WALKERS.bobble;
  if (w !== WALKERS[mine] && !(w === WALKERS.bobble && !WALKERS[mine])) return w;
  const pal = {};
  for (const [k, hex] of Object.entries(w.pal)) pal[k] = recolour(hex);
  return { ...w, name: w.name + ' (friend)', pal };
}
function recolour(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d < 0.12) return hex;                                  // greys, outline, white
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  const s = d / (1 - Math.abs(2 * l - 1));
  if (h >= 15 && h <= 45 && l > 0.62) return hex;            // skin
  if (l < 0.3) return hex;                                   // dark hair, boots
  const h2 = (h + 170) % 360, c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h2 / 60) % 2) - 1)), m = l - c / 2;
  const [r2, g2, b2] = h2 < 60 ? [c, x, 0] : h2 < 120 ? [x, c, 0] : h2 < 180 ? [0, c, x] : h2 < 240 ? [0, x, c] : h2 < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r2, g2, b2].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}
