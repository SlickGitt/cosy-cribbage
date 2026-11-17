// Biomes: ground, lane colours, scenery, rest stop surface and the line shown the
// first time you walk into each one. decorate() runs once per stretch of lane:
// ground-level things are drawn straight away (the lane is laid over them),
// standing things go through place() so they are depth-sorted and kept off the lane.
import { rect, oval } from './pixel.js';
import * as A from './art.js';
import * as S from './scenery.js';
import { sprite } from './sprites.js';
import { lakeShape, paintLake, weepingWillow } from './lake.js';

const DIRT = { path: ['#7A5634', '#C49464', '#D6A874'], specks: ['#A07A50', '#E8C08A'] };
const DARK_DIRT = { path: ['#4A3420', '#8A6440', '#9E7650'], specks: ['#6B4A2E', '#C8402F', '#E8862E'] };
const COBBLE = { path: ['#5E5650', '#A89C8C', '#BCB2A2'], specks: ['#8A8072', '#D2C8B8'] };
const STONY = { path: ['#5A5242', '#9A8E74', '#B0A486'], specks: ['#7A7466', '#C8BCA0'] };
const GRAVEL = { path: ['#6A5E4E', '#B8AC94', '#CEC2AA'], specks: ['#9A8E7A', '#E2D8C4'] };

const grass = (ctx, n, cols) => { const { c, rng, W, t, b } = ctx; for (let i = 0; i < n; i++) rect(c, rng.range(0, W), rng.range(t, b), 1, 2, rng.pick(cols)); };
const leafLitter = (ctx, n, cols) => { const { c, rng, W, t, b } = ctx; for (let i = 0; i < n; i++) rect(c, rng.range(0, W), rng.range(t, b), 2, 1, rng.pick(cols)); };

