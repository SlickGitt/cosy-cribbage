// Biomes: ground, lane colours, scenery, rest stop surface and the line shown the
// first time you walk into each one. decorate() runs once per stretch of lane:
// ground-level things are drawn straight away (the lane is laid over them),
// standing things go through place() so they are depth-sorted and kept off the lane.
import { rect, oval } from './pixel.js';
import * as A from './art.js';
import * as S from './scenery.js';
import { sprite } from './sprites.js';

const DIRT = { path: ['#7A5634', '#C49464', '#D6A874'], specks: ['#A07A50', '#E8C08A'] };
const DARK_DIRT = { path: ['#4A3420', '#8A6440', '#9E7650'], specks: ['#6B4A2E', '#C8402F', '#E8862E'] };
const COBBLE = { path: ['#5E5650', '#A89C8C', '#BCB2A2'], specks: ['#8A8072', '#D2C8B8'] };
const STONY = { path: ['#5A5242', '#9A8E74', '#B0A486'], specks: ['#7A7466', '#C8BCA0'] };
const GRAVEL = { path: ['#6A5E4E', '#B8AC94', '#CEC2AA'], specks: ['#9A8E7A', '#E2D8C4'] };

const grass = (ctx, n, cols) => { const { c, rng, W, t, b } = ctx; for (let i = 0; i < n; i++) rect(c, rng.range(0, W), rng.range(t, b), 1, 2, rng.pick(cols)); };
const leafLitter = (ctx, n, cols) => { const { c, rng, W, t, b } = ctx; for (let i = 0; i < n; i++) rect(c, rng.range(0, W), rng.range(t, b), 2, 1, rng.pick(cols)); };

