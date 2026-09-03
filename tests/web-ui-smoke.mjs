// Drives the web app's auth screen and Supabase Store against a stubbed client.
import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = '/home/user/Golf-/web/dist';
const stub = fs.readFileSync('supabase-stub.js', 'utf8');
const server = http.createServer((req, res) => {
  let file = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const p = path.join(ROOT, file);
  if (file === '/vendor/supabase.js') {           // serve the stub in place of the library
    res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(stub); return;
  }
  if (!fs.existsSync(p)) { res.writeHead(404); res.end('nf'); return; }
  const type = p.endsWith('.js') ? 'text/javascript'
    : p.endsWith('.webmanifest') ? 'application/manifest+json' : 'text/html';
  res.writeHead(200, { 'content-type': type });
  res.end(fs.readFileSync(p));
});
await new Promise(r => server.listen(8240, r));
const BASE = 'http://localhost:8240';

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => {
  const t = m.text();
  if (m.type() === 'error' && !/ERR_CONNECTION|favicon|fonts\.googleapis/i.test(t)) errors.push('console: ' + t);
});
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok - ' + m); };

await page.goto(BASE);
await page.waitForSelector('#authScreen:not([hidden])');
ok(true, 'a signed-out visitor gets the sign-in screen, not the app');
ok(await page.$eval('#app', e => e.hidden), 'the app is hidden until signed in');

// wrong password
await page.fill('#authEmail', 'nobody@example.com');
await page.fill('#authPassword', 'whatever');
await page.click('#authSubmit');
await page.waitForFunction(() => document.getElementById('authMsg').textContent.length > 3);
ok(/do not match/i.test(await page.textContent('#authMsg')), 'unknown account gives a plain-English error');

// short password on sign-up
await page.click('#authToSignup');
ok(!(await page.$eval('#authNameField', e => e.hidden)), 'sign-up asks for a display name');
await page.fill('#authName', 'Tom Fletcher');
await page.fill('#authEmail', 'tom@example.com');
await page.fill('#authPassword', '123');
// the field carries minlength=6, so the browser refuses before any request
const blocked = await page.$eval('#authPassword', el => !el.checkValidity());
ok(blocked, 'a too-short password is caught by the form before any request');

// magic link path
await page.click('#authToSignin');
await page.click('#authToLink');
ok(await page.$eval('#authPassField', e => e.hidden), 'the magic-link form hides the password field');
await page.fill('#authEmail', 'tom@example.com');
await page.click('#authSubmit');
await page.waitForFunction(() => /Link sent/i.test(document.getElementById('authMsg').textContent));
ok(true, 'magic link reports that the email was sent');

// rate limit is explained rather than dumped raw
await page.evaluate(() => { window.__stubRateLimit = true; });
await page.click('#authSubmit');
await page.waitForFunction(() => /Too many emails/i.test(document.getElementById('authMsg').textContent));
ok(true, 'an email rate limit is explained in plain English');
await page.evaluate(() => { window.__stubRateLimit = false; });

// reset password path
await page.click('#authToSignin');
await page.click('#authToReset');
await page.fill('#authEmail', 'tom@example.com');
await page.click('#authSubmit');
await page.waitForFunction(() => /Reset link sent/i.test(document.getElementById('authMsg').textContent));
ok(true, 'password reset reports that the email was sent');

// real sign-up -> app opens
await page.click('#authToSignin');
await page.click('#authToSignup');
await page.fill('#authName', 'Tom Fletcher');
await page.fill('#authEmail', 'tom@example.com');
await page.fill('#authPassword', 'fairway-test');
await page.click('#authSubmit');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
ok(true, 'signing up opens the app');
await page.click('.tab[data-nav="me"]');
await page.waitForFunction(() => document.getElementById('meName').textContent === 'Tom Fletcher');
ok(true, 'the profile created by the sign-up trigger drives the UI identity');
ok(!(await page.$('#profileOverlay:not([hidden])')), 'no "who is playing?" picker — identity comes from the account');

// add a course through the Store and check the row shape written
await page.click('.tab[data-nav="courses"]');
await page.fill('#courseSearch', 'hunstanton');
await page.waitForSelector('#dirResultsWrap:not([hidden])');
await page.click('#dirResults .dirrow');
await page.waitForSelector('#courseFormCard:not([hidden])');
await page.fill('#fcTee', 'White');
await page.fill('#fcCR', '72.7');
await page.fill('#fcSR', '130');
await page.click('#fcSave');
await page.waitForFunction(() => document.getElementById('courseBook').textContent.includes('Hunstanton'));
const rows = await page.evaluate(() => ({
  course: window.__stub.tables.courses[0],
  tee: window.__stub.tables.tees[0],
  confirm: window.__stub.tables.tee_confirmations[0]
}));
ok(rows.course && rows.course.name.includes('Hunstanton'), 'a courses row was written');
ok(rows.tee && Number(rows.tee.course_rating) === 72.7 && rows.tee.slope_rating === 130,
   'the tee row carries the scorecard ratings');
ok(rows.confirm && rows.confirm.user_id === rows.tee.created_by,
   'adding a tee records the author as having confirmed it');

// post a round and check the column mapping
await page.click('#courseBook [data-book]');
await page.waitForSelector('.course-sel');
await page.click('#useTeeBtn');
await page.waitForSelector('#screen-home.active');
await page.click('#fabBtn');
await page.fill('#entryDate', '2026-07-01');
await page.fill('#grossInput', '88');
await page.click('#compComp');
await page.click('#entrySave');
await page.waitForSelector('#entryScreen', { state: 'hidden', timeout: 15000 });
const round = await page.evaluate(() => window.__stub.tables.rounds[0]);
ok(round && round.played_on === '2026-07-01' && round.adjusted_gross === 88,
   'the round row maps date and gross correctly');
ok(round.comp_type === 'competition' && round.holes_played === 18 && round.scoring_format === 'strokes',
   'the round row carries format, holes and competition type');
ok(Number(round.differential) === 13.3,
   'the stored differential is (113/130)x(88-72.7) = 13.3, got ' + round.differential);

// 9-hole round writes the unrounded nine differential
await page.click('#fabBtn');
await page.click('#holesSeg [data-holes="front"]');
await page.fill('#entryDate', '2026-07-02');
await page.fill('#grossInput', '45');
await page.click('#entrySave');
await page.waitForSelector('#entryScreen', { state: 'hidden', timeout: 15000 });
const nine = await page.evaluate(() => window.__stub.tables.rounds.find(r => r.holes_played === 9));
ok(nine && nine.nine_of === 'front' && nine.nine_differential > 0,
   'a 9-hole round stores nine_of and the unrounded nine differential');

// sign out returns to the login screen
await page.click('.tab[data-nav="me"]');
await page.click('#switchPlayerBtn');
await page.waitForSelector('#authScreen:not([hidden])', { timeout: 15000 });
ok(true, 'signing out returns to the sign-in screen');

await page.screenshot({ path: 'web-auth.png' });
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('\nWEB UI SMOKE PASSED');
await browser.close();
server.close();
