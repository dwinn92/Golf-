'use strict';
// Unit tests for the WHS engine. Run with: node tests/whs.test.js
const assert = require('assert');
const WHS = require('../js/whs.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('ok - ' + name);
}

test('score differential rounds to one decimal', () => {
  // (113/125) x (85 - 70.9) = 12.7464 -> 12.7
  assert.strictEqual(
    WHS.scoreDifferential({ adjustedGross: 85, courseRating: 70.9, slopeRating: 125 }),
    12.7
  );
});

test('score differential applies PCC', () => {
  assert.strictEqual(
    WHS.scoreDifferential({ adjustedGross: 85, courseRating: 70.9, slopeRating: 125, pcc: 1 }),
    11.8
  );
});

test('course handicap includes CR minus par', () => {
  // 12.7 x (125/113) + (70.9 - 71) = 13.949 -> 14
  assert.strictEqual(WHS.courseHandicap(12.7, 125, 70.9, 71), 14);
  // plus handicap: -2.0 x (113/113) + (72 - 72) = -2
  assert.strictEqual(WHS.courseHandicap(-2.0, 113, 72, 72), -2);
});

test('playing handicap defaults to 95%', () => {
  assert.strictEqual(WHS.playingHandicap(14), 13);       // 13.3 -> 13
  assert.strictEqual(WHS.playingHandicap(20), 19);       // 19.0
  assert.strictEqual(WHS.playingHandicap(10, 100), 10);
});

test('strokes on hole from stroke index', () => {
  assert.strictEqual(WHS.strokesOnHole(14, 5), 1);
  assert.strictEqual(WHS.strokesOnHole(14, 14), 1);
  assert.strictEqual(WHS.strokesOnHole(14, 15), 0);
  assert.strictEqual(WHS.strokesOnHole(20, 2), 2);
  assert.strictEqual(WHS.strokesOnHole(20, 3), 1);
  assert.strictEqual(WHS.strokesOnHole(36, 18), 2);
  // plus handicaps give strokes back starting at SI 18
  assert.strictEqual(WHS.strokesOnHole(-2, 18), -1);
  assert.strictEqual(WHS.strokesOnHole(-2, 17), -1);
  assert.strictEqual(WHS.strokesOnHole(-2, 16), 0);
});

test('net double bogey caps hole scores', () => {
  assert.strictEqual(WHS.netDoubleBogey(4, 14, 5), 7);   // par+2+1
  assert.strictEqual(WHS.netDoubleBogey(3, 0, 10), 5);
});

test('adjusted gross: NDB caps played holes, net par for holes not played', () => {
  const holes = [
    { par: 4, strokeIndex: 1, strokes: 9 },    // played, capped at 4+2+1 = 7
    { par: 3, strokeIndex: 18, strokes: 3 },   // played, kept
    { par: 5, strokeIndex: 9, strokes: null }  // not played -> net par = 5+1 = 6
  ];
  assert.strictEqual(WHS.adjustedGrossScore(holes, 14), 16);
});

test('adjusted gross: started but not holed out takes net double bogey', () => {
  const holes = [{ par: 5, strokeIndex: 9, strokes: 0 }]; // 5+2+1
  assert.strictEqual(WHS.adjustedGrossScore(holes, 14), 8);
});

test('net par adds only the strokes received', () => {
  assert.strictEqual(WHS.netPar(4, 14, 5), 5);
  assert.strictEqual(WHS.netPar(4, 0, 5), 4);
  assert.strictEqual(WHS.netPar(4, 20, 2), 6);
});

test('minus score differentials round upward toward zero (Rule 5.1c)', () => {
  assert.strictEqual(WHS.roundTenth(-1.54), -1.5);
  assert.strictEqual(WHS.roundTenth(-1.55), -1.5);
  assert.strictEqual(WHS.roundTenth(-1.56), -1.6);
  assert.strictEqual(WHS.roundTenth(11.55), 11.6);
});

test('9-hole differential halves the PCC and stays unrounded (Rule 5.1b)', () => {
  // (113/127) x (41 - 34.6 - 0.5) = 0.889763 x 5.9 = 5.24960...
  const sd = WHS.nineHoleDifferential({
    adjustedGross9: 41, courseRating9: 34.6, slopeRating9: 127, pcc: 1
  });
  assert.ok(Math.abs(sd - 5.2496063) < 1e-6, 'got ' + sd);
});

