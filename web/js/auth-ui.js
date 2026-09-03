/* Sign-in, sign-up, magic link and password reset. */
(function (global) {
  'use strict';
  var D = global.FairwayData;
  var $ = function (id) { return document.getElementById(id); };
  // signin | signup | link | reset | newpassword
  var mode = 'signin';

  function setMode(m) {
    mode = m;
    var isSignup = m === 'signup', isLink = m === 'link', isReset = m === 'reset';
    var isNew = m === 'newpassword';
    $('authTitle').textContent = isSignup ? 'Create your account'
      : isLink ? 'Sign in by email' : isReset ? 'Reset your password'
      : isNew ? 'Set a new password' : 'Sign in';
    $('authSub').textContent = isSignup
      ? 'Your name is what the rest of the clubhouse sees on your rounds.'
      : isLink ? 'We will email you a link that signs you straight in.'
      : isReset ? 'We will email you a link to set a new password.'
      : isNew ? 'Choose a new password and you will be taken straight into the app.'
      : 'Welcome back.';
    // A hidden input still takes part in form validation, so a leftover value
    // (say a 3-character password typed before switching to magic link) would
    // block submission with nothing on screen to explain it. Disable what we
    // hide: disabled controls are exempt from constraint validation.
    $('authNameField').hidden = !isSignup;
    $('authName').disabled = !isSignup;
    $('authEmailField').hidden = isNew;
    $('authEmail').disabled = isNew;
    $('authEmail').required = !isNew;
    $('authPassField').hidden = isLink || isReset;
    $('authPassword').disabled = isLink || isReset;
    $('authPassword').autocomplete = (isSignup || isNew) ? 'new-password' : 'current-password';
    if (isNew) $('authPassField').querySelector('span').textContent = 'New password';
    $('authPass2Field').hidden = !isNew;
    $('authPassword2').disabled = !isNew;
    $('authSubmit').textContent = isSignup ? 'Create account'
      : isLink ? 'Email me a link' : isReset ? 'Send reset link'
      : isNew ? 'Save password and continue' : 'Sign in';
    $('authToSignup').hidden = isSignup || isNew;
    $('authToSignin').hidden = !(isSignup || isLink || isReset);
    $('authToLink').hidden = isLink || isSignup || isReset || isNew;
    $('authToReset').hidden = isReset || isSignup || isLink || isNew;
    setMsg('');
  }
  function setMsg(text, kind) {
    var el = $('authMsg');
    el.textContent = text || '';
    el.className = 'auth-msg' + (kind ? ' ' + kind : '');
  }
  function busy(on) {
    $('authSubmit').disabled = on;
    $('authSubmit').style.opacity = on ? '.6' : '';
  }

  /** Supabase error messages are terse; say what to actually do. */
  function explain(err) {
    var m = (err && err.message) || 'Something went wrong.';
    if (/invalid login credentials/i.test(m)) return 'That email and password do not match an account.';
    if (/email not confirmed/i.test(m)) return 'Check your inbox and confirm your email address first.';
    if (/user already registered/i.test(m)) return 'That email already has an account — sign in instead.';
    if (/password should be at least/i.test(m)) return 'Use a password of at least 6 characters.';
    if (/rate limit|too many/i.test(m)) return 'Too many emails just now. Wait a few minutes and try again.';
    if (/same as the old|should be different/i.test(m)) return 'That is your current password — choose a different one.';
    if (/session|expired|jwt/i.test(m)) return 'That link has expired. Request a new one below.';
    if (/unable to validate email/i.test(m) || /invalid format/i.test(m)) return 'That does not look like an email address.';
    return m;
  }

  function submit(e) {
    e.preventDefault();
    var email = $('authEmail').value.trim();
    var pass = $('authPassword').value;
    var name = $('authName').value.trim();

    if (mode === 'newpassword') {
      if (pass.length < 6) { setMsg('Use a password of at least 6 characters.', 'bad'); return; }
      if (pass !== $('authPassword2').value) { setMsg('Those two passwords do not match.', 'bad'); return; }
      busy(true);
      D.updatePassword(pass).then(function (r) {
        if (r.error) throw r.error;
        setMsg('Password saved. Taking you in…', 'good');
        if (global.FairwayOnPasswordSet) global.FairwayOnPasswordSet();
      }).catch(function (err) { setMsg(explain(err), 'bad'); })
        .then(function () { busy(false); });
      return;
    }

    if (!email) { setMsg('Enter your email address.', 'bad'); return; }
    busy(true);
    var run;
    if (mode === 'signup') {
      if (!name) { busy(false); setMsg('Enter the name your playing partners will see.', 'bad'); return; }
      run = D.signUp(email, pass, name).then(function (r) {
        if (r.error) throw r.error;
        if (r.data.session) return;               // email confirmation off: straight in
        setMode('signin');
        setMsg('Account created. Check your email to confirm, then sign in.', 'good');
      });
    } else if (mode === 'link') {
      run = D.signInWithLink(email).then(function (r) {
        if (r.error) throw r.error;
        setMsg('Link sent — check your inbox on this device.', 'good');
      });
    } else if (mode === 'reset') {
      run = D.resetPassword(email).then(function (r) {
        if (r.error) throw r.error;
        setMsg('Reset link sent — check your inbox.', 'good');
      });
    } else {
      run = D.signIn(email, pass).then(function (r) { if (r.error) throw r.error; });
    }
    run.catch(function (err) { setMsg(explain(err), 'bad'); })
       .then(function () { busy(false); });
  }

  global.FairwayAuthUI = {
    setMode: setMode,
    setMsg: setMsg,
    init: function () {
      $('authForm').addEventListener('submit', submit);
      $('authToSignup').addEventListener('click', function () { setMode('signup'); });
      $('authToSignin').addEventListener('click', function () { setMode('signin'); });
      $('authToLink').addEventListener('click', function () { setMode('link'); });
      $('authToReset').addEventListener('click', function () { setMode('reset'); });
      setMode('signin');
    },
    show: function () { $('authScreen').hidden = false; $('app').hidden = true; },
    hide: function () { $('authScreen').hidden = true; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
