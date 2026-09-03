/*
 * Web boot. The shared UI exposes __fairwayBoot(); here a real Supabase
 * session decides when to call it and who "me" is, so a member can only ever
 * write as themselves.
 */
(function (global) {
  'use strict';
  var D = global.FairwayData;
  var booted = false;

  function startApp(session) {
    if (booted) return;
    D.setMe(session.user.id);
    global.FairwayAuthUI.hide();
    // Make sure the clubhouse is loaded before the UI renders from it.
    D.loadAll().then(function () {
      D.subscribe();
      booted = true;
      if (typeof global.__fairwayBoot === 'function') global.__fairwayBoot();
    }).catch(function (err) {
      global.FairwayAuthUI.show();
      var msg = document.getElementById('authMsg');
      if (msg) {
        msg.textContent = 'Could not load your clubhouse: ' + (err.message || err);
        msg.className = 'auth-msg bad';
      }
    });
  }

  function init() {
    if (!D.configured) {
      document.body.innerHTML =
        '<p style="font:15px/1.6 system-ui;padding:40px;max-width:34em;margin:auto">' +
        'This build has no Supabase configuration. Copy <code>web/config.example.js</code> ' +
        'to <code>web/config.js</code>, fill in your project URL and publishable key, ' +
        'and rebuild with <code>python3 tools/build-web.py</code>.</p>';
      return;
    }
    global.FairwayAuthUI.init();

    D.onAuth(function (event, session) {
      if (event === 'SIGNED_OUT') {
        // Reload rather than unpick a signed-in session's state in place — the
        // next person to sign in on this device must start clean.
        global.location.reload();
        return;
      }
      if (session && session.user) startApp(session);
    });

    D.getSession().then(function (r) {
      if (r.data && r.data.session) startApp(r.data.session);
      else global.FairwayAuthUI.show();
    }).catch(function () { global.FairwayAuthUI.show(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