test('expected 9-hole differential matches the USGA worked example', () => {
  // HI 14.0 + 9-hole differential 7.2 -> 18-hole differential 15.7
  assert.strictEqual(WHS.expectedNineDifferential(14.0), 8.5);
  assert.strictEqual(WHS.nineToEighteenDifferential(7.2, 14.0), 15.7);
});

test('9-hole differential mirrors itself with no index yet', () => {
  assert.strictEqual(WHS.nineToEighteenDifferential(9.4, null), 18.8);
});

test('9-hole course handicap halves the index (Rule 6.1b)', () => {
  // (12.0/2) x (127/113) + (34.6 - 35) = 6.343 -> 6
  assert.strictEqual(WHS.courseHandicap9(12.0, 127, 34.6, 35), 6);
});

test('stableford points per hole', () => {
  // par 4, SI 5, CH 14 -> 1 stroke received
  assert.strictEqual(WHS.stablefordPointsForHole(5, 4, 14, 5), 2);  // net par
  assert.strictEqual(WHS.stablefordPointsForHole(4, 4, 14, 5), 3);  // net birdie
  assert.strictEqual(WHS.stablefordPointsForHole(3, 4, 14, 5), 4);  // net eagle
  assert.strictEqual(WHS.stablefordPointsForHole(6, 4, 14, 5), 1);  // net bogey
  assert.strictEqual(WHS.stablefordPointsForHole(7, 4, 14, 5), 0);  // net double
  assert.strictEqual(WHS.stablefordPointsForHole(9, 4, 14, 5), 0);  // never negative
  assert.strictEqual(WHS.stablefordPointsForHole(null, 4, 14, 5), 0);
});

test('net double bogey is the lowest score worth zero stableford points', () => {
  const ndb = WHS.netDoubleBogey(4, 14, 5);
  assert.strictEqual(WHS.stablefordPointsForHole(ndb, 4, 14, 5), 0);
  assert.strictEqual(WHS.stablefordPointsForHole(ndb - 1, 4, 14, 5), 1);
});

test('stableford points convert back to an adjusted gross', () => {
  // 36 points off a playing handicap of 13 on a par 71 = played to handicap
  assert.strictEqual(WHS.stablefordToAdjustedGross({ points: 36, par: 71, handicap: 13 }), 84);
  assert.strictEqual(WHS.stablefordToAdjustedGross({ points: 40, par: 71, handicap: 13 }), 80);
  assert.strictEqual(WHS.stablefordToAdjustedGross({ points: 30, par: 71, handicap: 13 }), 90);
  // 9 holes: par points is 18
  assert.strictEqual(WHS.stablefordToAdjustedGross({ points: 18, par: 35, handicap: 6, holes: 9 }), 41);
});

test('computeRecord scales a 9-hole score against the index in effect', () => {
  const scores = [];
  for (let i = 0; i < 5; i++) {
    scores.push({ date: '2026-01-0' + (i + 1), differential: 20.0 });
  }
  // after 5 scores of 20.0 the index is 20.0 (lowest 1, no adjustment)
  scores.push({ date: '2026-01-10', nineDifferential: 7.0 });
  const rec = WHS.computeRecord(scores);
  const nine = rec.scores[5];
  assert.ok(nine.nineHole, 'flagged as a 9-hole round');
  // expected 9-hole for HI 20.0 = 11.5 -> 18-hole differential 18.5
  assert.strictEqual(nine.differential, 18.5);
  assert.strictEqual(nine.adjustedDifferential, 18.5);
});

test('a 9-hole round can count toward the index', () => {
  const scores = [];
  for (let i = 0; i < 5; i++) {
    scores.push({ date: '2026-02-0' + (i + 1), differential: 25.0 });
  }
  scores.push({ date: '2026-02-10', nineDifferential: 4.0 });
  const rec = WHS.computeRecord(scores);
  // HI in effect 25.0 -> expected 14.0 -> 18-hole differential 18.0, the
  // lowest of six, so it counts (best 2 of 6, adjustment -1.0)
  assert.strictEqual(rec.scores[5].differential, 18.0);
  assert.ok(rec.counted.indexOf(5) >= 0, 'the 9-hole round is in the counting set');
});

