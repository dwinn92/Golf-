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
  var cache = { players: {}, courses: {}, rounds: [], clubs: [], notifications: [], offers: [], me: null, session: null };

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
  /** Trade the refresh token for a newly minted access token. */
  function refreshSession() { return sb().auth.refreshSession(); }

  /* ---------------- reads ---------------- */

  /**
   * Load the whole clubhouse. It is small by design — a friends group, not a
   * national database — so one pass per change beats incremental syncing.
   */
  function loadAll() {
    return Promise.all([
      sb().from('profiles').select('id, display_name, color, cdh, home_tee_id, target_index'),
      sb().from('courses').select('id, name'),
      sb().from('tees').select('id, course_id, name, par, course_rating, slope_rating, yards, holes, front9, back9'),
      sb().from('tee_confirmations').select('tee_id, user_id'),
      sb().from('rounds').select('*').order('played_on', { ascending: false }).limit(2000),
      sb().from('round_partners').select('round_id, partner_id'),
      sb().from('clubs').select('id, name, invite_code, created_by'),
      sb().from('club_members').select('club_id, user_id, role, joined_at'),
      sb().from('notifications').select('*').order('created_at', { ascending: false }).limit(200),
      sb().from('card_offers').select('*').eq('status', 'pending')
    ]).then(function (res) {
      var err = res.find(function (r) { return r.error; });
      if (err) throw err.error;

      var players = {};
      res[0].data.forEach(function (p) {
        players[p.id] = {
          name: p.display_name, color: p.color || '#1F6B4A',
          cdh: p.cdh || '', homeTeeId: p.home_tee_id || null,
          targetIndex: p.target_index == null ? null : Number(p.target_index)
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
          attestedBy: r.attested_by || null, attestedAt: r.attested_at || null,
          stats: r.stats || null, photoPath: r.photo_path || null,
          allowancePercent: r.allowance_percent == null ? 95 : r.allowance_percent,
          formatName: r.format_name || null,
          playedWith: partners[r.id] || []
        };
      });

      var clubs = res[6].data.map(function (c) {
        return { id: c.id, name: c.name, inviteCode: c.invite_code, createdBy: c.created_by, members: [] };
      });
      var byClub = {};
      clubs.forEach(function (c) { byClub[c.id] = c; });
      res[7].data.forEach(function (m) {
        if (byClub[m.club_id]) byClub[m.club_id].members.push({ id: m.user_id, role: m.role, joinedAt: m.joined_at });
      });

      cache.players = players;
      cache.courses = courses;
      cache.rounds = rounds;
      cache.clubs = clubs;
      cache.notifications = res[8].data.map(function (n) {
        return { id: n.id, kind: n.kind, actorId: n.actor_id, roundId: n.round_id,
                 offerId: n.offer_id, body: n.body, readAt: n.read_at, createdAt: n.created_at };
      });
      cache.offers = res[9].data.map(function (o) {
        return { id: o.id, fromUser: o.from_user, toUser: o.to_user,
                 payload: o.payload, status: o.status, createdAt: o.created_at };
      });
      emit();
      return cache;
    });
  }

  /* ---------------- realtime ---------------- */

  var channel = null;
  var reloadTimer = null;

  /*
   * One posted round can arrive as several change events — the round row, its
   * partner rows, the course and tee it created — and reloading per event
   * meant six full clubhouse fetches for one action. Coalesce them into a
   * single reload just after the burst settles.
   */
  function scheduleReload() {
    if (reloadTimer) return;
    reloadTimer = setTimeout(function () {
      reloadTimer = null;
      loadAll().catch(function () { /* the next change will try again */ });
    }, 350);
  }

  function subscribe() {
    if (channel) return;
    channel = sb().channel('clubhouse')
      .on('postgres_changes', { event: '*', schema: 'public' }, scheduleReload)
      .subscribe();
  }
  function unsubscribe() {
    if (reloadTimer) { clearTimeout(reloadTimer); reloadTimer = null; }
    if (channel) { sb().removeChannel(channel); channel = null; }
  }

  /* ---------------- writes ---------------- */

  function updateProfile(patch) {
    var row = {};
    if (patch.name != null) row.display_name = patch.name;
    if (patch.color != null) row.color = patch.color;
    if (patch.cdh != null) row.cdh = patch.cdh;
    if (patch.homeTeeId !== undefined) row.home_tee_id = patch.homeTeeId;
    if (patch.targetIndex !== undefined) row.target_index = patch.targetIndex;
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
      ratings_estimated: !!round.ratingsEstimated,
      stats: round.stats || null,
      photo_path: round.photoPath || null,
      allowance_percent: round.allowancePercent == null ? 95 : round.allowancePercent,
      format_name: round.formatName || null
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


  /* ---------------- clubhouses ---------------- */

  function createClub(name) {
    return sb().rpc('create_club', { club_name: name }).then(check).then(loadAll);
  }
  function joinClub(code) {
    return sb().rpc('join_club_by_code', { code: code }).then(function (r) {
      if (r.error) {
        // The function raises a bare `no_such_code`; say something a person
        // can act on instead.
        if (/no_such_code/.test(r.error.message || '')) {
          throw new Error('No clubhouse has that code. Check it with whoever invited you.');
        }
        throw r.error;
      }
      return r;
    }).then(loadAll);
  }
  function leaveClub(clubId) {
    return sb().rpc('leave_club', { target_club: clubId }).then(check).then(loadAll);
  }
  function renameClub(clubId, name) {
    return sb().from('clubs').update({ name: name }).eq('id', clubId).then(check).then(loadAll);
  }

  /* ---------------- attestation ---------------- */

  function attestRound(roundId, on) {
    return sb().rpc('attest_round', { target_round: roundId, on_off: on !== false })
      .then(check).then(loadAll);
  }

  /* ---------------- cards kept for other players ---------------- */

  function offerCards(offers) {
    if (!offers.length) return Promise.resolve(null);
    return sb().from('card_offers').insert(offers.map(function (o) {
      return { from_user: cache.me, to_user: o.toUser, payload: o.payload };
    })).then(check).then(loadAll);
  }
  function resolveOffer(offerId, status) {
    return sb().from('card_offers')
      .update({ status: status, resolved_at: new Date().toISOString() })
      .eq('id', offerId).then(check).then(loadAll);
  }

  /* ---------------- notifications ---------------- */

  function markNotificationsRead(ids) {
    if (!ids || !ids.length) return Promise.resolve(null);
    return sb().from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids).then(check).then(loadAll);
  }
  function clearNotifications() {
    return sb().from('notifications').delete().eq('user_id', cache.me).then(check).then(loadAll);
  }

  /* ---------------- scorecard photos ---------------- */

  function uploadScorecard(file, roundKey) {
    var ext = (file.name || '').split('.').pop().toLowerCase();
    if (!/^(jpe?g|png|webp|heic)$/.test(ext)) ext = 'jpg';
    var path = cache.me + '/' + roundKey + '.' + ext;
    return sb().storage.from('scorecards')
      .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
      .then(function (r) { check(r); return path; });
  }
  function scorecardUrl(path) {
    if (!path) return Promise.resolve(null);
    return sb().storage.from('scorecards').createSignedUrl(path, 3600)
      .then(function (r) { return (r.data && r.data.signedUrl) || null; })
      .catch(function () { return null; });
  }

  /* ---------------- leaving for good ---------------- */

  function deleteAccount() {
    return sb().rpc('delete_my_account').then(check).then(function () {
      // The account is gone; the token in memory now refers to nobody.
      return sb().auth.signOut().catch(function () { /* already invalid */ });
    });
  }

  function check(res) {
    if (res && res.error) throw res.error;
    return res;
  }

  global.FairwayData = {
    sb: sb,
    signUp: signUp, signIn: signIn, signInWithLink: signInWithLink,
    resetPassword: resetPassword, updatePassword: updatePassword,
    signOut: signOut, onAuth: onAuth, getSession: getSession,
    refreshSession: refreshSession,
    loadAll: loadAll, subscribe: subscribe, unsubscribe: unsubscribe, onChange: onChange,
    linkParams: linkParams, readLinkParams: readLinkParams,
    updateProfile: updateProfile, addCourseTee: addCourseTee,
    toggleTeeConfirmation: toggleTeeConfirmation,
    postRound: postRound, deleteRound: deleteRound,
    createClub: createClub, joinClub: joinClub, leaveClub: leaveClub, renameClub: renameClub,
    attestRound: attestRound, offerCards: offerCards, resolveOffer: resolveOffer,
    markNotificationsRead: markNotificationsRead, clearNotifications: clearNotifications,
    uploadScorecard: uploadScorecard, scorecardUrl: scorecardUrl,
    deleteAccount: deleteAccount,
    cache: cache,
    setMe: function (id) { cache.me = id; },
    configured: !!(SUPABASE_URL && SUPABASE_KEY)
  };
})(typeof window !== 'undefined' ? window : globalThis);
