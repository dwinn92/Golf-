// Smoke test for the wireframe rebuild at a 390px mobile viewport, using the
// in-memory mock of the db capability from social-smoke.mjs's wrapper.
import { chromium } from 'playwright-core';
import fs from 'fs';

const inner = fs.readFileSync('dist/fairway-social.html', 'utf8');
const prev = fs.readFileSync('social-wrapped.html', 'utf8');
const head = prev.slice(0, prev.indexOf('<body>') + 6); // includes mock claude.use
fs.writeFileSync('mobile-wrapped.html', head + inner + '</body></html>');

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => {
  if (m.type() === 'error' && !m.text().includes('ERR_CONNECTION')) errors.push('console: ' + m.text());
});
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok - ' + m); };

await page.goto('file://' + process.cwd() + '/mobile-wrapped.html');
await page.waitForSelector('#profileOverlay:not([hidden])');
assert(true, 'profile sheet appears for a new visitor');

// Seed shared course book + a friend with rounds.
await page.evaluate(() => {
  window.__mockStore['courses'] = {
    'c-ash': {
      name: 'Ashridge Golf Club',
      tees: [
        { name: 'White', par: 72, courseRating: 71.9, slopeRating: 131, yards: 6547,
          holes: [4,5,3,4,4,3,5,4,4,4,3,5,4,4,3,5,4,4].map((p, i) => ({ par: p, strokeIndex: [5,11,17,1,7,15,9,3,13,4,16,10,2,8,18,12,6,14][i] })) },
        { name: 'Yellow', par: 71, courseRating: 70.1, slopeRating: 127, yards: 6241, holes: null }
      ]
    }
  };
  window.__mockStore['players'] = { 'p-amy': { name: 'Amy Patel', color: '#3a6ea5' } };
  const mk = (i, ags) => ({
    playerId: 'p-amy', date: '2026-07-0' + i, courseName: 'Ashridge Golf Club', teeName: 'Yellow',
    courseRating: 70.1, slopeRating: 127, par: 71, pcc: 0, adjustedGross: ags,
    differential: Math.round((113 / 127) * (ags - 70.1) * 10) / 10, playedWith: [], compType: 'general'
  });
  window.__mockStore['rounds'] = { 'r-a1': mk(1, 89), 'r-a2': mk(2, 92), 'r-a3': mk(3, 86) };
  window.__mockNotifyAll();
});

await page.fill('#newPlayerName', 'Tom Fletcher');
await page.click('#joinBtn');
await page.waitForSelector('#profileOverlay', { state: 'hidden' });
assert(true, 'joined the clubhouse');
await page.waitForFunction(() => document.getElementById('homeAvatar').textContent === 'TF');
assert(true, 'home avatar shows initials TF');
await page.waitForFunction(() => document.querySelectorAll('#homeClubFeed .listrow').length === 3);
assert(true, 'clubhouse feed shows friend rounds on Home');

// Entry: total mode via FAB, tag Amy.
await page.click('#fabBtn');
await page.waitForSelector('#entryScreen:not([hidden])');
assert((await page.textContent('#ctxName')).includes('Ashridge'), 'entry context shows default course');
await page.fill('#entryDate', '2026-07-04');
await page.fill('#grossInput', '84');
// yellow default? prefs default to first course, teeIdx 0 = White CR 71.9 SR 131
await page.waitForFunction(() => document.getElementById('gcDiff').textContent !== '–');
const diff = await page.textContent('#gcDiff');
// (113/131)*(84-71.9) = 10.437 -> 10.4
assert(diff === '10.4', 'differential preview 10.4, got ' + diff);
await page.click('#compComp');
await page.click('.wchip');
assert(await page.getAttribute('.wchip', 'aria-pressed') === 'true', 'played-with chip selects');
await page.click('#entrySave');
await page.waitForSelector('#entryScreen', { state: 'hidden' });
await page.waitForFunction(() => document.querySelectorAll('#homeRecent .listrow').length === 1);
const row = await page.textContent('#homeRecent .listrow');
assert(row.includes('84') && row.includes('COMPETITION') && row.includes('W/ AP'), 'my round shows comp + played-with: ' + row.replace(/\s+/g, ' ').slice(0, 90));

// Rounds tab: chips + month group.
await page.click('.tab[data-nav="rounds"]');
await page.waitForFunction(() => document.querySelectorAll('#historyList .listrow').length === 1);
assert((await page.textContent('#historyChips')).includes('ALL 1'), 'filter chips show ALL 1');
assert((await page.textContent('#historyList')).includes('July 2026'), 'month group header renders');
await page.click('[data-filter="comps"]');
await page.waitForFunction(() => document.querySelectorAll('#historyList .listrow').length === 1);
assert(true, 'comps filter keeps competition round');

