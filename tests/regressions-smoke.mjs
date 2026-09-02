// Regressions for review fixes: draft/course binding, back-dated 9-hole
// differentials, and net results using the handicap in force on the day.
import { chromium } from 'playwright-core';
import fs from 'fs';
const inner = fs.readFileSync('dist/fairway-social.html', 'utf8');
const mock = fs.readFileSync('mockdb.js', 'utf8');
fs.writeFileSync('reg-wrapped.html',
  '<!doctype html><html><head><meta charset="utf-8">' +
  '<style>body{margin:0;font:14px system-ui;background:#faf9f5}</style>' +
  '<' + 'script>' + mock + '</' + 'script></head><body>' + inner + '</body></html>');

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_CONNECTION')) errors.push('console: ' + m.text()); });
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok - ' + m); };

await page.goto('file://' + process.cwd() + '/reg-wrapped.html');
await page.waitForSelector('#profileOverlay:not([hidden])');
await page.evaluate(() => {
  const si = [5,11,17,1,7,15,9,3,13,4,16,10,2,8,18,12,6,14];
  window.__mockStore['courses'] = {
    'c-a': { name: 'Alpha Links', tees: [{ name: 'White', par: 71, courseRating: 70.1, slopeRating: 127,
      holes: [4,5,3,4,4,3,5,4,3, 4,3,5,4,4,3,5,4,4].map((p,i)=>({par:p,strokeIndex:si[i]})) }] },
    'c-b': { name: 'Bravo Park', tees: [{ name: 'Blue', par: 70, courseRating: 68.4, slopeRating: 113,
      holes: [3,4,4,5,4,3,4,4,4, 4,4,3,5,4,4,3,4,4].map((p,i)=>({par:p,strokeIndex:si[i]})) }] }
  };
  window.__mockNotifyAll();
});
await page.fill('#newPlayerName', 'Tom Fletcher');
await page.click('#joinBtn');
await page.waitForSelector('#profileOverlay', { state: 'hidden' });

// ---- A. a draft stays bound to the course it was started on ----
await page.click('#fabBtn');
await page.waitForSelector('#entryScreen:not([hidden])');
await page.click('#entryCtx');                      // pick Alpha Links explicitly
await page.waitForSelector('#teePickOverlay:not([hidden])');
await page.click('[data-pickcourse="c-a"][data-picktee="0"]');
await page.click('#modeHoles');
await page.waitForSelector('#entryHoles:not([hidden])');
await page.click('#stepPlus');                      // score hole 1 at par (4 on Alpha)
await page.click('#entryCancel');                   // leave as a draft
await page.waitForSelector('#entryScreen', { state: 'hidden' });

// switch the selected course to Bravo, as if planning a different round
await page.click('#phChange').catch(() => {});
await page.click('.tab[data-nav="courses"]');
await page.click('#courseBook [data-book="c-b"]');
await page.waitForSelector('.course-sel');
await page.click('#useTeeBtn');
await page.waitForSelector('#screen-home.active');

await page.click('#fabBtn');                        // resume via the + button
await page.waitForSelector('#entryScreen:not([hidden])');
ok((await page.textContent('#ctxName')).includes('Alpha'),
   'tapping + resumes the draft on its own course, got ' + await page.textContent('#ctxName'));
ok((await page.textContent('#hcFacts')).includes('PAR 4'),
   'hole card shows the drafted course pars, not the newly selected course');
await page.click('#entryCancel');

// ---- B/C. a back-dated 9-hole round is shown at the record's value ----
await page.evaluate(() => { localStorage.removeItem('fairway.draft'); });
await page.reload();
await page.waitForSelector('#app:not([hidden])');
const me = await page.evaluate(() => localStorage.getItem('fairway.social.profile'));
await page.evaluate((me) => {
  const mk = (d, ags) => ({ playerId: me, date: d, courseName: 'Alpha Links', teeName: 'White',
    courseRating: 70.1, slopeRating: 127, par: 71, pcc: 0, adjustedGross: ags,
    differential: Math.round((113/127)*(ags-70.1)*10)/10, playedWith: [], compType: 'general',
    holesPlayed: 18, scoringFormat: 'strokes' });
  window.__mockStore['rounds'] = {
    r1: mk('2026-06-01', 95), r2: mk('2026-06-08', 96), r3: mk('2026-06-15', 97),
    // a 9-hole round back-dated to the start, POSTED with a stale differential
    // (as if computed against a much later index)
    r0: { playerId: me, date: '2026-05-01', courseName: 'Alpha Links', teeName: 'White',
          courseRating: 35.1, slopeRating: 127, par: 35, pcc: 0, adjustedGross: 44,
          nineDifferential: (113/127)*(44-35.1), differential: 99.9,
          playedWith: [], compType: 'general', holesPlayed: 9, nineOf: 'front',
          scoringFormat: 'strokes' }
  };
  window.__mockNotifyAll();
}, me);
await page.click('.tab[data-nav="rounds"]');
await page.waitForFunction(() => document.querySelectorAll('#historyList .listrow').length === 4);
const rows = await page.textContent('#historyList');
ok(!rows.includes('99.9'), 'the stale post-time differential is not shown');
// earliest round, no prior index -> the 9 mirrors itself: 2 x 7.9189 = 15.8
ok(rows.includes('15.8'), 'back-dated 9-hole shows the record-recomputed 15.8, got: ' +
   rows.replace(/\s+/g, ' ').slice(0, 140));

// ---- net results use the index in force on the day ----
await page.evaluate((me) => {
  window.__mockStore['players']['p-amy'] = { name: 'Amy Patel', color: '#3a6ea5' };
  const mk = (pid, d, ags, w) => ({ playerId: pid, date: d, courseName: 'Alpha Links', teeName: 'White',
    courseRating: 70.1, slopeRating: 127, par: 71, pcc: 0, adjustedGross: ags,
    differential: Math.round((113/127)*(ags-70.1)*10)/10, playedWith: w||[], compType: 'general',
    holesPlayed: 18, scoringFormat: 'strokes' });
  const s = window.__mockStore['rounds'];
  s.r3.playedWith = ['p-amy'];
  s.a1 = mk('p-amy', '2026-06-01', 92); s.a2 = mk('p-amy', '2026-06-08', 91);
  s.a3 = mk('p-amy', '2026-06-15', 90, [me]);
  window.__mockNotifyAll();
}, me);
await page.click('#segResults');
await page.waitForFunction(() => document.querySelectorAll('#groupList .listrow').length >= 2);
const board = await page.textContent('#groupList');
ok(/C\.H'CAP \d/.test(board), 'group leaderboard shows the course handicap used: ' +
   board.replace(/\s+/g, ' ').slice(0, 120));
ok((await page.textContent('#h2hList')).includes('Amy Patel'), 'head-to-head lists the opponent');

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('\nREGRESSIONS PASSED');
await browser.close();
