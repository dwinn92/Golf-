// Clubhouses, invite codes, group scoring, attestation and activity — all of
// which need real accounts, so they run against the web build and the stub
// that models the database's row level security.
import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = '/home/user/Golf-/web/dist';
const stub = fs.readFileSync('supabase-stub.js', 'utf8');
const server = http.createServer((req, res) => {
  const file = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  if (file === '/vendor/supabase.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(stub); return; }
  let p = path.join(ROOT, file);
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(ROOT, 'index.html');
  res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
  res.end(fs.readFileSync(p));
});
await new Promise(r => server.listen(8242, r));
const BASE = 'http://localhost:8242';

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok - ' + m); };

// One browser context per member, but a shared stub state so they see the same
// database. localStorage is per-origin per-context, so seed it from a store the
// test keeps.
let shared = null;
async function member(name, email) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(name + ' pageerror: ' + e.message));
  page.on('console', m => {
    const t = m.text();
    // The stub hands back a made-up blob: URL for the card photo, which the
    // browser refuses to load. Real signed URLs from Storage do load.
    if (m.type() === 'error' && !/ERR_CONNECTION|favicon|fonts\.googleapis|blob:stub/i.test(t)) errors.push(name + ' console: ' + t);
  });
  // Seed the shared database, but never the session: this is a different
  // person on a different phone, so they must sign up for themselves.
  // addInitScript runs on every navigation, reloads included, so it has to
  // seed once — otherwise a later reload signs the member back out.
  if (shared) await page.addInitScript(s => {
    if (localStorage.getItem('__seeded')) return;
    localStorage.setItem('__seeded', '1');
    const st = JSON.parse(s); st.session = null;
    localStorage.setItem('__stub_state', JSON.stringify(st));
  }, shared);
  await page.goto(BASE);
  await page.waitForSelector('#authScreen:not([hidden])', { timeout: 15000 });
  if (email) {
    await page.click('#authToSignup');
    await page.fill('#authName', name);
    await page.fill('#authEmail', email);
    await page.fill('#authPassword', 'fairway-test');
    await page.click('#authSubmit');
    await page.waitForSelector('#app:not([hidden])', { timeout: 20000 });
  }
  return { page, ctx };
}
const save = async (page) => { shared = await page.evaluate(() => localStorage.getItem('__stub_state')); };

/* Each context has its own localStorage, so the stub's "database" has to be
   carried between them by hand. Keep whoever this browser is signed in as. */
async function syncAndReload(page) {
  await page.evaluate(s => {
    const mine = JSON.parse(localStorage.getItem('__stub_state') || '{}');
    const st = JSON.parse(s);
    st.session = mine.session || null;
    localStorage.setItem('__stub_state', JSON.stringify(st));
  }, shared);
  await page.reload();
  try {
    await page.waitForSelector('#app:not([hidden])', { timeout: 20000 });
  } catch (e) {
    // Say what the app actually showed instead, or the failure is a mystery.
    const shown = await page.evaluate(() => ({
      auth: document.getElementById('authScreen').hidden ? null : document.getElementById('authMsg').textContent,
      boot: document.getElementById('bootScreen').hidden ? null : document.getElementById('bootText').textContent
    }));
    throw new Error('app did not open after sync: ' + JSON.stringify(shown));
  }
}

// ---- Tom signs up: private by default ----
let { page: tom } = await member('Tom Fletcher', 'tom@example.com');
await tom.click('.tab[data-nav="me"]');
await tom.waitForFunction(() => document.getElementById('meName').textContent === 'Tom Fletcher');
ok(!(await tom.$eval('#setClubhouse', e => e.hidden)), 'the web build shows the clubhouse settings row');
await tom.click('#setClubhouse');
await tom.waitForSelector('#clubOverlay:not([hidden])');
const tomCode = await tom.textContent('#clubList');
ok(/CODE [A-Z2-9]{8}/.test(tomCode), 'a new member gets a clubhouse of their own with an invite code: ' +
  (tomCode.match(/CODE [A-Z2-9]{8}/) || [''])[0]);