// Post two more (general) to establish an index.
for (const [d, g] of [['2026-07-05', 88], ['2026-07-06', 90]]) {
  await page.click('#fabBtn');
  await page.fill('#entryDate', d);
  await page.fill('#grossInput', String(g));
  await page.click('#entrySave');
  await page.waitForSelector('#entryScreen', { state: 'hidden' });
}
// my diffs: 84->10.4, 88->13.9, 90->15.6; HI = 10.4-2 = 8.4
await page.waitForFunction(() => document.getElementById('heroIndex').textContent === '8.4');
assert(true, 'hero index computes to 8.4');
assert(!(await page.$('#phCard[hidden]')), 'playing handicap card visible with index');
const ch = await page.textContent('#phCH');
// 8.4*(131/113)+(71.9-72) = 9.63 -> 10
assert(ch === '10', 'course handicap 10, got ' + ch);

// Trend view renders bars + index line.
await page.click('.tab[data-nav="rounds"]');
await page.click('#segTrend');
await page.waitForFunction(() => document.querySelectorAll('#trendChart .tc-col').length === 3);
assert((await page.textContent('#statAvg8')).length > 1, 'trend stats populated');
assert((await page.textContent('#movedText')).length > 20, 'what-moved-it text present');

// Courses: directory search + book tee table + use tees.
await page.click('.tab[data-nav="courses"]');
await page.fill('#courseSearch', 'hunstanton');
await page.waitForSelector('#dirResultsWrap:not([hidden])');
const dirRow = await page.textContent('#dirResults .dirrow');
assert(dirRow.includes('PAR 72') && dirRow.includes('6,741'), 'directory row carries par + yardage');
await page.click('#dirResults .dirrow');
await page.waitForSelector('#courseFormCard:not([hidden])');
assert((await page.inputValue('#fcName')).includes('Hunstanton'), 'add form pre-filled from directory');
await page.click('#courseFormCancel');
await page.fill('#courseSearch', '');
await page.click('#courseBook [data-book]');
await page.waitForSelector('.course-sel');
assert((await page.$$('.course-sel .tee-row2')).length === 2, 'tee table lists both tees');
await page.click('.course-sel [data-booktee="1"]');
await page.waitForFunction(() => document.querySelector('#useTeeBtn').textContent.includes('yellow'));
await page.click('#useTeeBtn');
await page.waitForSelector('#screen-home.active');
assert((await page.textContent('#phCourse')).includes('Yellow'), 'Use tees updates home playing handicap card');

// Hole-by-hole on White (has hole data): switch course first via CHANGE.
await page.click('#phChange');
await page.waitForSelector('#teePickOverlay:not([hidden])');
await page.click('[data-pickcourse="c-ash"][data-picktee="0"]');
await page.waitForSelector('#teePickOverlay[hidden]', { state: 'attached' });
await page.click('#fabBtn');
await page.click('#modeHoles');
await page.waitForSelector('#entryHoles:not([hidden])');
assert((await page.$$('#holeGrid .hg-cell')).length === 18, '18-hole grid renders');
await page.click('#stepPlus'); // seeds at par (4)
assert((await page.textContent('#hcStrokes')) === '4', 'first tap seeds at par');
assert((await page.textContent('#hcWord')) === 'PAR', 'score word PAR');
while (!(await page.$eval('#stepPlus', b => b.disabled))) await page.click('#stepPlus');
const capped = await page.textContent('#hcStrokes');
// HI 8.4 -> CH 10 on White -> 1 stroke on SI 5 -> NDB = 4+2+1 = 7
assert(capped === '7', 'NDB cap is 7 on hole 1, got ' + capped);
const footer = await page.textContent('#hcFoot');
assert(footer.includes('MAXIMUM — ' + capped), 'stepper caps at net double bogey (' + capped + ')');
await page.click('#entryCta'); // next hole
assert((await page.textContent('#hcN')) === '2', 'Next hole advances to hole 2');
await page.click('#entryCancel');

// Me tab: members + overlay + together filter.
await page.click('.tab[data-nav="me"]');
assert((await page.$$('#memberList .member-row')).length === 2, 'members list shows both players');
await page.click('#memberList [data-member="p-amy"]');
await page.waitForSelector('#memberOverlay:not([hidden])');
await page.waitForFunction(() => document.querySelectorAll('#mdRounds .listrow').length === 3);
assert((await page.textContent('#mdSub')).includes('1 TOGETHER'), 'member overlay shows together count');
await page.check('#mdTogetherOnly');
await page.waitForFunction(() => document.querySelectorAll('#mdRounds .listrow').length === 0);
assert(true, 'together-only filter works in member view');
await page.click('#mdClose');

await page.click('.tab[data-nav="home"]');
await page.screenshot({ path: 'mobile-home.png', fullPage: false });
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('\nMOBILE SMOKE PASSED');
await browser.close();
