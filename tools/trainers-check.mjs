// Headless check of the Trainers app (js/trainers.js) with two stand-in accounts sharing one in-memory Firestore that
// mirrors firestore.rules; gstatic is routed to stand-in SDK modules. Serve the repo (python3 -m http.server 8123), then:
// node tools/trainers-check.mjs [three.module.min.js]
// The Clearing and the base visit need Three.js r160 on disk, as tools/model-check.mjs: `npm i three@0.160.0` (or
// `npm pack three@0.160.0`) in a scratch folder and pass its build/three.module.min.js, or point THREE_JS at it.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:8123/';
const THREE = process.argv[2] || process.env.THREE_JS || '/tmp/three/node_modules/three/build/three.module.min.js';
const store = new Map();   // path -> data
const log = [];
const denied = () => ({ error: 'permission-denied' });
const isCode = (c) => /^[A-HJKMNP-Z]{8}$/.test(c);

function rulesAllow(op, path, data, uid) {
  const [col, id] = path.split('/');
  if (!uid) return false;
  if (col === 'saves') return id === uid;
  if (op === 'set' && store.has(path) && col === 'codes') return false;
  if (col === 'codes') {
    if (op === 'get') return true;
    if (store.has(path)) return false;   // update: never
    return isCode(id) && Object.keys(data).join() === 'uid' && data.uid === uid;
  }
  if (col === 'trainers') {
    if (op === 'get') return true;
    if (id !== uid) return false;
    const owner = store.get(`codes/${data.code}`)?.uid;
    return owner === uid && Object.keys(data).every(k => ['code', 'name', 'card', 'buddy', 'base', 'at'].includes(k)) && data.name.length <= 16;
  }
  if (col === 'plaza') return op === 'get' || op === 'query' || id === uid;
  if (col === 'adds') {
    const cur = store.get(path);
    if (op === 'get') return cur?.to === uid;
    if (op === 'delete') return cur && (cur.to === uid || cur.from === uid);
    if (op === 'update') return cur?.to === uid && Object.keys(data).join() === 'seen' && data.seen === true;
    return data.from === uid && id === `${data.to}_${data.from}` && data.seen === false && (!cur || cur.from === uid);
  }
  if (col === 'safariBoard' || col === 'towerBoard' || col === 'arcadeBoard') return op === 'get' || op === 'query';
  return false;
}

function fsCall(uid, op, path, data, filter) {
  if (op === 'query') {
    if (path === 'adds' && filter?.[1] !== uid) { log.push(`DENIED ${uid} list adds`); return denied(); }
    const out = [...store.entries()].filter(([p, d]) => p.startsWith(`${path}/`) && (!filter || d[filter[0]] === filter[1])).map(([p, d]) => ({ path: p, data: d }));
    return { docs: out };
  }
  if (!rulesAllow(op === 'get' ? 'get' : op, path, data, uid)) { log.push(`DENIED ${uid} ${op} ${path}`); return denied(); }
  if (op === 'get') return { exists: store.has(path), data: store.get(path) ?? null };
  if (op === 'delete') { store.delete(path); log.push(`${uid} deleted ${path}`); return { ok: true }; }
  if (op === 'update') { store.set(path, { ...store.get(path), ...data }); log.push(`${uid} updated ${path}`); return { ok: true }; }
  const d = JSON.parse(JSON.stringify(data), (k, v) => (v === '__serverTime__' ? Date.now() : v));
  store.set(path, d);
  log.push(`${uid} wrote ${path}`);
  return { ok: true };
}