const code = tomCode.match(/CODE ([A-Z2-9]{8})/)[1];

// seed a course with a full hole card so hole-by-hole entry is available
await tom.click('#clubClose');
await tom.evaluate(() => {
  const si = [5,11,17,1,7,15,9,3,13,4,16,10,2,8,18,12,6,14];
  const holes = [4,5,3,4,4,3,5,4,4, 4,3,5,4,4,3,5,4,4].map((p, i) => ({ par: p, strokeIndex: si[i] }));
  const st = JSON.parse(localStorage.getItem('__stub_state'));
  const cid = 'course-1', tid = 'tee-1';
  st.tables.courses.push({ id: cid, name: 'Ashridge Golf Club', created_by: null });
  st.tables.tees.push({ id: tid, course_id: cid, name: 'White', par: 72, course_rating: 71.9,
                        slope_rating: 131, yards: 6547, holes, front9: null, back9: null, created_by: null });
  localStorage.setItem('__stub_state', JSON.stringify(st));
});
await tom.reload();
await tom.waitForSelector('#app:not([hidden])', { timeout: 20000 });
await save(tom);

// ---- Amy signs up in her own clubhouse and cannot see Tom ----
let { page: amy } = await member('Amy Patel', 'amy@example.com');
await amy.click('.tab[data-nav="me"]');
await amy.waitForFunction(() => document.getElementById('memberList').children.length >= 1);
const before = await amy.textContent('#memberList');
ok(!/Tom Fletcher/.test(before), 'a new member in her own clubhouse cannot see anyone else');

// ---- Amy joins Tom's clubhouse with his code ----
await amy.click('#setClubhouse');
await amy.waitForSelector('#clubOverlay:not([hidden])');
await amy.fill('#clubCode', 'WRONGCOD');
await amy.click('#clubJoin');
await amy.waitForFunction(() => /No clubhouse has that code/i.test(document.getElementById('clubMsg').textContent));
ok(true, 'a wrong invite code is refused in plain English');
await amy.fill('#clubCode', code);
await amy.click('#clubJoin');
await amy.waitForFunction(() => /Joined/i.test(document.getElementById('clubMsg').textContent), null, { timeout: 15000 });
await amy.click('#clubClose');
await amy.waitForFunction(() => /Tom Fletcher/.test(document.getElementById('memberList').textContent), null, { timeout: 15000 });
ok(true, 'joining with the code makes the other member visible');
await save(amy);

// ---- Amy keeps the card for the fourball ----
await amy.click('.tab[data-nav="home"]');
await amy.click('#fabBtn');
await amy.waitForSelector('#entryScreen:not([hidden])');
await amy.fill('#entryDate', '2026-08-01');
await amy.click('.wchip[data-with]');                       // tag Tom
await amy.click('#modeHoles');
await amy.waitForSelector('#entryHoles:not([hidden])');
ok(!(await amy.$eval('#groupToggle', e => e.hidden)), 'tagging a partner offers to keep the whole group’s card');
await amy.click('#groupToggle');
await amy.waitForSelector('#gbStrip:not([hidden])');
ok((await amy.$$('#gbStrip .gb')).length === 2, 'the group strip lists both players');

// Amy's card: par on every hole. Tom's: one over on every hole.
async function keyRound(page, over) {
  for (let h = 0; h < 18; h++) {
    await page.click('#stepPlus');                            // seeds at par
    for (let i = 0; i < over; i++) await page.click('#stepPlus');
    if (h < 17) await page.click('#entryCta');
  }
}
await keyRound(amy, 0);
await amy.click('#gbStrip .gb:nth-child(2)');                 // switch to Tom
await amy.waitForFunction(() => document.querySelector('#gbStrip .gb:nth-child(2)').getAttribute('aria-pressed') === 'true');
ok((await amy.textContent('#gbStrip')).includes('18/18'), 'the strip shows how far each card has got');
await keyRound(amy, 1);
await amy.click('#entrySave');
await amy.waitForSelector('#entryScreen', { state: 'hidden' }, { timeout: 20000 });
await amy.waitForFunction(() => document.querySelectorAll('#homeRecent .listrow').length === 1, null, { timeout: 15000 });
const amyGross = (await amy.textContent('#homeRecent .r-gross')).trim();
ok(amyGross === '72', 'the scorer posts her own card only — level par 72, got ' + amyGross);
await save(amy);