test('selection table matches the WHS schedule', () => {
  assert.deepStrictEqual(WHS.selectionTable(3), { use: 1, adjustment: -2.0 });
  assert.deepStrictEqual(WHS.selectionTable(4), { use: 1, adjustment: -1.0 });
  assert.deepStrictEqual(WHS.selectionTable(5), { use: 1, adjustment: 0 });
  assert.deepStrictEqual(WHS.selectionTable(6), { use: 2, adjustment: -1.0 });
  assert.deepStrictEqual(WHS.selectionTable(8), { use: 2, adjustment: 0 });
  assert.deepStrictEqual(WHS.selectionTable(11), { use: 3, adjustment: 0 });
  assert.deepStrictEqual(WHS.selectionTable(14), { use: 4, adjustment: 0 });
  assert.deepStrictEqual(WHS.selectionTable(16), { use: 5, adjustment: 0 });
  assert.deepStrictEqual(WHS.selectionTable(18), { use: 6, adjustment: 0 });
  assert.deepStrictEqual(WHS.selectionTable(19), { use: 7, adjustment: 0 });
  assert.deepStrictEqual(WHS.selectionTable(20), { use: 8, adjustment: 0 });
});

test('raw index: 3 scores uses lowest minus 2.0', () => {
  const r = WHS.rawIndexFromDifferentials([20.0, 18.5, 22.1]);
  assert.strictEqual(r.index, 16.5);
  assert.deepStrictEqual(r.counted, [1]);
});

test('raw index: 20 scores averages best 8', () => {
  const diffs = [];
  for (let i = 0; i < 12; i++) diffs.push(20);
  for (let i = 0; i < 8; i++) diffs.push(10);
  const r = WHS.rawIndexFromDifferentials(diffs);
  assert.strictEqual(r.index, 10.0);
  assert.strictEqual(r.counted.length, 8);
});

test('raw index considers only the latest 20', () => {
  const diffs = [1.0]; // old great score that must fall outside the window
  for (let i = 0; i < 20; i++) diffs.push(15);
  assert.strictEqual(WHS.rawIndexFromDifferentials(diffs).index, 15.0);
});

test('index is capped at 54.0', () => {
  const r = WHS.rawIndexFromDifferentials([60, 61, 62, 63, 64]);
  assert.strictEqual(r.index, 54.0);
});

test('soft and hard caps', () => {
  assert.strictEqual(WHS.applyCaps(12.9, 10.0), 12.9);   // within soft cap
  assert.strictEqual(WHS.applyCaps(14.0, 10.0), 13.5);   // 13 + 1/2
  assert.strictEqual(WHS.applyCaps(20.0, 10.0), 15.0);   // hard cap at low+5
  assert.strictEqual(WHS.applyCaps(14.0, null), 14.0);   // no low HI yet
});

test('exceptional score reduction thresholds', () => {
  assert.strictEqual(WHS.exceptionalReduction(13.1, 20.0), 0);    // gap 6.9
  assert.strictEqual(WHS.exceptionalReduction(13.0, 20.0), -1.0); // gap 7.0
  assert.strictEqual(WHS.exceptionalReduction(10.0, 20.0), -2.0); // gap 10.0
  assert.strictEqual(WHS.exceptionalReduction(5.0, null), 0);     // no HI yet
});

test('computeRecord: steady record gives the plain average', () => {
  const scores = [];
  for (let i = 0; i < 20; i++) {
    scores.push({ date: '2025-01-' + String(i + 1).padStart(2, '0'), differential: 12.0 });
  }
  const rec = WHS.computeRecord(scores);
  assert.strictEqual(rec.handicapIndex, 12.0);
  assert.strictEqual(rec.counted.length, 8);
});

test('computeRecord: exceptional score applies -1 to the record', () => {
  const scores = [];
  for (let i = 0; i < 19; i++) {
    scores.push({ date: '2025-01-' + String(i + 1).padStart(2, '0'), differential: 20.0 });
  }
  // HI in effect = 20.0; a 12.5 differential is 7.5 clear -> ESR -1.0
  scores.push({ date: '2025-01-20', differential: 12.5 });
  const rec = WHS.computeRecord(scores);
  const last = rec.scores[19];
  assert.strictEqual(last.esr, -1.0);
  assert.strictEqual(last.adjustedDifferential, 11.5);
  // best 8 of adjusted diffs: 11.5 + 7x19.0 -> (11.5 + 133)/8 = 18.0625 -> 18.1
  assert.strictEqual(rec.handicapIndex, 18.1);
  assert.ok(rec.scores[19].exceptional);
});

