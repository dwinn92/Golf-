/*
 * Web boot. The shared UI exposes __fairwayBoot(); here a real Supabase
 * session decides when to call it and who "me" is, so a member can only ever
 * write as themselves.
 *
 * This also owns what happens when someone arrives from an email link, which
 * lands them on the site with the outcome in the URL hash:
 *   #access_token=...&type=recovery   -> ask for a new password
 *   #access_token=...&type=magiclink  -> straight into the app
 *   #error=access_denied&error_code=otp_expired&... -> explain, don't blank
 */
(function (global) {
  'use strict';
  var D = global.FairwayData;
  var booted = false;
  var pendingRecovery = false;

  /** Read and clear the auth hash so a refresh cannot replay it. */
  function takeAuthHash() {
    var hash = (global.location.hash || '').replace(/^#/, '');
    if (!hash) return {};
    var out = {};
    hash.split('&').forEach(function (pair) {
      var i = pair.indexOf('=');
      if (i > 0) out[decodeURIComponent(pair.slice(0, i))] = decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
    });
    if (out.access_token || out.error || out.error_code || out.type) {
      // supabase-js has already consumed the tokens by this point
      try {
        global.history.replaceState(null, '', global.location.pathname + global.location.search);
      } catch (e) { global.location.hash = ''; }
    }
    return out;
  }

  function startApp(session) {
    if (booted) return;
    D.setMe(session.user.id);
    global.FairwayAuthUI.hide();
    D.loadAll().then(function () {
      D.subscribe();
      booted = true;
      document.getElementById('app').hidden = false;
      if (typeof global.__fairwayBoot === 'function') global.__fairwayBoot();
    }).catch(function (err) {
      global.FairwayAuthUI.show('Could not load your clubhouse: ' + (err.message || err));
    });
  }

  /** Called by the recovery screen once the password is saved (or skipped). */
  global.FairwayRecovered = function () {
    pendingRecovery = false;
    D.getSession().then(function (r) {
      if (r.data && r.data.session) startApp(r.data.session);
      else global.FairwayAuthUI.show('Password saved — sign in with it now.', 'good');
    });
  };

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

    var hash = takeAuthHash();

    // A link that failed must say why rather than leave a blank page.
    if (hash.error || hash.error_code) {
      global.FairwayAuthUI.show(
        global.FairwayAuthUI.explainLinkError(hash.error_code || hash.error, hash.error_description));
      return;
    }
    if (hash.type === 'recovery') pendingRecovery = true;

    D.onAuth(function (event, session) {
      if (event === 'SIGNED_OUT') { global.location.reload(); return; }
      if (event === 'PASSWORD_RECOVERY') { pendingRecovery = true; global.FairwayAuthUI.showRecovery(); return; }
      if (session && session.user) {
        if (pendingRecovery) global.FairwayAuthUI.showRecovery();
        else startApp(session);
      }
    });

    D.getSession().then(function (r) {
      var session = r.data && r.data.session;
      if (session && pendingRecovery) global.FairwayAuthUI.showRecovery();
      else if (session) startApp(session);
      else if (pendingRecovery) {
        global.FairwayAuthUI.show('That reset link could not be read. Request a new one below.');
      } else {
        global.FairwayAuthUI.show();
      }
    }).catch(function () {
      global.FairwayAuthUI.show('Could not reach the server. Check your connection and try again.');
    });
  }

  function safeInit() {
    // Whatever happens, the visitor must never be left looking at a blank page.
    try {
      init();
    } catch (err) {
      try {
        global.FairwayAuthUI.show('Something went wrong starting the app: ' + (err.message || err));
      } catch (e) {
        document.body.innerHTML =
          '<p style="font:15px/1.6 system-ui;padding:40px;max-width:34em;margin:auto">' +
          'Fairway could not start: ' + String(err && err.message || err) + '</p>';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
  } else {
    safeInit();
  }
})(typeof window !== 'undefined' ? window : globalThis);
