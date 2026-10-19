// Headless check of friends' tombstones (js/graves.js) and the Trainer Plaza's buddies (js/hub-buddies.js), with two
// stand-in accounts sharing one in-memory Firestore that mirrors firestore.rules' graves/ (gstatic routed to stand-in SDK
// modules, as tools/trainers-check.mjs). Serve the repo (python3 -m http.server 8123), then:
//   node tools/graves-check.mjs <three.module.min.js>      (OLD_RULES=1: rules from before graves/, every write refused)
// MISTY (B) loses a real run on floor 1 of the Whispering Clearing; ASH (A), who has MISTY on their list, finds her grave
// on that floor of a Clearing map, opens her recap, pays respects, and meets her Squirtle in the Plaza.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:8123/';
const THREE = process.argv[2] || process.env.THREE_JS;
const OLD = !!process.env.OLD_RULES;
const store = new Map();
const log = [];

function allow(op, path, data, uid) {
  const [col, id] = path.split('/');
  if (!uid) return false;
  if (col === 'saves') return id === uid;
  if (col === 'codes') return op === 'get' || (!store.has(path) && data?.uid === uid);
  if (col === 'trainers' || col === 'plaza') return op === 'get' || op === 'query' || id === uid;
  if (col === 'graves') {
    if (OLD) return false;
    if (op === 'get') return true;
    return id === uid && Object.keys(data).every(k => ['name', 'buddy', 'tier', 'falls', 'at'].includes(k))
      && Array.isArray(data.falls) && data.falls.length <= 5 && data.falls.every(f => typeof f === 'string' && f.length <= 4000);
  }
  if (col === 'adds') return op === 'query';
  return false;
}

function fsCall(uid, op, path, data, filter) {
  if (op === 'query') {
    if (!allow('query', `${path}/x`, null, uid)) return { error: 'permission-denied' };
    return { docs: [...store.entries()].filter(([p, d]) => p.startsWith(`${path}/`) && (!filter || d[filter[0]] === filter[1])).map(([p, d]) => ({ path: p, data: d })) };
  }
  if (!allow(op, path, data, uid)) { log.push(`DENIED ${uid} ${op} ${path}`); return { error: 'permission-denied' }; }
  log.push(`${uid} ${op} ${path}`);
  if (op === 'get') return { exists: store.has(path), data: store.get(path) ?? null };
  if (op === 'delete') { store.delete(path); return { ok: true }; }
  store.set(path, JSON.parse(JSON.stringify(op === 'update' ? { ...store.get(path), ...data } : data), (k, v) => (v === '__serverTime__' ? Date.now() : v)));
  return { ok: true };
}

const APP = 'export const initializeApp = () => ({});';
const AUTH = `
export const getAuth = () => ({});
export const onAuthStateChanged = (auth, cb) => { setTimeout(() => cb(window.__user ? { uid: window.__user, email: window.__user + '@test' } : null), 50); return () => {}; };
export const isSignInWithEmailLink = () => false;
export class GoogleAuthProvider {}
export const signOut = async () => {};
export const signInWithPopup = async () => {}, signInWithRedirect = async () => {}, signInWithEmailLink = async () => {}, sendSignInLinkToEmail = async () => {},
  createUserWithEmailAndPassword = async () => {}, signInWithEmailAndPassword = async () => {}, sendPasswordResetEmail = async () => {};
`;
const FS = `
const call = async (...a) => { const r = await window.__fs(window.__user, ...a); if (r && r.error) { const e = new Error(r.error); e.code = r.error; throw e; } return r; };
const wrap = (data) => data && data.at && typeof data.at === 'number' ? { ...data, at: { toMillis: () => data.at } } : data;
const snap = (path, r) => ({ id: path.split('/').pop(), exists: () => r.exists, data: () => wrap(r.data) });
export const getFirestore = () => ({});
export const doc = (db, ...p) => ({ path: p.join('/') });
export const collection = (db, ...p) => ({ path: p.join('/') });
export const where = (f, op, v) => ({ where: [f, v] });
export const limit = () => ({});
export const orderBy = () => ({});
export const query = (c, ...parts) => ({ path: c.path, filter: parts.find(p => p.where)?.where });
export const serverTimestamp = () => '__serverTime__';
export const getDoc = async (ref) => snap(ref.path, await call('get', ref.path));
export const setDoc = async (ref, data) => { await call('set', ref.path, data); };
export const deleteDoc = async (ref) => { await call('delete', ref.path); };
export const updateDoc = async (ref, data) => { await call('update', ref.path, data); };
export const getDocs = async (q) => ({ docs: (await call('query', q.path, null, q.filter)).docs.map(d => ({ id: d.path.split('/').pop(), data: () => wrap(d.data) })) });
export const runTransaction = async (db, fn) => fn({ get: getDoc, set: (ref, data) => { call('set', ref.path, data); } });
`;

