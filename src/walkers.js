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

export function setPlayerWalker(id) { WALKERS.p = WALKERS[id] || WALKERS.bobble; }

// Draw a walker into a small canvas for menus. Locked ones are a dark silhouette.
export function walkerCanvas(id, locked = false) {
  const w = WALKERS[id], cv = document.createElement('canvas');
  cv.width = 10; cv.height = 20; cv.className = 'px-sprite';
  const pal = locked ? Object.fromEntries(Object.keys(w.pal).map((k) => [k, '#1E1420'])) : w.pal;
  sprite(cv.getContext('2d'), w.rows, pal, 0, 0);
  return cv;
}
