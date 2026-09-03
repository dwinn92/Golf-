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

    connect: function () {
      // app-web.js only boots the UI once a session exists.
      return Promise.resolve(true);
    },

    currentPlayerId: function () { return D.cache.me; },
    rememberPlayer: function () { /* identity is the session, nothing to store */ },
    signOut: function () { return D.signOut(); },

    watch: function (next, err) {
      D.onChange(function (cache) {
        next({ players: cache.players, courses: cache.courses, rounds: cache.rounds });
      });
      if (D.cache.rounds.length || Object.keys(D.cache.players).length) {
        next({ players: D.cache.players, courses: D.cache.courses, rounds: D.cache.rounds });
      }
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
    deleteRound: function (id) { return D.deleteRound(id); }
  };

  global.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);
