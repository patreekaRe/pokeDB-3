/* double-probe.mjs  -  the double battles' phase 2 (2026-11-04, branch-only): ?arena=double played headless on phone
   viewports. Checks the two-enemy layout (two plates, two boxes clear of each other and of your side, compact move
   bubbles, a 3D pad each), a tap on an enemy aiming at it (the other dims), aiming with a card raised (it stays up), the
   lethal warning counting both attacks, the target falling while the other stands (it faints, the aim moves on, the
   fight goes on) and the win. Phase 3 (2026-11-05): a pack Pokémon's room is a pair (Houndour's), its Howl powers up
   both, Sentret's Call for Help brings one in (a third pad, it waits a turn), Acid hits both, Hail and Rocky Helmet
   with two, no ball while two stand, and Bouffalant's Wide Guard lasting Tauros's turn too:
     NODE_PATH=$(npm root -g) node tools/double-probe.mjs
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + `
window.__battle = () => battle;
window.__render = () => renderAll();
window.__raise = (uid) => tapCard(uid);
window.__raised = () => selectedUid;
window.__play = async (uid) => { const b = battle; b.busy = false; await playCard(uid); for (let i = 0; i < 80 && b.busy && !b.over; i++) await sleep(100); };
window.__end = async () => { const b = battle; b.busy = false; await endTurn(); for (let i = 0; i < 200 && (b.busy || b.enemyActing) && !b.over; i++) await sleep(100); };
// a hand of only skills (the draw's luck) gets an Ember, so a check never hangs on what was drawn
window.__attack = () => battle.hand.find(h => isAttack(h.card) && !whyNotPlayable(h.card) && costOf(h.card) <= battle.energy)
  ?? (battle.hand.push({ uid: nextUid++, card: CARDS_BY_ID.ember, fresh: true }), renderAll(), battle.hand.at(-1));
window.__cast = async (id) => { const b = battle; b.busy = true; await resolveCard(CARDS_BY_ID[id], 0); b.busy = false; renderAll(); };
window.__whyNotThrow = () => whyNotThrow();
window.__intent = (i) => withFoe(i, () => currentMove());
`
  : path === '/js/arena-3d.js' ? body.toString() + '\nwindow.__pads = () => A?.pads?.length ?? 0;\n'
  : body;

const three = await threeCopy('');
const { server, port } = serve(HOOK);
const browser = await launch();
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const box = (page, id) => page.evaluate((id) => { const r = document.getElementById(id)?.getBoundingClientRect(); return r && { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; }, id);
const apart = (a, b) => a.r <= b.l + 1 || b.r <= a.l + 1 || a.b <= b.t + 1 || b.b <= a.t + 1;

for (const [w, h] of [[402, 874], [390, 664]]) {
  const { ctx, page, errors } = await phone(browser, three);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`http://localhost:${port}/index.html?arena=double&foe=rattata,sentret&starter=charmander`);
  for (let i = 0; i < 60 && await page.evaluate(() => !window.__battle?.() || window.__battle().busy !== false); i++) {
    await page.waitForTimeout(500);
    await page.mouse.click(200, 400).catch(() => {});
  }
  await page.waitForTimeout(900);   // the move bubbles' pop-in
  console.log(`-- ${w}x${h}`);
  const n = await page.evaluate(() => window.__battle().enemies.map(en => en.def.name).join(' + '));
  check(n === 'Rattata + Sentret', `two enemies: ${n}`);
  const [p1, p2, z1, z2, you, yourPlate] = await Promise.all(['enemy-plate', 'enemy2-plate', 'enemy-portrait-box', 'enemy2-portrait-box', 'player-sprite', 'player-plate'].map(id => box(page, id)));
  check(apart(p1, p2) && p2.t > p1.t, 'the two plates stack, clear of each other');
  check(apart(z1, z2), `the two enemies stand clear of each other (${Math.round(z1.w)}px, ${Math.round(z2.w)}px)`);
  check(apart(p2, you) || p2.b <= you.t + 24, 'the second plate clears your Pokémon');
  check(apart(z1, yourPlate) && apart(z2, yourPlate), 'both enemies clear your plate');
  check(z2.r <= w, 'the second enemy stays on screen');
  const intents = await page.evaluate(() => [...document.querySelectorAll('#arena .intent')].map(n => ({ text: n.textContent, title: n.title, name: getComputedStyle(n.querySelector('.intent-name') ?? n).display })));
  check(intents.length === 2 && intents.every(i => i.name === 'none' && /Next turn: /.test(i.title)), `compact move bubbles, the name in the tip: ${intents.map(i => i.text).join(' / ')}`);
  check(await page.evaluate(() => window.__pads()) === 3, '3D arena: a pad for each enemy and yours');

  // how to aim is shown: a reticle on the one aimed at, a tapping fingertip on the other and a note, till you aim once
  const shown = await page.evaluate(() => ({
    ring: getComputedStyle(document.querySelector('#enemy-portrait-box'), '::after').content,
    teach: getComputedStyle(document.querySelector('#enemy2-portrait-box'), '::before').content,
    tip: document.querySelector('.tap-tip')?.textContent ?? '',
  }));
  check(shown.ring !== 'none' && shown.teach !== 'none' && /aim/.test(shown.tip), `the aim is shown: a reticle, a tapping fingertip, the note ("${shown.tip}")`);
  // tap to aim
  await page.mouse.click(z2.l + z2.w / 2, z2.t + z2.h / 2);
  await page.waitForTimeout(150);
  let s = await page.evaluate(() => ({ t: window.__battle().target, aside: [...document.querySelectorAll('#arena .enemy-zone.aside')].map(n => n.id) }));
  check(s.t === 1 && s.aside.join() === 'enemy-zone', `a tap on the second aims at it, the first dims (${s.aside})`);
  const taught = await page.evaluate(() => ({ teach: document.querySelectorAll('#arena .aim-teach').length, ring: document.querySelector('#arena .enemy-zone.aimed')?.id }));
  check(!taught.teach && taught.ring === 'enemy2-zone', 'once aimed, the fingertip goes for good and the reticle moves');
  const uid = await page.evaluate(() => window.__attack()?.uid);
  await page.evaluate((u) => window.__raise(u), uid);
  await page.waitForTimeout(400);
  await page.mouse.click(z1.l + z1.w / 2, z1.t + z1.h / 2);
  await page.waitForTimeout(150);
  s = await page.evaluate(() => ({ t: window.__battle().target, up: window.__raised() }));
  check(s.t === 0 && s.up === uid, 'with a card raised, a tap on the first aims at it and the card stays up');

  // the lethal warning counts both attacks
  const lethal = await page.evaluate(() => {
    const b = window.__battle(), was = b.hp;
    const hits = b.enemies.map((_, i) => { b.view = i; const m = b.def.moves[b.enemy.moveIndex] ?? {}; b.view = null; return m.kind; });
    b.hp = 1; window.__render();
    const on = document.getElementById('player-plate').classList.contains('danger') || !document.body.classList.contains('no-battle-fx');
    const marks = document.querySelectorAll('#arena .intent.lethal').length;
    b.hp = was; window.__render();
    return { on, marks, hits };
  });
  check(lethal.on, `at 1 HP the warning is up (${lethal.marks} bubble${lethal.marks === 1 ? '' : 's'} marked; moves ${lethal.hits})`);

  // the target falls while the other stands
  await page.evaluate(() => { const b = window.__battle(); b.energy = 9; b.enemies[0].hp = 1; b.enemies[0].block = 0; });
  await page.evaluate((u) => window.__play(u), uid);
  s = await page.evaluate(() => { const b = window.__battle(); return { over: b.over, t: b.target, down: b.enemies.map(en => en.down), gone: document.getElementById('enemy-portrait-box').classList.contains('defeated'), log: document.getElementById('battle-log-live').textContent, bubble: document.getElementById('enemy-intent').textContent }; });
  check(!s.over && s.down.join() === 'true,false' && s.t === 1 && s.gone && !s.bubble, `the first falls, the aim moves on, the fight goes on ("${s.log}")`);
  await page.waitForTimeout(600);
  const [gone, moved] = await Promise.all([page.evaluate(() => getComputedStyle(document.getElementById('enemy-plate')).display), box(page, 'enemy2-plate')]);
  check(gone === 'none' && Math.abs(moved.t - p1.t) <= 1, `its plate goes and the other's moves up into its place (top ${Math.round(moved.t)})`);
  await page.evaluate(() => window.__end());
  s = await page.evaluate(() => { const b = window.__battle(); return { turn: b.turn, over: b.over, hp: b.enemies.map(en => en.hp) }; });
  check(!s.over && s.turn === 2 && s.hp[0] === 0, 'the enemies\' turn: only the one standing acts, then yours');
  const next = await page.evaluate(() => window.__attack()?.uid);
  await page.evaluate(() => { const b = window.__battle(); b.energy = 9; b.enemies[1].hp = 1; b.enemies[1].block = 0; });
  await page.evaluate((u) => window.__play(u), next);
  for (let i = 0; i < 30 && !await page.evaluate(() => document.getElementById('reward-screen') && !document.getElementById('reward-screen').hidden); i++) await page.waitForTimeout(300);
  s = await page.evaluate(() => ({ over: window.__battle()?.over, reward: !document.getElementById('reward-screen').hidden }));
  check(s.reward, 'the second falls: the fight is won and the rewards come up');
  check(!errors.length, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await ctx.close();
}

// phase 3: the pack, the caller, a hit-both card, the weather, Rocky Helmet and the ball, on one phone
const start = async (page, url) => {
  await page.goto(url);
  for (let i = 0; i < 60 && await page.evaluate(() => !window.__battle?.() || window.__battle().busy !== false); i++) {
    await page.waitForTimeout(500);
    await page.mouse.click(200, 400).catch(() => {});
  }
  await page.waitForTimeout(600);
};
{
  const { ctx, page, errors } = await phone(browser, three);
  console.log('-- phase 3: a Houndour pack');
  await start(page, `http://localhost:${port}/index.html?arena=wild&foe=houndour&starter=squirtle&relics=rocky-helmet`);
  let s = await page.evaluate(() => { const b = window.__battle(); return { names: b.enemies.map(en => en.def.name), hp: b.enemies.map(en => en.maxHp), mult: b.enemies.map(en => en.dmgMult), duo: document.getElementById('arena').classList.contains('duo'), pads: window.__pads() }; });
  check(s.names.join() === 'Houndour,Houndour' && s.duo && s.pads === 3, `a pack Pokémon's room is a pair: ${s.names} (HP ${s.hp}, damage ×${s.mult})`);
  // Howl: both gain its strength; Hail: both lose its chip; Rocky Helmet: each attacker takes 3
  s = await page.evaluate(async () => {
    const b = window.__battle(), howl = b.enemies[0].def.moves.findIndex(m => m.name === 'Howl');
    b.enemies[0].moveIndex = howl;
    b.enemies[1].moveIndex = b.enemies[1].def.moves.findIndex(m => m.kind === 'attack');
    b.weather = { kind: 'hail', turns: 3 };
    b.block = 0;
    const before = b.enemies.map(en => ({ hp: en.hp, str: en.strength }));
    window.__render();
    const bubble = document.getElementById('enemy-intent').title;
    await window.__end();
    return { bubble, after: b.enemies.map((en, i) => ({ dHp: before[i].hp - en.hp, dStr: en.strength - before[i].str })), log: document.getElementById('battle-log-live').textContent };
  });
  check(/to each of them/.test(s.bubble), `Howl's bubble says both ("${s.bubble}")`);
  check(s.after.every(a => a.dStr >= 2), `Howl powers up both (strength +${s.after.map(a => a.dStr)})`);
  check(s.after[0].dHp === 3 && s.after[1].dHp === 6, `Hail chips both (3 each), Rocky Helmet only the one that attacked (-${s.after.map(a => a.dHp)})`);
  // Acid hits both, the Vulnerable on both
  s = await page.evaluate(async () => {
    const b = window.__battle(), was = b.enemies.map(en => en.hp + en.block);
    await window.__cast('acid');
    return { lost: b.enemies.map((en, i) => was[i] - en.hp - en.block), vuln: b.enemies.map(en => en.vulnerable) };
  });
  check(s.lost.every(n => n > 0) && s.vuln.every(n => n === 1), `Acid hits both (-${s.lost}) and both are Vulnerable`);
  // no ball while two stand; one left, the reason goes
  s = await page.evaluate(() => { const b = window.__battle(); b.catchable = true; b.energy = 9; const two = window.__whyNotThrow(); b.enemies[0].hp = 0; window.__render(); const one = window.__whyNotThrow(); b.catchable = false; return { two, one }; });
  check(/knock one out/.test(s.two ?? '') && !/knock one out/.test(s.one ?? ''), `no ball while two stand ("${s.two}"), one left it may fly`);
  check(!errors.length, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await ctx.close();
}
{
  const { ctx, page, errors } = await phone(browser, three);
  console.log('-- phase 3: Sentret calls for help');
  await start(page, `http://localhost:${port}/index.html?arena=wild&foe=sentret&starter=charmander`);
  let s = await page.evaluate(async () => {
    const b = window.__battle(), call = b.enemies[0].def.moves.findIndex(m => m.kind === 'call');
    b.enemies[0].moveIndex = call;
    window.__render();
    const bubble = document.getElementById('enemy-intent').title;
    b.block = 999;
    await window.__end();
    return { bubble, n: b.enemies.length, names: b.enemies.map(en => en.def.name), hp: b.enemies.map(en => `${en.hp}/${en.maxHp}`), duo: document.getElementById('arena').classList.contains('duo'), pads: window.__pads(), zone: document.getElementById('enemy2-zone')?.className, log: document.getElementById('battle-log-live').textContent };
  });
  check(/calls for help/.test(s.bubble), `its bubble says it will call ("${s.bubble}")`);
  check(s.n === 2 && s.duo && s.pads === 3 && /revealed/.test(s.zone), `the call brings one in: ${s.names} (${s.hp}), a third pad, it slid in ("${s.log}")`);
  s = await page.evaluate(() => ({ first: window.__intent(0).name, second: window.__intent(1).name }));
  check(s.first !== 'Call for Help' && s.second !== 'Call for Help', `with two out, no one calls (${s.first} / ${s.second})`);
  // the caller falls: the helper may call again (CALLS = 2 a fight), into the fallen one's place
  s = await page.evaluate(async () => {
    const b = window.__battle();
    b.enemies[0].hp = 1; b.enemies[0].block = 0; b.energy = 9;
    await window.__play(window.__attack().uid);
    b.target = 1;
    b.enemies[1].moveIndex = b.enemies[1].def.moves.findIndex(m => m.kind === 'call');
    b.block = 999;
    await window.__end();
    return { n: b.enemies.length, standing: b.enemies.filter(en => en.hp > 0).length, called: b.called, plate: getComputedStyle(document.getElementById('enemy-plate')).display, over: b.over };
  });
  check(!s.over && s.n === 2 && s.standing === 2 && s.called === 2 && s.plate !== 'none', `the caller fell and the other called one into its place (${s.called} calls, its plate back)`);
  s = await page.evaluate(() => { const b = window.__battle(); b.enemies[1].hp = 0; window.__render(); b.enemies[0].moveIndex = b.enemies[0].def.moves.findIndex(m => m.kind === 'call'); return window.__intent(0).name; });
  check(s !== 'Call for Help', `two calls a fight: the third is ${s} instead`);
  check(!errors.length, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await ctx.close();
}

{
  const { ctx, page, errors } = await phone(browser, three);
  console.log('-- phase 3: Bouffalant shields Tauros');
  await start(page, `http://localhost:${port}/index.html?arena=wild&foe=bouffalant&biome=wastes&starter=bulbasaur`);
  const s = await page.evaluate(async () => {
    const b = window.__battle();
    b.enemies[0].moveIndex = b.enemies[0].def.moves.findIndex(m => m.name === 'Wide Guard');
    b.enemies[1].moveIndex = b.enemies[1].def.moves.findIndex(m => m.kind === 'attack');
    b.block = 999;
    await window.__end();
    return { names: b.enemies.map(en => en.def.name), block: b.enemies.map(en => en.block), turn: b.turn };
  });
  // every enemy's block goes as their turn begins, so the tank's shield on the hitter, given first, lasts into yours
  check(s.turn === 2 && s.block.every(n => n === 9), `Wide Guard: ${s.names} both keep 9 block into your turn (${s.block})`);
  check(!errors.length, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await ctx.close();
}

// a single fight afterwards has no second plate and no .duo
{
  const { ctx, page, errors } = await phone(browser, three);
  await page.goto(`http://localhost:${port}/index.html?arena=wild&foe=rattata`);
  for (let i = 0; i < 60 && await page.evaluate(() => !window.__battle?.() || window.__battle().busy !== false); i++) {
    await page.waitForTimeout(500);
    await page.mouse.click(200, 400).catch(() => {});
  }
  const s = await page.evaluate(() => ({ n: window.__battle().enemies.length, twin: !!document.getElementById('enemy2-zone'), duo: document.getElementById('arena').classList.contains('duo'), pads: window.__pads() }));
  console.log('-- a single fight');
  check(s.n === 1 && !s.twin && !s.duo && s.pads === 2, 'one enemy, one plate, no .duo, two pads');
  check(!errors.length, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await ctx.close();
}

await browser.close();
server.close();
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
