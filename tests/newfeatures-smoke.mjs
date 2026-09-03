// Scorecard, round editing, profile editing, onboarding and location.
import { chromium } from 'playwright-core';
import fs from 'fs';
import http from 'http';
const inner = fs.readFileSync('dist/fairway-social.html', 'utf8');
const mock = fs.readFileSync('mockdb.js', 'utf8');
fs.writeFileSync('nf-wrapped.html',
  '<!doctype html><html><head><meta charset="utf-8">' +
  '<style>body{margin:0;font:14px system-ui;background:#faf9f5}</style>' +
  '<' + 'script>' + mock + '</' + 'script></head><body>' + inner + '</body></html>');

// Browsers refuse geolocation on file:// URLs, so serve over localhost.
const html = fs.readFileSync('nf-wrapped.html');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(html);
});
await new Promise(r => server.listen(8250, r));

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
// Ashridge sits at roughly 51.80,-0.58; grant location and place the phone there.
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  permissions: ['geolocation'],
  geolocation: { latitude: 51.8005, longitude: -0.5820 },
  locale: 'en-GB'
});
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_CONNECTION|favicon/i.test(t)) errors.push('console: ' + t); });
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok - ' + m); };

await page.goto('http://localhost:8250/');
await page.waitForSelector('#profileOverlay:not([hidden])');
await page.evaluate(() => {
  const si = [5,11,17,1,7,15,9,3,13,4,16,10,2,8,18,12,6,14];
  window.__mockStore['courses'] = { 'c-ash': { name: 'Ashridge Golf Club', tees: [
    { name: 'White', par: 71, courseRating: 70.1, slopeRating: 127, yards: 6241, confirmedBy: [],
      holes: [4,5,3,4,4,3,5,4,3, 4,3,5,4,4,3,5,4,4].map((p,i)=>({par:p,strokeIndex:si[i]})) }] } };
  window.__mockNotifyAll();
});
await page.fill('#newPlayerName', 'Tom Fletcher');
await page.click('#joinBtn');
await page.waitForSelector('#profileOverlay', { state: 'hidden' });

// ---- onboarding ----
await page.waitForSelector('.start-card');
const start = await page.textContent('.start-card');
ok(/Getting started/.test(start) && /Post a round/.test(start), 'a new member sees getting-started steps');

// ---- post a hole-by-hole round so there is a card to look at ----
await page.click('#fabBtn');
await page.waitForSelector('#entryScreen:not([hidden])');
await page.fill('#entryDate', '2026-07-01');
await page.click('#modeHoles');
await page.waitForSelector('#entryHoles:not([hidden])');
for (let k = 0; k < 18; k++) {
  await page.click(`#holeGrid [data-hole="${k}"]`);
  await page.click('#stepPlus');                       // par
  if (k === 2) { await page.click('#stepPlus'); }      // one bogey on hole 3
}
await page.click('#entrySave');
await page.waitForSelector('#entryScreen', { state: 'hidden', timeout: 15000 });
await page.waitForFunction(() => document.querySelectorAll('#homeRecent .listrow').length === 1);
ok(true, 'hole-by-hole round posted');

// ---- scorecard ----
await page.click('#homeRecent .listrow');
await page.waitForSelector('#roundOverlay:not([hidden])');
ok(!(await page.$eval('#rdCardWrap', e => e.hidden)), 'the round opens a scorecard');
const card = await page.textContent('#rdCard');
ok(/Hole/.test(card) && /Par/.test(card) && /SI/.test(card), 'the card shows hole, par and stroke index rows');
const cells = await page.$$('#rdCard tbody tr:last-child td');
ok(cells.length === 18, 'eighteen scores on the card, got ' + cells.length);
ok((await page.textContent('#rdToPar')) === '+1', 'to-par reads +1 for one bogey, got ' + await page.textContent('#rdToPar'));
ok((await page.textContent('#rdGross')) === '72', 'gross 72 (par 71 plus one), got ' + await page.textContent('#rdGross'));

// ---- edit that round ----
await page.click('#rdEdit');
await page.waitForSelector('#entryScreen:not([hidden])');
ok((await page.textContent('#entryTitle')) === 'Edit round', 'editing opens the entry sheet in edit mode');
await page.click('#holeGrid [data-hole="0"]');
await page.click('#stepPlus');                          // hole 1 becomes a bogey too
await page.click('#entrySave');
await page.waitForSelector('#entryScreen', { state: 'hidden', timeout: 15000 });
await page.waitForFunction(() => document.querySelectorAll('#homeRecent .listrow').length === 1);
ok(true, 'editing replaces the round rather than adding a second');
const rounds = await page.evaluate(() => Object.values(window.__mockStore['rounds']));
ok(rounds.length === 1 && rounds[0].adjustedGross === 73,
   'the edited round stores the new gross of 73, got ' + JSON.stringify(rounds.map(r => r.adjustedGross)));

// ---- profile editing ----
await page.click('.tab[data-nav="me"]');
await page.click('#setProfile');
await page.waitForSelector('#editProfileOverlay:not([hidden])');
await page.fill('#epName', 'Thomas Fletcher');
await page.fill('#epCDH', '401 8823');
await page.click('#epSwatches [data-epcolor="#b3562f"]');
await page.click('#epSave');
await page.waitForFunction(() => document.getElementById('meName').textContent === 'Thomas Fletcher');
ok(true, 'display name, colour and CDH can be edited');
ok((await page.textContent('#meSub')).includes('CDH 401 8823'), 'the CDH shows on the profile');

// ---- location ----
await page.click('.tab[data-nav="courses"]');
await page.click('#nearMeBtn');
// wait past the interim "Finding you…" state for the actual outcome
await page.waitForFunction(
  () => !/Finding/.test(document.getElementById('nearMeStatus').textContent) &&
        document.getElementById('nearMeStatus').textContent.length > 0,
  null, { timeout: 25000 });
const status = await page.textContent('#nearMeStatus');
ok(/Sorted by distance/.test(status), 'near me locates the visitor: ' + status);
ok((await page.getAttribute('#nearMeBtn', 'aria-pressed')) === 'true', 'the near-me toggle stays on');

// standing at Ashridge, the course book should mark it and the + should default there
const book = await page.textContent('#courseBook');
ok(/Ashridge/.test(book), 'the course book still lists the club');
await page.click('#nearMeBtn');
await page.waitForFunction(() => document.getElementById('nearMeStatus').textContent === '');
ok((await page.getAttribute('#nearMeBtn', 'aria-pressed')) === 'false', 'tapping again turns location off');

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('\nNEW FEATURES PASSED');
await browser.close();
server.close();