const APP = `export const initializeApp = () => ({});`;
const AUTH = `
export const getAuth = () => ({});
export const onAuthStateChanged = (auth, cb) => { setTimeout(() => cb(window.__user ? { uid: window.__user, email: window.__user + '@test' } : null), 50); return () => {}; };
export const isSignInWithEmailLink = () => false;
export class GoogleAuthProvider {}
export const signOut = async () => {};
for (const n of ['signInWithPopup','signInWithRedirect','signInWithEmailLink','sendSignInLinkToEmail','createUserWithEmailAndPassword','signInWithEmailAndPassword','sendPasswordResetEmail']) globalThis['__' + n] = async () => {};
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
export const query = (c, ...parts) => ({ path: c.path, filter: parts.find(p => p.where)?.where });
export const serverTimestamp = () => '__serverTime__';
export const getDoc = async (ref) => snap(ref.path, await call('get', ref.path));
export const setDoc = async (ref, data) => { await call('set', ref.path, data); };
export const orderBy = () => ({});
export const deleteDoc = async (ref) => { await call('delete', ref.path); };
export const updateDoc = async (ref, data) => { await call('update', ref.path, data); };
export const getDocs = async (q) => ({ docs: (await call('query', q.path, null, q.filter)).docs.map(d => ({ id: d.path.split('/').pop(), data: () => wrap(d.data) })) });
export const runTransaction = async (db, fn) => fn({ get: getDoc, set: (ref, data) => { call('set', ref.path, data); } });
`;

const errors = [];
async function account(browser, uid, save) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.exposeFunction('__fs', (u, ...a) => fsCall(u, ...a));
  await ctx.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', r => r.fulfill({ path: THREE, contentType: 'text/javascript' }));
  await ctx.route('https://www.gstatic.com/firebasejs/**', (route) => {
    const url = route.request().url();
    const body = url.includes('firebase-app') ? APP : url.includes('firebase-auth') ? AUTH : FS;
    route.fulfill({ status: 200, contentType: 'text/javascript', body });
  });
  await ctx.addInitScript(([uid, save]) => {
    window.__user = uid;
    if (!localStorage.getItem('pokedb.cloud.v1')) {
      localStorage.setItem('pokedb.cloud.v1', JSON.stringify({ uid, rev: 'r0', dirty: false, localAt: Date.now() }));
      localStorage.setItem('pokedb.save.v2', JSON.stringify(save));
    }
  }, [uid, save]);
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`${uid}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${uid} (after check ${checks}): ${e.message}`));
  await page.goto(BASE);
  await page.waitForTimeout(2500);
  return page;
}

let checks = 0;
const check = (ok, what) => { checks++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); if (!ok) process.exitCode = 1; };
const until = async (fn, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await Promise.resolve().then(fn).catch(() => false)) return true; await new Promise(r => setTimeout(r, 100)); } return false; };

const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args: GL, executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch({ args: GL }));
// friendMail: today's friend letter already in, or the Clearing (which runs once Three.js loads) writes the save on load
const today = new Date().toISOString().slice(0, 10);
const saveA = { friendMail: today, trainerName: 'ASH', setupDone: true, seenHelp: true, coins: 500, badges: ['first-win', 'champion'], stats: { runsWon: 7, runsStarted: 10, playMs: 3 * 3600000 + 25 * 60000 }, unlocked: [], seen: { relics: [], items: [], cards: [], gym: [] }, newFinds: { relics: [], items: [], cards: [], gym: [] }, dex: { seen: [], defeated: [], done: [], count: {}, complete: false } };
// A's base (session 2's visits): a TV, a PC and a Berry plot, a present and a piece this game doesn't know (both
// dropped on a visit), a Safari resident and a made-up one
saveA.secretBase = { v: 2, wall: 'mint', floor: 'checker', shopOpens: 1, leaderVisit: 99999, mons: ['rattata', 'hax'],
  items: [{ id: 'window', x: 4 }, { id: 'rug', x: 4, y: 3, dir: 0 }, { id: 'bed', x: 0, y: 0, dir: 0 }, { id: 'lamp', x: 2, y: 0, dir: 0 },
    { id: 'tv', x: 7, y: 0, dir: 0 }, { id: 'pc', x: 9, y: 0, dir: 0 }, { id: 'gift', x: 5, y: 3, dir: 0 }, { id: 'hax', x: 1, y: 3 },
    { id: 'trophycase', x: 6, y: 2, dir: 0 }],
  owned: { window: 1, rug: 1, bed: 1, lamp: 1, tv: 1, trophycase: 1 },
  // what A's trophy case showed at home: three trophies (B's save has none)
  liveSeen: { trophycase: '111000000000' },
  house: { big: false, rooms: [], links: [], yard: { size: 1, met: 1, wall: 'cream', floor: 'grass', items: [{ id: 'berryplot', x: 2, y: 2, dir: 0 }] } } };
