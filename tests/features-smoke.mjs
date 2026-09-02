// Covers the seven new features at a 390px mobile viewport.
import { chromium } from 'playwright-core';
import fs from 'fs';
const inner = fs.readFileSync('dist/fairway-social.html', 'utf8');
const mock = fs.readFileSync('mockdb.js', 'utf8');
fs.writeFileSync('feat-wrapped.html',
  '<!doctype html><html><head><meta charset="utf-8">' +
  '<style>body{margin:0;font:14px system-ui;background:#faf9f5}</style>' +
  '<' + 'script>' + mock + '</' + 'script></head><body>' + inner + '</body></html>');

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_CONNECTION')) errors.push('console: ' + m.text()); });
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok - ' + m); };

const seed = () => page.evaluate(() => {
  window.__mockStore['courses'] = { 'c-ash': { name: 'Ashridge Golf Club', tees: [
    { name: 'Yellow', par: 71, courseRating: 70.1, slopeRating: 127, yards: 6241, confirmedBy: [],
      holes: [4,5,3,4,4,3,5,4,3, 4,3,5,4,4,3,5,4,4].map((p,i)=>({par:p,strokeIndex:[5,11,17,1,7,15,9,3,13,4,16,10,2,8,18,12,6,14][i]})) }
  ] } };
  window.__mockStore['players'] = { 'p-amy': { name: 'Amy Patel', color: '#3a6ea5' } };
  window.__mockNotifyAll();
});

await page.goto('file://' + process.cwd() + '/feat-wrapped.html');
await page.waitForSelector('#profileOverlay:not([hidden])');
await seed();
await page.fill('#newPlayerName', 'Tom Fletcher');
await page.click('#joinBtn');
await page.waitForSelector('#profileOverlay', { state: 'hidden' });

// three 18-hole rounds to establish an index
for (const [d, g] of [['2026-07-01', 84], ['2026-07-02', 88], ['2026-07-03', 90]]) {
  await page.click('#fabBtn');
  await page.fill('#entryDate', d);
  await page.fill('#grossInput', String(g));
  await page.click('#entrySave');
  await page.waitForSelector('#entryScreen', { state: 'hidden' });
}
// diffs: (113/127)*(84-70.1)=12.4, 88->15.9, 90->17.7 ; HI = 12.4-2 = 10.4
await page.waitForFunction(() => document.getElementById('heroIndex').textContent === '10.4');
ok(true, 'index established at 10.4 from three 18-hole rounds');

// ---- 1. NINE-HOLE ENTRY ----
await page.click('#fabBtn');
await page.click('#holesSeg [data-holes="front"]');
await page.waitForFunction(() => document.getElementById('ctxMeta').textContent.includes('FRONT 9'));
const ctx = await page.textContent('#ctxMeta');
ok(ctx.includes('CR 35.1') && ctx.includes('PAR 35') && ctx.includes('EST'), 'front 9 uses halved CR, real par, flagged EST: ' + ctx);
await page.fill('#entryDate', '2026-07-05');
await page.fill('#grossInput', '44');
await page.waitForFunction(() => document.getElementById('gcDiff').textContent !== '–');
const nineDiff = await page.textContent('#gcDiff');
// 9-hole SD = (113/127)*(44-35.1) = 7.9189; expected for HI 10.4 = 6.7 -> 14.6
ok(nineDiff === '14.6', '9-hole scales to an 18-hole differential of 14.6, got ' + nineDiff);
await page.click('#entrySave');
await page.waitForSelector('#entryScreen', { state: 'hidden' });
await page.click('.tab[data-nav="rounds"]');
await page.waitForFunction(() => document.querySelectorAll('#historyList .listrow').length === 4);
ok((await page.textContent('#historyList')).includes('FRONT 9'), '9-hole round labelled in history');

// ---- 2. STABLEFORD ----
await page.click('#fabBtn');
await page.click('#modeStableford');
await page.waitForSelector('#entryStableford:not([hidden])');
await page.fill('#entryDate', '2026-07-06');
await page.fill('#pointsInput', '36');
await page.waitForFunction(() => document.getElementById('sfGross').textContent !== '–');
const ph = await page.textContent('#sfPH');
const sfGross = await page.textContent('#sfGross');
// after the 9-hole round the record is 4 scores (12.4, 15.9, 17.7, 14.6):
// lowest 1 minus 1.0 -> HI 11.4; CH = 11.4*127/113 + (70.1-71) = 11.91 -> 12;
// PH = 95% of 12 = 11.4 -> 11; 36 pts -> AGS = 71+11+36-36 = 82
ok(ph === '11' && sfGross === '82', 'stableford: PH 11, 36 pts -> gross 82 (got ' + ph + '/' + sfGross + ')');
ok((await page.textContent('#pointsVsPar')).includes('to handicap'), '36 points reads as playing to handicap');
await page.click('#entrySave');
await page.waitForSelector('#entryScreen', { state: 'hidden' });
await page.click('.tab[data-nav="rounds"]');
await page.waitForFunction(() => document.querySelectorAll('#historyList .listrow').length === 5);
ok((await page.textContent('#historyList')).includes('STABLEFORD'), 'stableford round labelled in history');

