// Every way a visitor can arrive from an email link, plus failure paths.
import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = '/home/user/Golf-/web/dist';
const stub = fs.readFileSync('supabase-stub.js', 'utf8');
const server = http.createServer((req, res) => {
  const file = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  if (file === '/vendor/supabase.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(stub); return; }
  // mirror web/dist/_redirects: unknown paths serve the app, as Netlify does
  let p = path.join(ROOT, file);
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(ROOT, 'index.html');
  res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
  res.end(fs.readFileSync(p));
});
await new Promise(r => server.listen(8241, r));
const BASE = 'http://localhost:8241';

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok - ' + m); };

async function fresh() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' && !/ERR_CONNECTION|favicon|fonts\.googleapis/i.test(t)) errors.push('console: ' + t);
  });
  return page;
}
const visible = (page, sel) => page.$eval(sel, e => !e.hidden).catch(() => false);

// ---- 1. reset link -> set a new password ----
let page = await fresh();
await page.goto(BASE + '/#access_token=tok&refresh_token=r&type=recovery&uid=u-dan&email=dan@example.com');
await page.waitForSelector('#recoverScreen:not([hidden])', { timeout: 15000 });
ok(true, 'a reset link opens the "set a new password" screen');
ok(!(await visible(page, '#app')), 'the app stays closed until the password is set');
ok(!/access_token/.test(page.url()), 'the token is stripped from the address bar: ' + page.url());

await page.fill('#recoverPassword', 'brand-new-pass');
await page.fill('#recoverPassword2', 'different-pass');
await page.click('#recoverSubmit');
await page.waitForFunction(() => /different/i.test(document.getElementById('recoverMsg').textContent));
ok(true, 'mismatched passwords are refused with an explanation');

await page.fill('#recoverPassword2', 'brand-new-pass');
await page.click('#recoverSubmit');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
ok(true, 'saving the new password signs you into the app');
const saved = await page.evaluate(() => Object.values(window.__stub.users)[0].password);
ok(saved === 'brand-new-pass', 'the new password was actually stored');

// ---- 2. reset link, but skip ----
page = await fresh();
await page.goto(BASE + '/#access_token=tok&type=recovery&uid=u-dan&email=dan@example.com');
await page.waitForSelector('#recoverScreen:not([hidden])');
await page.click('#recoverSkip');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
ok(true, '"skip" takes you into the app with the old password intact');

// ---- 3. magic link / confirmed email -> straight in ----
page = await fresh();
await page.goto(BASE + '/#access_token=tok&refresh_token=r&type=magiclink&uid=u-dan&email=dan@example.com');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
ok(true, 'a magic link signs you straight into the app');
ok(!(await visible(page, '#recoverScreen')), 'a magic link does not ask for a new password');
ok(!/access_token/.test(page.url()), 'the magic-link token is stripped from the address bar');

// ---- 4. expired link -> explained, never blank ----
page = await fresh();
await page.goto(BASE + '/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
await page.waitForSelector('#authScreen:not([hidden])', { timeout: 15000 });
const msg = await page.textContent('#authMsg');
ok(/expired/i.test(msg), 'an expired link explains itself: "' + msg + '"');
ok(!(await visible(page, '#app')), 'an expired link does not open the app');

// ---- 5. a deep path still serves the app (SPA routing) ----
page = await fresh();
await page.goto(BASE + '/reset-password');
await page.waitForSelector('#authScreen:not([hidden])', { timeout: 15000 });
ok(true, 'an unknown path still serves the app rather than a 404');

// ---- 6. a failure during load never leaves a blank page ----
page = await fresh();
await page.addInitScript(() => { window.__stubNoProfile = true; });
await page.goto(BASE + '/#access_token=tok&type=magiclink&uid=u-ghost&email=ghost@example.com');
await page.waitForFunction(() => {
  const a = document.getElementById('authScreen'), r = document.getElementById('recoverScreen'), p = document.getElementById('app');
  return !a.hidden || !r.hidden || !p.hidden;
}, null, { timeout: 15000 });
ok(true, 'a member with no profile row still lands on a visible screen, not a blank page');

// ---- 7. signed-out visitor ----
page = await fresh();
await page.goto(BASE);
await page.waitForSelector('#authScreen:not([hidden])');
ok(!(await visible(page, '#recoverScreen')), 'a normal visit shows sign-in only');

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('\nAUTH FLOWS PASSED');
await browser.close();
server.close();