const saveB = { ...saveA, trainerName: 'MISTY', badges: [], stats: { runsWon: 1, runsStarted: 2, playMs: 600000 },
  secretBase: { v: 2, wall: 'cream', floor: 'wood', shopOpens: 1, leaderVisit: 99999, items: [{ id: 'bed', x: 0, y: 0, dir: 0 }], owned: { bed: 1 } } };

// someone on a leaderboard who has never opened the game since Trainers came in
const day = new Date().toISOString().slice(0, 10);
store.set(`safariBoard/${day}_uidC`, { day, uid: 'uidC', name: 'BROCK', starter: 'charmander', won: true, area: 3, bosses: 3, turns: 90, time: 1500, caught: 4, at: Date.now() });

const A = await account(browser, 'uidA', saveA);
check(await until(() => store.has('trainers/uidA')), 'A\'s page is written on sign-in');
const pageA = store.get('trainers/uidA');
const codeA = pageA?.code;
check(isCode(codeA) && store.get(`codes/${codeA}`)?.uid === 'uidA', `A claimed a code (${codeA})`);
check(pageA?.name === 'ASH' && pageA.card.wins === 7 && pageA.card.time === 205 && typeof pageA.buddy === 'string' && pageA.card.partner.startsWith('starter:'), 'A\'s page carries name, card, buddy');
const savedA = await A.evaluate(() => localStorage.getItem('pokedb.save.v2'));
check(!savedA.includes(codeA) && !savedA.includes('trainerCode'), 'publishing writes nothing into the save (so no "Two saves found")');

const B = await account(browser, 'uidB', saveB);
check(await until(() => store.has('trainers/uidB')), 'B\'s page is written on sign-in');
const codeB = store.get('trainers/uidB').code;
check(codeB !== codeA, 'B got a code of their own');

// B can't write A's page or take A's code
const forge = await B.evaluate(async ([codeA]) => {
  const F = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js');
  const tries = [];
  for (const [path, data] of [['trainers/uidA', { code: codeA, name: 'HAX', card: {}, buddy: '', at: 1 }], [`codes/${codeA}`, { uid: 'uidB' }], ['trainers/uidB', { code: codeA, name: 'HAX', card: {}, buddy: '', at: 1 }]]) {
    try { await F.setDoc(F.doc({}, path), data); tries.push('ok'); } catch (e) { tries.push(e.code); }
  }
  return tries;
}, [codeA]);
check(forge.every(t => t === 'permission-denied'), `forging A's page or code is refused (${forge})`);

