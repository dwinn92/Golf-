// The paths an email link can land on: recovery, confirmation, expired, error.
import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = '/home/user/Golf-/web/dist';
const stub = fs.readFileSync('supabase-stub.js', 'utf8');
const server = http.createServer((req, res) => {
  let file = req.url === '/' ? '/index.html' : req.url.split('?')[0].split('#')[0];
  if (file === '/vendor/supabase.js') {
    res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(stub); return;
  }
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) { file = '/index.html'; }      // SPA fallback, like _redirects
  const q = path.join(ROOT, file);
  res.writeHead(200, { 'content-type': q.endsWith('.js') ? 'text/javascript' : 'text/html' });
  res.end(fs.readFileSync(q));
});
await new Promise(r => server.listen(8250, r));
const BASE = 'http://localhost:8250';

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
const notBlank = async (page) => {
  const state = await page.evaluate(() => ({
    app: document.getElementById('app').hidden,
    auth: document.getElementById('authScreen').hidden
  }));
  return !(state.app && state.auth);
};

// ---- 1. expired / already-used link ----
let page = await fresh();
await page.goto(BASE + '/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
await page.waitForSelector('#authScreen:not([hidden])', { timeout: 15000 });
ok(await notBlank(page), 'an expired link does not show a blank page');
ok(/expired or has already been used/i.test(await page.textContent('#authMsg')),
   'an expired link explains itself: ' + (await page.textContent('#authMsg')).slice(0, 60));
ok(!/error=/.test(await page.evaluate(() => location.href)), 'the spent link is cleared from the address bar');

// ---- 2. generic auth error ----
page = await fresh();
await page.goto(BASE + '/#error=server_error&error_description=Database+error+saving+new+user');
await page.waitForSelector('#authScreen:not([hidden])', { timeout: 15000 });
ok(/could not be used/i.test(await page.textContent('#authMsg')), 'an unexpected link error is surfaced, not swallowed');

// ---- 3. password recovery ----
page = await fresh();
await page.goto(BASE);
await page.waitForSelector('#authScreen:not([hidden])');
await page.click('#authToSignup');
await page.fill('#authName', 'Tom Fletcher');
await page.fill('#authEmail', 'tom@example.com');
await page.fill('#authPassword', 'original-pass');
await page.click('#authSubmit');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
// clicking a reset link in the same tab: a hash-only change, no page reload
await page.evaluate(() => { location.hash = 'access_token=tok&refresh_token=r&type=recovery'; });
await page.waitForSelector('#authScreen:not([hidden])', { timeout: 15000 });
ok(true, 'a reset link opened in the same tab is acted on without a reload');
// and again as a fresh page load, the way an email client opens it
await page.goto('about:blank');
await page.goto(BASE + '/#access_token=tok&refresh_token=r&type=recovery');
await page.waitForSelector('#authScreen:not([hidden])', { timeout: 15000 });
ok(await notBlank(page), 'a recovery link does not show a blank page');
ok((await page.textContent('#authTitle')) === 'Set a new password', 'a recovery link opens the set-password screen');
ok(!(await page.$eval('#authPass2Field', e => e.hidden)), 'it asks for the password twice');
ok(await page.$eval('#authEmailField', e => e.hidden), 'it does not ask for the email again');

await page.fill('#authPassword', 'brand-new-pass');
await page.fill('#authPassword2', 'different-pass');
await page.click('#authSubmit');
await page.waitForFunction(() => /do not match/i.test(document.getElementById('authMsg').textContent));
ok(true, 'mismatched passwords are caught before saving');

await page.fill('#authPassword2', 'brand-new-pass');
await page.click('#authSubmit');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
ok(true, 'saving the new password takes you into the app');
const saved = await page.evaluate(() => localStorage.getItem('__stub_pw'));
ok(saved === 'brand-new-pass', 'the new password reached Supabase, got ' + saved);

// ---- 4. reusing the old password is refused clearly ----
page = await fresh();
await page.goto(BASE);
await page.waitForSelector('#authScreen:not([hidden])');
await page.click('#authToSignup');
await page.fill('#authName', 'Amy Patel');
await page.fill('#authEmail', 'amy@example.com');
await page.fill('#authPassword', 'same-old-pass');
await page.click('#authSubmit');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await page.goto('about:blank');
await page.goto(BASE + '/#access_token=tok&type=recovery');
await page.waitForSelector('#authScreen:not([hidden])', { timeout: 15000 });
await page.fill('#authPassword', 'same-old-pass');
await page.fill('#authPassword2', 'same-old-pass');
await page.click('#authSubmit');
await page.waitForFunction(() => /current password/i.test(document.getElementById('authMsg').textContent));
ok(true, 'reusing the current password is explained in plain English');

// ---- 5. email confirmation return ----
page = await fresh();
await page.goto(BASE);
await page.waitForSelector('#authScreen:not([hidden])');
await page.click('#authToSignup');
await page.fill('#authName', 'Sam Reed');
await page.fill('#authEmail', 'sam@example.com');
await page.fill('#authPassword', 'sam-pass-1');
await page.click('#authSubmit');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await page.goto('about:blank');
await page.goto(BASE + '/#access_token=tok&refresh_token=r&type=signup');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
ok(await notBlank(page), 'a confirmation link does not show a blank page');
ok(!/access_token/.test(await page.evaluate(() => location.href)), 'the confirmation token is cleared from the address bar');

// ---- 6. a deep path still serves the app (SPA fallback) ----
page = await fresh();
await page.goto(BASE + '/some/deep/path');
await page.waitForSelector('#authScreen:not([hidden])', { timeout: 15000 });
ok(true, 'an unknown path still serves the app rather than a 404');

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('\nLINK SMOKE PASSED');
await browser.close();
server.close();
