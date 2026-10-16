/* tools/model-sheet.mjs  -  a labelled contact sheet of pieces as the room lights them, saved as a PNG (a screenshot: only when the user asks for one)
   (2026-10-16, the furniture model pass). Headless; run from the repo root,
     node tools/model-sheet.mjs id,id,... "Title" out.png
   It serves the repo itself and needs Three.js r160 on disk (no network): `npm i three@0.160.0` in a scratch folder
   and point THREE_JS at its build/three.module.min.js. Chromium comes from Playwright (PLAYWRIGHT, default the cloud's). */
const { chromium } = await import(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright/index.mjs');
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const HERE = path.dirname(new URL(import.meta.url).pathname), ROOT = path.join(HERE, '..');
const THREE = process.env.THREE_JS || '/tmp/three/node_modules/three/build/three.module.min.js';
const types = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.gif': 'image/gif', '.jpg': 'image/jpeg' };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]), f = u === '/tools/__sheet.html' ? path.join(HERE, 'model-sheet.html') : path.join(ROOT, u);
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
}).listen(0);
const [ids, title, out] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1468, height: 600 } });
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
page.on('pageerror', e => console.error('pageerror:', e.message));
await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', r => r.fulfill({ path: THREE, contentType: 'text/javascript' }));
await page.goto(`http://localhost:${srv.address().port}/tools/__sheet.html?ids=${ids}&title=${encodeURIComponent(title)}`);
await page.waitForFunction(() => window.done, null, { timeout: 600000 });
await page.screenshot({ path: out, fullPage: true });
await browser.close(); srv.close();
