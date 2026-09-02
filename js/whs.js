/*
 * WHS engine — World Handicap System calculations as operated by England Golf
 * (2024 Rules of Handicapping revision).
 *
 * Pure functions only: no DOM, no storage. Exposed as `window.WHS` in the
 * browser and via module.exports under Node so the same code is unit-tested.
 */
(function (global) {
  'use strict';

  var MAX_HANDICAP_INDEX = 54.0;
  var SOFT_CAP_THRESHOLD = 3.0; // above Low HI, growth beyond this is halved
  var HARD_CAP_THRESHOLD = 5.0; // above Low HI, growth is stopped entirely
  var LOW_HI_WINDOW_DAYS = 365;

  /**
   * Round to the nearest tenth, ties upward (toward +infinity).
   * Rule 5.1c: minus Score Differentials round upward towards 0 —
   * -1.54 -> -1.5, -1.55 -> -1.5, -1.56 -> -1.6. JS Math.round rounds
   * halves toward +infinity, which is exactly this rule.
   */
  function roundTenth(x) {
    return Math.round(x * 10) / 10;
  }

  /** Round to the nearest whole number, half upward (Course/Playing Handicap). */
  function roundWhole(x) {
    return Math.round(x);
  }

  /**
   * Score Differential for an 18-hole round.
   * SD = (113 / Slope) x (Adjusted Gross - Course Rating - PCC), to one decimal.
   */
  function scoreDifferential(opts) {
    var pcc = opts.pcc || 0;
    var sd = (113 / opts.slopeRating) *
      (opts.adjustedGross - opts.courseRating - pcc);
    return roundTenth(sd);
  }

  /**
   * Course Handicap = HI x (Slope / 113) + (Course Rating - Par).
   * England Golf applies the (CR - Par) adjustment in all formats.
   * Returns the rounded playing value; pass {unrounded:true} for the raw figure.
   */
  function courseHandicap(handicapIndex, slopeRating, courseRating, par, opts) {
    var ch = handicapIndex * (slopeRating / 113) + (courseRating - par);
    return (opts && opts.unrounded) ? ch : roundWhole(ch);
  }

  /**
   * Playing Handicap = Course Handicap x allowance.
   * Default allowance 95% (individual stroke play). Allowance applies to the
   * unrounded Course Handicap? No — WHS applies it to the rounded CH.
   */
  function playingHandicap(courseHcp, allowancePercent) {
    var allowance = (allowancePercent == null ? 95 : allowancePercent) / 100;
    return roundWhole(courseHcp * allowance);
  }

  /**
   * Handicap strokes received on a hole, from the (rounded) Course Handicap
   * and the hole's Stroke Index (1..18).
   * A plus-handicap player gives strokes back starting at SI 18.
   */
  function strokesOnHole(courseHcp, strokeIndex) {
    if (courseHcp >= 0) {
      var base = Math.floor(courseHcp / 18);
      var rem = courseHcp % 18;
      return base + (strokeIndex <= rem ? 1 : 0);
    }
    var give = Math.min(-courseHcp, 18);
    // strokes given back on SI 18, 17, ... (18 - give + 1)
    return strokeIndex > 18 - give ? -1 : 0;
  }

  /** Maximum hole score for handicapping: Net Double Bogey (Rule 3.1b). */
  function netDoubleBogey(par, courseHcp, strokeIndex) {
    return par + 2 + strokesOnHole(courseHcp, strokeIndex);
  }

  /**
   * Net par for a hole: the score recorded for a hole NOT PLAYED, where the
   * Association permits net par in place of an expected score (Rule 3.2b/2).
   * Distinct from net double bogey, which caps a hole that WAS played.
   */
  function netPar(par, courseHcp, strokeIndex) {
    return par + strokesOnHole(courseHcp, strokeIndex);
  }

  /**
   * Adjusted Gross Score from hole-by-hole scores.
   *
   * holes: [{par, strokeIndex, strokes}] where `strokes` is
   *   - a number   : the hole was played and holed out; capped at net double
   *                  bogey (Rule 3.1b);
   *   - 0          : the hole was STARTED but not holed out — net double
   *                  bogey (Rule 3.3);
   *   - null       : the hole was NOT PLAYED — net par (Rule 3.2b/2, the
   *                  net-par option in place of an automated expected score).
   *
   * The distinction matters: a picked-up hole and a hole never played take
   * different scores under the Rules.
   */
  function adjustedGrossScore(holes, courseHcp) {
    var total = 0;
    for (var i = 0; i < holes.length; i++) {
      var h = holes[i];
      if (h.strokes == null) {
        total += netPar(h.par, courseHcp, h.strokeIndex);
      } else {
        var cap = netDoubleBogey(h.par, courseHcp, h.strokeIndex);
        total += h.strokes === 0 ? cap : Math.min(h.strokes, cap);
      }
    }
    return total;
  }

  /* ---------------- 9-hole scores (Rule 5.1b) ---------------- */

  /**
   * 9-hole Score Differential, left UNROUNDED (Rule 5.1b):
   *   (113 / 9-hole Slope) x (9-hole AGS - 9-hole Course Rating - 0.5 x PCC)
   * Note the PCC is halved for a 9-hole round.
   */
  function nineHoleDifferential(opts) {
    var pcc = opts.pcc || 0;
    return (113 / opts.slopeRating9) *
      (opts.adjustedGross9 - opts.courseRating9 - 0.5 * pcc);
  }

  /**
   * Expected 9-hole Score Differential for a player of the given Handicap
   * Index — the value combined with a played 9-hole differential to make an
   * 18-hole Score Differential (Rule 5.1b).
   *
   * IMPORTANT: the Rules of Handicapping state that this expected score is
   * "automated" (Clarification 3.2b/1) and do NOT publish the underlying
   * model, which is derived from the WHS scoring database. This is therefore
   * an approximation, not the official figure.
   *
   * The model used here is expected 18-hole differential = HI + 3.0 (a
   * Handicap Index is the mean of the best 8 of the last 20 differentials,
   * which sits about three strokes below the mean of all 20), halved for
   * 9 holes. It reproduces the USGA's published worked example exactly:
   * a player of HI 14.0 with a 9-hole differential of 7.2 is credited with
   * an 18-hole differential of 15.7, i.e. an expected 9-hole value of 8.5,
   * and (14.0 + 3.0) / 2 = 8.5.
   *
   * Returns null when there is no Handicap Index to base it on.
   */
  function expectedNineDifferential(handicapIndex) {
    if (handicapIndex == null) return null;
    return (handicapIndex + 3.0) / 2;
  }

  /**
   * Combine a played 9-hole differential with the expected differential for
   * the 9 holes not played, giving an 18-hole Score Differential rounded to
   * one decimal (Rule 5.1b).
   *
   * With no Handicap Index yet, there is no expected score to draw on, so the
   * played 9 is mirrored (the 18-hole differential is twice the 9-hole one).
   */
  function nineToEighteenDifferential(nineDifferential, handicapIndex) {
    var expected = expectedNineDifferential(handicapIndex);
    return roundTenth(nineDifferential + (expected == null ? nineDifferential : expected));
  }

  /**
   * 9-hole Course Handicap (Rule 6.1b):
   *   (HI / 2) x (9-hole Slope / 113) + (9-hole Course Rating - 9-hole par)
   */
  function courseHandicap9(handicapIndex, slopeRating9, courseRating9, par9, opts) {
    var ch = (handicapIndex / 2) * (slopeRating9 / 113) + (courseRating9 - par9);
    return (opts && opts.unrounded) ? ch : roundWhole(ch);
  }

  /* ---------------- Stableford ---------------- */

  /**
   * Stableford points for one hole against the strokes received:
   * 2 for a net par, 3 net birdie, 4 net eagle, 1 net bogey, 0 for net double
   * bogey or worse. A net double bogey is by definition the lowest score
   * scoring zero points, which is what makes Stableford self-capping.
   */
  function stablefordPointsForHole(strokes, par, courseHcp, strokeIndex) {
    if (strokes == null || strokes === 0) return 0;
    var net = strokes - strokesOnHole(courseHcp, strokeIndex);
    return Math.max(0, 2 - (net - par));
  }

  /** Total Stableford points for a hole-by-hole card. */
  function stablefordPoints(holes, courseHcp) {
    var total = 0;
    for (var i = 0; i < holes.length; i++) {
      total += stablefordPointsForHole(
        holes[i].strokes, holes[i].par, courseHcp, holes[i].strokeIndex);
    }
    return total;
  }

  /**
   * Reconstruct an Adjusted Gross Score from a Stableford points total, for a
   * card signed for in points rather than strokes.
   *
   * A player scoring the par of the round in points (36 over 18 holes, 18 over
   * 9) has played to their handicap, i.e. shot par + handicap; every point
   * above that is one stroke better:
   *   AGS = par + handicap + parPoints - points
   *
   * `handicap` must be the handicap the points were computed against — in a
   * UK club competition that is the Playing Handicap (95% of Course Handicap
   * for individual Stableford), not the Course Handicap.
   *
   * Because Stableford already scores zero for anything worse than a net
   * double bogey, the result is inherently net-double-bogey adjusted.
   */
  function stablefordToAdjustedGross(opts) {
    var holes = opts.holes == null ? 18 : opts.holes;
    var parPoints = holes === 9 ? 18 : 36;
    return Math.round(opts.par + opts.handicap + parPoints - opts.points);
  }

  /**
   * Selection table: how many of the most recent differentials count, and the
   * additional adjustment, for records of fewer than 20 scores.
   * Returns {use, adjustment} for n available differentials (n >= 3).
   */
  function selectionTable(n) {
    if (n <= 3) return { use: 1, adjustment: -2.0 };
    if (n === 4) return { use: 1, adjustment: -1.0 };
    if (n === 5) return { use: 1, adjustment: 0 };
    if (n === 6) return { use: 2, adjustment: -1.0 };
    if (n <= 8) return { use: 2, adjustment: 0 };
    if (n <= 11) return { use: 3, adjustment: 0 };
    if (n <= 14) return { use: 4, adjustment: 0 };
    if (n <= 16) return { use: 5, adjustment: 0 };
    if (n <= 18) return { use: 6, adjustment: 0 };
    if (n === 19) return { use: 7, adjustment: 0 };
    return { use: 8, adjustment: 0 };
  }

  /**
   * Raw Handicap Index from a window of adjusted differentials (chronological,
   * most recent last; at most the latest 20 are considered).
   * Returns {index, counted} where counted is the set of window positions
   * (indices into the passed array) whose differentials were averaged.
   */
  function rawIndexFromDifferentials(diffs) {
    var windowDiffs = diffs.slice(-20);
    var offset = diffs.length - windowDiffs.length;
    var n = windowDiffs.length;
    if (n < 3) return { index: null, counted: [] };

    var sel = selectionTable(n);
    var order = windowDiffs
      .map(function (d, i) { return { d: d, i: i }; })
      .sort(function (a, b) { return a.d - b.d || a.i - b.i; })
      .slice(0, sel.use);

    var sum = order.reduce(function (acc, e) { return acc + e.d; }, 0);
    var index = roundTenth(sum / sel.use + sel.adjustment);
    index = Math.min(index, MAX_HANDICAP_INDEX);
    return {
      index: index,
      counted: order.map(function (e) { return e.i + offset; })
    };
  }

  /** Apply soft and hard caps against a Low Handicap Index. */
  function applyCaps(rawIndex, lowHI) {
    if (lowHI == null) return rawIndex;
    var capped = rawIndex;
    if (capped > lowHI + SOFT_CAP_THRESHOLD) {
      capped = lowHI + SOFT_CAP_THRESHOLD +
        (capped - (lowHI + SOFT_CAP_THRESHOLD)) / 2;
    }
    if (capped > lowHI + HARD_CAP_THRESHOLD) {
      capped = lowHI + HARD_CAP_THRESHOLD;
    }
    return roundTenth(capped);
  }

  /**
   * Exceptional Score Reduction for a newly submitted differential, given the
   * Handicap Index in effect when the round was played.
   * Returns 0, -1 or -2 (applied to each of the most recent 20 differentials).
   */
  function exceptionalReduction(differential, indexInEffect) {
    if (indexInEffect == null) return 0;
    var gap = indexInEffect - differential;
    if (gap >= 10.0) return -2.0;
    if (gap >= 7.0) return -1.0;
    return 0;
  }

  /**
   * Recompute the full scoring record chronologically.
   *
   * scores: [{date: 'YYYY-MM-DD', differential: number}] in any order, or for
   * a 9-hole round [{date, nineDifferential: number}] carrying the unrounded
   * 9-hole Score Differential, which is scaled to 18 holes here against the
   * index in effect when it was played.
   * Returns {
   *   scores: same order as input, each annotated with
   *     {adjustedDifferential, esr, indexAfter, exceptional},
   *   handicapIndex, lowHandicapIndex, counted: [scoreRefs...]
   * }
   *
   * Implements: ESR (-1/-2 applied to the most recent 20 differentials
   * including the exceptional score), soft & hard caps against the Low HI
   * (lowest index in the 365 days preceding the most recent round, active
   * once the record has reached 20 scores), and the 54.0 ceiling.
   */
  function computeRecord(scores) {
    var order = scores
      .map(function (s, i) { return { s: s, i: i }; })
      .sort(function (a, b) {
        return String(a.s.date).localeCompare(String(b.s.date)) || a.i - b.i;
      });

    var esr = order.map(function () { return 0; });     // cumulative ESR per score
    var resolved = order.map(function () { return 0; }); // 18-hole differential
    var results = scores.map(function () { return null; });
    var history = [];                                    // {time, hi} after each round
    var reached20 = false;
    var currentHI = null;
    var lowHI = null;
    var lastCounted = [];

    for (var k = 0; k < order.length; k++) {
      var sc = order[k].s;

      // A 9-hole score becomes an 18-hole Score Differential by combining it
      // with the expected score for the 9 holes not played, based on the
      // Handicap Index in effect when the round was played (Rule 5.1b).
      resolved[k] = (sc.nineDifferential != null)
        ? nineToEighteenDifferential(sc.nineDifferential, currentHI)
        : sc.differential;

      // Exceptional score check against the index in effect when played.
      var reduction = exceptionalReduction(resolved[k], currentHI);
      if (reduction !== 0) {
        var from = Math.max(0, k - 19);
        for (var j = from; j <= k; j++) esr[j] += reduction;
      }

      var adjusted = [];
      for (var m = 0; m <= k; m++) {
        adjusted.push(roundTenth(resolved[m] + esr[m]));
      }

      var raw = rawIndexFromDifferentials(adjusted);
      var hi = raw.index;

      if (hi != null) {
        if (k + 1 >= 20) reached20 = true;

        // Low HI: lowest index during the 365 days before this round's date,
        // once the player has a 20-score record.
        lowHI = null;
        if (reached20) {
          var time = Date.parse(sc.date);
          for (var h = 0; h < history.length; h++) {
            if (time - history[h].time <= LOW_HI_WINDOW_DAYS * 86400000 &&
                (lowHI == null || history[h].hi < lowHI)) {
              lowHI = history[h].hi;
            }
          }
        }

        hi = applyCaps(hi, lowHI);
        hi = Math.min(hi, MAX_HANDICAP_INDEX);
      }

      currentHI = hi;
      if (hi != null) history.push({ time: Date.parse(sc.date), hi: hi });

      lastCounted = raw.counted.map(function (w) { return order[w].i; });

      results[order[k].i] = {
        differential: resolved[k],
        nineHole: sc.nineDifferential != null,
        adjustedDifferential: roundTenth(resolved[k] + esr[k]),
        esr: esr[k],
        exceptional: reduction !== 0,
        indexAfter: hi
      };
    }

    return {
      scores: results,
      handicapIndex: currentHI,
      lowHandicapIndex: lowHI,
      counted: lastCounted
    };
  }

  var WHS = {
    MAX_HANDICAP_INDEX: MAX_HANDICAP_INDEX,
    roundTenth: roundTenth,
    scoreDifferential: scoreDifferential,
    courseHandicap: courseHandicap,
    playingHandicap: playingHandicap,
    strokesOnHole: strokesOnHole,
    netDoubleBogey: netDoubleBogey,
    netPar: netPar,
    adjustedGrossScore: adjustedGrossScore,
    nineHoleDifferential: nineHoleDifferential,
    expectedNineDifferential: expectedNineDifferential,
    nineToEighteenDifferential: nineToEighteenDifferential,
    courseHandicap9: courseHandicap9,
    stablefordPointsForHole: stablefordPointsForHole,
    stablefordPoints: stablefordPoints,
    stablefordToAdjustedGross: stablefordToAdjustedGross,
    selectionTable: selectionTable,
    rawIndexFromDifferentials: rawIndexFromDifferentials,
    applyCaps: applyCaps,
    exceptionalReduction: exceptionalReduction,
    computeRecord: computeRecord
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = WHS;
  global.WHS = WHS;
})(typeof window !== 'undefined' ? window : globalThis);