export const BIOMES = {
  meadow: {
    title: 'The meadow', line: 'Sheep, stone walls and a flask of tea.', surface: 'rug', rug: ['#C98272', '#E2AE9E', '#F2E4CC'], prop: 'tea',
    ground: '#8FB04A', patches: ['#9CBC54', '#82A040', '#A8C860'], ...DIRT,
    tones: ['#6E8E3E', '#7A9642', '#889C46', '#98A24C', '#A8A656'],
    pathTones: ['#7A5634', '#94693F', '#AC7E4E', '#C2945E', '#D4AA72'],
    decorate(ctx) {
      const { c, rng, area, obj, critter, grove, place, spot } = ctx;
      // flower patches and grass blades on the ground
      let flies = 0;
      for (let i = 0; i < area * 0.6; i++) {
        const p = ctx.spotNearLane(16, 110, [4, 4]); if (!p) continue;
        const col = rng.pick(['#FFF4DC', '#F2A0B8', '#FFD45E', '#B8A0E8', '#E8603A']);
        for (let k = 0; k < 18; k++) { const x = p[0] + rng.range(-12, 12), y = p[1] + rng.range(-6, 6); if (!ctx.near(x, y, 11)) { rect(c, x, y + 1, 1, 1, '#3E6A2E'); rect(c, x, y, 1, 1, rng() < 0.85 ? col : '#FFF4DC'); } }
        if (flies < 1 && rng() < 0.5) { flies++; critter({ kind: 'butterfly', x: p[0], y: p[1] }); }
      }
      grassBlades(ctx, area * 30, ['#C8B46A', '#6A7E3A', '#D8A050']);
      // groves and lone trees
      for (let g = 0; g < area * 0.3; g++) grove(rng.int(3, 6), 26, 13, (x, y) => obj(x, y, treeSprite(rng.pick(MEADOW_TREES), rng), TREE), [22, 26], 20);
      place(area * 0.35, 28, 40, (x, y) => obj(x, y, treeSprite(rng.pick(MEADOW_TREES), rng), TREE), [22, 26]);
      for (let g = 0; g < area * 0.25; g++) grove(rng.int(2, 3), 14, 10, (x, y) => obj(x, y, bushSprite(rng.pick(['hawthorn', 'bracken', 'fieldmaple', 'oakturn']), rng), BUSH), [14, 10]);
      place(area * 1.2, 12, 10, (x, y) => obj(x, y, tuftSprite(rng), { sway: 2 }), [6, 6], 50);
      place(area * 0.25, 22, 40, (x, y) => obj(x, y, sprite('hay', 20, 16, (cc) => A.hay(cc, -7, -8))), [16, 10]);
      place(area * 0.25, 14, 20, (x, y) => obj(x, y, sprite(`rock|${rng.int(0, 2)}`, 14, 12, (cc) => A.rock(cc, 0, -2))), [10, 6]);
      place(area * 0.2, 22, 40, (x, y) => { const n = rng.int(3, 6); obj(x, y, sprite(`fence|${n}`, n * 8 + 6, 14, (cc) => A.fence(cc, -n * 4, -7, n))); }, [40, 8]);
      // animals: a flock or two, a pair of cows, rabbits by the bushes, birds near the lane
      grove(rng.int(3, 4), 18, 9, (x, y) => critter({ kind: 'sheep', x, y }), [10, 8], 18);
      if (rng() < 0.4) grove(2, 14, 12, (x, y) => critter({ kind: 'cow', x, y }), [16, 10], 22);
      if (rng() < 0.6) place(1, 16, 30, (x, y) => critter({ kind: 'rabbit', x, y }), [6, 6], 70);
      place(rng.int(1, 2), 14, 12, (x, y) => critter({ kind: rng() < 0.6 ? 'bird' : 'magpie', x, y }), [4, 4], 40);
      if (rng() < 0.5) place(1, 18, 20, (x, y) => critter({ kind: 'pheasant', x, y }), [8, 6], 60);
      if (rng() < 0.35) place(1, 20, 20, (x, y) => critter({ kind: 'hare', x, y }), [8, 6], 90);
    },
  },
  forest: {
    title: 'The forest', line: '', surface: 'slab', prop: 'mushrooms',
    ground: '#55702E', patches: ['#4A6428', '#607C36', '#3E5822'], ...DARK_DIRT,
    tones: ['#46502E', '#505A30', '#5C6034', '#686436', '#74683A'],
    pathTones: ['#4A3420', '#5E4228', '#745434', '#8A6440', '#9E7650'],
    decorate(ctx) {
      const { c, rng, W, t, b, area, obj, critter, grove, place } = ctx;
      // drifts of fallen leaves and moss
      for (let i = 0; i < area * 6; i++) {
        const cx = rng.range(0, W), cy = rng.range(t, b), col = rng.pick([['#B4602A', '#D07A34', '#E8A048'], ['#9A3E22', '#BC5430', '#D8784A'], ['#A07A24', '#C49A36', '#E0BE5A']]);
        for (let k = 0; k < 34; k++) { const x = cx + rng.range(-14, 14), y = cy + rng.range(-6, 6); rect(c, x, y, rng() < 0.5 ? 2 : 1, 1, rng.pick(col)); }
      }
      grassBlades(ctx, area * 12, ['#5E7E3A', '#344E30', '#9A6A34']);
      // a clearing or two, kept open
      const clear = [];
      for (let i = 0; i < 1; i++) { const p = ctx.spotNearLane(40, 60, [6, 6]); if (p) clear.push(p); }
      const inClearing = (x, y) => clear.some(([cx, cy]) => Math.hypot(x - cx, (y - cy) * 1.4) < 26);
      const tree = (x, y) => { if (inClearing(x, y)) return; obj(x, y, rng() < 0.12 ? pineSprite(rng) : treeSprite(rng.pick(FOREST_TREES), rng), TREE);
        if (rng() < 0.2) for (let k = 0; k < 2; k++) { const fx = x + rng.range(-9, 9), fy = y + rng.range(1, 4); if (ctx.free(fx, fy)) obj(fx, fy, sprite(`fern|${rng.int(0, 2)}`, 12, 12, (cc, r) => A.fern(cc, 0, 0)), { sway: 2 }); } };
      place(area * 9, 15, 11, tree, [10, 8]);
      place(area * 4, 22, 11, tree, [10, 8], 30);
      place(area * 0.6, 14, 14, (x, y) => obj(x, y, bushSprite(rng.pick(['bracken', 'bracken', 'fieldmaple', 'hawthorn']), rng), BUSH), [14, 10]);
      for (const [cx, cy] of clear) {
        grove(rng.int(4, 7), 20, 6, (x, y) => obj(x, y, sprite(`mush|${rng.int(0, 3)}`, 14, 10, (cc, r) => A.mushrooms(cc, -3, -3, r)), { kind: 'mush' }), [8, 5], 12, [cx, cy]);
        if (rng() < 0.7) { const p = [cx + rng.range(-14, 14), cy + rng.range(-6, 6)]; if (ctx.spot(p[0], p[1], 14, [24, 8])) obj(p[0], p[1], sprite('log', 26, 14, (cc) => A.log(cc, -9, -4))); }
        ctx.shaft(cx, cy);
      }
      place(area * 0.25, 14, 24, (x, y) => obj(x, y, sprite(`stump|${rng.int(0, 1)}`, 14, 12, (cc) => A.stump(cc, 0, -2))), [10, 6]);
      place(area * 0.2, 14, 30, (x, y) => obj(x, y, sprite(`rock|${rng.int(0, 2)}`, 14, 12, (cc) => A.rock(cc, 0, -2))), [10, 6]);
      place(rng.int(1, 2), 14, 60, (x, y) => critter({ kind: 'squirrel', x, y }), [4, 4], 60);
      if (rng() < 0.4) place(1, 16, 20, (x, y) => critter({ kind: 'pheasant', x, y }), [8, 6], 40);
    },
  },
  orchard: {
    title: 'The orchard', line: 'Windfalls under every tree.', surface: 'rug', rug: ['#6E9A4E', '#A8C88A', '#EEF0D8'], prop: 'crate',
    ground: '#88AC4C', patches: ['#94B856', '#7C9E44'], ...DIRT,
    decorate(ctx) {
      const { c, rng, W, t, b, area, place, spot, add } = ctx;
      for (let y = t + 4; y < b; y += 8) rect(c, 0, y, W, 3, 'rgba(255,255,240,0.06)');
      // trees in rows, with gaps where the lane runs
      for (let row = 0, y = t + 22; y < b - 2; y += 24, row++) {
        for (let x = 8 + (row % 2) * 14; x < W; x += 28) {
          const jx = x + rng.range(-2, 2), jy = y + rng.range(-2, 2);
          if (spot(jx, jy, 20, [20, 22])) add(jy, () => S.appleTree(c, jx, jy, rng));
        }
      }
      place(area * 1.2, 16, 30, (x, y) => S.crate(c, x, y, rng), [12, 8]);
      place(area * 0.6, 16, 40, (x, y) => S.beehive(c, x, y), [10, 12]);
      place(area * 0.4, 16, 60, (x, y) => S.ladder(c, x, y), [6, 15]);
      place(area * 4, 12, 8, (x, y) => A.flowers(c, x, y, rng));
      place(area * 0.6, 14, 30, (x, y) => A.bird(c, x, y));
    },
  },
  river: {
    title: 'The river', line: 'Mind the ducks on the bridge.', surface: 'planks', prop: 'bucket',
    ground: '#7CA84E', patches: ['#88B456', '#6E9A44'], ...DIRT,
    tones: ['#5E863A', '#688E3E', '#729642', '#7E9E48', '#8AA44E'],
    pathTones: ['#7A5634', '#94693F', '#AC7E4E', '#C2945E', '#D4AA72'],
    decorate(ctx) {
      const { c, rng, W, t, b, area, place, after, laneAt, samples, obj, critter } = ctx;
      grassBlades(ctx, area * 25, ['#9CB860', '#4E7A34', '#C8A050']);
      // the river: winding across, darker in the middle, with a muddy, reedy bank
      const yc = (t + b) / 2, ph = rng.range(0, 6), hw = 10;
      const ry = (x) => yc + Math.sin(x * 0.016 + ph) * 9 + Math.sin(x * 0.047 + ph * 2) * 2;
      for (let x = 0; x < W; x++) {
        const y0 = Math.round(ry(x));
        rect(c, x, y0 - hw - 3, 1, 2, '#5E7A34'); rect(c, x, y0 + hw + 1, 1, 2, '#5E7A34');
        rect(c, x, y0 - hw - 1, 1, hw * 2 + 2, '#6A5A3A');
        for (let j = -hw; j < hw; j++) {
          const d = Math.abs(j + 0.5) / hw, v = d + (((x * 7 + j * 13) % 5) - 2) * 0.04;
          rect(c, x, y0 + j, 1, 1, v > 0.85 ? '#4E7A8E' : v > 0.55 ? '#3E6A84' : '#2E5670');
        }
      }
      for (let i = 0; i < W / 2.5; i++) { const x = rng.range(0, W); rect(c, x, ry(x) + rng.range(-hw + 2, hw - 3), rng.int(2, 5), 1, rng.pick(['#8CB8D4', '#6A9AB8', '#B8D8EC'])); }
      ctx.water = (x, y) => Math.abs(y - ry(x)) < hw + 4;
      ctx.waterway(ry, hw);
      // lily pads and fallen leaves floating
      for (let i = 0; i < area * 2; i++) { const x = rng.range(0, W), y = ry(x) + rng.range(-5, 5); if (Math.abs(x - laneAt(y)) > 20) S.lilypad(c, x, y, rng() < 0.3); }
      for (let i = 0; i < area * 4; i++) { const x = rng.range(0, W), y = ry(x) + rng.range(-7, 7); rect(c, x, y, 2, 1, rng.pick(['#D8702E', '#E8A040', '#B8442A'])); }
      // a stone bridge where the lane crosses
      after(() => {
        const cross = samples.filter(([x, y]) => Math.abs(y - ry(x)) < hw + 5);
        if (!cross.length) return;
        for (const [x, y] of cross) rect(c, x - 10, y - 1, 21, 3, '#A89C8C');
        for (const [x, y] of cross) for (let i = -9; i < 10; i += 4) rect(c, x + i, y, 1, 1, '#8A8072');
        for (const [x, y] of cross) { rect(c, x - 14, y - 2, 5, 5, '#7A7466'); rect(c, x + 10, y - 2, 5, 5, '#7A7466'); }
        for (const [x, y] of cross) { rect(c, x - 14, y - 2, 5, 1, '#C8C0AE'); rect(c, x + 10, y - 2, 5, 1, '#C8C0AE'); }
        for (const [x, y] of [cross[0], cross[cross.length - 1]]) { rect(c, x - 15, y - 5, 7, 7, '#8A8272'); rect(c, x + 9, y - 5, 7, 7, '#8A8272'); rect(c, x - 15, y - 5, 7, 1, '#D8D0C0'); rect(c, x + 9, y - 5, 7, 1, '#D8D0C0'); }
      });
      // jetty and rowing boat off to one side
      const lx = laneAt(yc), jx = lx > W / 2 ? lx - rng.range(60, 100) : lx + rng.range(60, 100), jt = Math.round(ry(jx) - hw - 6), len = hw + 10;
      obj(jx, jt + len, sprite(`jetty|${len}`, 24, len + 10, (cc) => S.jetty(cc, 0, -len, len)));
      obj(jx + 15, Math.round(ry(jx + 15)) + 3, sprite('boat', 24, 14, (cc) => S.rowboat(cc, 0, -2)));
      // reeds on the banks
      for (let i = 0; i < area * 4; i++) {
        const x = rng.range(0, W), side = rng() < 0.5 ? -1 : 1, y = Math.round(ry(x) + side * (hw + 1));
        if (Math.abs(x - laneAt(y)) > 18 && Math.abs(x - jx) > 16) obj(x, y, sprite(`reeds|${rng.int(0, 3)}`, 14, 14, (cc, r) => S.reeds(cc, 0, 0, r)), { sway: 2 });
      }
      // ducks on the water, a heron on the bank
      for (let i = 0; i < rng.int(2, 3); i++) {
        const x = lx + rng.pick([-1, 1]) * rng.range(30, 90);
        critter({ kind: 'duck', x, y: ry(x), water: ry, off: rng.range(-4, 4) });
      }
      if (rng() < 0.7) { const x = lx + rng.pick([-1, 1]) * rng.range(36, 80), y = Math.round(ry(x) + hw + 4); critter({ kind: 'heron', x, y }); }
      place(area * 0.9, 24, 34, (x, y) => obj(x, y, sprite(`willow|${rng.int(0, 3)}`, 40, 46, (cc, r) => S.willow(cc, 0, 0, r)), TREE), [22, 26]);
      place(area * 0.8, 24, 30, (x, y) => obj(x, y, treeSprite(rng.pick(['fieldmaple', 'oakturn', 'beech', 'ash']), rng), TREE), [20, 24]);
      place(area * 0.8, 16, 14, (x, y) => obj(x, y, bushSprite(rng.pick(['hawthorn', 'bracken']), rng), BUSH), [14, 10]);
      place(area * 1.2, 12, 10, (x, y) => obj(x, y, tuftSprite(rng), { sway: 2 }), [6, 6], 50);
      place(rng.int(1, 2), 14, 12, (x, y) => critter({ kind: rng() < 0.5 ? 'bird' : 'magpie', x, y }), [4, 4], 40);
    },
  },
  lake: {
    title: 'The lake', line: 'All aboard. Mind the toads.', surface: 'hull', prop: 'rod',
    ground: '#7CA84E', patches: ['#88B456', '#6E9A44'], ...DIRT,
    tones: ['#5E863A', '#688E3E', '#729642', '#7E9E48', '#8AA44E'],
    pathTones: ['#7A5634', '#94693F', '#AC7E4E', '#C2945E', '#D4AA72'],
    decorate(ctx) {
      const { c, rng, W, t, b, area, after, laneAt, samples, obj, critter, place } = ctx;
      grassBlades(ctx, area * 25, ['#9CB860', '#4E7A34', '#C8A050']);
      // a wide lake across the lane, with a strip of shore above and below
      const top = t + rng.int(20, 26), bot = b - rng.int(20, 26), cy = (top + bot) / 2, ry = (bot - top) / 2;
      const rx = rng.range(180, 240), cx = Math.max(rx * 0.7, Math.min(W - rx * 0.7, laneAt(cy) + rng.range(-50, 50)));
      const L = lakeShape(cx, cy, rx, ry, rng);
      ctx.water = (x, y) => L.inside(x, y, 5);
      // where the lane goes into the water and comes out again: a jetty at each
      const wet = samples.filter(([x, y]) => y > t && y < b && L.inside(x, y));
      const inAt = wet.length ? wet[0] : null, outAt = wet.length ? wet[wet.length - 1] : null;
      const onJetty = (x, y) => [inAt, outAt].some((j) => j && Math.abs(y - j[1]) < 9 && Math.abs(x - j[0]) < 8);
      ctx.lake(L, onJetty);
      after(() => {
        paintLake(c, L);
        for (let i = 0; i < L.rx * 1.2; i++) {
          const x = cx + rng.range(-rx, rx), y = cy + rng.range(-ry, ry);
          if (L.d(x, y) < 0.9) rect(c, x, y, rng.int(2, 4), 1, rng.pick(['#8CB8D4', '#6A9AB8', '#B8D8EC']));
        }
        // lily pads and leaves floating, kept clear of the pegs
        for (let i = 0; i < area * 5; i++) {
          const x = cx + rng.range(-rx, rx), y = cy + rng.range(-ry, ry), d = L.d(x, y);
          if (d < 0.97 && d > 0.45 && Math.abs(x - laneAt(y)) > 16) S.lilypad(c, x, y, rng() < 0.25);
        }
        for (let i = 0; i < area * 4; i++) { const x = cx + rng.range(-rx, rx), y = cy + rng.range(-ry, ry); if (L.d(x, y) < 0.95) rect(c, x, y, 2, 1, rng.pick(['#D8702E', '#E8A040', '#B8442A'])); }
        for (const j of [inAt, outAt]) {
          if (!j) continue;
          const down = j === inAt, len = 16, jt = down ? Math.round(j[1]) - 6 : Math.round(j[1]) - 10;
          S.jetty(c, Math.round(j[0]), jt, len);
        }
      });
      // moored boats by the first jetty, and one out on the water
      if (inAt) { const side = inAt[0] > W / 2 ? -1 : 1; obj(inAt[0] + side * 17, inAt[1] + 4, sprite('boat', 24, 14, (cc) => S.rowboat(cc, 0, -2))); }
      for (let k = 0; k < 20; k++) { const x = cx + rng.range(-rx * 0.8, rx * 0.8), y = cy + rng.range(-ry * 0.5, ry * 0.5); if (L.d(x, y) < 0.75 && Math.abs(x - laneAt(y)) > 60) { obj(x, y, sprite('boat', 24, 14, (cc) => S.rowboat(cc, 0, -2))); break; } }
      // reeds and bulrushes round the edge
      for (let i = 0; i < area * 7; i++) {
        const a = rng.range(0, 6.28), r = rng.range(0.96, 1.06);
        const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
        if (L.d(x, y) < 0.95 || L.d(x, y) > 1.08 || y < t + 4 || y > b - 2 || Math.abs(x - laneAt(y)) < 18 || onJetty(x, y)) continue;
        obj(x, y, sprite(`reeds|${rng.int(0, 3)}`, 14, 14, (cc, r2) => S.reeds(cc, 0, 0, r2)), { sway: 2 });
      }
      // weeping willows leaning over the banks
      for (let i = 0; i < area * 3; i++) {
        const a = rng.range(0, 6.28), x = cx + Math.cos(a) * rx * 1.12, y = cy + Math.sin(a) * ry * 1.12 + 8;
        if (y < t + 8 || y > b - 2 || !ctx.spot(x, y, 22, [22, 10])) continue;
        obj(x, y, sprite(`weeping|${rng.int(0, 3)}`, 44, 46, (cc, r) => weepingWillow(cc, 0, 0, r)), TREE);
      }
      place(area * 0.4, 22, 30, (x, y) => obj(x, y, sprite(`weeping|${rng.int(0, 3)}`, 44, 46, (cc, r) => weepingWillow(cc, 0, 0, r)), TREE), [22, 26]);
      place(area * 0.6, 16, 14, (x, y) => obj(x, y, bushSprite(rng.pick(['hawthorn', 'bracken']), rng), BUSH), [14, 10]);
      place(area * 1.2, 12, 10, (x, y) => obj(x, y, tuftSprite(rng), { sway: 2 }), [6, 6], 50);
      // toads on the bank and on the bigger pads; a pair of swans out on the water
      for (let i = 0, n = 0; i < 60 && n < 3; i++) {
        const a = rng.range(0, 6.28), x = cx + Math.cos(a) * rx * 1.04, y = cy + Math.sin(a) * ry * 1.04 + 2;
        if (Math.abs(x - laneAt(y)) < 24 || y < t + 4 || y > b - 2 || L.d(x, y) < 1) continue;
        critter({ kind: 'toad', x, y }); n++;
      }
      for (let i = 0, n = 0; i < 60 && n < 2; i++) {
        const x = cx + rng.range(-rx * 0.8, rx * 0.8), y = cy + rng.range(-ry * 0.6, ry * 0.6);
        if (L.d(x, y) > 0.8 || Math.abs(x - laneAt(y)) < 26) continue;
        after(() => { oval(c, x, y + 1, 5, 3, '#3E7A34'); oval(c, x, y, 4, 2, '#5E9A42'); rect(c, x + 2, y - 2, 2, 1, '#3E6A84'); });
        critter({ kind: 'toad', x, y, pad: true }); n++;
      }
      for (let k = 0; k < 40; k++) {
        const x = cx + rng.range(-rx * 0.6, rx * 0.6), y = cy + rng.range(-ry * 0.4, ry * 0.4);
        if (L.d(x - 40, y) > 0.8 || L.d(x + 40, y) > 0.8 || Math.abs(x - laneAt(y)) < 70) continue;
        for (let i = 0; i < 2; i++) critter({ kind: 'swan', x: x + i * 9, y: y + i * 3, water: () => y + i * 3, off: 0 });
        break;
      }
      place(rng.int(1, 2), 14, 12, (x, y) => critter({ kind: rng() < 0.5 ? 'bird' : 'magpie', x, y }), [4, 4], 40);
    },
  },
  farm: {
    title: 'The farm', line: 'Something smells of hay.', surface: 'straw', prop: 'churn',
    ground: '#8EA84A', patches: ['#9AB454', '#80983E'], ...DIRT,
    decorate(ctx) {
      const { c, rng, area, place, field, add } = ctx;
      grass(ctx, area * 30, ['#B0C868', '#7A9238']);
      for (let i = 0; i < 5; i++) field(rng.int(40, 90), rng.int(22, 40), rng.pick(['plough', 'wheat', 'cabbage', 'stubble']));
      const barn = ctx.spotNearLane(34, 50, [44, 36]);
      if (barn) add(barn[1], () => S.barn(c, barn[0], barn[1]));
      place(area * 0.5, 24, 50, (x, y) => S.tractor(c, x, y, rng() < 0.5), [20, 14]);
      place(area * 0.6, 20, 40, (x, y) => S.scarecrow(c, x, y), [12, 18]);
      place(area * 1.2, 16, 12, (x, y) => S.pig(c, x, y, rng() < 0.5), [12, 6]);
      place(area * 2, 12, 8, (x, y) => S.hen(c, x, y, rng() < 0.5));
      place(area * 1, 22, 24, (x, y) => A.hay(c, x, y), [16, 9]);
      place(area * 0.8, 24, 26, (x, y) => A.cow(c, x, y, rng() < 0.5, rng() < 0.4), [18, 10]);
      place(area * 0.6, 22, 40, (x, y) => A.fence(c, x, y, rng.int(3, 6)));
      place(area * 0.8, 26, 36, (x, y) => A.tree(c, x, y, rng.pick(['gold', 'orange', 'green']), rng.range(1, 1.2), rng), [20, 26]);
    },
  },
  moor: {
    title: 'The moor', line: 'The wind picks up out here.', surface: 'stone', prop: 'flask',
    ground: '#8C9858', patches: ['#96A262', '#82904E', '#9A9A5E'], ...STONY,
    decorate(ctx) {
      const { c, rng, W, t, b, area, place } = ctx;
      for (let i = 0; i < area * 14; i++) {
        const cx = rng.range(0, W), cy = rng.range(t, b), col = rng.pick([['#8E5A86', '#A86A9A'], ['#7A4E76', '#9A6090'], ['#A8743A', '#C08A48']]);
        for (let k = 0; k < 18; k++) rect(c, cx + rng.range(-12, 12), cy + rng.range(-4, 4), rng.int(1, 2), 1, rng.pick(col));
      }
      grass(ctx, area * 40, ['#A8B070', '#6E7A40', '#B890B0']);
      place(area * 0.5, 34, 80, (x, y) => S.tor(c, x, y), [32, 20]);
      place(area * 1.6, 18, 24, (x, y) => S.boulder(c, x, y, rng.range(0.7, 1.2)), [16, 10]);
      place(area * 3, 14, 12, (x, y) => S.gorse(c, x, y, rng), [12, 8]);
      place(area * 6, 10, 6, (x, y) => S.heather(c, x, y, rng));
      place(area * 0.8, 22, 40, (x, y) => S.stoneWall(c, x, y, rng.int(5, 12), rng));
      place(area * 0.6, 22, 30, (x, y) => S.pony(c, x, y, rng() < 0.5), [16, 10]);
      place(area * 1, 20, 20, (x, y) => A.sheep(c, x, y, rng() < 0.5));
      place(area * 0.4, 16, 60, (x, y) => S.cairn(c, x, y));
      place(area * 0.5, 22, 50, (x, y) => A.tree(c, x, y, 'gold', 0.8, rng), [16, 20]);
    },
  },
  village: {
    title: 'The village', line: 'Someone has the kettle on.', surface: 'cloth', prop: 'teapot',
    ground: '#86A84A', patches: ['#92B454', '#7A9C42'], ...COBBLE,
    tones: ['#6C883C', '#768E40', '#809644', '#8A9C48', '#96A24E'],
    pathTones: ['#5E5650', '#7A7068', '#968A7E', '#ACA092', '#BCB2A2'],
    decorate(ctx) {
      const { c, rng, area, place, obj, critter, spotNearLane } = ctx;
      grassBlades(ctx, area * 20, ['#A8B868', '#5E7A34', '#C8A050']);
      const big = (key, w, h, fn) => sprite(key, w, h, fn);
      // the tea room and the pub first, then cottages along the lane
      const tea = spotNearLane(30, 30, [50, 36]);
      if (tea) obj(tea[0], tea[1], big(`tearoom|${rng.int(0, 2)}`, 64, 48, (cc, r) => S.tearoom(cc, 0, 0, r)), { kind: 'house', ...homely(36, true) });
      const pb = spotNearLane(30, 40, [56, 36]);
      if (pb) obj(pb[0], pb[1], big(`pub|${rng.int(0, 2)}`, 66, 48, (cc, r) => S.pub(cc, 0, 0, r)), { kind: 'house', ...homely(40, true) });
      // cottages lining the lane, each with a fenced front garden
      const { t, b, laneAt } = ctx;
      for (let y = t + 34; y < b - 4; y += rng.int(30, 38)) for (const dir of [-1, 1]) {
        for (const off of [rng.range(32, 40), rng.range(78, 92)]) {
          if (off > 60 && rng() < 0.45) continue;
          const x = laneAt(y) + dir * off;
          if (!ctx.spot(x, y, 26, [40, 34])) continue;
          obj(x, y, big(`house|${rng.int(0, 7)}`, 46, 46, (cc, r) => S.house(cc, 0, 0, r)), { kind: 'house', ...homely(30, false) });
          if (ctx.spot(x, y + 8, 14, [38, 5])) {
            obj(x, y + 8, sprite('frontfence', 44, 12, (cc) => { S.picket(cc, -18, 0, 5); S.picket(cc, 4, 0, 5); }));
            for (let k = 0; k < 14; k++) { const fx = x + rng.range(-16, 16), fy = y + rng.range(2, 6); if (Math.abs(fx - x) > 3) rect(c, fx, fy, 1, 1, rng.pick(['#F2A0B8', '#E8603A', '#FFF4DC', '#FFD45E', '#B8A0E8', '#4E8A3A'])); }
          }
        }
      }
      place(3, 12, 50, (x, y) => obj(x, y, sprite('lamp', 14, 26, (cc) => S.lamppost(cc, 0, 0, true)), { kind: 'lamp', glows: [[0, -15]] }), [5, 16], 16);
      place(1, 14, 40, (x, y) => obj(x, y, sprite('phonebox', 14, 22, (cc) => S.phonebox(cc, 0, 0))), [10, 18], 16);
      place(1, 12, 40, (x, y) => obj(x, y, sprite('postbox', 10, 14, (cc) => S.postbox(cc, 0, 0))), [6, 10], 14);
      place(2, 14, 40, (x, y) => obj(x, y, sprite('bench', 18, 12, (cc) => S.bench(cc, 0, 0))), [14, 7], 20);
      place(area * 0.6, 26, 40, (x, y) => obj(x, y, treeSprite(rng.pick(['fieldmaple', 'cherry', 'oakturn', 'sycamore']), rng), TREE), [20, 24]);
      place(rng.int(1, 2), 14, 30, (x, y) => critter({ kind: 'cat', x, y }), [6, 6], 30);
      place(rng.int(1, 2), 14, 12, (x, y) => critter({ kind: 'bird', x, y }), [4, 4], 30);
    },
  },
  churchyard: {
    title: 'The churchyard', line: 'Quiet now, past the church.', surface: 'rug', rug: ['#6E4A6A', '#AE90AA', '#EEE4EA'], prop: 'posy',
    ground: '#6E8C44', patches: ['#7A9A4C', '#62803C'], ...GRAVEL,
    decorate(ctx) {
      const { c, rng, area, place, spotNearLane, add } = ctx;
      grass(ctx, area * 40, ['#8AA858', '#56722E']);
      const ch = spotNearLane(38, 70, [50, 54]);
      if (ch) add(ch[1], () => S.church(c, ch[0], ch[1]));
      place(1, 18, 40, (x, y) => S.lychgate(c, x, y), [28, 14], 22);
      place(area * 7, 12, 9, (x, y) => S.gravestone(c, x, y, rng.pick(['round', 'round', 'cross', 'tilt'])), [7, 9]);
      place(area * 1.2, 22, 34, (x, y) => S.yew(c, x, y, rng), [18, 20]);
      place(area * 0.8, 20, 40, (x, y) => S.stoneWall(c, x, y, rng.int(6, 14), rng));
      place(area * 0.6, 12, 30, (x, y) => S.crow(c, x, y));
      place(area * 1.6, 12, 12, (x, y) => A.flowers(c, x, y, rng));
    },
  },
  green: {
    title: 'The village green', line: 'Nearly home now.', surface: 'stripes', prop: 'flags',
    ground: '#8EBC50', patches: ['#98C65A', '#84B048'], ...GRAVEL,
    decorate(ctx) {
      const { c, rng, W, t, b, area, place, spot, add, pondAt } = ctx;
      for (let y = t; y < b; y += 12) rect(c, 0, y, W, 6, 'rgba(255,255,230,0.07)');
      const bs = ctx.spotNearLane(30, 30, [36, 30]);
      if (bs) add(bs[1], () => S.bandstand(c, bs[0], bs[1]));
      pondAt(rng.int(22, 30), rng.int(9, 12), 50);
      place(1, 22, 40, (x, y) => S.bonfire(c, x, y), [18, 15]);
      place(1, 20, 40, (x, y) => S.maypole(c, x, y), [10, 28]);
      place(area * 1.4, 16, 24, (x, y) => S.bench(c, x, y), [14, 7]);
      place(area * 0.6, 34, 60, (x, y) => A.tree(c, x, y, rng.pick(['gold', 'orange']), rng.range(1.4, 1.6), rng), [30, 36]);
      place(area * 0.8, 12, 30, (x, y) => S.lamppost(c, x, y), [4, 16]);
      place(area * 2, 12, 10, (x, y) => A.flowers(c, x, y, rng));
      // bunting strung across the lane
      const ys = ctx.holeYs.filter((y, i) => i % 6 === 3);
      for (const y of ys) { const x = ctx.laneAt(y); add(y + 1, () => S.bunting(c, Math.round(x - 14), Math.round(x + 14), Math.round(y + 1), rng)); }
    },
  },
  town: {
    title: 'The town', line: 'The shops are still open.', surface: 'rug', rug: ['#2B4A5E', '#8AA4B4', '#F2EEE4'], prop: 'cups',
    ground: '#9C9284', patches: ['#A49A8C', '#928878'], ...COBBLE,
    decorate(ctx) {
      const { c, rng, W, t, b, area, place, add } = ctx;
      for (let y = t; y < b; y += 6) rect(c, 0, y, W, 1, 'rgba(60,50,40,0.07)');
      for (let y = t, r = 0; y < b; y += 6, r++) for (let x = (r % 2) * 5; x < W; x += 10) rect(c, x, y, 1, 6, 'rgba(60,50,40,0.06)');
      // terraces of shops facing the lane, a bookshop in every town
      const kinds = ['books', 'bakery', 'grocer', 'plain', 'plain', 'books'];
      let n = 0;
      for (let y = t + 40; y < b - 2; y += 44) for (const dir of [-1, 1]) {
        const lx = ctx.laneAt(y);
        let x = [30, 38, 46].map((o) => lx + dir * o).find((x0) => ctx.spot(x0, y, 22, [27, 36]));
        if (x === undefined) continue;
        for (let k = 0; k < 4 && x > 14 && x < W - 14; k++, x += dir * 27) {
          if (k && !ctx.spot(x, y, 22, [27, 36])) break;
          const kind = n === 1 ? 'books' : rng.pick(kinds), sx = x, sy = y; n++;
          add(y, () => S.shop(c, sx, sy, rng, kind));
        }
      }
      place(area * 1.2, 12, 30, (x, y) => S.lamppost(c, x, y), [4, 16], 14);
      place(area * 0.5, 14, 50, (x, y) => S.postbox(c, x, y), [6, 10], 12);
      place(area * 0.3, 14, 70, (x, y) => S.phonebox(c, x, y), [10, 18], 14);
      place(area * 1.2, 12, 24, (x, y) => S.planter(c, x, y, rng), [10, 7]);
      place(area * 0.8, 14, 30, (x, y) => S.bench(c, x, y), [14, 7]);
      place(area * 0.6, 22, 40, (x, y) => A.tree(c, x, y, rng.pick(['gold', 'orange', 'red']), 1, rng), [18, 24]);
    },
  },
};