// B opens the Trainers app and adds A by code
const openTrainers = (p, at) => p.evaluate(async (at) => { (await import('./js/collection.js')).openDeviceApp('trainers', at); }, at);
await openTrainers(B);
// the first open, signed in: the TRAINER NETWORK welcome, once
check(await until(async () => !!(await B.$('.tn-welcome .tn-box.done')), 30000), 'the welcome comes up the first time the app opens');
check((await B.textContent('.tn-welcome .tn-name')).replace('-', '') === codeB && (await B.textContent('.tn-count')) === '1/6', 'it shows B\'s code, 1/6');
const pages = [];
for (let i = 0; i < 6; i++) {
  await B.waitForFunction(() => document.querySelector('.tn-box.done') && !document.querySelector('.tn-scrim')?.dataset.busy, null, { timeout: 30000 });
  pages.push(await B.textContent('.tn-text'));
  if (i < 5) await B.click('.tn-a');
}
check(pages.some(l => l.includes('Trainer Plaza')) && pages.some(l => l.includes('TRAINER LINK')) && pages.at(-1).includes('Secret Base'), 'its pages: the Plaza, TRAINER LINK, and visits coming soon');
check((await B.textContent('.tn-a')).includes('LET\'S GO!'), 'the last key says LET\'S GO!');
await B.click('.tn-a');
check(await until(async () => !(await B.$('.tn-scrim'))), 'and it closes');
check(await B.evaluate(() => JSON.parse(localStorage.getItem('pokedb.save.v2')).trainersWelcome === true), 'it\'s marked seen in the save');
await B.click('.trn-help');
check(await until(async () => !!(await B.$('.tn-welcome'))), 'the ? key plays it again');
await B.waitForFunction(() => document.querySelector('.tn-box.done'), null, { timeout: 20000 });
await B.click('.tn-b');
check(await until(async () => !(await B.$('.tn-scrim'))), 'Skip closes it');
await B.waitForSelector('.trn-code-text');
check(await until(async () => (await B.textContent('.trn-code-text')).replace('-', '') === codeB), 'B sees their own code in the app');
const add = async (p, text) => { await p.fill('.trn-input', text); await p.click('.trn-add button[type=submit]'); await p.waitForTimeout(600); return p.textContent('.trn-said').catch(() => ''); };
check((await add(B, 'nope')).includes('8 letters'), 'a malformed code is caught');
check((await add(B, 'ZZZZ-ZZZZ')).includes('No trainer has'), 'an unknown code says so');
check((await add(B, codeB.toLowerCase())).includes('your own code'), 'B\'s own code says so');
await add(B, `${codeA.slice(0, 4)} ${codeA.slice(4).toLowerCase()}`);
const friendsB = () => B.evaluate(() => JSON.parse(localStorage.getItem('pokedb.save.v2')).friends || []);
check((await friendsB()).includes('uidA'), 'A is on B\'s list (save.friends)');
check(await until(async () => (await B.textContent('.pdx-banners')).includes('ASH')), 'A\'s banner shows their name');
const banner = await B.textContent('.trn-banner:not(.trn-plaza):not(.trn-added)');
check(/Online just now|min ago/.test(banner) && banner.includes('1 badge'), `A's banner: last seen and badges (${banner.replace(/\s+/g, ' ').trim()})`);
await B.click('.trn-banner:not(.trn-plaza):not(.trn-added)');
await B.waitForTimeout(900);
const pageText = (await B.textContent('.trn-device')).replace(/\s+/g, ' ');
check(pageText.includes('Wins 7') && pageText.includes('Time 3:25') && pageText.includes('Badges 1'), 'A\'s Trainer Card on B\'s handheld');
check(store.get('trainers/uidA').base && JSON.parse(store.get('trainers/uidA').base).items.length === 9, 'A\'s page carries their base');
check((await B.$$('.trn-visit')).length === 2 && !(await B.isDisabled('.trn-visit[data-start=main]')), 'a base with a backyard offers Visit house and Visit yard');

