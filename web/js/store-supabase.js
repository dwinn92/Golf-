/*
 * Store: web build. Backed by Supabase, so identity comes from a real session
 * and row level security — not from a value this device chose.
 */
(function (global) {
  'use strict';
  var D = global.FairwayData;

  var Store = {
    // Accounts supply identity, so the "who's playing?" picker is not used.
    needsProfilePicker: false,

    /* What this build can do. The artifact build shares this UI but has no
       accounts behind it, so it turns these off rather than showing controls
       that cannot work. */
    features: {
      accounts: true, clubs: true, attestation: true,
      offers: true, notifications: true, photos: true
    },

    connect: function () {
      // app-web.js only boots the UI once a session exists.
      return Promise.resolve(true);
    },

    currentPlayerId: function () { return D.cache.me; },
    rememberPlayer: function () { /* identity is the session, nothing to store */ },
    signOut: function () { return D.signOut(); },

    watch: function (next, err) {
      function shape(c) {
        return {
          players: c.players, courses: c.courses, rounds: c.rounds,
          clubs: c.clubs, notifications: c.notifications, offers: c.offers
        };
      }
      D.onChange(function (cache) { next(shape(cache)); });
      if (D.cache.rounds.length || Object.keys(D.cache.players).length) next(shape(D.cache));
      D.loadAll().catch(err);
    },

    join: function () {
      // Signing up creates the profile; nothing to do here.
      return Promise.resolve(D.cache.me);
    },

    updateProfile: function (patch) { return D.updateProfile(patch); },

    addCourseTee: function (courseName, tee) {
      return D.addCourseTee({
        courseName: courseName, teeName: tee.name, par: tee.par,
        courseRating: tee.courseRating, slopeRating: tee.slopeRating,
        yards: tee.yards, holes: tee.holes
      });
    },

    confirmTee: function (courseId, teeIdx, alreadyMine) {
      var course = D.cache.courses[courseId];
      var tee = course && course.tees[teeIdx];
      if (!tee) return Promise.reject(new Error('unknown tee'));
      return D.toggleTeeConfirmation(tee.id, alreadyMine);
    },

    postRound: function (round) { return D.postRound(round); },
    deleteRound: function (id) { return D.deleteRound(id); },

    /* ---- clubhouses ---- */
    createClub: function (name) { return D.createClub(name); },
    joinClub: function (code) { return D.joinClub(code); },
    leaveClub: function (id) { return D.leaveClub(id); },
    renameClub: function (id, name) { return D.renameClub(id, name); },

    /* ---- cards ---- */
    attest: function (roundId, on) { return D.attestRound(roundId, on); },
    offerCards: function (list) { return D.offerCards(list); },
    resolveOffer: function (id, status) { return D.resolveOffer(id, status); },

    /* ---- notifications ---- */
    markRead: function (ids) { return D.markNotificationsRead(ids); },
    clearNotifications: function () { return D.clearNotifications(); },

    /* ---- scorecard photos ---- */
    uploadScorecard: function (file, key) { return D.uploadScorecard(file, key); },
    scorecardUrl: function (path) { return D.scorecardUrl(path); },

    /* ---- account ---- */
    deleteAccount: function () { return D.deleteAccount(); },

    /* A plain browser download. The artifact build overrides this because it
       has no filesystem of its own to save to. */
    download: function (filename, mime, text) {
      return new Promise(function (resolve, reject) {
        try {
          var blob = new Blob([text], { type: mime });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          // Revoke late: Safari reads the blob after the click returns.
          setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
          resolve(true);
        } catch (e) { reject(e); }
      });
    }
  };

  global.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);