test('computeRecord: hard cap holds a rising index', () => {
  const scores = [];
  for (let i = 0; i < 20; i++) {
    scores.push({ date: '2025-01-' + String(i + 1).padStart(2, '0'), differential: 10.0 });
  }
  for (let i = 0; i < 20; i++) {
    scores.push({ date: '2025-02-' + String(i + 1).padStart(2, '0'), differential: 30.0 });
  }
  const rec = WHS.computeRecord(scores);
  // Low HI within 365 days is 8.0 (3-score record: lowest 10.0 minus 2.0)
  assert.strictEqual(rec.lowHandicapIndex, 8.0);
  assert.strictEqual(rec.handicapIndex, 13.0); // hard-capped at low HI + 5
});

test('computeRecord: hard cap against a 20-score low HI', () => {
  const scores = [];
  for (let i = 0; i < 20; i++) {
    scores.push({ date: '2023-01-' + String(i + 1).padStart(2, '0'), differential: 10.0 });
  }
  // push the short-record lows outside the 365-day window
  for (let i = 0; i < 20; i++) {
    scores.push({ date: '2025-02-' + String(i + 1).padStart(2, '0'), differential: 30.0 });
  }
  const rec = WHS.computeRecord(scores);
  assert.strictEqual(rec.lowHandicapIndex, 10.0);
  assert.strictEqual(rec.handicapIndex, 15.0); // hard-capped at low HI + 5
});

test('computeRecord: fewer than 3 scores gives no index', () => {
  const rec = WHS.computeRecord([
    { date: '2025-01-01', differential: 15.0 },
    { date: '2025-01-02', differential: 16.0 }
  ]);
  assert.strictEqual(rec.handicapIndex, null);
});

test('computeRecord: results map back to input order', () => {
  const rec = WHS.computeRecord([
    { date: '2025-03-01', differential: 15.0 }, // played later
    { date: '2025-01-01', differential: 20.0 },
    { date: '2025-02-01', differential: 18.0 }
  ]);
  // chronological third score completes 3 -> HI = lowest(15) - 2 = 13.0
  assert.strictEqual(rec.scores[0].indexAfter, 13.0);
  assert.strictEqual(rec.handicapIndex, 13.0);
  assert.deepStrictEqual(rec.counted, [0]);
});


/* ---------------- handicap allowances (Appendix C) ---------------- */

test('allowance: singles stroke play is 95% of the course handicap', () => {
  assert.strictEqual(WHS.playingHandicap(18, 95), 17);   // 17.1
  assert.strictEqual(WHS.playingHandicap(24, 95), 23);   // 22.8
});

test('allowance: four-ball better ball is 85% of each player', () => {
  const t = WHS.teamAllowance('fourball', [10, 20]);
  assert.deepStrictEqual(t.perPlayer, [9, 17]);          // 8.5 -> 9, 17.0
  assert.strictEqual(t.team, null);
});

test('allowance: foursomes is 50% of the combined course handicaps', () => {
  assert.strictEqual(WHS.teamAllowance('foursomes', [12, 20]).team, 16);
  assert.strictEqual(WHS.teamAllowance('foursomes', [9, 14]).team, 12);   // 11.5 -> 12
});

test('allowance: greensomes is 60% of the lower plus 40% of the higher', () => {
  assert.strictEqual(WHS.teamAllowance('greensomes', [12, 20]).team, 15); // 7.2 + 8.0
  // order of the pair must not matter: the lower handicap always takes 60%
  assert.strictEqual(WHS.teamAllowance('greensomes', [20, 12]).team, 15);
});

test('allowance: scramble percentages run lowest handicap first', () => {
  assert.strictEqual(WHS.teamAllowance('scramble4', [4, 10, 16, 24]).team, 8);  // 1+2+2.4+2.4
  assert.strictEqual(WHS.teamAllowance('scramble4', [24, 16, 10, 4]).team, 8);  // sorted first
  assert.strictEqual(WHS.teamAllowance('scramble2', [10, 20]).team, 7);         // 3.5 + 3.0
});

test('allowance: a side of the wrong size returns null rather than a guess', () => {
  assert.strictEqual(WHS.teamAllowance('foursomes', [12]), null);
  assert.strictEqual(WHS.teamAllowance('scramble4', [4, 10, 16]), null);
  assert.strictEqual(WHS.teamAllowance('greensomes', [1, 2, 3]), null);
});

test('allowance: an unknown format falls back to singles, never to nothing', () => {
  assert.strictEqual(WHS.allowanceById('nonsense').id, 'singles');
  assert.strictEqual(WHS.allowanceById('nonsense').percent, 95);
});

console.log('\n' + passed + ' tests passed');
