/* Minimal stand-in for supabase-js: enough surface to drive the web app's
   auth screen and Store without network access. */
(function () {
  const KEY = '__stub_state';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }
  const users = saved.users || {};   // email -> {id, password, name}
  const tables = saved.tables ||
    { profiles: [], courses: [], tees: [], tee_confirmations: [], rounds: [], round_partners: [],
      clubs: [], club_members: [], notifications: [], card_offers: [] };
  // a state file written before these tables existed must not break the app
  ['clubs', 'club_members', 'notifications', 'card_offers'].forEach(t => { if (!tables[t]) tables[t] = []; });
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
                             color: '#1F6B4A', cdh: null, home_tee_id: null, target_index: null });
      newClubFor(session.user.id, 'Recovered User');
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
  const inviteCode = () => {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () => a[Math.floor(Math.random() * a.length)]).join('');
  };
  // mirrors handle_new_user(): every member starts in a clubhouse of their own
  function newClubFor(userId, name) {
    const club = { id: uuid(), name: name + "'s clubhouse", invite_code: inviteCode(), created_by: userId };
    tables.clubs.push(club);
    tables.club_members.push({ club_id: club.id, user_id: userId, role: 'owner', joined_at: new Date().toISOString() });
    return club;
  }
  const myClubIds = () => tables.club_members
    .filter(m => session && m.user_id === session.user.id).map(m => m.club_id);
  const sharesClub = (target) => {
    if (!session) return false;
    if (target === session.user.id) return true;
    const mine = myClubIds();
    return tables.club_members.some(m => m.user_id === target && mine.indexOf(m.club_id) >= 0);
  };
  // The real database applies RLS to every read; the stub must too, or a test
  // would pass here on rows Postgres would never have returned.
  function visible(table, row) {
    switch (table) {
      case 'profiles': return sharesClub(row.id);
      case 'rounds': return sharesClub(row.user_id);
      case 'round_partners': {
        const r = tables.rounds.find(x => x.id === row.round_id);
        return !!r && sharesClub(r.user_id);
      }
      case 'clubs': return myClubIds().indexOf(row.id) >= 0;
      case 'club_members': return myClubIds().indexOf(row.club_id) >= 0;
      case 'notifications': return !!session && row.user_id === session.user.id;
      case 'card_offers': return !!session && (row.to_user === session.user.id || row.from_user === session.user.id);
      default: return true;
    }
  }
  const fire = (evt) => authCbs.forEach(cb => cb(evt, session));

  function match(row, filters) {
    return filters.every(f => f.op === 'eq' ? String(row[f.col]) === String(f.val)
      : f.op === 'in' ? f.val.map(String).indexOf(String(row[f.col])) >= 0
      : f.op === 'ilike' ? String(row[f.col]).toLowerCase() === String(f.val).toLowerCase() : true);
  }

  function from(table) {
    const q = { _f: [], _sel: null, _single: false, _limit: null };
    const api = {
      select(cols) { q._sel = cols; return api; },
      eq(col, val) { q._f.push({ col, op: 'eq', val }); return api; },
      in(col, vals) { q._f.push({ col, op: 'in', val: vals }); return api; },
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
              (table === 'tee_confirmations' && row.user_id !== (session && session.user.id)) ||
              (table === 'notifications') ||
              (table === 'club_members') ||
              (table === 'card_offers' && (row.from_user !== (session && session.user.id) ||
                                           !sharesClub(row.to_user) ||
                                           row.to_user === row.from_user))) {
            throw { message: 'new row violates row-level security policy' };
          }
          if (table === 'card_offers') {
            row.status = row.status || 'pending';
            row.created_at = new Date().toISOString();
            tables.notifications.push({ id: uuid(), user_id: row.to_user, kind: 'card_offer', actor_id: row.from_user,
              round_id: null, offer_id: row.id, body: 'kept your card', read_at: null, created_at: new Date().toISOString() });
          }
          if (table === 'rounds') {
            // the notify_round_posted trigger
            const mine = tables.club_members.filter(m => m.user_id === row.user_id).map(m => m.club_id);
            const seen = {};
            tables.club_members.forEach(m => {
              if (mine.indexOf(m.club_id) < 0 || m.user_id === row.user_id || seen[m.user_id]) return;
              seen[m.user_id] = true;
              tables.notifications.push({ id: uuid(), user_id: m.user_id, kind: 'round_posted', actor_id: row.user_id,
                round_id: row.id, offer_id: null, body: 'posted a round', read_at: null, created_at: new Date().toISOString() });
            });
          }
          if (table === 'round_partners') {
            // notify_partner_tagged upgrades the notice instead of adding one
            const r = tables.rounds.find(x => x.id === row.round_id);
            const hit = tables.notifications.find(n => n.round_id === row.round_id && n.user_id === row.partner_id && n.kind === 'round_posted');
            if (hit) { hit.kind = 'tagged'; hit.body = 'played with you — confirm their card'; }
            else if (r && r.user_id !== row.partner_id) {
              tables.notifications.push({ id: uuid(), user_id: row.partner_id, kind: 'tagged', actor_id: r.user_id,
                round_id: r.id, offer_id: null, body: 'played with you — confirm their card', read_at: null,
                created_at: new Date().toISOString() });
            }
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
            out = tables[table].filter(r => visible(table, r) && match(r, q._f));
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
        // Mirrors the security-definer functions, including who they refuse.
        rpc(name, args) {
          args = args || {};
          const me = session && session.user.id;
          const err = (message) => Promise.resolve({ data: null, error: { message } });
          if (!me) return err('not signed in');
          if (name === 'create_club') {
            const club = { id: uuid(), name: String(args.club_name).trim(), invite_code: inviteCode(), created_by: me };
            tables.clubs.push(club);
            tables.club_members.push({ club_id: club.id, user_id: me, role: 'owner', joined_at: new Date().toISOString() });
            persist();
            return Promise.resolve({ data: club, error: null });
          }
          if (name === 'join_club_by_code') {
            const club = tables.clubs.find(c => c.invite_code === String(args.code || '').trim().toUpperCase());
            if (!club) return err('no_such_code');
            if (!tables.club_members.some(m => m.club_id === club.id && m.user_id === me)) {
              tables.club_members.push({ club_id: club.id, user_id: me, role: 'member', joined_at: new Date().toISOString() });
            }
            persist();
            return Promise.resolve({ data: club, error: null });
          }
          if (name === 'leave_club') {
            const others = tables.club_members.filter(m => m.club_id === args.target_club && m.user_id !== me);
            if (others.length && !others.some(m => m.role === 'owner')) others[0].role = 'owner';
            tables.club_members = tables.club_members.filter(m => !(m.club_id === args.target_club && m.user_id === me));
            if (!tables.club_members.some(m => m.club_id === args.target_club)) {
              tables.clubs = tables.clubs.filter(c => c.id !== args.target_club);   // the reaper trigger
            }
            persist();
            return Promise.resolve({ data: null, error: null });
          }
          if (name === 'attest_round') {
            const r = tables.rounds.find(x => x.id === args.target_round);
            if (!r) return err('no_such_round');
            if (r.user_id === me) return err('cannot attest your own card');
            if (!tables.round_partners.some(p2 => p2.round_id === r.id && p2.partner_id === me)) return err('not_a_marker');
            if (args.on_off === false) { r.attested_by = null; r.attested_at = null; }
            else {
              r.attested_by = me;
              r.attested_at = new Date().toISOString();
              tables.notifications.push({ id: uuid(), user_id: r.user_id, kind: 'attested', actor_id: me,
                round_id: r.id, offer_id: null, body: 'confirmed your card', read_at: null,
                created_at: new Date().toISOString() });
            }
            persist();
            return Promise.resolve({ data: null, error: null });
          }
          if (name === 'delete_my_account') {
            const email = Object.keys(users).find(e => users[e].id === me);
            tables.rounds = tables.rounds.filter(r => r.user_id !== me);
            tables.profiles = tables.profiles.filter(r => r.id !== me);
            tables.club_members = tables.club_members.filter(m => m.user_id !== me);
            tables.clubs = tables.clubs.filter(c => tables.club_members.some(m => m.club_id === c.id));
            tables.notifications = tables.notifications.filter(n => n.user_id !== me && n.actor_id !== me);
            tables.card_offers = tables.card_offers.filter(o => o.from_user !== me && o.to_user !== me);
            if (email) delete users[email];
            persist();
            return Promise.resolve({ data: null, error: null });
          }
          return err('unknown function ' + name);
        },
        storage: {
          from() {
            return {
              async upload(path) { window.__stubUploads = (window.__stubUploads || []).concat(path); return { data: { path }, error: null }; },
              async createSignedUrl(path) { return { data: { signedUrl: 'blob:stub/' + path }, error: null }; }
            };
          }
        },
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
            tables.profiles.push({ id, display_name: name, color: '#1F6B4A', cdh: null, home_tee_id: null, target_index: null });
            newClubFor(id, name);
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