// ---- Tom is offered his card and posts it himself ----
await syncAndReload(tom);
await tom.waitForFunction(() => document.querySelectorAll('#homeRecent .listrow').length === 0);
ok(true, 'a card kept for you does not appear in your record until you accept it');
await tom.waitForSelector('#bellBtn:not([hidden])');
ok(!(await tom.$eval('#bellDot', e => e.hidden)), 'the activity bell shows there is something waiting');
await tom.click('#bellBtn');
await tom.waitForSelector('#bellOverlay:not([hidden])');
ok(/kept your card/i.test(await tom.textContent('#bellList')), 'the waiting card says who kept it');
await tom.click('[data-acceptoffer]');
await tom.waitForFunction(() => document.querySelectorAll('#homeRecent .listrow').length === 1, null, { timeout: 20000 });
const tomGross = (await tom.textContent('#homeRecent .r-gross')).trim();
ok(tomGross === '90', 'accepting posts his own card — one over on every hole is 90, got ' + tomGross);
await tom.click('#bellClose');
await tom.waitForSelector('#bellOverlay[hidden]', { state: 'attached' });
ok(!(await tom.$('[data-acceptoffer]')), 'the accepted card is gone from the waiting list');
await save(tom);

// ---- Amy, named on Tom's card, can attest it; Tom cannot attest his own ----
await tom.click('#homeRecent .listrow');
await tom.waitForSelector('#roundOverlay:not([hidden])');
ok(!(await tom.$('#rdAttestBtn')), 'the card’s owner is never offered the confirm button');
ok(/NOT YET CONFIRMED/.test(await tom.textContent('#rdAttest')), 'an unconfirmed card says so');
await tom.click('#rdClose');

await syncAndReload(amy);
await amy.waitForFunction(() => document.querySelectorAll('#homeClubFeed .listrow').length === 1, null, { timeout: 20000 });
await amy.click('#homeClubFeed .listrow');
await amy.waitForSelector('#roundOverlay:not([hidden])');
await amy.waitForSelector('#rdAttestBtn');
ok(true, 'a named playing partner is offered the confirm button');
await amy.click('#rdAttestBtn');
await amy.waitForFunction(() => /CONFIRMED BY AMY PATEL/.test(document.getElementById('rdAttest').textContent), null, { timeout: 15000 });
ok(true, 'the marker can confirm the card');
await save(amy);

await syncAndReload(tom);
await tom.waitForFunction(() => /CONFIRMED/.test(document.getElementById('homeRecent').textContent), null, { timeout: 20000 });
ok(true, 'the confirmed card is badged in the owner’s own list');


// ---- pasting a scorecard beats 36 taps ----
await tom.click('.tab[data-nav="courses"]');
await tom.fill('#courseSearch', 'hunstanton');
await tom.waitForSelector('#dirResultsWrap:not([hidden])');
await tom.click('#dirResults .dirrow');
await tom.waitForSelector('#courseFormCard:not([hidden])');
await tom.fill('#fcTee', 'Blue');
await tom.fill('#fcPar', '72');
await tom.fill('#fcCR', '72.4');
await tom.fill('#fcSR', '129');
await tom.click('.holes-details summary');
await tom.fill('#fcPastePars', '4 5 3 4 4 3 5 4 4 4 3 5 4 4 3 5 4 4');
await tom.waitForFunction(() => /pars add to 72/.test(document.getElementById('fcHoleStatus').textContent));
ok(true, 'pasting a row of pars fills all 18 boxes and totals them');
const par0 = await tom.inputValue('[data-fcpar="0"]');
const par17 = await tom.inputValue('[data-fcpar="17"]');
ok(par0 === '4' && par17 === '4', 'the pasted numbers land in hole 1 and hole 18');
await tom.fill('#fcPastePars', '4 5 3 4 4 3 5 4 4 4 3 5 4 4 3 5 4 5');
await tom.waitForFunction(() => /pars add to 73, tee par is 72/.test(document.getElementById('fcHoleStatus').textContent));
ok(true, 'a card whose pars do not match the tee par says so as you type');
await tom.fill('#fcPastePars', '4 5 3 4 4 3 5 4 4 4 3 5 4 4 3 5 4 4');
await tom.fill('#fcPasteSis', '5 11 17 1 7 15 9 3 13 4 16 10 2 8 18 12 6 6');
await tom.waitForFunction(() => /used twice/.test(document.getElementById('fcHoleStatus').textContent));
ok(true, 'a repeated stroke index is caught before saving');
await tom.fill('#fcPasteSis', '5 11 17 1 7 15 9 3 13 4 16 10 2 8 18 12 6 14');
await tom.waitForFunction(() => /each once/.test(document.getElementById('fcHoleStatus').textContent));
ok(true, 'a valid set of stroke indexes is confirmed');
await tom.click('#fcSave');
await tom.waitForSelector('#courseFormCard[hidden]', { state: 'attached' });
ok(true, 'the tee saves with its hole card');
await save(tom);

