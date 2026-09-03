/*
 * Web boot. The shared UI exposes __fairwayBoot(); a real Supabase session
 * decides when to call it and who "me" is.
 *
 * This also handles what email links bring back — a password-recovery link, a
 * confirmed address, or an expired one — because those all land on this page
 * and, left unhandled, would show nothing at all.
 */
(function (global) {
  'use strict';
  var D = global.FairwayData;
  var booted = false;
  var recovering = false;

  function authMsg(text, kind) {
    if (global.FairwayAuthUI) global.FairwayAuthUI.setMsg(text, kind);
  }
  function showAuth(mode, text, kind) {
    global.FairwayAuthUI.show();
    if (mode) global.FairwayAuthUI.setMode(mode);
    if (text) authMsg(text, kind);
  }

  function startApp(session) {
    // A recovery link signs the member in so they can change their password.
    // Hold them on that screen until they have actually set one.
    if (recovering || booted) return;
    D.setMe(session.user.id);
    global.FairwayAuthUI.hide();
    D.loadAll().then(function () {
      D.subscribe();
      booted = true;
      if (typeof global.__fairwayBoot === 'function') global.__fairwayBoot();
    }).catch(function (err) {
      showAuth(null, 'Could not load your clubhouse: ' + (err.message || err) +
        ' — check your connection and try again.', 'bad');
    });
  }

  // Called by the auth UI once a new password has been saved.
  global.FairwayOnPasswordSet = function () {
    recovering = false;
    D.getSession().then(function (r) {
      if (r.data && r.data.session) startApp(r.data.session);
      else showAuth('signin', 'Password saved. Sign in with it now.', 'good');
    });
  };

  /**
   * Read what the email link delivered. Supabase returns either a signed-in
   * session (in the URL hash) or an error describing why it could not.
   */
  function handleLink(fresh) {
    var p = fresh || D.linkParams || {};
    // Tidy the address bar so a refresh does not replay a spent link.
    if ((p.access_token || p.error || p.code) && global.history && global.history.replaceState) {
      global.history.replaceState({}, document.title, global.location.pathname);
    }

    if (p.error || p.error_code) {
      var desc = (p.error_description || p.error_code || p.error).replace(/\+/g, ' ');
      var expired = /expired|invalid/i.test(desc);
      showAuth('signin', expired
        ? 'That link has expired or has already been used. Request a new one below.'
        : 'That link could not be used: ' + desc, 'bad');
      return true;
    }

    if (p.type === 'recovery') {
      recovering = true;
      showAuth('newpassword');
      return true;
    }

    if (p.type === 'signup' || p.type === 'email_change' || p.type === 'magiclink' || p.type === 'invite') {
      // The session that arrives with it signs them in; just say what happened.
      authMsg(p.type === 'signup' ? 'Email confirmed — signing you in…' : 'Signing you in…', 'good');
      return false;
    }
    return false;
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
    var handled = handleLink();

    D.onAuth(function (event, session) {
      if (event === 'SIGNED_OUT') { global.location.reload(); return; }
      if (event === 'PASSWORD_RECOVERY') {
        recovering = true;
        showAuth('newpassword');
        return;
      }
      if (session && session.user) startApp(session);
    });

    D.getSession().then(function (r) {
      if (recovering) return;                       // stay on the new-password screen
      if (r.data && r.data.session) startApp(r.data.session);
      else if (!handled) global.FairwayAuthUI.show();
    }).catch(function (err) {
      showAuth('signin', 'Could not reach the sign-in service: ' + (err.message || err), 'bad');
    });

    // Clicking an email link while the app is already open in that tab is a
    // same-document navigation: the page does not reload, so act on the new
    // hash directly rather than appearing to ignore the link.
    global.addEventListener('hashchange', function () {
      var again = D.readLinkParams();
      if (again.type === 'recovery' || again.error || again.error_code) {
        booted = false;
        handleLink(again);
      }
    });

    // Whatever happens above, never leave the viewer looking at a blank page.
    setTimeout(function () {
      var app = document.getElementById('app');
      var auth = document.getElementById('authScreen');
      if (app && auth && app.hidden && auth.hidden) global.FairwayAuthUI.show();
    }, 4000);
  }

  function boot() {
    try { init(); }
    catch (err) {
      // A failure here used to render nothing at all; show the sign-in screen
      // with the reason instead.
      try {
        showAuth('signin', 'Something went wrong starting the app: ' + (err.message || err), 'bad');
      } catch (e) {
        document.body.innerHTML = '<p style="font:15px/1.6 system-ui;padding:40px">' +
          'Fairway failed to start: ' + String(err && err.message || err) + '</p>';
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