export const BIOMES = {
  meadow: {
    title: 'The meadow', line: 'Sheep, hay and wide open sky.', surface: 'rug', rug: ['#C98272', '#E2AE9E', '#F2E4CC'], prop: 'basket',
    ground: '#8FB04A', patches: ['#9CBC54', '#82A040', '#A8C860'], ...DIRT,
    tones: ['#557E38', '#62903C', '#73A042', '#86B04A', '#9CC058', '#B2CE66'],
    pathTones: ['#7A5634', '#94693F', '#AC7E4E', '#C2945E', '#D4AA72'],
    decorate(ctx) {
      const { c, rng, area, obj, critter, grove, place, spot } = ctx;
      // flower patches and grass blades on the ground
      for (let i = 0; i < area * 1.4; i++) {
        const p = ctx.spotNearLane(16, 110, [4, 4]); if (!p) continue;
        const col = rng.pick(['#FFF4DC', '#F2A0B8', '#FFD45E', '#B8A0E8', '#E8603A']);
        for (let k = 0; k < 26; k++) { const x = p[0] + rng.range(-12, 12), y = p[1] + rng.range(-6, 6); if (!ctx.near(x, y, 11)) { rect(c, x, y + 1, 1, 1, '#3E6A2E'); rect(c, x, y, 1, 1, rng() < 0.85 ? col : '#FFF4DC'); } }
        if (rng() < 0.6) critter({ kind: 'butterfly', x: p[0], y: p[1] });
      }
      grassBlades(ctx, area * 70, ['#B8D474', '#4E7A34', '#9CC058']);
      // groves and lone trees
      for (let g = 0; g < area * 0.3; g++) grove(rng.int(3, 6), 26, 13, (x, y) => obj(x, y, treeSprite(rng.pick(MEADOW_TREES), rng), TREE), [22, 26], 20);
      place(area * 0.35, 28, 40, (x, y) => obj(x, y, treeSprite(rng.pick(MEADOW_TREES), rng), TREE), [22, 26]);
      for (let g = 0; g < area * 0.4; g++) grove(rng.int(2, 4), 14, 10, (x, y) => obj(x, y, bushSprite(rng.pick(['green', 'lime']), rng), BUSH), [14, 10]);
      place(area * 4, 12, 7, (x, y) => obj(x, y, tuftSprite(rng), { sway: 2 }), [6, 6], 50);
      place(area * 0.5, 22, 34, (x, y) => obj(x, y, sprite('hay', 20, 16, (cc) => A.hay(cc, -7, -8))), [16, 10]);
      place(area * 0.6, 14, 20, (x, y) => obj(x, y, sprite(`rock|${rng.int(0, 2)}`, 14, 12, (cc) => A.rock(cc, 0, -2))), [10, 6]);
      place(area * 0.35, 22, 40, (x, y) => { const n = rng.int(3, 6); obj(x, y, sprite(`fence|${n}`, n * 8 + 6, 14, (cc) => A.fence(cc, -n * 4, -7, n))); }, [40, 8]);
      // animals: a flock or two, a pair of cows, rabbits by the bushes, birds near the lane
      for (let f = 0; f < Math.max(1, area * 0.15); f++) grove(rng.int(3, 5), 18, 8, (x, y) => critter({ kind: 'sheep', x, y }), [10, 8], 18);
      if (rng() < 0.8) grove(2, 14, 12, (x, y) => critter({ kind: 'cow', x, y }), [16, 10], 22);
      place(Math.max(1, area * 0.15), 16, 30, (x, y) => critter({ kind: 'rabbit', x, y }), [6, 6], 70);
      place(area * 0.35, 14, 12, (x, y) => critter({ kind: 'bird', x, y }), [4, 4], 40);
    },
  },
  forest: {
    title: 'The forest', line: '', surface: 'slab', prop: 'mushrooms',
    ground: '#55702E', patches: ['#4A6428', '#607C36', '#3E5822'], ...DARK_DIRT,
    tones: ['#263E2C', '#2E4A2E', '#385632', '#446236', '#52703A', '#627E40'],
    pathTones: ['#4A3420', '#5E4228', '#745434', '#8A6440', '#9E7650'],
    decorate(ctx) {
      const { c, rng, W, t, b, area, obj, critter, grove, place } = ctx;
      // drifts of fallen leaves and moss
      for (let i = 0; i < area * 5; i++) {
        const cx = rng.range(0, W), cy = rng.range(t, b), col = rng.pick([['#C8642A', '#E8862E', '#F2B63C'], ['#A8352B', '#C8402F', '#E07A3A'], ['#6E8A3A', '#86A244']]);
        for (let k = 0; k < 40; k++) { const x = cx + rng.range(-14, 14), y = cy + rng.range(-6, 6); rect(c, x, y, rng() < 0.5 ? 2 : 1, 1, rng.pick(col)); }
      }
      grassBlades(ctx, area * 30, ['#5E7E3A', '#2A4228', '#E8862E']);
      // a clearing or two, kept open
      const clear = [];
      for (let i = 0; i < 2; i++) { const p = ctx.spotNearLane(40, 60, [6, 6]); if (p) clear.push(p); }
      const inClearing = (x, y) => clear.some(([cx, cy]) => Math.hypot(x - cx, (y - cy) * 1.4) < 26);
      const tree = (x, y) => { if (inClearing(x, y)) return; obj(x, y, rng() < 0.35 ? pineSprite(rng) : treeSprite(rng.pick(FOREST_TREES), rng), TREE);
        if (rng() < 0.45) for (let k = 0; k < 2; k++) { const fx = x + rng.range(-9, 9), fy = y + rng.range(1, 4); if (ctx.free(fx, fy)) obj(fx, fy, sprite(`fern|${rng.int(0, 2)}`, 12, 12, (cc, r) => A.fern(cc, 0, 0)), { sway: 2 }); } };
      place(area * 9, 15, 11, tree, [10, 8]);
      place(area * 4, 22, 11, tree, [10, 8], 30);
      place(area * 1.2, 14, 12, (x, y) => obj(x, y, bushSprite(rng.pick(['green', 'red', 'orange']), rng), BUSH), [14, 10]);
      for (const [cx, cy] of clear) {
        grove(rng.int(4, 7), 20, 6, (x, y) => obj(x, y, sprite(`mush|${rng.int(0, 3)}`, 14, 10, (cc, r) => A.mushrooms(cc, -3, -3, r)), { kind: 'mush' }), [8, 5], 12, [cx, cy]);
        if (rng() < 0.7) { const p = [cx + rng.range(-14, 14), cy + rng.range(-6, 6)]; if (ctx.spot(p[0], p[1], 14, [24, 8])) obj(p[0], p[1], sprite('log', 26, 14, (cc) => A.log(cc, -9, -4))); }
        ctx.shaft(cx, cy);
      }
      place(area * 0.6, 14, 20, (x, y) => obj(x, y, sprite(`stump|${rng.int(0, 1)}`, 14, 12, (cc) => A.stump(cc, 0, -2))), [10, 6]);
      place(area * 0.4, 14, 30, (x, y) => obj(x, y, sprite(`rock|${rng.int(0, 2)}`, 14, 12, (cc) => A.rock(cc, 0, -2))), [10, 6]);
      place(Math.max(2, area * 0.3), 14, 40, (x, y) => critter({ kind: 'squirrel', x, y }), [4, 4], 60);
      place(area * 0.15, 14, 20, (x, y) => critter({ kind: 'bird', x, y }), [4, 4], 30);
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
    decorate(ctx) {
      const { c, rng, W, t, b, area, place, spot, add, after, laneAt, samples } = ctx;
      grass(ctx, area * 40, ['#9CC860', '#5E8A3A']);
      const yc = (t + b) / 2, ph = rng.range(0, 6), hw = 9;
      const ry = (x) => yc + Math.sin(x * 0.017 + ph) * 8 + Math.sin(x * 0.05 + ph * 2) * 2;
      for (let x = 0; x < W; x++) {
        const y0 = Math.round(ry(x));
        rect(c, x, y0 - hw - 2, 1, hw * 2 + 4, '#7A6A42');
        rect(c, x, y0 - hw, 1, hw * 2, '#2E5A7A');
        rect(c, x, y0 - hw + 2, 1, hw * 2 - 3, '#3E7AA0');
      }
      for (let i = 0; i < W / 3; i++) { const x = rng.range(0, W); rect(c, x, ry(x) + rng.range(-hw + 3, hw - 3), rng.int(2, 4), 1, rng.pick(['#9CCBE8', '#5E9AC0'])); }
      ctx.water = (x, y) => Math.abs(y - ry(x)) < hw + 3;
      // a stone bridge where the lane crosses
      after(() => {
        const cross = samples.filter(([x, y]) => Math.abs(y - ry(x)) < hw + 5);
        if (!cross.length) return;
        for (const [x, y] of cross) rect(c, x - 10, y - 1, 21, 3, '#A89C8C');
        for (const [x, y] of cross) for (let i = -9; i < 10; i += 4) rect(c, x + i, y, 1, 1, '#8A8072');
        for (const [x, y] of cross) { rect(c, x - 13, y - 2, 4, 4, '#7A7466'); rect(c, x + 10, y - 2, 4, 4, '#7A7466'); }
        for (const [x, y] of cross) { rect(c, x - 13, y - 2, 4, 1, '#C0B8A6'); rect(c, x + 10, y - 2, 4, 1, '#C0B8A6'); }
        for (const [x, y] of [cross[0], cross[cross.length - 1]]) { rect(c, x - 14, y - 4, 6, 6, '#8A8272'); rect(c, x + 9, y - 4, 6, 6, '#8A8272'); rect(c, x - 14, y - 4, 6, 1, '#D0C8B8'); rect(c, x + 9, y - 4, 6, 1, '#D0C8B8'); }
      });
      const lx = laneAt(yc);
      // jetty and boat on whichever side has room
      const jx = lx > W / 2 ? lx - rng.range(70, 120) : lx + rng.range(70, 120);
      const jt = Math.round(ry(jx) - hw - 6);
      add(jt, () => { S.jetty(c, jx, jt, hw + 10); S.rowboat(c, jx + 14, Math.round(ry(jx + 14)) + 2); });
      for (let i = 0; i < area * 3; i++) {
        const x = rng.range(0, W), side = rng() < 0.5 ? -1 : 1, y = ry(x) + side * (hw + 1);
        if (Math.abs(x - laneAt(y)) > 18 && Math.abs(x - jx) > 14) add(y, () => S.reeds(c, x, y, rng));
      }
      for (let i = 0; i < area * 1.5; i++) {
        const x = rng.range(0, W), y = ry(x) + rng.range(-4, 4);
        if (Math.abs(x - laneAt(y)) > 18 && Math.abs(x - jx) > 22) add(y - 6, () => S.lilypad(c, x, y, rng() < 0.4));
      }
      for (let i = 0; i < 5; i++) {
        const x = rng.range(20, W - 20), y = ry(x) + rng.range(-3, 3);
        if (Math.abs(x - laneAt(y)) > 24 && Math.abs(x - jx) > 22) add(y, () => S.duck(c, x, y, rng() < 0.5, rng() < 0.5));
      }
      place(area * 0.8, 26, 40, (x, y) => S.willow(c, x, y, rng), [24, 30]);
      place(area * 0.8, 24, 30, (x, y) => A.tree(c, x, y, rng.pick(['green', 'lime', 'gold']), rng.range(1, 1.2), rng), [20, 26]);
      place(area * 1.4, 18, 16, (x, y) => A.bush(c, x, y, rng.pick(['green', 'lime']), rng, rng.pick([null, '#F2A0B8'])));
      place(area * 3, 12, 8, (x, y) => A.flowers(c, x, y, rng));
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
        for (let k = 0; k < 26; k++) rect(c, cx + rng.range(-12, 12), cy + rng.range(-4, 4), rng.int(1, 2), 1, rng.pick(col));
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
    decorate(ctx) {
      const { c, rng, area, place, spotNearLane, add } = ctx;
      grass(ctx, area * 30, ['#A8C868', '#6E9038']);
      const tea = spotNearLane(30, 44, [44, 34]);
      if (tea) add(tea[1], () => S.tearoom(c, tea[0], tea[1], rng));
      place(area * 2.6, 30, 44, (x, y) => S.house(c, x, y, rng), [36, 32], 30);
      place(area * 2, 14, 18, (x, y) => S.cottageGarden(c, x, y, rng), [14, 6]);
      place(area * 1.2, 14, 26, (x, y) => S.picket(c, x, y, rng.int(4, 8)), [24, 6]);
      place(area * 1, 16, 30, (x, y) => S.hedge(c, x, y, rng.int(14, 26)), [26, 8]);
      place(area * 1, 12, 34, (x, y) => S.lamppost(c, x, y), [4, 16], 16);
      place(area * 0.5, 12, 50, (x, y) => S.cat(c, x, y, rng() < 0.5));
      place(area * 0.8, 26, 40, (x, y) => A.tree(c, x, y, rng.pick(['gold', 'orange', 'red']), rng.range(1, 1.2), rng), [20, 26]);
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

export const MIDDLE = ['forest', 'orchard', 'river', 'farm', 'moor', 'village', 'churchyard', 'town'];
// Biomes switched on. While the new style is tried out, only the restyled ones are used.
export const ACTIVE = ['meadow', 'forest'];

const TREE = { kind: 'tree', cover: true, sway: 1 }, BUSH = { kind: 'bush', cover: true };
const MEADOW_TREES = ['gold', 'orange', 'lime', 'green', 'gold'];
const FOREST_TREES = ['orange', 'red', 'green', 'gold', 'plum', 'orange', 'lime'];
function treeSprite(set, rng) { const v = rng.int(0, 3), sc = rng.pick([0.95, 1.1, 1.25]); return sprite(`tree|${set}|${v}|${sc}`, 46, 48, (c, r) => A.tree(c, 0, 0, set, sc, r)); }
function pineSprite(rng) { const v = rng.int(0, 3), sc = rng.pick([0.95, 1.1, 1.25]), au = rng() < 0.15; return sprite(`pine|${v}|${sc}|${au}`, 32, 48, (c, r) => A.pine(c, 0, 0, sc, r, au)); }
function bushSprite(set, rng) { const v = rng.int(0, 2), berry = rng.pick([null, '#D0302A', '#F2A0B8']); return sprite(`bush|${set}|${v}|${berry}`, 24, 18, (c, r) => A.bush(c, 0, 0, set, r, berry)); }
function tuftSprite(rng) { const v = rng.int(0, 5); return sprite(`tuft|${v}`, 12, 14, (c, r) => A.tallGrass(c, 0, 0, r, v > 3), { outline: false }); }
function grassBlades(ctx, n, cols) { const { c, rng, W, t, b } = ctx; for (let i = 0; i < n; i++) { const x = rng.range(0, W), y = rng.range(t, b); rect(c, x, y, 1, 1, cols[0]); rect(c, x, y + 1, 1, 1, cols[1]); if (rng() < 0.3) rect(c, x + 1, y, 1, 1, cols[2]); } }
