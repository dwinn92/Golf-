/*
 * Fairway data layer over Supabase.
 *
 * Presents the same shape the rest of the app expects — players, courses and
 * rounds as plain objects, plus a change callback — so the UI does not care
 * that rows now come from Postgres behind row level security.
 */
(function (global) {
  'use strict';

  var SUPABASE_URL = global.FAIRWAY_CONFIG && global.FAIRWAY_CONFIG.supabaseUrl;
  var SUPABASE_KEY = global.FAIRWAY_CONFIG && global.FAIRWAY_CONFIG.supabaseKey;

  /**
   * Email links land here carrying either a hash (#access_token=...&type=recovery)
   * or a query (?code=... / ?error=...). supabase-js consumes and clears the URL
   * as soon as the client is created, so read it once, first thing.
   */
  function readLinkParams() {
    var out = {};
    try {
      var hash = (global.location.hash || '').replace(/^#/, '');
      var query = (global.location.search || '').replace(/^\?/, '');
      [hash, query].forEach(function (str) {
        if (!str) return;
        str.split('&').forEach(function (pair) {
          var bits = pair.split('=');
          if (bits[0]) out[decodeURIComponent(bits[0])] = decodeURIComponent((bits[1] || '').replace(/\+/g, ' '));
        });
      });
    } catch (e) { /* malformed URL — treat as a plain visit */ }
    return out;
  }
  var linkParams = readLinkParams();

  var client = null;
  var listeners = [];
  var cache = { players: {}, courses: {}, rounds: [], me: null, session: null };

  function sb() {
    if (!client) {
      client = global.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return client;
  }

  function emit() { listeners.forEach(function (fn) { fn(cache); }); }
  function onChange(fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; }

  /* ---------------- auth ---------------- */

  function signUp(email, password, displayName) {
    return sb().auth.signUp({
      email: email,
      password: password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: global.location.origin
      }
    });
  }
  function signIn(email, password) {
    return sb().auth.signInWithPassword({ email: email, password: password });
  }
  function signInWithLink(email) {
    return sb().auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: global.location.origin }
    });
  }
  function resetPassword(email) {
    return sb().auth.resetPasswordForEmail(email, { redirectTo: global.location.origin });
  }
  /** Set a new password for the member the recovery link signed in. */
  function updatePassword(password) {
    return sb().auth.updateUser({ password: password });
  }
  function signOut() { return sb().auth.signOut(); }
  function onAuth(fn) { return sb().auth.onAuthStateChange(fn); }
  function getSession() { return sb().auth.getSession(); }

  /* ---------------- reads ---------------- */

  /**
   * Load the whole clubhouse. It is small by design — a friends group, not a
   * national database — so one pass per change beats incremental syncing.
   */
  function loadAll() {
    return Promise.all([
      sb().from('profiles').select('id, display_name, color, cdh, home_tee_id'),
      sb().from('courses').select('id, name'),
      sb().from('tees').select('id, course_id, name, par, course_rating, slope_rating, yards, holes, front9, back9'),
      sb().from('tee_confirmations').select('tee_id, user_id'),
      sb().from('rounds').select('*').order('played_on', { ascending: false }).limit(2000),
      sb().from('round_partners').select('round_id, partner_id')
    ]).then(function (res) {
      var err = res.find(function (r) { return r.error; });
      if (err) throw err.error;

      var players = {};
      res[0].data.forEach(function (p) {
        players[p.id] = {
          name: p.display_name, color: p.color || '#1F6B4A',
          cdh: p.cdh || '', homeTeeId: p.home_tee_id || null
        };
      });

      var confirms = {};
      res[3].data.forEach(function (c) {
        (confirms[c.tee_id] || (confirms[c.tee_id] = [])).push(c.user_id);
      });

      var courses = {};
      res[1].data.forEach(function (c) { courses[c.id] = { id: c.id, name: c.name, tees: [] }; });
      res[2].data.forEach(function (t) {
        var c = courses[t.course_id];
        if (!c) return;
        c.tees.push({
          id: t.id, name: t.name, par: t.par,
          courseRating: Number(t.course_rating), slopeRating: t.slope_rating,
          yards: t.yards, holes: t.holes, front9: t.front9, back9: t.back9,
          confirmedBy: confirms[t.id] || []
        });
      });
      Object.keys(courses).forEach(function (id) {
        courses[id].tees.sort(function (a, b) { return a.name.localeCompare(b.name); });
      });

      var partners = {};
      res[5].data.forEach(function (p) {
        (partners[p.round_id] || (partners[p.round_id] = [])).push(p.partner_id);
      });

      var rounds = res[4].data.map(function (r) {
        return {
          id: r.id, playerId: r.user_id, date: r.played_on,
          courseName: r.course_name, teeName: r.tee_name,
          courseRating: Number(r.course_rating), slopeRating: r.slope_rating, par: r.par,
          pcc: r.pcc, adjustedGross: r.adjusted_gross,
          differential: Number(r.differential),
          nineDifferential: r.nine_differential == null ? null : Number(r.nine_differential),
          holesPlayed: r.holes_played, nineOf: r.nine_of,
          scoringFormat: r.scoring_format, compType: r.comp_type,
          holeScores: r.hole_scores, ratingsEstimated: r.ratings_estimated,
          playedWith: partners[r.id] || []
        };
      });

      cache.players = players;
      cache.courses = courses;
      cache.rounds = rounds;
      emit();
      return cache;
    });
  }

  /* ---------------- realtime ---------------- */

  var channel = null;
  function subscribe() {
    if (channel) return;
    channel = sb().channel('clubhouse')
      .on('postgres_changes', { event: '*', schema: 'public' }, function () { loadAll(); })
      .subscribe();
  }
  function unsubscribe() {
    if (channel) { sb().removeChannel(channel); channel = null; }
  }

  /* ---------------- writes ---------------- */

  function updateProfile(patch) {
    var row = {};
    if (patch.name != null) row.display_name = patch.name;
    if (patch.color != null) row.color = patch.color;
    if (patch.cdh != null) row.cdh = patch.cdh;
    if (patch.homeTeeId !== undefined) row.home_tee_id = patch.homeTeeId;
    row.updated_at = new Date().toISOString();
    return sb().from('profiles').update(row).eq('id', cache.me).then(check).then(loadAll);
  }

  function addCourseTee(opts) {
    // Reuse an existing course of the same name so the book does not fork.
    return sb().from('courses').select('id, name').ilike('name', opts.courseName)
      .then(function (r) {
        check(r);
        if (r.data && r.data.length) return r.data[0].id;
        return sb().from('courses')
          .insert({ name: opts.courseName, created_by: cache.me })
          .select('id').single()
          .then(function (c) { check(c); return c.data.id; });
      })
      .then(function (courseId) {
        return sb().from('tees').insert({
          course_id: courseId, name: opts.teeName, par: opts.par,
          course_rating: opts.courseRating, slope_rating: opts.slopeRating,
          yards: opts.yards, holes: opts.holes, created_by: cache.me
        }).select('id').single();
      })
      .then(function (t) {
        check(t);
        // adding a tee from your own card is itself a confirmation of it
        return sb().from('tee_confirmations')
          .insert({ tee_id: t.data.id, user_id: cache.me });
      })
      .then(check).then(loadAll);
  }

  function toggleTeeConfirmation(teeId, confirmed) {
    var q = confirmed
      ? sb().from('tee_confirmations').delete().eq('tee_id', teeId).eq('user_id', cache.me)
      : sb().from('tee_confirmations').insert({ tee_id: teeId, user_id: cache.me });
    return q.then(check).then(loadAll);
  }

  function postRound(round) {
    return sb().from('rounds').insert({
      user_id: cache.me,
      played_on: round.date,
      course_name: round.courseName,
      tee_name: round.teeName,
      course_rating: round.courseRating,
      slope_rating: round.slopeRating,
      par: round.par,
      pcc: round.pcc,
      adjusted_gross: round.adjustedGross,
      differential: round.differential,
      nine_differential: round.nineDifferential == null ? null : round.nineDifferential,
      holes_played: round.holesPlayed,
      nine_of: round.nineOf,
      scoring_format: round.scoringFormat,
      comp_type: round.compType,
      hole_scores: round.holeScores,
      ratings_estimated: !!round.ratingsEstimated
    }).select('id').single().then(function (r) {
      check(r);
      var ids = round.playedWith || [];
      if (!ids.length) return null;
      return sb().from('round_partners').insert(ids.map(function (pid) {
        return { round_id: r.data.id, partner_id: pid };
      })).then(check);
    }).then(loadAll);
  }

  function deleteRound(id) {
    return sb().from('rounds').delete().eq('id', id).then(check).then(loadAll);
  }

  function check(res) {
    if (res && res.error) throw res.error;
    return res;
  }

  global.FairwayData = {
    sb: sb,
    signUp: signUp, signIn: signIn, signInWithLink: signInWithLink,
    resetPassword: resetPassword, signOut: signOut, onAuth: onAuth, getSession: getSession,
    loadAll: loadAll, subscribe: subscribe, unsubscribe: unsubscribe, onChange: onChange,
    updatePassword: updatePassword, linkParams: linkParams, readLinkParams: readLinkParams,
    updateProfile: updateProfile, addCourseTee: addCourseTee,
    toggleTeeConfirmation: toggleTeeConfirmation,
    postRound: postRound, deleteRound: deleteRound,
    cache: cache,
    setMe: function (id) { cache.me = id; },
    configured: !!(SUPABASE_URL && SUPABASE_KEY)
  };
})(typeof window !== 'undefined' ? window : globalThis);
