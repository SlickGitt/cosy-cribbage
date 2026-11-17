// Database checks: scoring parity with src/scoring.js, then full games between two players.
// Needs a local Postgres on /tmp:5433 with database ll, loaded with supabase-shim.sql and
// supabase/001_friend_play.sql, and the pg package (npm i pg). Run: node tests/db/simulate.mjs
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { scoreHand, pegScore } from '../../src/scoring.js';

const db = new pg.Client({ host: '/tmp', port: 5433, user: 'postgres', database: 'll' });
await db.connect();
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; throw new Error(m); } };

const card = id => { const [r, s] = id.split('-').map(Number); return { r, s, id }; };
const deck = () => { const d = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push(r + '-' + s); return d; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// 1. scoring parity with src/scoring.js
for (let t = 0; t < 4000; t++) {
  const d = shuffle(deck()); const hand = d.slice(0, 4), st = d[4]; const crib = Math.random() < .5;
  // bias towards interesting hands sometimes
  const js = scoreHand(hand.map(card), card(st), crib);
  const { rows } = await db.query('select ll.score_hand($1,$2,$3) r', [hand, st, crib]);
  const sq = rows[0].r;
  const jsItems = js.items.map(i => ({ label: i.label, cards: i.cards.map(c => c.id), pts: i.pts }));
  ok(JSON.stringify(jsItems) === JSON.stringify(sq.items.map(i => ({ label: i.label, cards: i.cards, pts: i.pts }))) && js.total === sq.total, `hand parity ${hand} ${st} ${crib}\n${JSON.stringify(jsItems)}\n${JSON.stringify(sq.items)}`);
}
// flush and nobs cases specifically
for (const [h, st, cr] of [[['2-1', '4-1', '8-1', '12-1'], '9-1', true], [['2-1', '4-1', '8-1', '12-1'], '9-0', false], [['11-2', '2-0', '6-1', '8-3'], '13-2', false], [['5-0', '5-1', '5-2', '11-3'], '5-3', false]]) {
  const js = scoreHand(h.map(card), card(st), cr); const { rows } = await db.query('select ll.score_hand($1,$2,$3) r', [h, st, cr]);
  ok(js.total === rows[0].r.total, 'special ' + h);
}
for (let t = 0; t < 4000; t++) {
  const n = 1 + Math.floor(Math.random() * 7); const d = shuffle(deck()).slice(0, n);
  // make pairs and runs likely
  if (Math.random() < .4) for (let i = 1; i < n; i++) if (Math.random() < .5) d[i] = d[i - 1].split('-')[0] + '-' + ((+d[i - 1].split('-')[1] + 1) % 4);
  const cnt = d.reduce((a, c) => a + Math.min(+c.split('-')[0], 10), 0); if (cnt > 31) continue;
  const js = pegScore(d.map(card), cnt).map(i => i.label + i.pts).join();
  const { rows } = await db.query('select ll.peg_score($1,$2) r', [d, cnt]);
  ok(js === rows[0].r.map(i => i.label + i.pts).join(), `peg parity ${d} ${cnt} ${js} vs ${JSON.stringify(rows[0].r)}`);
}
console.log('scoring parity ok');

// 2. play full games as two signed-in players
async function as(uid, sql, args = []) {
  await db.query('begin');
  try {
    await db.query('set local role authenticated');
    await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid || '']);
    const r = await db.query(sql, args); await db.query('commit'); return r;
  } catch (e) { await db.query('rollback'); throw e; }
}
const rpc = async (uid, fn, args) => (await as(uid, `select public.${fn}(${args.map((_, i) => '$' + (i + 1)).join(',')}) r`, args)).rows[0].r;
const fails = async (p, msg) => { try { await p; } catch (e) { return e.message; } ok(false, 'expected failure: ' + msg); };

