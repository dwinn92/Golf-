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

  /** Round to the nearest tenth, half away from zero (WHS convention). */
  function roundTenth(x) {
    return Math.sign(x) * Math.round(Math.abs(x) * 10) / 10;
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

  /** Maximum hole score for handicapping: Net Double Bogey. */
  function netDoubleBogey(par, courseHcp, strokeIndex) {
    return par + 2 + strokesOnHole(courseHcp, strokeIndex);
  }

  /**
   * Adjusted Gross Score from hole-by-hole scores.
   * holes: [{par, strokeIndex, strokes}] — strokes null/0 means "hole not
   * played / picked up", which for an acceptable score counts as net double
   * bogey (net par would apply to holes not played; NDB to pick-ups — we use
   * NDB, the score-entry convention England Golf uses for picked-up holes).
   */
  function adjustedGrossScore(holes, courseHcp) {
    var total = 0;
    for (var i = 0; i < holes.length; i++) {
      var h = holes[i];
      var cap = netDoubleBogey(h.par, courseHcp, h.strokeIndex);
      var s = (h.strokes == null || h.strokes === 0) ? cap : Math.min(h.strokes, cap);
      total += s;
    }
    return total;
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
   * scores: [{date: 'YYYY-MM-DD', differential: number}] in any order.
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
    var results = scores.map(function () { return null; });
    var history = [];                                    // {time, hi} after each round
    var reached20 = false;
    var currentHI = null;
    var lowHI = null;
    var lastCounted = [];

    for (var k = 0; k < order.length; k++) {
      var sc = order[k].s;

      // Exceptional score check against the index in effect when played.
      var reduction = exceptionalReduction(sc.differential, currentHI);
      if (reduction !== 0) {
        var from = Math.max(0, k - 19);
        for (var j = from; j <= k; j++) esr[j] += reduction;
      }

      var adjusted = [];
      for (var m = 0; m <= k; m++) {
        adjusted.push(roundTenth(order[m].s.differential + esr[m]));
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
        adjustedDifferential: roundTenth(sc.differential + esr[k]),
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
    adjustedGrossScore: adjustedGrossScore,
    selectionTable: selectionTable,
    rawIndexFromDifferentials: rawIndexFromDifferentials,
    applyCaps: applyCaps,
    exceptionalReduction: exceptionalReduction,
    computeRecord: computeRecord
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = WHS;
  global.WHS = WHS;
})(typeof window !== 'undefined' ? window : globalThis);
