/*
 * Store: artifact build. Backed by the per-artifact document store from
 * claude.use('db'). There are no accounts here — a device picks which member
 * it is, which is why this build asks for a profile up front.
 */
(function (global) {
  'use strict';
  var PROFILE_KEY = 'fairway.social.profile';
  var db = null;
  var data = { players: {}, courses: {}, rounds: [] };
  var onData = null;

  function uid(p) { return p + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function tryStore(fn) { try { return fn(); } catch (e) { return null; } }

  var Store = {
    needsProfilePicker: true,

    connect: function () {
      var use = (global.claude && global.claude.use) ? global.claude.use.bind(global.claude) : null;
      if (!use) return Promise.resolve(false);
      return use('db').then(function (got) {
        if (!got) return false;
        db = got;
        return true;
      });
    },

    currentPlayerId: function () {
      return tryStore(function () { return localStorage.getItem(PROFILE_KEY); });
    },
    rememberPlayer: function (id) {
      tryStore(function () { localStorage.setItem(PROFILE_KEY, id); });
    },
    signOut: function () { /* no accounts in the artifact build */ },

    watch: function (next, err) {
      onData = next;
      db.collection('players').onSnapshot(function (snap) {
        data.players = {};
        snap.docs.forEach(function (d) {
          var b = d.data();
          if (b && b.name) data.players[d.id] = {
            name: String(b.name), color: String(b.color || '#1F6B4A'),
            cdh: b.cdh ? String(b.cdh) : ''
          };
        });
        onData(data);
      }, err);
      db.collection('courses').onSnapshot(function (snap) {
        data.courses = {};
        snap.docs.forEach(function (d) {
          var b = d.data();
          if (b && b.name && Array.isArray(b.tees)) {
            b.id = d.id;
            data.courses[d.id] = b;
          }
        });
        onData(data);
      }, err);
      db.collection('rounds').orderBy('date', 'desc').limit(1000).onSnapshot(function (snap) {
        data.rounds = snap.docs.map(function (d) {
          var b = d.data() || {}; b.id = d.id; return b;
        });
        onData(data);
      }, err);
    },

    join: function (name, color) {
      var id = uid('p');
      return db.collection('players').doc(id)
        .set({ name: name, color: color, createdAt: new Date().toISOString() })
        .then(function () { return id; });
    },

    updateProfile: function (patch) {
      var id = Store.currentPlayerId();
      return db.collection('players').doc(id).update(patch);
    },

    addCourseTee: function (courseName, tee) {
      var existingId = Object.keys(data.courses).find(function (id) {
        return data.courses[id].name.toLowerCase() === courseName.toLowerCase();
      });
      if (existingId) {
        var updated = JSON.parse(JSON.stringify(data.courses[existingId]));
        updated.tees.push(tee);
        return db.collection('courses').doc(existingId).set(updated);
      }
      return db.collection('courses').doc(uid('c')).set({ name: courseName, tees: [tee] });
    },

    confirmTee: function (courseId, teeIdx, alreadyMine) {
      var me = Store.currentPlayerId();
      var updated = JSON.parse(JSON.stringify(data.courses[courseId]));
      var tee = updated.tees[teeIdx];
      tee.confirmedBy = tee.confirmedBy || [];
      var at = tee.confirmedBy.indexOf(me);
      if (alreadyMine && at >= 0) tee.confirmedBy.splice(at, 1);
      else if (!alreadyMine && at < 0) tee.confirmedBy.push(me);
      return db.collection('courses').doc(courseId).set(updated);
    },

    postRound: function (round) {
      var body = JSON.parse(JSON.stringify(round));
      body.createdAt = new Date().toISOString();
      return db.collection('rounds').doc(uid('r')).set(body);
    },

    deleteRound: function (id) {
      return db.collection('rounds').doc(id).delete();
    }
  };

  global.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);