// B visits A's base: walked round as A left it, nothing of B's saved
// first let any upload already queued (the welcome's seen flag, the list) finish, so only the visit can change things
await until(() => B.evaluate(() => JSON.parse(localStorage.getItem('pokedb.cloud.v1') || '{}').dirty === false), 20000);
await B.waitForTimeout(1000);
const before = await B.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
const pageB = store.get('trainers/uidB').base;
await B.click('.trn-visit[data-start=main]');
check(await until(async () => (await B.textContent('.base3d.guest .b3-top h2').catch(() => '')) === 'ASH\'s Base', 15000), 'Visit opens A\'s base, named for them');
await B.waitForTimeout(2500);
const inside = await B.evaluate(async () => {
  const d = document.querySelector('.base3d');
  const shown = (s) => { const e = d.querySelector(s); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; };
  return { decor: shown('.b3-decor'), garden: shown('.b3-garden'), talk: shown('.b3-talk'), gift: shown('.b3-gift'), hint: d.querySelector('.b3-hint').textContent };
});
check(!inside.decor && !inside.garden, 'no Decorate or Garden key on a visit');
check(!inside.talk && !inside.gift, 'no Smeargle, present or visitor on a visit');
check(inside.hint.includes('ASH\'s Secret Base'), `the hint says whose base it is (${inside.hint})`);
const read = await B.evaluate(async (json) => { const b = (await import('./js/secret-base.js')).readGuestBase(json); return { ids: b.items.map(i => i.id), mons: b.mons }; }, store.get('trainers/uidA').base);
check(!read.ids.includes('gift') && !read.ids.includes('hax') && read.ids.length === 7, `their present and unknown pieces are left out (${read.ids})`);
check(await B.evaluate(async () => (await import('./js/secret-base.js')).readGuestBase('{"v":2,"items":"x"}') === null && (await import('./js/secret-base.js')).readGuestBase('not json') === null), 'a base that isn\'t one is refused');
// every way a tap could write: try the base's writers straight, and walk about by tapping the room
const tries = await B.evaluate(async () => {
  const sb = await import('./js/secret-base.js'), b = sb.loadBase();
  sb.saveBase({ ...b, wall: 'stars' }); sb.meetSmeargle(b); sb.buyPiece(b, 'tv'); sb.leaderVisited(b); sb.openGift(b);
  const c = document.querySelector('.b3-view'), r = c.getBoundingClientRect();
  for (const [x, y] of [[0.5, 0.5], [0.3, 0.6], [0.7, 0.4], [0.5, 0.3]]) c.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width * x, clientY: r.top + r.height * y, bubbles: true }));
  return true;
});
await B.waitForTimeout(1500);
check(tries, 'taps and base writes during the visit ran');
const cases = await B.evaluate(async () => { const { PIECES } = await import('./js/base-furniture.js'); return PIECES.trophycase.live(); });
check(cases === '111000000000', `A's trophy case shows A's trophies, not B's (${cases})`);
await B.evaluate(async () => (await import('./js/base-3d.js')).leave());
check(await until(async () => !(await B.$('body > .base3d'))), 'the doormat takes B home');
const mine = await B.evaluate(async () => { const { PIECES } = await import('./js/base-furniture.js'); return PIECES.trophycase.live(); });
check(mine === '100000000000', `home again, trophy cases read B's own save, one win (${mine})`);
// and out to A's backyard, through Visit yard
await openTrainers(B);
await B.waitForTimeout(1200);
await B.click('.trn-banner:not(.trn-plaza):not(.trn-added)');
await B.waitForTimeout(900);
await B.click('.trn-visit[data-start=yard]');
check(await until(async () => (await B.textContent('.base3d.guest .b3-top h2').catch(() => '')) === 'ASH\'s Backyard', 15000), 'Visit yard opens A\'s backyard');
await B.waitForTimeout(1500);
check(await B.evaluate(() => { const g = document.querySelector('.b3-garden'); return g.hidden || getComputedStyle(g).display === 'none'; }), 'no Garden key in their yard');
await B.evaluate(async () => (await import('./js/base-3d.js')).leave());
await until(async () => !(await B.$('body > .base3d')));
await B.waitForTimeout(1500);
await B.waitForTimeout(1500);
const after = await B.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
// the play clock (stats.playMs) ticks on whatever you do, so it's left out
const noClock = (all) => { const o = { ...all }; if (o['pokedb.save.v2']) { const d = JSON.parse(o['pokedb.save.v2']); delete d.stats.playMs; o['pokedb.save.v2'] = JSON.stringify(d); } return o; };
Object.assign(before, noClock(before)); Object.assign(after, noClock(after));
// the save and the cloud save's record of it; the Clearing keeps notes of its own (a Halloween greeter's hello) as B comes home
const changed = ['pokedb.save.v2', 'pokedb.cloud.v1'].filter(k => before[k] !== after[k]);
if (changed.includes('pokedb.save.v2')) { const x = JSON.parse(before['pokedb.save.v2']), y = JSON.parse(after['pokedb.save.v2']); console.log('save fields changed:', Object.keys({ ...x, ...y }).filter(k => JSON.stringify(x[k]) !== JSON.stringify(y[k])).map(k => `${k}: ${JSON.stringify(x[k])?.slice(0, 200)} -> ${JSON.stringify(y[k])?.slice(0, 200)}`)); }
check(!changed.length, `visiting and leaving leaves B's save exactly as it was${changed.length ? ` (changed: ${changed})` : ''}`);
check(store.get('trainers/uidB').base === pageB, 'leaving a friend\'s base doesn\'t publish it as B\'s');
// B's own base afterwards is B's again, and saves again
await B.evaluate(async () => (await import('./js/base-3d.js')).openBase3d({ onLeave: async () => {} }));
check(await until(async () => (await B.textContent('.base3d:not(.guest) .b3-top h2').catch(() => '')) === 'Secret Base', 15000), 'B\'s own base opens as theirs after');
const own = await B.evaluate(async () => { const sb = await import('./js/secret-base.js'), b = sb.loadBase(); b.wall = 'stars'; sb.saveBase(b); return JSON.parse(localStorage.getItem('pokedb.save.v2')).secretBase.wall; });
check(own === 'stars', 'and B\'s own base saves again');
await B.evaluate(async () => (await import('./js/base-3d.js')).leave());
await B.waitForTimeout(1500);
await openTrainers(B);
await B.waitForTimeout(1200);