export const MIDDLE = ['forest', 'orchard', 'river', 'lake', 'farm', 'moor', 'village', 'churchyard', 'town'];
// Biomes switched on. While the new style is tried out, only the restyled ones are used.
export const ACTIVE = ['meadow', 'forest', 'river', 'lake', 'village'];

const TREE = { kind: 'tree', cover: true, sway: 1 }, BUSH = { kind: 'bush', cover: true };
// A house's windows (lit at dusk), where the glow sits, and the top of its chimney.
// Matches S.house: walls w wide, base at (0, 0).
function homely(w, lit) {
  const wins = [[-w / 2 + 3, -11], [w / 2 - 9, -11]];
  return { wins, lit, glows: wins.map(([x, y]) => [x + 2, y + 2]), chimney: [w / 2 - 6, -32] };
}
const MEADOW_TREES = ['oakturn', 'beech', 'fieldmaple', 'birch', 'oak', 'cherry', 'sycamore', 'oakturn'];
const FOREST_TREES = ['beech', 'oakturn', 'fieldmaple', 'beech', 'oak', 'cherry', 'sycamore', 'green', 'beech'];
function treeSprite(set, rng) {
  const v = rng.int(0, 3), sc = rng.pick([0.95, 1.1, 1.25]);
  if (set === 'birch') return sprite(`birch|${v}|${sc}`, 30, 48, (c, r) => A.birch(c, 0, 0, sc, r));
  return sprite(`tree|${set}|${v}|${sc}`, 46, 48, (c, r) => A.tree(c, 0, 0, set, set === 'oak' ? sc * 1.1 : sc, r));
}
function pineSprite(rng) { const v = rng.int(0, 3), sc = rng.pick([0.95, 1.1, 1.25]), au = rng() < 0.15; return sprite(`pine|${v}|${sc}|${au}`, 32, 48, (c, r) => A.pine(c, 0, 0, sc, r, au)); }
function bushSprite(set, rng) { const v = rng.int(0, 2), berry = set === 'hawthorn' ? rng.pick(['#B82A22', '#B82A22', null]) : null; return sprite(`bush|${set}|${v}|${berry}`, 24, 18, (c, r) => A.bush(c, 0, 0, set, r, berry)); }
function tuftSprite(rng) { const v = rng.int(0, 5); return sprite(`tuft|${v}`, 12, 14, (c, r) => A.tallGrass(c, 0, 0, r, v > 3), { outline: false }); }
function grassBlades(ctx, n, cols) { const { c, rng, W, t, b } = ctx; for (let i = 0; i < n; i++) { const x = rng.range(0, W), y = rng.range(t, b); rect(c, x, y, 1, 1, cols[0]); rect(c, x, y + 1, 1, 1, cols[1]); if (rng() < 0.3) rect(c, x + 1, y, 1, 1, cols[2]); } }