const errors = [];
async function account(browser, uid, save, query = '') {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 } });
  await ctx.exposeFunction('__fs', (u, ...a) => fsCall(u, ...a));
  if (THREE) await ctx.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', r => r.fulfill({ path: THREE, contentType: 'text/javascript' }));
  await ctx.route('https://www.gstatic.com/firebasejs/**', (route) => {
    const url = route.request().url();
    route.fulfill({ status: 200, contentType: 'text/javascript', body: url.includes('firebase-app') ? APP : url.includes('firebase-auth') ? AUTH : FS });
  });
  await ctx.addInitScript(([uid, save]) => {
    window.__user = uid;
    if (!localStorage.getItem('pokedb.cloud.v1')) {
      localStorage.setItem('pokedb.cloud.v1', JSON.stringify({ uid, rev: 'r0', dirty: false, localAt: Date.now() }));
      localStorage.setItem('pokedb.save.v2', JSON.stringify(save));
    }
  }, [uid, save]);
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`${uid}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${uid}: ${e.message}`));
  await page.goto(BASE + query);
  await page.waitForTimeout(3000);
  return page;
}

let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); if (!ok) failed++; };
const until = async (fn, ms = 10000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await Promise.resolve().then(fn).catch(() => false)) return true; await new Promise(r => setTimeout(r, 150)); } return false; };

const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args: GL, executablePath: '/opt/pw-browsers/chromium' });
const today = new Date().toISOString().slice(0, 10);
const base = { friendMail: today, setupDone: true, seenHelp: true, coins: 100, stats: { runsWon: 2, runsStarted: 3, playMs: 600000 }, unlocked: [], seen: { relics: [], items: [], cards: [], gym: [] }, newFinds: { relics: [], items: [], cards: [], gym: [] }, dex: { seen: [], defeated: [], done: [], count: {}, complete: false } };
const saveA = { ...base, trainerName: 'ASH', friends: ['uidB'] };
const saveB = { ...base, trainerName: 'MISTY', friends: ['uidA'], partner: 'squirtle' };

// MISTY signs in: her graves doc goes up, empty
const B = await account(browser, 'uidB', saveB);
check(OLD ? !store.has('graves/uidB') : await until(() => store.get('graves/uidB')?.name === 'MISTY'), OLD ? 'old rules: no graves doc, and nothing breaks' : 'signing in writes graves/<uid> with the name');
if (!OLD) check(Array.isArray(store.get('graves/uidB')?.falls) && store.get('graves/uidB').falls.length === 0, 'with no falls yet');