// back out, close the device
await B.keyboard.press('Escape'); await B.waitForTimeout(500);
await B.keyboard.press('Escape'); await B.waitForTimeout(500);
await B.keyboard.press('Escape'); await B.waitForTimeout(800);

// B adds BROCK from the Safari leaderboard
await B.evaluate(async () => { (await import('./js/leaderboard.js')).openLeaderboard(0, 'safari'); });
await B.waitForSelector('#board-dialog[open] .bdx-banner:not(.empty)', { timeout: 20000 });
await B.click('#board-dialog .bdx-banner:not(.empty)');
await B.waitForTimeout(900);
const addKey = await B.$('#board-dialog .lb-add');
check(!!addKey && (await addKey.textContent()).includes('Add to Trainers'), 'BROCK\'s leaderboard page offers Add to Trainers');
await addKey?.click();
await B.waitForTimeout(200);
check((await friendsB()).includes('uidC') && (await addKey.textContent()).includes('In your Trainers'), 'BROCK added from the leaderboard');
await B.evaluate(() => document.getElementById('board-dialog').close());
await B.waitForTimeout(400);

// in the app, BROCK has no page yet; remove takes two taps
await openTrainers(B);
check(await until(async () => (await B.$$('.trn-banner:not(.trn-plaza):not(.trn-added)')).length === 2), 'two trainers on B\'s list');
const brock = (await B.$$('.trn-banner:not(.trn-plaza):not(.trn-added)'))[1];
check((await brock.textContent()).includes('Not on the network yet'), 'a trainer with no page yet says so');
await brock.click();
await B.waitForTimeout(900);
await B.click('.trn-remove');
check((await friendsB()).includes('uidC'), 'one tap on Remove only asks');
await B.click('.trn-remove');
await B.waitForTimeout(400);
check(!(await friendsB()).includes('uidC') && (await friendsB()).includes('uidA'), 'a second tap removes them');
check((await B.$$('.trn-banner:not(.trn-plaza):not(.trn-added)')).length === 1, 'the list redraws without them');
for (let i = 0; i < 4; i++) { await B.keyboard.press('Escape'); await B.waitForTimeout(600); }

