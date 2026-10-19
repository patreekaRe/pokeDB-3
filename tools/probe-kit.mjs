/* probe-kit.mjs  -  what tools/memory-probe.mjs and tools/budget-check.mjs share: the game served from the repo, a phone
   in headless Chromium (an iPhone 17 Pro's 402 x 874 at 3x), three.js from a local copy (the cloud's proxy turns jsDelivr
   away), and the in-page counters (`instrument`, read with `window.__probe()`). */
import { createServer } from 'node:http';
import { readFile, mkdir, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(import.meta.url);
export function playwright() {
  try { return require('playwright'); } catch { return require(join(process.execPath, '../../lib/node_modules/playwright')); }
}

const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.gif': 'image/gif', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
/** The repo on a local port; `patch(path, body)` may rewrite a file as it's served. */
export function serve(patch = (p, b) => b) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]), file = path === '/' ? 'index.html' : path;
    try {
      const body = patch(path, await readFile(normalize(join(root, file))));
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body);
    } catch { res.writeHead(404); res.end(); }
  }).listen(0);
  return { server, port: server.address().port };
}

/** A copy of three.module.min.js: the one named, one already unpacked in the temp folder, or `npm pack`ed there. */
export async function threeCopy(named) {
  if (named) return named;
  for (const dir of ['/tmp/three', join(tmpdir(), 'pokedb-three')]) {
    const f = join(dir, 'package/build/three.module.min.js');
    try { await access(f); return f; } catch {}
  }
  const dir = join(tmpdir(), 'pokedb-three');
  await mkdir(dir, { recursive: true });
  execFileSync('npm', ['pack', 'three@0.160.0', '--silent'], { cwd: dir });
  execFileSync('tar', ['xzf', 'three-0.160.0.tgz'], { cwd: dir });
  return join(dir, 'package/build/three.module.min.js');
}

export const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
export const launch = () => playwright().chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--js-flags=--expose-gc', '--autoplay-policy=no-user-gesture-required'] });

/** A fresh phone: instrumented, three.js served locally, Firebase turned away, errors collected in `errors`. */
export async function phone(browser, three) {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA });
  await ctx.addInitScript(instrument);
  if (three) await ctx.route(/cdn\.jsdelivr\.net\/npm\/three/, async r => r.fulfill({ contentType: 'text/javascript', body: await readFile(three) }));
  await ctx.route(/gstatic\.com|googleapis\.com/, r => r.abort());
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|404|firebase|firestore|ERR_|GL Driver/i.test(m.text())) errors.push(`console: ${m.text().slice(0, 200)}`); });
  return { ctx, page, errors };
}

