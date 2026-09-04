/* Minimal stand-in for supabase-js: enough surface to drive the web app's
   auth screen and Store without network access. */
(function () {
  const KEY = '__stub_state';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }
  const users = saved.users || {};   // email -> {id, password, name}
  const tables = saved.tables ||
    { profiles: [], courses: [], tees: [], tee_confirmations: [], rounds: [], round_partners: [] };
  let session = saved.session || null;
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify({ users, tables, session })); } catch (e) {} };

  // Stand in for detectSessionInUrl. The real library reads the URL when the
  // client is CREATED, not when the script loads — so this only runs from
  // createClient(). Anything that clears the hash beforehand loses the session,
  // which is precisely the bug this faithfulness exists to catch.
  let recoveryFromHash = false;
  function consumeUrl() {
    const h = (location.hash || '').replace(/^#/, '');
    if (!/access_token=/.test(h)) return;
    const p = new URLSearchParams(h);
    const email = p.get('email') || 'someone@example.com';
    const id = p.get('uid') || 'recovered-user';
    if (!users[email]) users[email] = { id, password: 'old-password', name: 'Recovered User' };
    session = { user: { id: users[email].id, email } };
    if (!window.__stubNoProfile && !tables.profiles.some(r => r.id === session.user.id)) {
      tables.profiles.push({ id: session.user.id, display_name: 'Recovered User',
                             color: '#1F6B4A', cdh: null, home_tee_id: null });
    }
    if (p.get('type') === 'recovery') recoveryFromHash = true;
    // the real library tidies the hash away once it has the tokens
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  }
  const authCbs = [];
  window.__stub = { users, tables, get session() { return session; },
    // let a test place a member in the signed-in state a recovery link creates
    signInAs(email) { const u = users[email]; session = { user: { id: u.id, email } }; } };

  const uuid = () => 'u' + Math.random().toString(36).slice(2, 10);
  const fire = (evt) => authCbs.forEach(cb => cb(evt, session));

  function match(row, filters) {
    return filters.every(f => f.op === 'eq' ? String(row[f.col]) === String(f.val)
      : f.op === 'ilike' ? String(row[f.col]).toLowerCase() === String(f.val).toLowerCase() : true);
  }

  function from(table) {
    const q = { _f: [], _sel: null, _single: false, _limit: null };
    const api = {
      select(cols) { q._sel = cols; return api; },
      eq(col, val) { q._f.push({ col, op: 'eq', val }); return api; },
      ilike(col, val) { q._f.push({ col, op: 'ilike', val: String(val).replace(/%/g, '') }); return api; },
      order() { return api; },
      limit(n) { q._limit = n; return api; },
      single() { q._single = true; return api; },
      insert(rows) {
        const list = Array.isArray(rows) ? rows : [rows];
        const added = list.map(r => {
          const row = Object.assign({ id: uuid() }, r);
          // enforce the RLS rule the real database enforces
          if ((table === 'rounds' && row.user_id !== (session && session.user.id)) ||
              (table === 'tee_confirmations' && row.user_id !== (session && session.user.id))) {
            throw { message: 'new row violates row-level security policy' };
          }
          tables[table].push(row);
          persist();
          return row;
        });
        q._result = added;
        return api;
      },
      update(patch) {
        const hits = tables[table].filter(r => match(r, q._f));
        hits.forEach(r => Object.assign(r, patch));
        q._result = hits;
        return api;
      },
      delete() {
        const hits = tables[table].filter(r => match(r, q._f));
        tables[table] = tables[table].filter(r => !match(r, q._f));
        q._result = hits;
        return api;
      },
      then(res, rej) {
        let out;
        try {
          // Let a test reproduce the clock-skew race: the API rejects the
          // first calls with a token it thinks is from the future, then the
          // same calls succeed.
          if (window.__stubFailSelects > 0 && !q._result) {
            window.__stubFailSelects--;
            return Promise.resolve({ data: null, error: { message: 'JWT issued at future', status: 401 } }).then(res, rej);
          }
          if (q._result) out = q._result;
          else {
            out = tables[table].filter(r => match(r, q._f));
            if (q._limit) out = out.slice(0, q._limit);
          }
          const data = q._single ? out[0] : out;
          return Promise.resolve({ data, error: null }).then(res, rej);
        } catch (e) {
          return Promise.resolve({ data: null, error: e }).then(res, rej);
        }
      }
    };
    return api;
  }

  window.supabase = {
    createClient() {
      consumeUrl();
      return {
        from,
        channel() { return { on() { return this; }, subscribe() { return this; } }; },
        removeChannel() {},
        auth: {
          async signUp({ email, password, options }) {
            if (users[email]) return { data: {}, error: { message: 'User already registered' } };
            if (!password || password.length < 6) return { data: {}, error: { message: 'Password should be at least 6 characters' } };
            const id = uuid();
            const name = (options && options.data && options.data.display_name) || email.split('@')[0];
            users[email] = { id, password, name };
            // the database trigger creates the profile
            tables.profiles.push({ id, display_name: name, color: '#1F6B4A', cdh: null, home_tee_id: null });
            session = { user: { id, email } };
            persist();
            setTimeout(() => fire('SIGNED_IN'), 0);
            return { data: { session, user: session.user }, error: null };
          },
          async signInWithPassword({ email, password }) {
            const u = users[email];
            if (!u || u.password !== password) return { data: {}, error: { message: 'Invalid login credentials' } };
            session = { user: { id: u.id, email } };
            persist();
            setTimeout(() => fire('SIGNED_IN'), 0);
            return { data: { session }, error: null };
          },
          async signInWithOtp({ email }) {
            if (window.__stubRateLimit) return { data: {}, error: { message: 'email rate limit exceeded' } };
            return { data: {}, error: null };
          },
          async resetPasswordForEmail() { return { data: {}, error: null }; },
          async signOut() { session = null; persist(); fire('SIGNED_OUT'); return { error: null }; },
          async updateUser({ password }) {
            if (!session) return { data: {}, error: { message: 'Auth session missing' } };
            const email = Object.keys(users).find(e => users[e].id === session.user.id);
            if (users[email] && users[email].password === password) {
              return { data: {}, error: { message: 'New password should be different from the old password.' } };
            }
            if (users[email]) users[email].password = password;
            persist();
            localStorage.setItem('__stub_pw', password);
            return { data: { user: session.user }, error: null };
          },
          onAuthStateChange(cb) { authCbs.push(cb); if (recoveryFromHash) setTimeout(() => cb('PASSWORD_RECOVERY', session), 0); return { data: { subscription: { unsubscribe() {} } } }; },
          async getSession() { return { data: { session } }; },
          async refreshSession() { window.__stubRefreshes = (window.__stubRefreshes || 0) + 1; return { data: { session }, error: null }; }
        }
      };
    }
  };
})();