// she starts a real run (not a playtest), comes back to it with 1 HP, walks into a fight and faints
await B.evaluate(async () => {
  const r = await import('./js/run.js'), { STARTERS_BY_ID } = await import('./js/data/starters.js');
  r.beginRun(STARTERS_BY_ID.squirtle, 0);
});
await B.waitForTimeout(4000);
await B.evaluate(async () => {
  const r = await import('./js/run.js');
  const saved = JSON.parse(localStorage.getItem('pokedb.run.v1'));
  saved.hp = 1;
  localStorage.setItem('pokedb.run.v1', JSON.stringify(saved));
  r.continueRun(r.loadSavedRun());
});
await B.waitForTimeout(2500);
const fightAt = await B.evaluate(() => { const b = [...document.querySelectorAll('.map-node.reachable')].find(n => n.classList.contains('type-fight')) || document.querySelector('.map-node.reachable'); b?.click(); return b?.className; });
check(!!fightAt, `a room on floor 1 walked into (${fightAt})`);
await until(() => B.evaluate(() => document.body.dataset.screen === 'battle-screen'), 15000);
for (let i = 0; i < 12 && !(await B.evaluate(() => JSON.parse(localStorage.getItem('pokedb.save.v2') || '{}').falls?.length)); i++) {
  await B.evaluate(() => document.getElementById('end-turn-btn')?.click());
  await B.waitForTimeout(400);
  await B.evaluate(() => { if (document.getElementById('confirm-dialog').open) document.getElementById('confirm-yes').click(); });   // end the turn with energy left
  await B.waitForTimeout(2500);
}
const kept = await B.evaluate(() => (JSON.parse(localStorage.getItem('pokedb.save.v2')).falls || []).map(j => JSON.parse(j)));
check(kept.length === 1, 'the lost run is kept in the save\'s falls');
const f = kept[0] || {};
check(f.mode === 'run' && f.land === 'clearing' && f.floor === 1 && f.foeId && f.starter === 'squirtle', `as a run's fall on the Clearing's floor 1, its foe ${f.foeId} (${f.foe})`);
check(f.hpTrail?.at(-1)?.[0] === 0 && f.deck?.length > 0, 'with its HP chart and deck for the recap');
if (!OLD) check(await until(() => store.get('graves/uidB')?.falls?.length === 1), 'and sent up to graves/<uid>');

// ASH plays the Clearing (a playtest map shows friends' graves too, its flowers saved nowhere)
if (!OLD) {
  const A = await account(browser, 'uidA', saveA, '?biome=clearing&starter=charmander');
  check(await until(() => A.evaluate(() => [...document.querySelectorAll('.map-grave')].some(b => b.getAttribute('aria-label').startsWith('MISTY'))), 15000), 'ASH finds MISTY\'s grave on the map');
  const row = await A.evaluate(() => { const g = document.querySelector('.map-grave'); if (!g) return false; const nodes = [...document.querySelectorAll('.map-node.reachable')]; return nodes.some(n => Math.abs(parseFloat(n.style.top) - parseFloat(g.style.top)) < 3); });
  check(row, 'by a room on floor 1, where she fell');
  check(log.filter(l => l.startsWith('uidA get graves/')).every(l => l === 'uidA get graves/uidB'), 'reading only graves docs of trainers on the list');
  await A.evaluate(() => document.querySelector('.map-grave').click());
  check(await A.evaluate(() => document.getElementById('grave-dialog').open && /MISTY's Squirtle fell here/.test(document.getElementById('grave-sub').textContent)), 'a tap opens her loss recap');
  check(await A.evaluate(() => /HP over the run/i.test(document.getElementById('grave-body').innerText)), 'with her HP over the run');
  const coins = await A.evaluate(() => JSON.parse(localStorage.getItem('pokedb.save.v2')).coins);
  await A.evaluate(() => document.getElementById('grave-respect').click());
  check(await A.evaluate(() => document.getElementById('grave-respect').disabled && document.querySelector('.map-grave.flowers') !== null), 'Pay respects leaves flowers on the stone');
  check(await A.evaluate((c) => JSON.parse(localStorage.getItem('pokedb.save.v2')).coins === c && !JSON.parse(localStorage.getItem('pokedb.save.v2')).graveMarks, coins), 'and a playtest saves nothing');
  const avenge = await A.evaluate(() => ({ off: document.getElementById('grave-avenge').disabled, title: document.getElementById('grave-avenge').title }));
  check(typeof avenge.off === 'boolean', `Avenge says what it does: ${avenge.title}`);

  // and in the Clearing, MISTY's Squirtle walks the Trainer Plaza
  const A2 = await account(browser, 'uidA', saveA);
  check(await until(() => A2.evaluate(() => !!document.querySelector('.buddy-foot')), 15000), 'MISTY\'s buddy is out in the Trainer Plaza');
}

console.log(errors.length ? `page errors:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
if (errors.length) failed++;
console.log(failed ? `${failed} FAILED` : 'all graves checks passed');
process.exit(failed ? 1 : 0);