// ---- shot detail and a photo of the card ----
await tom.click('.tab[data-nav="home"]');
await tom.click('#fabBtn');
await tom.waitForSelector('#entryScreen:not([hidden])');
await tom.fill('#entryDate', '2026-08-02');
await tom.click('#modeHoles');
await tom.waitForSelector('#entryHoles:not([hidden])');
await tom.click('#statShow');
await tom.waitForSelector('#hcStats:not([hidden])');
ok(true, 'shot detail can be switched on from the hole card');
// hole 1 is a par 4: fairway applies
ok(!(await tom.$eval('#statFw', e => e.disabled)), 'a par 4 offers the fairway control');
await tom.click('#stepPlus');            // seed at par
await tom.click('#statFw');
await tom.click('#statGir');
await tom.click('[data-putt="1"]');      // first tap seeds at 2 putts
await tom.waitForFunction(() => document.getElementById('statPutts').textContent === '2');
ok(true, 'the putts control seeds at two rather than at zero');
await tom.click('#entryCta');            // hole 2
await tom.click('#stepPlus');
await tom.click('#entryCta');            // hole 3 — a par 3
await tom.click('#stepPlus');
await tom.waitForFunction(() => document.getElementById('statFw').disabled);
ok(/no fairway/i.test(await tom.textContent('#statFw')), 'a par 3 says there is no fairway rather than offering one');

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
await tom.setInputFiles('#photoInput', { name: 'card.png', mimeType: 'image/png', buffer: png });
await tom.waitForFunction(() => /will be attached/.test(document.getElementById('photoPreview').textContent));
ok(true, 'a photo of the card can be attached before saving');
await tom.click('#entrySave');
await tom.waitForSelector('#entryScreen', { state: 'hidden' }, { timeout: 20000 });
await tom.waitForFunction(() => document.querySelectorAll('#homeRecent .listrow').length === 2, null, { timeout: 20000 });
await tom.click('#homeRecent .listrow');
await tom.waitForSelector('#roundOverlay:not([hidden])');
await tom.waitForSelector('#rdStats:not([hidden])');
const detail = (await tom.textContent('#rdStats')).replace(/\s+/g, ' ');
// Three holes played: 1 and 2 are par 4/5, 3 is a par 3. One fairway hit of
// the two that had one = 50%; one green of three holes = 33%; two putts.
ok(/Fairways ?50%/.test(detail), 'fairways count only the holes that have one: ' + detail);
ok(/Greens ?33%/.test(detail), 'greens in regulation count every hole played: ' + detail);
ok(/Putts ?2/.test(detail), 'putts total across the holes recorded: ' + detail);
await tom.waitForSelector('#rdPhoto:not([hidden])', { timeout: 15000 });
ok(await tom.$('#rdPhoto img'), 'the photo of the card shows on the round');
await tom.click('#rdClose');

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('\nCLUBHOUSE SMOKE PASSED');
await browser.close();
server.close();
