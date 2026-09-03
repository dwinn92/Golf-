# Fairway — web app (accounts + Supabase)

The deployed app: **https://fairway-clubhouse.netlify.app**

This is the same UI as the artifact build, with real accounts behind it. The
shared UI lives in `artifact/fairway-social.html`; all its data access goes
through a `Store` object that each build supplies:

| Build    | Store implementation              | Identity                        |
| -------- | --------------------------------- | ------------------------------- |
| artifact | `artifact/stores/store-artifact.js` | device picks a member           |
| web      | `web/js/store-supabase.js`          | Supabase session (real account) |

## Build and deploy

```sh
python3 tools/build-web.py          # -> web/dist/
# deploy web/dist as a static site (Netlify, Vercel, GitHub Pages, ...)
```

`web/config.js` holds the project URL and publishable key. That key is meant to
ship in client code — row level security is what protects the data. Copy
`web/config.example.js` if you point this at a different project.

## Supabase project

Project `fairway-golf` (`pcfczfcsousxdytfbisa`, eu-west-2). Schema in
`supabase/migrations/`.

Tables: `profiles`, `courses`, `tees`, `tee_confirmations`, `rounds`,
`round_partners`. Every signed-in member reads the whole clubhouse and writes
only their own rows; a trigger on `auth.users` creates the profile at sign-up.

### Two settings that must be set in the dashboard

The Supabase MCP tools cannot reach auth configuration, so these are manual:

1. **Authentication → URL Configuration**
   - Site URL: `https://fairway-clubhouse.netlify.app`
   - Redirect URLs: add the same origin.
   Without this, magic links and password-reset links bounce to `localhost:3000`
   and the visitor lands on a dead page. Supabase ignores the redirect the app
   asks for unless that origin is in the allow-list, then falls back to Site URL.

2. **Authentication → Sign In / Providers → Email**
   - Turn **Confirm email** off, *or* attach your own SMTP under
     **Project Settings → Authentication → SMTP**.
   The built-in mailer allows only a couple of messages an hour, which throttles
   sign-up confirmations, magic links and password resets. With confirmation off,
   email + password sign-up works instantly and no email is sent.

## What email links do

Password-reset, confirmation and magic links all land back on `/`. The app
reads what they carry before supabase-js clears the URL:

| Link carries        | What happens                                        |
| ------------------- | --------------------------------------------------- |
| `type=recovery`     | the Set a new password screen                        |
| `type=signup`       | "Email confirmed — signing you in…", then the app    |
| `error=...`         | a plain-English reason on the sign-in screen         |

A link clicked while the app is already open in that tab is a hash-only
navigation, so it is handled on `hashchange` too. If anything fails, the
sign-in screen is shown with the reason — the page is never left blank.

## Tests

```sh
node tests/whs.test.js          # 32 handicap engine unit tests
node tests/web-ui-smoke.mjs     # 20 checks: auth screens + Supabase Store wiring
node tests/link-smoke.mjs       # 15 checks: what password-reset and confirmation links do
```

`tests/web-ui-smoke.mjs` serves `web/dist` and swaps `vendor/supabase.js` for
`tests/supabase-stub.js`, so it runs without network access. The row level
security policies were verified separately against the live database by
impersonating two members in Postgres (11 checks, see the commit message).
