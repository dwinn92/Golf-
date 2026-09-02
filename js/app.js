/* Fairway — UI layer. All persistence is localStorage; all maths is in WHS. */
(function () {
  'use strict';

  var STORAGE_KEY = 'fairway.whs.v1';

  /* ---------------- state ---------------- */

  function defaultHoles(pars, sis) {
    return pars.map(function (p, i) { return { par: p, strokeIndex: sis[i] }; });
  }

  function sampleCourses() {
    return [
      {
        id: 'c-heathside',
        name: 'Heathside Park GC (sample)',
        tees: [
          {
            id: 't-hs-white', name: 'White', par: 72, courseRating: 72.3, slopeRating: 131,
            holes: defaultHoles(
              [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4],
              [5, 11, 17, 1, 7, 15, 9, 3, 13, 4, 16, 10, 2, 8, 18, 12, 6, 14])
          },
          { id: 't-hs-yellow', name: 'Yellow', par: 72, courseRating: 70.8, slopeRating: 126, holes: null },
          { id: 't-hs-red', name: 'Red', par: 73, courseRating: 72.9, slopeRating: 128, holes: null }
        ]
      },
      {
        id: 'c-links',
        name: 'St Edmund Links (sample)',
        tees: [
          { id: 't-li-white', name: 'White', par: 71, courseRating: 71.6, slopeRating: 124, holes: null },
          { id: 't-li-yellow', name: 'Yellow', par: 71, courseRating: 69.9, slopeRating: 119, holes: null }
        ]
      },
      {
        id: 'c-meadow',
        name: 'Meadowbrook GC (sample)',
        tees: [
          { id: 't-me-yellow', name: 'Yellow', par: 70, courseRating: 68.4, slopeRating: 113, holes: null }
        ]
      }
    ];
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var st = JSON.parse(raw);
        if (st && Array.isArray(st.courses) && Array.isArray(st.scores)) return st;
      }
    } catch (e) { /* corrupted or blocked storage — start fresh */ }
    return { courses: sampleCourses(), scores: [] };
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { /* private mode etc. — app still works for the session */ }
  }

  var state = load();
  var record = WHS.computeRecord(state.scores);

  function recompute() {
    record = WHS.computeRecord(state.scores);
    save();
    renderAll();
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function findCourse(id) {
    return state.courses.find(function (c) { return c.id === id; }) || null;
  }
  function findTee(course, teeId) {
    return course ? (course.tees.find(function (t) { return t.id === teeId; }) || null) : null;
  }

  function sortedScoreViews() {
    // most recent first, annotated with the computed record data
    return state.scores
      .map(function (s, i) { return { score: s, calc: record.scores[i], index: i }; })
      .sort(function (a, b) {
        return String(b.score.date).localeCompare(String(a.score.date)) || b.index - a.index;
      });
  }

  function fmt(x, dp) {
    if (x == null || isNaN(x)) return '–';
    return Number(x).toFixed(dp == null ? 1 : dp);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- tabs ---------------- */

  document.getElementById('tabs').addEventListener('click', function (e) {
    var btn = e.target.closest('.tab');
    if (!btn) return;
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t === btn); });
    document.querySelectorAll('.panel').forEach(function (p) {
      p.classList.toggle('active', p.id === 'panel-' + btn.dataset.tab);
    });
  });

  /* ---------------- dashboard ---------------- */

  function renderDashboard() {
    var hi = record.handicapIndex;
    document.getElementById('topHiValue').textContent = hi == null ? '–' : fmt(hi);
    document.getElementById('statHI').textContent = hi == null ? '–' : fmt(hi);
    document.getElementById('statHINote').textContent = hi == null
      ? (3 - state.scores.length) + ' more round' + (3 - state.scores.length === 1 ? '' : 's') + ' needed for an index'
      : 'best 8 of your last ' + Math.min(state.scores.length, 20) + ' rounds';
    document.getElementById('statLowHI').textContent =
      record.lowHandicapIndex == null ? '–' : fmt(record.lowHandicapIndex);
    document.getElementById('statCount').textContent = state.scores.length;
    document.getElementById('statCountNote').textContent =
      state.scores.length >= 20 ? 'full 20-score record' : (20 - state.scores.length) + ' to a full record';

    var views = sortedScoreViews();
    var best = null;
    views.forEach(function (v) {
      if (best == null || v.score.differential < best.score.differential) best = v;
    });
    document.getElementById('statBest').textContent = best ? fmt(best.score.differential) : '–';
    document.getElementById('statBestNote').textContent = best
      ? best.score.courseName + ' · ' + best.score.date : '';

    renderChart();
    renderDiffStrip(views);
  }

  function renderChart() {
    var holder = document.getElementById('chart');
    var points = state.scores
      .map(function (s, i) { return { date: s.date, hi: record.scores[i].indexAfter, i: i }; })
      .filter(function (p) { return p.hi != null; })
      .sort(function (a, b) { return String(a.date).localeCompare(String(b.date)) || a.i - b.i; });

    if (points.length < 2) {
      holder.innerHTML = '<p class="chart-empty">Your index progression will appear here once you have an established Handicap Index.</p>';
      return;
    }

    var W = 900, H = 260, padL = 44, padR = 16, padT = 16, padB = 30;
    var his = points.map(function (p) { return p.hi; });
    var min = Math.floor(Math.min.apply(null, his)) - 1;
    var max = Math.ceil(Math.max.apply(null, his)) + 1;
    if (max - min < 4) { max = min + 4; }

    function x(i) { return padL + (W - padL - padR) * (points.length === 1 ? 0.5 : i / (points.length - 1)); }
    function y(v) { return padT + (H - padT - padB) * (1 - (v - min) / (max - min)); }

    var grid = '', labels = '';
    var steps = 4;
    for (var g = 0; g <= steps; g++) {
      var val = min + (max - min) * g / steps;
      var gy = y(val);
      grid += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy +
        '" stroke="var(--line)" stroke-width="1"/>';
      labels += '<text x="' + (padL - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="var(--ink-soft)">' +
        val.toFixed(1) + '</text>';
    }

    var path = points.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.hi).toFixed(1); }).join(' ');
    var dots = points.map(function (p, i) {
      return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.hi).toFixed(1) +
        '" r="3.5" fill="var(--green-600)"><title>' + esc(p.date) + ' — HI ' + fmt(p.hi) + '</title></circle>';
    }).join('');

    var first = points[0], last = points[points.length - 1];
    var xLabels =
      '<text x="' + padL + '" y="' + (H - 8) + '" font-size="11" fill="var(--ink-soft)">' + esc(first.date) + '</text>' +
      '<text x="' + (W - padR) + '" y="' + (H - 8) + '" text-anchor="end" font-size="11" fill="var(--ink-soft)">' + esc(last.date) + '</text>';

    holder.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
      grid + labels + xLabels +
      '<path d="' + path + '" fill="none" stroke="var(--green-600)" stroke-width="2.5" stroke-linejoin="round"/>' +
      dots + '</svg>';
  }

  function renderDiffStrip(views) {
    var strip = document.getElementById('recentDiffs');
    var latest = views.slice(0, 20);
    if (!latest.length) {
      strip.innerHTML = '<p class="hint">No rounds recorded yet.</p>';
      return;
    }
    var countingSet = {};
    record.counted.forEach(function (i) { countingSet[i] = true; });
    strip.innerHTML = latest.map(function (v) {
      var cls = 'diff-chip' + (countingSet[v.index] ? ' counting' : '') +
        (v.calc.exceptional ? ' exceptional' : '');
      var diffShown = v.calc.adjustedDifferential;
      var title = esc(v.score.courseName) + (v.calc.esr ? ' (incl. ' + v.calc.esr.toFixed(1) + ' exceptional adj.)' : '');
      return '<div class="' + cls + '" title="' + title + '">' +
        '<span class="d">' + fmt(diffShown) + '</span>' +
        '<span class="dt">' + esc(v.score.date.slice(5)) + '</span></div>';
    }).join('');
  }

  /* ---------------- course/tee selects ---------------- */

  function fillCourseSelect(sel, includeManual) {
    sel.innerHTML = state.courses.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
    }).join('') + (includeManual ? '<option value="__manual">Manual entry…</option>' : '');
  }

  function fillTeeSelect(sel, course) {
    sel.innerHTML = course ? course.tees.map(function (t) {
      return '<option value="' + esc(t.id) + '">' + esc(t.name) + ' — CR ' + t.courseRating +
        ', Slope ' + t.slopeRating + ', Par ' + t.par + '</option>';
    }).join('') : '';
  }

  /* ---------------- enter score ---------------- */

  var scoreCourseSel = document.getElementById('scoreCourse');
  var scoreTeeSel = document.getElementById('scoreTee');
  var holesWrap = document.getElementById('holesWrap');
  var totalWrap = document.getElementById('totalWrap');

  function currentEntryTee() {
    var course = findCourse(scoreCourseSel.value);
    return { course: course, tee: findTee(course, scoreTeeSel.value) };
  }

  function entryMode() {
    return document.querySelector('input[name="entryMode"]:checked').value;
  }

  function entryCourseHandicap(tee) {
    if (record.handicapIndex == null) return null; // no index yet -> par+5 cap
    return WHS.courseHandicap(record.handicapIndex, tee.slopeRating, tee.courseRating, tee.par);
  }

  function holeCap(tee, hole, ch) {
    return ch == null ? hole.par + 5 : WHS.netDoubleBogey(hole.par, ch, hole.strokeIndex);
  }

  function renderEntryHoles() {
    var sel = currentEntryTee();
    var modeHolesRadio = document.getElementById('modeHoles');
    var hasHoles = !!(sel.tee && sel.tee.holes && sel.tee.holes.length === 18);
    modeHolesRadio.disabled = !hasHoles;
    modeHolesRadio.parentElement.title = hasHoles ? '' :
      'Add hole pars and stroke indexes to this tee (Courses tab) to enable hole-by-hole entry.';
    if (!hasHoles && entryMode() === 'holes') {
      document.querySelector('input[name="entryMode"][value="total"]').checked = true;
    }

    var holesMode = entryMode() === 'holes' && hasHoles;
    holesWrap.hidden = !holesMode;
    totalWrap.hidden = holesMode;

    if (holesMode) {
      var ch = entryCourseHandicap(sel.tee);
      holesWrap.innerHTML = sel.tee.holes.map(function (h, i) {
        var cap = holeCap(sel.tee, h, ch);
        return '<div class="hole-box"><div class="hole-head"><span>H' + (i + 1) +
          '</span><span>Par ' + h.par + ' · SI ' + h.strokeIndex + '</span></div>' +
          '<input type="number" min="1" max="20" step="1" data-hole="' + i +
          '" placeholder="max ' + cap + '" aria-label="Hole ' + (i + 1) + ' strokes"></div>';
      }).join('');
    }
    updateScorePreview();
  }

  function gatherEntry() {
    var sel = currentEntryTee();
    if (!sel.tee) return null;
    var pcc = parseInt(document.getElementById('scorePCC').value, 10) || 0;
    var ags = null, holes = null;

    if (entryMode() === 'holes' && sel.tee.holes) {
      var ch = entryCourseHandicap(sel.tee);
      var inputs = holesWrap.querySelectorAll('input[data-hole]');
      var anyEntered = false;
      holes = sel.tee.holes.map(function (h, i) {
        var v = parseInt(inputs[i] ? inputs[i].value : '', 10);
        if (v > 0) anyEntered = true;
        return { par: h.par, strokeIndex: h.strokeIndex, strokes: v > 0 ? v : null };
      });
      if (!anyEntered) return { tee: sel.tee, course: sel.course, pcc: pcc, ags: null, holes: holes };
      if (record.handicapIndex == null) {
        ags = holes.reduce(function (t, h) {
          var cap = h.par + 5;
          return t + (h.strokes == null ? cap : Math.min(h.strokes, cap));
        }, 0);
      } else {
        ags = WHS.adjustedGrossScore(holes, entryCourseHandicap(sel.tee));
      }
    } else {
      var v = parseInt(document.getElementById('scoreTotal').value, 10);
      if (v > 0) ags = v;
    }
    return { tee: sel.tee, course: sel.course, pcc: pcc, ags: ags, holes: holes };
  }

  function updateScorePreview() {
    var box = document.getElementById('scorePreview');
    var entry = gatherEntry();
    if (!entry || entry.ags == null) { box.textContent = ''; return; }
    var sd = WHS.scoreDifferential({
      adjustedGross: entry.ags,
      courseRating: entry.tee.courseRating,
      slopeRating: entry.tee.slopeRating,
      pcc: entry.pcc
    });
    box.textContent = 'Adjusted gross ' + entry.ags + ' → score differential ' + fmt(sd);
  }

  document.getElementById('scoreForm').addEventListener('input', function (e) {
    if (e.target.name === 'entryMode') renderEntryHoles();
    else updateScorePreview();
  });
  scoreCourseSel.addEventListener('change', function () {
    fillTeeSelect(scoreTeeSel, findCourse(scoreCourseSel.value));
    renderEntryHoles();
  });
  scoreTeeSel.addEventListener('change', renderEntryHoles);

  document.getElementById('scoreForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var date = document.getElementById('scoreDate').value;
    var entry = gatherEntry();
    if (!date || !entry || entry.ags == null) {
      alert('Enter a date and a score first.');
      return;
    }
    var sd = WHS.scoreDifferential({
      adjustedGross: entry.ags,
      courseRating: entry.tee.courseRating,
      slopeRating: entry.tee.slopeRating,
      pcc: entry.pcc
    });
    state.scores.push({
      id: uid('s'),
      date: date,
      courseName: entry.course.name,
      teeName: entry.tee.name,
      courseRating: entry.tee.courseRating,
      slopeRating: entry.tee.slopeRating,
      par: entry.tee.par,
      pcc: entry.pcc,
      adjustedGross: entry.ags,
      differential: sd
    });
    recompute();
    this.reset();
    document.getElementById('scoreDate').value = todayISO();
    renderEntryHoles();
    document.querySelector('.tab[data-tab="dashboard"]').click();
  });

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
      '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ---------------- history ---------------- */

  function renderHistory() {
    var tbody = document.querySelector('#historyTable tbody');
    var views = sortedScoreViews();
    document.getElementById('historyEmpty').hidden = views.length > 0;
    var countingSet = {};
    record.counted.forEach(function (i) { countingSet[i] = true; });

    tbody.innerHTML = views.map(function (v) {
      var s = v.score, c = v.calc;
      var badges = '';
      if (countingSet[v.index]) badges += '<span class="badge badge-counting">counting</span>';
      if (c.esr) badges += '<span class="badge badge-esr">ESR ' + c.esr.toFixed(1) + '</span>';
      var diffCell = fmt(c.adjustedDifferential) +
        (c.esr ? ' <span class="hint">(' + fmt(s.differential) + ')</span>' : '');
      return '<tr>' +
        '<td>' + esc(s.date) + '</td>' +
        '<td>' + esc(s.courseName) + ' · ' + esc(s.teeName) + badges + '</td>' +
        '<td class="num">' + s.adjustedGross + '</td>' +
        '<td class="num">' + s.courseRating + ' / ' + s.slopeRating + '</td>' +
        '<td class="num">' + (s.pcc > 0 ? '+' + s.pcc : s.pcc) + '</td>' +
        '<td class="num"><strong>' + diffCell + '</strong></td>' +
        '<td class="num">' + fmt(c.indexAfter) + '</td>' +
        '<td><button class="btn btn-danger" data-del="' + esc(s.id) + '">Delete</button></td>' +
        '</tr>';
    }).join('');
  }

  document.querySelector('#historyTable tbody').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-del]');
    if (!btn) return;
    if (!confirm('Delete this score? Your Handicap Index will be recalculated.')) return;
    state.scores = state.scores.filter(function (s) { return s.id !== btn.dataset.del; });
    recompute();
  });

  document.getElementById('exportBtn').addEventListener('click', function () {
    var json = JSON.stringify(state, null, 2);
    var filename = 'fairway-backup-' + todayISO() + '.json';
    // Hosted on claude.ai, saves go through the viewer-confirmed downloads
    // capability; a plain browser gets the anchor download.
    if (typeof window.claude !== 'undefined' && window.claude.use) {
      window.claude.use('downloads').then(function (downloads) {
        if (!downloads) throw new Error('unavailable');
        return downloads.save({ filename: filename, data: json });
      }).catch(function (err) {
        if (err && err.code === 'declined') return; // viewer said no
        anchorDownload(filename, json);
      });
      return;
    }
    anchorDownload(filename, json);
  });

  function anchorDownload(filename, json) {
    var blob = new Blob([json], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  document.getElementById('importFile').addEventListener('change', function () {
    var file = this.files[0];
    this.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.courses) || !Array.isArray(data.scores)) {
          throw new Error('bad shape');
        }
        if (!confirm('Replace your current courses and scores with the imported file?')) return;
        state = data;
        recompute();
        renderEntrySelectors();
      } catch (err) {
        alert('That file is not a valid Fairway backup.');
      }
    };
    reader.readAsText(file);
  });

  /* ---------------- courses ---------------- */

  var courseFormCard = document.getElementById('courseFormCard');

  function renderCourses() {
    var list = document.getElementById('courseList');
    if (!state.courses.length) {
      list.innerHTML = '<p class="hint">No courses yet — add the courses you play with their tee ratings from the scorecard.</p>';
      return;
    }
    list.innerHTML = state.courses.map(function (c) {
      var tees = c.tees.map(function (t) {
        return '<div class="tee-row"><span><strong>' + esc(t.name) + '</strong>' +
          (t.holes ? '<span class="tee-tag">hole data</span>' : '') + '</span>' +
          '<span class="tee-facts">Par ' + t.par + ' · CR ' + t.courseRating + ' · Slope ' + t.slopeRating + '</span>' +
          '<button class="btn btn-danger" data-del-tee="' + esc(c.id) + '|' + esc(t.id) + '">Remove</button></div>';
      }).join('');
      return '<div class="course-item"><h3>' + esc(c.name) + '</h3>' + tees + '</div>';
    }).join('');
  }

  document.getElementById('courseList').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-del-tee]');
    if (!btn) return;
    var parts = btn.dataset.delTee.split('|');
    var course = findCourse(parts[0]);
    if (!course) return;
    if (!confirm('Remove this tee? Existing scores keep their recorded ratings.')) return;
    course.tees = course.tees.filter(function (t) { return t.id !== parts[1]; });
    if (!course.tees.length) {
      state.courses = state.courses.filter(function (c) { return c.id !== course.id; });
    }
    save();
    renderCourses();
    renderEntrySelectors();
  });

  function renderHoleInputs() {
    var wrap = document.getElementById('holeInputs');
    var cells = '';
    for (var i = 0; i < 18; i++) {
      cells += '<div class="hole-box"><div class="hole-head"><span>H' + (i + 1) + '</span><span>par / SI</span></div>' +
        '<div class="hole-meta">' +
        '<input type="number" min="3" max="6" step="1" data-par="' + i + '" placeholder="4" aria-label="Hole ' + (i + 1) + ' par">' +
        '<input type="number" min="1" max="18" step="1" data-si="' + i + '" placeholder="' + (i + 1) + '" aria-label="Hole ' + (i + 1) + ' stroke index">' +
        '</div></div>';
    }
    wrap.innerHTML = cells;
  }

  document.getElementById('addCourseBtn').addEventListener('click', function () {
    courseFormCard.hidden = false;
    renderHoleInputs();
    document.getElementById('courseName').focus();
  });
  document.getElementById('cancelCourseBtn').addEventListener('click', function () {
    courseFormCard.hidden = true;
    document.getElementById('courseForm').reset();
  });

  document.getElementById('courseForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('courseName').value.trim();
    var teeName = document.getElementById('teeName').value.trim();
    var par = parseInt(document.getElementById('teePar').value, 10);
    var cr = parseFloat(document.getElementById('teeCR').value);
    var slope = parseInt(document.getElementById('teeSlope').value, 10);
    if (!name || !teeName || !(par >= 54) || isNaN(cr) || !(slope >= 55 && slope <= 155)) {
      alert('Check the tee details — slope must be 55–155.');
      return;
    }

    // optional hole data: only saved if all 36 values are present and SIs are 1..18 unique
    var holes = null;
    var pars = [], sis = [], filled = 0;
    for (var i = 0; i < 18; i++) {
      var p = parseInt(document.querySelector('[data-par="' + i + '"]').value, 10);
      var s = parseInt(document.querySelector('[data-si="' + i + '"]').value, 10);
      if (p > 0 && s > 0) filled++;
      pars.push(p); sis.push(s);
    }
    if (filled > 0) {
      if (filled < 18) { alert('Fill in par and stroke index for all 18 holes, or leave them all blank.'); return; }
      var seen = {};
      for (var j = 0; j < 18; j++) {
        if (sis[j] < 1 || sis[j] > 18 || seen[sis[j]]) { alert('Stroke indexes must be 1–18, each used once.'); return; }
        seen[sis[j]] = true;
      }
      var parSum = pars.reduce(function (a, b) { return a + b; }, 0);
      if (parSum !== par) { alert('Hole pars add up to ' + parSum + ' but the tee par is ' + par + '.'); return; }
      holes = defaultHoles(pars, sis);
    }

    var course = state.courses.find(function (c) { return c.name.toLowerCase() === name.toLowerCase(); });
    if (!course) {
      course = { id: uid('c'), name: name, tees: [] };
      state.courses.push(course);
    }
    course.tees.push({
      id: uid('t'), name: teeName, par: par, courseRating: cr, slopeRating: slope, holes: holes
    });

    save();
    this.reset();
    courseFormCard.hidden = true;
    renderCourses();
    renderEntrySelectors();
  });

  /* ---------------- calculator ---------------- */

  var calcCourseSel = document.getElementById('calcCourse');
  var calcTeeSel = document.getElementById('calcTee');

  function renderCalc() {
    var out = document.getElementById('calcResult');
    var strokesOut = document.getElementById('calcStrokes');
    var hiInput = document.getElementById('calcHI');
    var hi = parseFloat(hiInput.value);
    if (isNaN(hi) && record.handicapIndex != null) {
      hi = record.handicapIndex;
      hiInput.placeholder = 'current: ' + fmt(record.handicapIndex);
    }
    var course = findCourse(calcCourseSel.value);
    var tee = findTee(course, calcTeeSel.value);
    if (isNaN(hi) || !tee) {
      out.innerHTML = '<p class="hint">' + (isNaN(hi)
        ? 'Enter a Handicap Index (or post scores to use your own).'
        : 'Pick a course and tee.') + '</p>';
      strokesOut.innerHTML = '';
      return;
    }
    var ch = WHS.courseHandicap(hi, tee.slopeRating, tee.courseRating, tee.par);
    var allowance = parseInt(document.getElementById('calcAllowance').value, 10);
    var ph = WHS.playingHandicap(ch, allowance);
    out.innerHTML =
      '<div class="calc-pill"><span class="cp-label">Course Handicap</span><span class="cp-value">' + ch + '</span></div>' +
      '<div class="calc-pill"><span class="cp-label">Playing Handicap (' + allowance + '%)</span><span class="cp-value">' + ph + '</span></div>';

    if (tee.holes && tee.holes.length === 18) {
      strokesOut.innerHTML = '<h2 style="margin-top:18px">Strokes received by hole</h2><div class="stroke-grid">' +
        tee.holes.map(function (h, i) {
          var st = WHS.strokesOnHole(ch, h.strokeIndex);
          return '<div class="stroke-cell' + (st > 0 ? ' gets' : '') + '"><b>' + (i + 1) + '</b>' +
            (st === 0 ? '—' : (st > 0 ? '+' + st : st)) + '</div>';
        }).join('') + '</div>';
    } else {
      strokesOut.innerHTML = '';
    }
  }

  document.getElementById('calcForm').addEventListener('input', function (e) {
    if (e.target === calcCourseSel) fillTeeSelect(calcTeeSel, findCourse(calcCourseSel.value));
    renderCalc();
  });

  /* ---------------- boot ---------------- */

  function renderEntrySelectors() {
    fillCourseSelect(scoreCourseSel);
    fillTeeSelect(scoreTeeSel, findCourse(scoreCourseSel.value));
    fillCourseSelect(calcCourseSel);
    fillTeeSelect(calcTeeSel, findCourse(calcCourseSel.value));
    renderEntryHoles();
    renderCalc();
  }

  function renderAll() {
    renderDashboard();
    renderHistory();
    renderCourses();
    renderCalc();
  }

  document.getElementById('scoreDate').value = todayISO();
  renderEntrySelectors();
  renderAll();
})();