// the PC letter, once, with B's code; the PC's row and the Trainer Card show it too
await B.evaluate(async () => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); (await import('./js/pc.js')).openPC(); });
await B.waitForSelector('.pc-menu', { timeout: 15000 });
await B.waitForTimeout(500);
const mail = await B.evaluate(() => JSON.parse(localStorage.getItem('pokedb.save.v2')).mail || []);
const letter = mail.find(m => m.from === 'trainers');
check(letter?.code === codeB, 'the PC posted the trainer-code letter');
const pcText = (await B.textContent('.pc-screen')).replace(/\s+/g, ' ');
check(pcText.includes('TRAINERS') && pcText.includes(`${codeB.slice(0, 4)}-${codeB.slice(4)}`), 'the PC\'s TRAINERS row shows the code');
await B.evaluate(async () => { const pc = await import('./js/pc.js'); document.querySelector('.pc-off').click(); });
await B.waitForTimeout(600);
await B.evaluate(async () => { (await import('./js/pc.js')).openPC(); });
await B.waitForTimeout(1500);
check((await B.evaluate(() => JSON.parse(localStorage.getItem('pokedb.save.v2')).mail.filter(m => m.from === 'trainers').length)) === 1, 'the letter comes only once');
await B.click('.pc-row');   // MAILBOX
await B.waitForTimeout(500);
await B.click('.pc-env');
await B.waitForTimeout(500);
const letterText = (await B.textContent('.pc-letter')).replace(/\s+/g, ' ');
check(letterText.includes('YOUR CODE') && letterText.includes(`${codeB.slice(0, 4)}-${codeB.slice(4)}`), 'the letter shows the code');
await B.evaluate(() => document.querySelector('.pc-claim').click());
await B.waitForTimeout(400);
check((await B.textContent('.pc-letter')).includes('READ'), 'reading it marks it READ');
await B.evaluate(() => document.querySelector('.pc-off').click());
await B.waitForTimeout(500);
const card = await B.evaluate(async () => { const box = document.createElement('div'); (await import('./js/trainercard.js')).openTrainerCard(box); return box.textContent; });
check(card.includes('CODE') && card.includes(`${codeB.slice(0, 4)}-${codeB.slice(4)}`), 'the Trainer Card shows the code');


// ---------- the Plaza, the notes and the TRAINER LINK pop-up ----------
check(!!store.get('plaza/uidA') && store.get('plaza/uidA').name === 'ASH' && !('base' in store.get('plaza/uidA')), 'A stands in the Plaza, as a blurb');
check(store.get('adds/uidA_uidB')?.name === 'MISTY' && store.get('adds/uidA_uidB').seen === false, 'B adding A left A a note');
check(!store.has('adds/uidC_uidB'), 'removing BROCK took B\'s note back');
store.set('adds/uidA_uidC', { from: 'uidC', to: 'uidA', name: 'BROCK', buddy: 'starter:bulbasaur', partner: 'starter:bulbasaur:1', tier: 'silver', badges: 5, wins: 2, seen: false, at: Date.now() - 3600000 });
await A.reload();
check(await until(async () => !!(await A.$('.tn-scrim')), 60000), 'A gets the TRAINER LINK pop-up on loading');
await A.waitForFunction(() => document.querySelector('.tn-box.done'), null, { timeout: 20000 });
const first = (await A.textContent('.tn-card')).replace(/\s+/g, ' ');
check(first.includes('MISTY') && first.includes('1/2') && first.includes('ADD BACK') && first.includes('LATER'), `the first card: MISTY, 1/2, A and B (${first.slice(0, 120)})`);
await A.click('.tn-a');
await A.waitForTimeout(400);
check((await A.textContent('.tn-card')).includes('LINKED!'), 'Add back stamps LINKED!');
check(await until(async () => (await A.evaluate(() => JSON.parse(localStorage.getItem('pokedb.save.v2')).friends || [])).includes('uidB')), 'B is on A\'s list');
check(await until(() => store.get('adds/uidB_uidA')?.from === 'uidA'), 'A adding back left B a note');
check(await until(() => store.get('adds/uidA_uidB')?.seen === true), 'MISTY\'s note is marked seen');
await A.waitForFunction(() => document.querySelector('.tn-count')?.textContent === '2/2' && document.querySelector('.tn-box.done'), null, { timeout: 20000 });
check((await A.textContent('.tn-name')) === 'BROCK', 'then BROCK, 2/2');
await A.click('.tn-b');
await A.waitForTimeout(600);
check(!(await A.$('.tn-scrim')) && store.get('adds/uidA_uidC')?.seen === true, 'Later closes it and marks it seen');
check(!(await A.evaluate(() => JSON.parse(localStorage.getItem('pokedb.save.v2')).friends || [])).includes('uidC'), 'Later doesn\'t add them');
await A.reload();
await A.waitForTimeout(12000);
check(!(await A.$('.tn-scrim')), 'answered notes don\'t pop up again');
await openTrainers(A);
await A.waitForFunction(() => document.querySelector('.tn-welcome .tn-box.done'), null, { timeout: 30000 });
await A.click('.tn-b');
await A.waitForTimeout(400);
check(await until(async () => !!(await A.$('.trn-added'))), 'BROCK waits under "Added you"');
check((await A.textContent('.trn-plaza')).includes('Trainer Plaza'), 'A sees the Trainer Plaza');
await A.click('.trn-added');
await A.waitForTimeout(900);
check((await A.textContent('.trn-device')).includes('BROCK added you'), 'BROCK\'s page says they added you');
await A.click('.trn-addkey');
await A.waitForTimeout(500);
check((await A.evaluate(() => JSON.parse(localStorage.getItem('pokedb.save.v2')).friends || [])).includes('uidC') && !(await A.$('.trn-added')), 'Add back from the app; the banner goes');
check((await A.textContent('.trn-said')).includes('BROCK is on your list now'), 'and it says so');

