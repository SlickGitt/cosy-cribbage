// Scoring rules tests. Run with: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreHand, pegScore } from '../src/scoring.js';

// Suits: 0 apples, 1 blackberries, 2 leaves, 3 acorns. Ranks: 1 ace ... 11 jack, 12 queen, 13 king.
const c = (r, s = 0) => ({ r, s, id: r + '-' + s });
const pts = items => items.reduce((a, i) => a + i.pts, 0);

test('29 hand: three fives and the jack of the starter suit, five starter', () => {
  const hand = [c(5, 0), c(5, 1), c(5, 2), c(11, 3)];
  assert.equal(scoreHand(hand, c(5, 3), false).total, 29);
});

test('28 hand: four fives with a ten-card starter', () => {
  const hand = [c(5, 0), c(5, 1), c(5, 2), c(5, 3)];
  assert.equal(scoreHand(hand, c(13, 0), false).total, 28);
});

test('24 hand: 4 4 5 6 with a 6 starter', () => {
  const hand = [c(4, 0), c(4, 1), c(5, 2), c(6, 3)];
  assert.equal(scoreHand(hand, c(6, 0), false).total, 24);
});

test('19 (nothing): all even cards, no pairs or runs', () => {
  const hand = [c(2, 0), c(4, 1), c(6, 2), c(8, 3)];
  assert.equal(scoreHand(hand, c(10, 0), false).total, 0);
});

test('run of four plus two fifteens', () => {
  const hand = [c(1, 0), c(2, 1), c(3, 2), c(4, 3)];
  const r = scoreHand(hand, c(12, 0), false);
  assert.equal(r.total, 8);
  assert.equal(r.items.filter(i => i.label === 'Run of 4').length, 1);
  assert.equal(r.items.some(i => i.label === 'Run of 3'), false);
});

test('double run of three: 3 3 4 5 with a king', () => {
  // runs 2x3 = 6, pair 2, fifteens: 5+K, 3+3+4+5 = 2x2 = 4. Total 12.
  const hand = [c(3, 0), c(3, 1), c(4, 2), c(5, 3)];
  assert.equal(scoreHand(hand, c(13, 0), false).total, 12);
});

test('four card flush counts in the hand but not in the crib', () => {
  const hand = [c(2, 1), c(4, 1), c(8, 1), c(12, 1)];
  assert.equal(scoreHand(hand, c(9, 0), false).total, 4 + 2); // flush 4, 2+4+9 fifteen
  assert.equal(scoreHand(hand, c(9, 0), true).total, 2);
});

test('five card flush counts in hand and crib', () => {
  const hand = [c(2, 1), c(4, 1), c(8, 1), c(12, 1)];
  assert.equal(scoreHand(hand, c(9, 1), false).total, 5 + 2);
  assert.equal(scoreHand(hand, c(9, 1), true).total, 5 + 2);
});

test('his nobs: jack in hand matching the starter suit', () => {
  const hand = [c(11, 2), c(2, 0), c(6, 1), c(8, 3)];
  const r = scoreHand(hand, c(13, 2), false);
  assert.ok(r.items.some(i => i.label === 'His nobs'));
  const off = scoreHand(hand, c(13, 0), false);
  assert.equal(off.items.some(i => i.label === 'His nobs'), false);
});

test('pegging: fifteen and thirty-one', () => {
  assert.equal(pts(pegScore([c(5), c(13)], 15)), 2);
  assert.equal(pts(pegScore([c(10), c(10, 1), c(1), c(13, 2)], 31)), 2);
});

test('pegging: pair, pair royal, double pair royal', () => {
  assert.equal(pts(pegScore([c(7), c(7, 1)], 14)), 2);
  assert.equal(pts(pegScore([c(7), c(7, 1), c(7, 2)], 21)), 6);
  assert.equal(pts(pegScore([c(2), c(2, 1), c(2, 2), c(2, 3)], 8)), 12);
});

test('pegging: runs in any order, broken runs score nothing', () => {
  assert.equal(pts(pegScore([c(3), c(5), c(4)], 12)), 3);
  assert.equal(pts(pegScore([c(4), c(5), c(6), c(3)], 18)), 4);
  assert.equal(pts(pegScore([c(2), c(3), c(2, 1)], 7)), 0); // no run, and the twos aren't next to each other
  assert.equal(pts(pegScore([c(3), c(4), c(4, 1), c(5)], 16)), 0);
});
