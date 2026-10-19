/* duo-probe.mjs  -  the Duo Run end to end, headless (docs/duo-design.md): the Safari lobby's Duo key, two picks, Start
   Duo (the Day Pass bought), the map, a wild fight, a switch (PP, type, Ability, the bench chip), a won fight's card
   reward (a card of each type), and the run's save:
     NODE_PATH=$(npm root -g) node tools/duo-probe.mjs [--pair=fire,water]
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const args = process.argv.slice(2), opt = (k, d) => args.find(a => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const PAIR = opt('pair', 'fire,water').split(',');
const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + '\nwindow.__battle = () => battle;\nwindow.__win = () => { if (!battle || battle.over) return false; battle.enemy.hp = 0; finish(true); return true; };\n'
  : body;

const three = await threeCopy(opt('three', ''));
const { server, port } = serve(HOOK);
const browser = await launch();
const { page, errors } = await phone(browser, three);
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const click = (sel) => page.evaluate(s => { const n = document.querySelector(s); if (!n) return false; n.click(); return true; }, sel);
const screen = () => page.evaluate(() => document.body.dataset.screen || [...document.querySelectorAll('section')].find(s => !s.hidden)?.id || '');

await page.goto(`http://localhost:${port}/?duorun&coins=500`);
await page.waitForTimeout(9000);
await page.evaluate(() => import('/js/safariprep.js').then(m => m.openSafariPrep()));
await page.waitForTimeout(1500);
check(await page.evaluate(() => document.querySelector('#safari-prep-dialog').open), 'the Safari lobby opens');
await click('#sp-duo');
await page.waitForTimeout(800);
const app = await page.evaluate(() => ({ picks: document.querySelectorAll('.duo-pick').length, areas: document.querySelectorAll('.duo-area').length, a: document.querySelector('#sp-start-label').textContent }));
check(app.picks >= 3 && app.areas === 3, `the Duo app shows the pool (${app.picks}) and today's road (${app.areas})`);
check(app.a === 'Pick 2', `A reads "${app.a}" before a pick`);
for (const t of PAIR) await click(`.duo-pick.type-${t} .duo-face`);
await page.waitForTimeout(400);
const fares = await page.evaluate(() => [...document.querySelectorAll('.duo-fares')].map(n => n.textContent));
check(fares.length === 3, `each area says how the pair fares: ${fares[0]}`);
check(await page.evaluate(() => document.querySelector('#sp-start-label').textContent) === 'Start Duo', 'A reads Start Duo');
await click('#sp-start');
await page.waitForTimeout(1200);
// the Day Pass: the probe's save has played no Daily run, so safariTicket() treats the first try as free; either way, yes
for (let i = 0; i < 3; i++) { await click('#confirm-yes'); await page.waitForTimeout(800); }
await page.waitForTimeout(9000);
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /run/.test(k) && localStorage.getItem(k).includes('"duo"')) || 'null') || 'null'));
check(!!saved?.duo, `the run saves its duo: ${JSON.stringify(saved?.duo)}`);
check(saved?.deck?.length === 10, `a 5 + 5 deck: ${saved?.deck?.join(' ')}`);
check(saved?.safari && saved.safari.first === false, 'a Duo Run is never the first try (no leaderboard)');

// into the first fight on the map
for (let i = 0; i < 20 && (await screen()) !== 'battle-screen'; i++) {
  await page.evaluate(() => {
    const vis = (n) => n && n.getClientRects().length && !n.disabled;
    const node = [...document.querySelectorAll('.map-node.reachable, .map-node')].find(n => vis(n) && /fight|wild/.test(n.className + n.dataset.type));
    (node || [...document.querySelectorAll('#confirm-yes, .travel-skip, dialog[open] button')].find(vis) || document.body).click();
  });
  await page.waitForTimeout(1500);
}
check((await screen()) === 'battle-screen', 'a wild fight starts');
for (let i = 0; i < 20 && await page.evaluate(() => window.__battle()?.busy !== false); i++) await page.waitForTimeout(700);
const before = await page.evaluate(() => { const b = window.__battle(); return { type: b.starter.type, energy: b.energy, ability: b.ability?.id, bench: !document.querySelector('#player-bench').hidden, title: document.querySelector('#player-bench').title }; });
check(before.bench, `the bench chip shows: ${before.title}`);
check(before.type === PAIR[0], `the lead is out first (${before.type}, ${before.ability})`);
await click('#player-bench');
await page.waitForTimeout(200);
check(await page.evaluate(() => !document.querySelector('#switch-go').hidden), `a first tap arms the switch: "${await page.evaluate(() => document.querySelector('#switch-go').textContent)}"`);
await click('#switch-go');
for (let i = 0; i < 12 && await page.evaluate(() => window.__battle()?.busy); i++) await page.waitForTimeout(400);
const after = await page.evaluate(() => { const b = window.__battle(); return { type: b.starter.type, energy: b.energy, ability: b.ability?.id, tide: b.tide, name: document.querySelector('#player-name').textContent, theme: document.body.dataset.theme }; });
check(after.type === PAIR[1] && after.theme === PAIR[1], `the partner is out: ${after.name} (${after.type}, ${after.ability})`);
check(after.energy === before.energy - 1, `the switch cost 1 PP (${before.energy} -> ${after.energy})`);
if (PAIR[1] === 'water') check(after.tide >= 2, `Torrent fires the first time Water comes out (Tide ${after.tide})`);
const edges = await page.evaluate(() => [...document.querySelectorAll('#hand .card')].map(c => c.querySelector('.card-type')?.title).filter(Boolean));
check(edges.length > 0, `cards of the type out carry the STAB hint: ${edges[0]}`);

await page.evaluate(() => window.__win());
await page.waitForTimeout(4000);
for (let i = 0; i < 6; i++) {
  const types = await page.evaluate(() => [...document.querySelectorAll('#reward-options .card, .reward-options .card')].map(c => [...c.classList].find(k => k.startsWith('type-'))));
  if (types.length) {
    const own = types.filter(t => PAIR.includes(t.slice(5)));
    check(types.length >= 3, `the card reward: ${types.join(' ')}`);
    check(PAIR.every(t => types.includes(`type-${t}`)) || own.length < 3, 'a card of each type (Neutral may take a slot)');
    break;
  }
  await click('#confirm-yes');
  await page.waitForTimeout(1500);
}
const outAfter = await page.evaluate(() => window.__battle()?.duo?.run.out);
check(outAfter === 1, 'whoever was out at the knockout stays out for the next fight');

const bad = errors.filter(e => !/favicon|net::|Failed to load resource|cloud|firebase|gstatic/i.test(e));
check(!bad.length, `no console errors${bad.length ? `: ${bad.slice(0, 3).join(' | ')}` : ''}`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
