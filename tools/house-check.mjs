/* house-check.mjs  -  the Secret Base's houses (js/hub-houses.js) in text, no screenshots (the user's rule): for each,
   its draws a frame as mergeStill() would leave them, triangles, its bounding box (it must stay inside the lot: |x| <=
   2.25, z from about -2.7 to 0.95, the door at x 0), and a front, side and plan view, one letter a material (a paint
   key's initial, # a lit window, * a glow; the legend names the rest). Built 2026-10-23 for the houses' session A.
     NODE_PATH=$(npm root -g) node tools/house-check.mjs mushroom,barn [paint index] [front,side,plan] */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const HERE = path.dirname(new URL(import.meta.url).pathname), ROOT = path.join(HERE, '..');
const { launch, threeCopy } = await import('./probe-kit.mjs');
const three = await threeCopy();
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = u === '/__houses.html' ? path.join(HERE, 'house-check.html') : path.join(ROOT, u);
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
}).listen(0);
const browser = await launch(), ctx = await browser.newContext(), page = await ctx.newPage();
await page.route(/cdn\.jsdelivr\.net\/npm\/three/, async r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(three) }));
await page.route(/gstatic\.com|googleapis\.com/, r => r.abort());
page.on('pageerror', e => console.error('pageerror:', e.message));
page.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) console.error('console:', m.text().slice(0, 300)); });
const [ids, paint = 0, views = 'front,side,plan'] = process.argv.slice(2);
await page.goto(`http://localhost:${srv.address().port}/__houses.html?ids=${ids}&paint=${paint}`);
await page.waitForFunction(() => window.done, null, { timeout: 300000 });
for (const r of await page.evaluate(() => window.result)) {
  console.log(`\n=== ${r.id} (${r.paint})  draws ${r.draws}  tris ${r.tris}  box ${JSON.stringify(r.box)}  door ${r.door}\n${r.legend}`);
  for (const v of views.split(',')) console.log(`--- ${v}\n${r[v]}`);
}
await browser.close(); srv.close();