const val = id => Math.min(+id.split('-')[0], 10);
let games = 0, rounds = 0, totalMoves = 0;
for (let gi = 0; gi < 150; gi++) {
  const A = randomUUID(), B = randomUUID(), C = randomUUID();
  const { id, code } = await rpc(A, 'create_game', ['Jules', 'fox']);
  const pv = await rpc(B, 'game_preview', [code]);
  ok(pv.seat === 'open' && pv.host === 'Jules' && pv.id === null, 'preview');
  await rpc(B, 'join_game', [code, '  Sam   Smith ', 'badger; drop']);
  await fails(rpc(C, 'join_game', [code, 'X', 'fox']), 'third player join');
  ok(await rpc(C, 'get_game', [id]) === null, 'outsider get_game');
  ok((await as(C, 'select count(*)::int n from public.games')).rows[0].n === 0, 'RLS hides games from outsiders');
  ok((await as(A, 'select count(*)::int n from public.games where id=$1', [id])).rows[0].n === 1, 'player sees own game');
  await fails(as(A, 'select * from ll.hands'), 'hands are private');
  await fails(as(A, 'select ll.shuffled()'), 'internal functions private');
  await fails(as(A, `update public.games set score_a=120 where id=$1`, [id]), 'no direct writes');
  let s = await rpc(A, 'get_game', [id]);
  ok(s.name_b === 'Sam Smith' && s.walker_b === 'bobble' && s.status === 'active' && s.round === 1, 'joined state');
  ok(!('player_a' in s), 'player ids hidden');
  let lastRound = 0, guard = 0;
  const uidOf = { a: A, b: B };
  while (s.status === 'active' && guard++ < 2000) {
    const sa = await rpc(A, 'get_game', [id]), sb = await rpc(B, 'get_game', [id]);
    ok(sa.version === sb.version, 'same version');
    if (sa.round !== lastRound) { rounds++; lastRound = sa.round; ok(sa.hand.length === 6 && sb.hand.length === 6, 'six cards each'); ok(!sa.hand.some(c => sb.hand.includes(c)), 'no shared cards'); }
    if (sa.phase === 'discard') {
      for (const [w, st] of [['a', sa], ['b', sb]]) {
        if (st.discarded[w]) continue;
        await fails(rpc(uidOf[w], 'discard_cards', [id, [st.hand[0], st.hand[0]]]), 'same card twice');
        await fails(rpc(uidOf[w], 'discard_cards', [id, ['1-0', '1-1'].filter(c => !st.hand.includes(c)).concat(st.hand[0]).slice(0, 2)]), 'card not in hand');
        const pick = shuffle([...st.hand]).slice(0, 2);
        s = await rpc(uidOf[w], 'discard_cards', [id, pick]); totalMoves++;
        await fails(rpc(uidOf[w], 'discard_cards', [id, s.hand.slice(0, 2)]), 'discard twice');
        break;
      }
      s = await rpc(A, 'get_game', [id]);
      continue;
    }
    ok(sa.phase === 'peg', 'phase peg, got ' + sa.phase);
    const t = sa.peg.turn, st = t === 'a' ? sa : sb, other = t === 'a' ? B : A;
    const playable = st.hand.filter(c => sa.peg.count + val(c) <= 31);
    ok(playable.length > 0, 'turn rests only on a player who can play');
    await fails(rpc(other, 'play_card', [id, (t === 'a' ? sb : sa).hand[0] || '1-0']), 'out of turn');
    const tooHigh = st.hand.find(c => sa.peg.count + val(c) > 31);
    if (tooHigh) await fails(rpc(uidOf[t], 'play_card', [id, tooHigh]), 'over 31');
    const before = sa.score_a + sa.score_b;
    s = await rpc(uidOf[t], 'play_card', [id, playable[Math.floor(Math.random() * playable.length)]]); totalMoves++;
    const evPts = s.events.filter(e => e.kind === 'pts').reduce((a, e) => a + e.pts, 0);
    if (s.status === 'active' && !s.events.some(e => e.kind === 'show')) ok(s.score_a + s.score_b - before === evPts, 'points match events');
    if (s.events.some(e => e.kind === 'show') && s.status === 'active') {
      const sh = s.show; const showPts = sh.steps.reduce((a, x) => a + x.total, 0);
      ok(sh.before.a + sh.before.b + showPts === s.from_a + s.from_b, 'show points added');
      ok(sh.steps[2].cards.length === 4 && sh.steps[0].cards.length === 4, 'show hands');
      ok(s.round === sh.round + 1 && s.dealer !== sh.dealer, 'next round dealt, dealer swaps');
    }
  }
  ok(s.status === 'over' && (s.score_a === 121 || s.score_b === 121) && s.winner, 'game finished at 121');
  await fails(rpc(A, 'play_card', [id, '1-0']), 'no moves after the end');
  const list = await rpc(A, 'my_games', []);
  ok(list.length === 1 && list[0].turn === 'over' && list[0].opp === 'Sam Smith', 'my_games');
  const { rows } = await db.query('select count(*)::int n from ll.deals where game=$1', [id]);
  ok(rows[0].n === s.round, 'every deal recorded');
  games++;
}
console.log(`simulated ${games} games, ${rounds} rounds, ${totalMoves} moves: all checks passed`);
await db.end();
