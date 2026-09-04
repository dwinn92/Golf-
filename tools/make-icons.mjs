/*
 * Rasterise web/icons/fairway-icon.svg into the PNGs a home-screen install
 * needs. iOS ignores the web manifest's icons entirely and looks for
 * <link rel="apple-touch-icon">, which is why adding the app to an iPhone
 * home screen used to produce a blank tile.
 *
 * Run: node tools/make-icons.mjs
 */
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const svg = fs.readFileSync(path.join(root, 'web/icons/fairway-icon.svg'), 'utf8');

// A maskable icon is cropped to a circle by the launcher, so its content has
// to sit inside the middle 80%. Everything else is drawn edge to edge.
const targets = [
  { file: 'icon-192.png', size: 192, inset: 0 },
  { file: 'icon-512.png', size: 512, inset: 0 },
  { file: 'icon-maskable-512.png', size: 512, inset: 0.14 },
  { file: 'apple-touch-icon.png', size: 180, inset: 0.06 },
  { file: 'favicon-32.png', size: 32, inset: 0 }
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size }, deviceScaleFactor: 1 });
  const pad = Math.round(t.size * t.inset);
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:#163F2E}
     .wrap{width:${t.size}px;height:${t.size}px;display:grid;place-items:center;background:#163F2E}
     svg{width:${t.size - pad * 2}px;height:${t.size - pad * 2}px;display:block}</style>
     <div class="wrap">${svg}</div>`);
  await page.screenshot({ path: path.join(root, 'web/icons', t.file) });
  await page.close();
  console.log('wrote web/icons/' + t.file);
}
await browser.close();