// B: A added back, so B's pop-up says linked, with OK only
await B.reload();
check(await until(async () => !!(await B.$('.tn-box.done')), 30000), 'B gets a pop-up too');
const mutual = (await B.textContent('.tn-card')).replace(/\s+/g, ' ');
check(mutual.includes('TRAINER LINKED') && mutual.includes('added you back') && !mutual.includes('LATER'), 'it says ASH added B back, OK only');
await B.keyboard.press('Enter');
check(await until(async () => !(await B.$('.tn-scrim')), 10000), 'A on the keyboard answers it');

// B finds GARY in the Plaza and adds him; then hides from it
store.set('plaza/uidD', { name: 'GARY', buddy: 'starter:charmander', partner: 'starter:charmander:2', tier: 'violet', badges: 40, wins: 88, at: Date.now() - 60000 });
await openTrainers(B, 'plaza');
check(await until(async () => !!(await B.$('.trn-device.bdx-plaza'))), 'the board\'s Look opens the app straight onto the Plaza');
await B.waitForTimeout(600);
const plazaPage = (await B.textContent('.trn-device')).replace(/\s+/g, ' ');
check(plazaPage.includes('ASH') || plazaPage.includes('GARY'), `the Plaza lists trainers on lately (${plazaPage.slice(0, 80)})`);
for (let i = 0; i < 3 && !(await B.textContent('.pdx-name')).includes('GARY'); i++) { await B.click('.pdx-round[aria-label=Next]'); await B.waitForTimeout(500); }
check((await B.textContent('.pdx-name')).includes('GARY') && (await B.textContent('.trn-addkey')).includes('+ Add'), 'GARY has + Add');
await B.click('.trn-addkey');
await B.waitForTimeout(500);
check((await friendsB()).includes('uidD') && store.get('adds/uidD_uidB')?.name === 'MISTY', 'B adds GARY from the Plaza; GARY gets a note');
check(!plazaPage.includes('MISTY'), 'B isn\'t shown themselves in the Plaza');
await B.click('.trn-spot button');
check(await until(() => !store.has('plaza/uidB')), 'Hide me takes B out of the Plaza');
check(await B.evaluate(() => JSON.parse(localStorage.getItem('pokedb.save.v2')).plazaHidden === true), 'and B stays hidden');

const publishedAt = store.get('trainers/uidA').at;
await A.reload();
await until(() => store.get('trainers/uidA').at !== publishedAt, 30000);
await A.waitForTimeout(1500);
check(store.get('trainers/uidA').code === codeA && [...store.keys()].filter(k => k.startsWith('codes/')).length === 2, 'A keeps one code across loads');
const out = await A.evaluate(async () => { localStorage.setItem('pokedb.cloud.v1', '{}'); return (await import('./js/trainers.js')).myCode(); });
check(out === null, 'signed out, no code is shown');

console.log('\nwrites:', log.filter(l => !l.startsWith('DENIED')).length, '· denied:', log.filter(l => l.startsWith('DENIED')).join(' | '));
console.log(errors.length ? `console errors:\n${errors.join('\n')}` : 'no console errors');
await browser.close();