// ---- 3. DRAFTS + HOLE SCORES ----
await page.click('#fabBtn');
await page.click('#holesSeg [data-holes="18"]');
await page.click('#modeHoles');
await page.waitForSelector('#entryHoles:not([hidden])');
await page.fill('#entryDate', '2026-07-08');
for (let i = 0; i < 3; i++) { await page.click('#stepPlus'); await page.click('#entryCta'); }
await page.click('#entryCancel');            // leave mid-round
await page.waitForSelector('#entryScreen', { state: 'hidden' });
await page.reload();                          // full reload: draft must survive
await page.waitForSelector('#app:not([hidden])');
await page.waitForSelector('#draftBanner .banner-note');
ok((await page.textContent('#draftBanner')).includes('3 holes in'), 'draft survives a reload and reports progress');
await page.click('#resumeDraft');
await page.waitForSelector('#entryScreen:not([hidden])');
ok((await page.textContent('#hcN')) === '4', 'resumed on hole 4');
// finish the card: score holes 4..18 at par via the hole grid
for (let k = 3; k < 18; k++) {
  await page.click(`#holeGrid [data-hole="${k}"]`);
  await page.click('#stepPlus');
}
await page.waitForFunction(() => document.getElementById('entryCta').textContent === 'Submit score');
await page.click('#entryCta');
await page.waitForSelector('#entryScreen', { state: 'hidden' });
const stored = await page.evaluate(() => {
  const rs = Object.values(window.__mockStore['rounds']);
  const r = rs.find(x => x.date === '2026-07-08');
  return { holeScores: r.holeScores, holesPlayed: r.holesPlayed, gross: r.adjustedGross };
});
ok(Array.isArray(stored.holeScores) && stored.holeScores.length === 18, 'all 18 hole scores stored on the round');
ok(stored.gross === 71, 'par round stores a gross of 71, got ' + stored.gross);
ok(!(await page.$('#draftBanner .banner-note')), 'draft cleared after posting');

// ---- 4. RESULTS ----
await page.evaluate(() => {
  const mk = (d, ags) => ({ playerId: 'p-amy', date: d, courseName: 'Ashridge Golf Club', teeName: 'Yellow',
    courseRating: 70.1, slopeRating: 127, par: 71, pcc: 0, adjustedGross: ags,
    differential: Math.round((113/127)*(ags-70.1)*10)/10, playedWith: [], compType: 'general',
    holesPlayed: 18, scoringFormat: 'strokes' });
  const s = window.__mockStore['rounds'];
  s['r-am1'] = mk('2026-07-01', 95); s['r-am2'] = mk('2026-07-02', 92); s['r-am3'] = mk('2026-07-03', 98);
  // Amy tags Tom on the shared day
  const tom = Object.keys(window.__mockStore['players']).find(k => k !== 'p-amy');
  s['r-am1'].playedWith = [tom];
  window.__mockNotifyAll();
});
await page.click('.tab[data-nav="rounds"]');
await page.click('#segResults');
await page.waitForFunction(() => document.querySelectorAll('#groupList .listrow').length >= 2);
const h2h = await page.textContent('#h2hList');
ok(h2h.includes('Amy Patel') && /\dW/.test(h2h), 'head-to-head record against Amy: ' + h2h.replace(/\s+/g,' ').slice(0,80));
const board = await page.textContent('#groupList');
ok(board.includes('NET') && board.includes('Ashridge'), 'group leaderboard shows net scores');

// ---- 5. CDH ----
await page.click('.tab[data-nav="me"]');
page.once('dialog', d => d.accept('401 8823'));
await page.click('#setCDH');
await page.waitForFunction(() => document.getElementById('setCDHVal').textContent === '401 8823');
ok((await page.textContent('#meSub')).includes('CDH 401 8823'), 'CDH number saved and shown on the profile');

// ---- 6. VERIFIED RATINGS ----
await page.click('.tab[data-nav="courses"]');
await page.click('#courseBook [data-book]');
await page.waitForSelector('.course-sel');
ok((await page.textContent('#courseSelWrap')).includes('NOT YET CONFIRMED'), 'unconfirmed ratings flagged');
await page.click('#confirmTeeBtn');
await page.waitForFunction(() => document.getElementById('courseSelWrap').textContent.includes('CONFIRMED BY 1 MEMBER'));
ok(true, 'confirming ratings records the member');

// ---- 7. OFFLINE ----
await page.context().setOffline(true);
await page.evaluate(() => { window.__mockFailWrites = true; });
await page.click('#fabBtn');
await page.fill('#entryDate', '2026-07-12');
await page.fill('#grossInput', '86');
await page.click('#entrySave');
await page.waitForSelector('#offlineBanner .banner-note', { timeout: 10000 });
ok((await page.textContent('#offlineBanner')).toLowerCase().includes('offline'), 'offline banner appears and the round is queued');
const queued = await page.evaluate(() => JSON.parse(localStorage.getItem('fairway.pending') || '[]').length);
ok(queued === 1, 'one round queued on the device, got ' + queued);
await page.context().setOffline(false);

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('\nFEATURES SMOKE PASSED');
await browser.close();
