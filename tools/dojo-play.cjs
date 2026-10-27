/* dojo-play.cjs  -  plays a line through a Kenmatta's dojo trial (js/data/dojo.js) on the real battle screen, in headless
   Chromium: the trial's own Pokémon, deck, foe and goal, as js/run.js's trialFight() sets it up, then says whether
   it earns the star (trialMissed()). Find the line with tools/dojo-solve.mjs. Needs the repo served on :8123
   (`python3 -m http.server 8123`) and Playwright (a cloud session has it installed globally).

     node tools/dojo-play.cjs t9 'water-sport,rain-dance,water-gun,withdraw|sparkling-aria,swift-swim,water-pulse'

   Turns are split by |, card ids by commas; each turn ends after its cards. */
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [,, id, line] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 420, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:8123/');
  await page.waitForTimeout(2500);
  await page.evaluate(async (id) => {
    const { updateSave } = await import('/js/storage.js');
    updateSave(d => { d.battleSpeed = 2; d.endTurnWarn = false; });
    const { startBattle } = await import('/js/battle.js');
    const { TRIALS_BY_ID, trialMissed } = await import('/js/data/dojo.js');
    const { STARTERS_BY_ID } = await import('/js/data/starters.js');
    const trial = TRIALS_BY_ID[id];
    const run = { starter: STARTERS_BY_ID[trial.starter], stage: 0, deck: [...trial.deck], relics: [], items: [], hp: trial.hp, maxHp: trial.maxHp ?? trial.hp, mods: { playerDmg: 1 }, tower: null, safari: null, biome: 0, map: null };
    window.__end = null; window.__log = [];
    new MutationObserver(() => window.__log.push(document.getElementById('battle-log-live').textContent)).observe(document.getElementById('battle-log-live'), { childList: true, characterData: true, subtree: true });
    startBattle({ run, encounter: { def: trial.foe, kind: 'fight', maxHp: trial.foe.hp, strength: 0, dmgMult: 1, trial: trial.goal },
      onEnd: (r) => { window.__end = { ...r, missed: trialMissed(trial, r) }; } });
  }, id);
  const names = await page.evaluate(async () => Object.fromEntries(Object.values((await import('/js/data/cards.js')).CARDS_BY_ID).map(c => [c.id, c.name])));   // made cards too (a Cinder)
  const ready = async () => { for (let i = 0; i < 300; i++) { const s = await page.evaluate(() => ({ end: window.__end, busy: document.getElementById('end-turn-btn').disabled })); if (s.end || !s.busy) return s; await page.waitForTimeout(100); } throw new Error('stuck'); };
  const state = () => page.evaluate(() => [...document.querySelectorAll('#player-zone .hp-text, #enemy-zone .hp-text, [id$=hp-text]')].filter(n => n.textContent).map(n => `${n.id.replace('-hp-text', '')} ${n.textContent}`).join(' '));
  const turns = line.split('|');
  for (const [t, cards] of turns.entries()) {
    let s = await ready(); if (s.end) break;
    await page.waitForTimeout(900);   // the deal lock
    for (const c of cards.split(',').filter(Boolean)) {
      const label = `${names[c]}, costs`;
      const count = () => page.locator(`#hand .card.in-hand[aria-label^="${label}"]`).count();
      const before = await count();
      if (!before) { console.log(`  T${t + 1}: ${c} not in hand!`, await page.evaluate(() => [...document.querySelectorAll('#hand .card.in-hand')].map(n => n.getAttribute('aria-label')).join(' / '))); break; }
      let played = false;
      for (let tries = 0; tries < 20 && !played; tries++) {
        await page.locator(`#hand .card.in-hand[aria-label^="${label}"]`).first().dispatchEvent('click');
        await page.waitForTimeout(150);
        if ((await count()) < before) { played = true; break; }
        await page.locator(`#hand .card.in-hand[aria-label^="${label}"]`).first().dispatchEvent('click');
        await page.waitForTimeout(400);
        if ((await count()) < before || await page.evaluate(() => !!window.__end)) played = true;
      }
      if (!played) { console.log(`  T${t + 1}: ${c} would not play`); break; }
      await page.waitForTimeout(300);
      s = await ready(); if (s.end) break;
    }
    const log = await page.evaluate(() => document.getElementById('battle-log')?.textContent?.slice(-160));
    console.log(`  T${t + 1} played ${cards} | ${await state()}\n     ` + (await page.evaluate(() => window.__log.splice(0).join(' / '))));
    if (s.end) break;
    if (t < turns.length) { await page.evaluate(() => document.getElementById('end-turn-btn').click()); await page.waitForTimeout(400); }
  }
  for (let i = 0; i < 200; i++) { if (await page.evaluate(() => window.__end)) break; await page.waitForTimeout(100); }
  const end = await page.evaluate(() => window.__end);
  console.log('     ' + (await page.evaluate(() => window.__log.splice(0).join(' / '))));
  console.log(`${id}: ${end ? `won=${end.won} turns=${end.turns} hp=${end.hp}/${end.maxHp} taken=${end.damageTaken} felledBy=${end.felledBy} trialFailed=${end.trialFailed ?? '-'} => ${end.missed ? 'MISSED: ' + end.missed : 'STAR'}` : 'no end'}`);
  if (errors.length) console.log('errors:', errors.slice(0, 5));
  await browser.close();
})();