/* Runs in the page before any of its scripts: notes every canvas given a context, every texture and renderbuffer upload. */
export function instrument() {
  const canvases = [], meta = new WeakMap(), gls = [];
  const where = () => (new Error().stack.split('\n').slice(2).map(l => l.match(/\/js\/([\w.-]+\.js):(\d+)/)).filter(Boolean)
    .filter(m => !/^hd2d\.js$/.test(m[1]) || true).slice(0, 3).map(m => `${m[1]}:${m[2]}`).join(' < '));
  for (const proto of [HTMLCanvasElement.prototype, OffscreenCanvas.prototype]) {
    const get = proto.getContext;
    proto.getContext = function (type, o) {
      const r = get.call(this, type, o);
      if (r && !meta.has(this)) {
        meta.set(this, { type, cpu: !!o?.willReadFrequently, at: where() });
        canvases.push(new WeakRef(this));
        if (/webgl/.test(type)) {
          const rec = { gl: new WeakRef(r), canvas: new WeakRef(this), tex: new Map(), rb: new Map(), unit: 0, bound: {}, rbBound: null, lost: null };
          gls.push(rec);
          // counted as WebKit holds them: a lost context keeps everything it made (and its drawing buffer at the size it
          // had) until it's restored; Chromium frees it all at the loss, so its own numbers would flatter a sleep
          this.addEventListener?.('webglcontextrestored', () => { rec.tex.clear(); rec.rb.clear(); rec.lost = null; });
          hookGL(r, rec);
        }
      }
      return r;
    };
  }
  const BPP = { 0x8058: 4, 0x8C43: 4, 0x1908: 4, 0x881A: 8, 0x8814: 16, 0x88F0: 4, 0x81A6: 3, 0x81A5: 2, 0x8CAC: 4, 0x1907: 3, 0x8051: 3, 0x822B: 2, 0x8229: 1, 0x1909: 1, 0x190A: 2, 0x1906: 1, 0x8D48: 1, 0x8CAD: 8 };
  const srcSize = (s) => [s.videoWidth || s.naturalWidth || s.displayWidth || s.width, s.videoHeight || s.naturalHeight || s.displayHeight || s.height];
  function hookGL(gl, rec) {
    const ext = gl.getExtension;
    gl.getExtension = function (name) {
      const e = ext.call(this, name);
      if (e && /lose_context/i.test(name) && !e.__probed) {
        e.__probed = true;
        const lose = e.loseContext;
        e.loseContext = function () { if (!gl.isContextLost()) rec.lost = gl.drawingBufferWidth * gl.drawingBufferHeight * 4 * 3; return lose.call(this); };
      }
      return e;
    };
    const P = Object.getPrototypeOf(gl), wrap = (name, fn) => { const f = gl[name]; if (f) gl[name] = function (...a) { fn.apply(this, a); return f.apply(this, a); }; };
    for (const d of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) wrap(d, () => { rec.draws = (rec.draws || 0) + 1; window.__drawsAll = (window.__drawsAll || 0) + 1; });
    wrap('activeTexture', (u) => { rec.unit = u; });
    wrap('bindTexture', (t, tx) => { rec.bound[`${rec.unit}:${t}`] = tx; });
    const cur = (target) => rec.bound[`${rec.unit}:${target >= 0x8515 && target <= 0x851A ? 0x8513 : target}`];
    const entry = (tx) => { let e = rec.tex.get(tx); if (!e) rec.tex.set(tx, e = { levels: {}, src: null, mip: false }); return e; };
    wrap('texStorage2D', (target, levels, fmt, w, h) => {
      const tx = cur(target); if (!tx) return;
      const e = entry(tx); let b = 0;
      for (let i = 0; i < levels; i++) b += Math.max(1, w >> i) * Math.max(1, h >> i) * (BPP[fmt] ?? 4);
      e.levels = { all: b * (target === 0x8513 ? 6 : 1) };
    });
    wrap('texImage2D', function (target, level, fmt, ...r) {
      const tx = cur(target); if (!tx) return;
      const e = entry(tx);
      let w, h;
      if (r.length >= 6) [w, h] = r; else { [w, h] = srcSize(r[2]); e.src = new WeakRef(r[2]); }
      const bpp = BPP[fmt] ?? 4;
      e.levels[`${target}:${level}`] = w * h * bpp;
    });
    wrap('texSubImage2D', function (target, level, x, y, ...r) {
      const tx = cur(target); if (!tx || level) return;
      const s = r.length >= 5 ? (r.length === 5 ? r[4] : null) : r[2];
      if (s && typeof s === 'object' && !ArrayBuffer.isView(s)) entry(tx).src = new WeakRef(s);
    });
    wrap('generateMipmap', (target) => { const tx = cur(target); if (tx) entry(tx).mip = true; });
    wrap('deleteTexture', (tx) => { rec.tex.delete(tx); });
    wrap('bindRenderbuffer', (t, rb) => { rec.rbBound = rb; });
    wrap('renderbufferStorage', (t, fmt, w, h) => { if (rec.rbBound) rec.rb.set(rec.rbBound, w * h * (BPP[fmt] ?? 4)); });
    wrap('renderbufferStorageMultisample', (t, s, fmt, w, h) => { if (rec.rbBound) rec.rb.set(rec.rbBound, w * h * (BPP[fmt] ?? 4) * Math.max(1, s)); });
    wrap('deleteRenderbuffer', (rb) => { rec.rb.delete(rb); });
  }
  // --audit: a call on a glow map that works in its canvas pixels (they no longer match its painting's)
  const glowSet = new WeakSet(), odd = new Map();
  Object.defineProperty(OffscreenCanvas.prototype, 'glow', { configurable: true, set(v) { Object.defineProperty(this, 'glow', { value: v, writable: true, configurable: true, enumerable: true }); if (v) glowSet.add(v); } });
  const C2 = OffscreenCanvasRenderingContext2D.prototype, note = (what) => { const k = `${what} ${where()}`; odd.set(k, (odd.get(k) || 0) + 1); };
  for (const m of ['setTransform', 'resetTransform', 'getImageData', 'putImageData', 'createImageData']) { const f = C2[m]; C2[m] = function (...a) { if (glowSet.has(this.canvas)) note(m); return f.apply(this, a); }; }
  for (const P of [C2, CanvasRenderingContext2D.prototype]) {
    const d = P.drawImage;
    P.drawImage = function (src, ...a) { if (glowSet.has(src) && a.length === 8) note('drawImage(glow, source rect)'); if (glowSet.has(src) && a.length === 2) note('drawImage(glow, x, y)'); return d.call(this, src, ...a); };
  }
  const fd = Object.getOwnPropertyDescriptor(C2, 'filter');
  if (fd) Object.defineProperty(C2, 'filter', { configurable: true, get: fd.get, set(v) { if (glowSet.has(this.canvas) && v !== 'none') note(`filter ${v}`); fd.set.call(this, v); } });
  window.__odd = () => [...odd].map(([k, n]) => `${n}x ${k}`);
  const audio = [], bitmaps = [], images = [];
  const dec = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function (...a) { return dec.apply(this, a).then(b => { audio.push(new WeakRef(b)); return b; }); };
  const cb = BaseAudioContext.prototype.createBuffer;
  BaseAudioContext.prototype.createBuffer = function (...a) { const b = cb.apply(this, a); audio.push(new WeakRef(b)); return b; };
  const cib = window.createImageBitmap;
  window.createImageBitmap = function (...a) { return cib.apply(this, a).then(b => { bitmaps.push(new WeakRef(b)); return b; }); };
  const close = ImageBitmap.prototype.close;
  ImageBitmap.prototype.close = function () { this.__closed = true; return close.call(this); };
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (n, ...a) { const el = ce.call(this, n, ...a); if (/^img$/i.test(n)) images.push(new WeakRef(el)); return el; };
  const I = window.Image;
  window.Image = function (...a) { const el = new I(...a); images.push(new WeakRef(el)); return el; };
  window.Image.prototype = I.prototype;

  window.__probe = async () => {
    for (let i = 0; i < 4; i++) { window.gc?.(); await new Promise(r => setTimeout(r, 120)); }
    const MB = (b) => Math.round(b / 1048576 * 10) / 10;
    const live = canvases.map(r => r.deref()).filter(Boolean);
    const glows = new Set(live.filter(c => c.glow).map(c => c.glow));
    const kind = (c) => glows.has(c) ? 'glow' : (meta.get(c)?.type.startsWith('webgl') ? 'gl' : c.fine || c.hd > 1 ? 'smooth' : meta.get(c)?.cpu ? 'cpu' : 'other2d');
    const cv = { glow: 0, smooth: 0, cpu: 0, other2d: 0, gl: 0 }, count = { glow: 0, smooth: 0, cpu: 0, other2d: 0, gl: 0 };
    const big = [];
    for (const c of live) {
      const k = kind(c), b = c.width * c.height * 4;
      if (k === 'gl') continue;
      cv[k] += b; count[k]++;
      big.push({ b, k, w: c.width, h: c.height, at: meta.get(c)?.at });
    }
    big.sort((a, b) => b.b - a.b);
    let tex = 0, texGlow = 0, texSmooth = 0, rb = 0, drawing = 0, awake = 0, ntex = 0, asleepHeld = 0, asleep = 0;
    const drawn = [];
    for (const rec of gls) {
      const gl = rec.gl.deref();
      if (!gl) continue;
      const before = tex + rb;
      if (gl.isContextLost()) { asleep++; drawing += rec.lost ?? 0; } else {
        awake++; drawing += gl.drawingBufferWidth * gl.drawingBufferHeight * 4 * 3;
        drawn.push(`${rec.canvas.deref()?.closest?.('[id]')?.id || 'offscreen'} ${gl.drawingBufferWidth}x${gl.drawingBufferHeight}: ${rec.draws || 0} draws, ${rec.tex.size} textures, error ${gl.getError()}`);
      }
      rec.draws = 0;
      for (const e of rec.tex.values()) {
        let b = Object.values(e.levels).reduce((s, x) => s + x, 0);
        if (e.mip && !e.levels.all) b *= 4 / 3;
        tex += b; ntex++;
        const s = e.src?.deref();
        if (s && glows.has(s)) texGlow += b; else if (s && (s.fine || s.hd > 1)) texSmooth += b;
      }
      for (const b of rec.rb.values()) rb += b;
      if (gl.isContextLost()) asleepHeld += tex + rb - before + (rec.lost ?? 0);
    }
    const liveAudio = audio.map(r => r.deref()).filter(Boolean), ab = liveAudio.reduce((s, b) => s + b.length * b.numberOfChannels * 4, 0);
    const audioBig = liveAudio.map(b => b.length * b.numberOfChannels * 4).sort((a, b) => b - a).slice(0, 4).map(MB);
    const bm = bitmaps.map(r => r.deref()).filter(b => b && !b.__closed).reduce((s, b) => s + b.width * b.height * 4, 0);
    const im = images.map(r => r.deref()).filter(i => i?.complete && i.naturalWidth).reduce((s, i) => s + i.naturalWidth * i.naturalHeight * 4, 0);
    const byAt = {};
    for (const x of big) { const k = `${x.k} ${x.at}`; byAt[k] = (byAt[k] || 0) + x.b; }
    const title = ['.b3-top h2', '#room-title'].map(q => document.querySelector(q)).find(n => n?.getClientRects().length)?.textContent.trim();
    return {
      where: [document.body.dataset.screen, title].filter(Boolean).join(' / '),
      canvasMB: Object.fromEntries(Object.entries(cv).map(([k, v]) => [k, MB(v)])), canvasCount: count,
      glMB: { textures: MB(tex), ofWhichGlow: MB(texGlow), ofWhichSmooth: MB(texSmooth), renderbuffers: MB(rb), drawingBuffers: MB(drawing) },
      drawn, contextsAwake: awake, contextsAsleep: asleep, asleepHeldMB: MB(asleepHeld), textures: ntex, audioMB: MB(ab), audioBig, bitmapsMB: MB(bm), imagesMB: MB(im),
      heapMB: performance.memory ? MB(performance.memory.usedJSHeapSize) : null,
      totalMB: MB(Object.values(cv).reduce((s, v) => s + v, 0) + tex + rb + drawing + ab + bm + im),
      biggest: big.slice(0, 8).map(x => `${MB(x.b)} MB ${x.k} ${x.w}x${x.h} ${x.at}`),
      bySite: Object.entries(byAt).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${MB(v)} MB ${k}`),
    };
  };
}

/* The Clearing's doors, for a probe walking between places in one page: served with js/hub-3d.js only, never shipped. */
export const HUB_PEEK = (path, body) => path === '/js/hub-3d.js' ? body.toString() + '\nwindow.__hub = { enterBase, enterMall };\n'
  : path === '/js/hd2d.js' ? body.toString() + '\nwindow.__hooked = () => hooked.size;\n' : body;
