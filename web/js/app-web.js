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
  var starting = false;
  var pendingRecovery = false;

  /**
   * Read the auth hash WITHOUT clearing it.
   *
   * supabase-js consumes the hash itself when the client is created, so
   * clearing it first throws the session away — which is exactly what used to
   * happen: an email link signed you in server-side, then the app dropped the
   * tokens and showed the sign-in screen again. Only `clearAuthHash` below
   * tidies the address bar, and only once the session has been resolved.
   */
  function readAuthHash() {
    var hash = (global.location.hash || '').replace(/^#/, '');
    if (!hash) return {};
    var out = {};
    hash.split('&').forEach(function (pair) {
      var i = pair.indexOf('=');
      if (i > 0) out[decodeURIComponent(pair.slice(0, i))] = decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
    });
    return out;
  }

  /** Tidy the address bar so a refresh cannot replay a token. */
  function clearAuthHash() {
    if (!global.location.hash && !/[?&]code=/.test(global.location.search)) return;
    try {
      global.history.replaceState(null, '', global.location.pathname);
    } catch (e) { global.location.hash = ''; }
  }

  /*
   * The first load after an email link can lose a race with the clock.
   *
   * Auth mints the token on one machine and the API validates it on another;
   * when the API's clock is a fraction of a second behind, the very first REST
   * call comes back "JWT issued at future" and the same call succeeds moments
   * later. Anything transient looks the same from here — a dropped request on
   * a phone leaving the car park, a cold API node — so the answer is the same:
   * wait a moment and ask again rather than throwing away a valid session.
   */
  var RETRY_DELAYS = [400, 1200, 2500, 5000];

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function loadWithRetry(attempt) {
    return D.loadAll().catch(function (err) {
      var offline = global.navigator && global.navigator.onLine === false;
      if (attempt >= RETRY_DELAYS.length || offline) throw err;
      // From the second attempt on, ask for a fresh token as well: it costs
      // one request and covers the case where this one really is unusable.
      var refresh = (attempt >= 1 && D.refreshSession)
        ? D.refreshSession().catch(function () { /* keep the token we have */ })
        : Promise.resolve();
      return refresh
        .then(function () { return wait(RETRY_DELAYS[attempt]); })
        .then(function () { return loadWithRetry(attempt + 1); });
    });
  }

  function startApp(session) {
    // Two callers race here — the auth event and the initial getSession — and
    // a retrying load holds the door open for seconds, so guard both states.
    if (booted || starting) return;
    starting = true;
    D.setMe(session.user.id);
    global.FairwayAuthUI.showLoading();
    loadWithRetry(0).then(function () {
      starting = false;
      D.subscribe();
      booted = true;
      global.FairwayAuthUI.hide();
      document.getElementById('app').hidden = false;
      if (typeof global.__fairwayBoot === 'function') global.__fairwayBoot();
    }).catch(function (err) {
      starting = false;
      // You are signed in — this is a loading failure, not a sign-in one.
      global.FairwayAuthUI.showRetry(
        'Could not load your clubhouse: ' + ((err && err.message) || err) +
        '. You are still signed in — this is usually temporary.',
        function () { startApp(session); });
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

    var hash = readAuthHash();
    var arrivedFromLink = !!(hash.access_token || hash.type || hash.error ||
      /[?&]code=/.test(global.location.search));

    // A link that failed must say why rather than leave a blank page.
    if (hash.error || hash.error_code) {
      clearAuthHash();
      global.FairwayAuthUI.show(
        global.FairwayAuthUI.explainLinkError(hash.error_code || hash.error, hash.error_description));
      return;
    }
    if (hash.type === 'recovery') pendingRecovery = true;

    // Create the client NOW so it reads the tokens out of the URL before
    // anything else touches it.
    D.sb();

    D.onAuth(function (event, session) {
      if (event === 'SIGNED_OUT') { global.location.reload(); return; }
      if (event === 'PASSWORD_RECOVERY') { pendingRecovery = true; global.FairwayAuthUI.showRecovery(); return; }
      if (session && session.user) {
        clearAuthHash();
        if (pendingRecovery) global.FairwayAuthUI.showRecovery();
        else startApp(session);
      }
    });

    D.getSession().then(function (r) {
      var session = r.data && r.data.session;
      clearAuthHash();
      if (session && pendingRecovery) global.FairwayAuthUI.showRecovery();
      else if (session) startApp(session);
      else if (pendingRecovery) {
        global.FairwayAuthUI.show('That reset link could not be read. It may have expired — request a new one below.');
      } else if (arrivedFromLink) {
        // The link was valid enough to reach us but produced no session:
        // usually it was opened in a different browser from the one that
        // asked for it, or it had already been used.
        global.FairwayAuthUI.show(
          'That link did not sign you in. If you opened it in a different browser ' +
          'from the one you signed up in, sign in with your email and password here instead.');
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

  // Cache the app on the device so it opens on a course with no signal.
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    global.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* not fatal */ });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
  } else {
    safeInit();
  }
})(typeof window !== 'undefined' ? window : globalThis);
