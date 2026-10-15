import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TOWNS, QUESTS, townState, questOf, greeterOf, openQuest, questStep, questDone, questProgress, stepText, stepReady,
  countTown, handInStep, mended, currentRequest, homeTalk, stepNudge, folkChats, questLine, CLEARING, clearingLit } from '../js/data/towns.js';
import { MATERIALS, MATERIALS_BY_ID, KEY_BY_ID, satchelOf, addMat, addKey, matCount, hasKey } from '../js/data/satchel.js';

const run = readFileSync(new URL('../js/run.js', import.meta.url), 'utf8');
const sent = new Set([...run.matchAll(/mission\((\[[^\]]*\]|'[^']*')/g)].flatMap(m => m[1].match(/'([^']*)'/g).map(s => s.slice(1, -1))));

test('every town has a questline its own leaders open and run, ending on its Waystone Shard', () => {
  for (const town of [CLEARING, ...Object.values(TOWNS)]) {
    const q = questOf(town);
    assert.ok(q, `${town.id}: no questline`);
    assert.deepEqual(Object.keys(q.greet).sort(), Object.keys(town.leaders).sort(), `${town.id}: every leader can greet you`);
    for (const lines of Object.values(q.greet)) assert.ok(lines.length >= 3);
    assert.ok(q.steps.length >= 3 && q.steps.length <= 5, `${town.id}: about 4 steps`);
    const last = q.steps.at(-1);
    assert.equal(last.kind, 'shard');
    assert.equal(last.key, `shard-${town.biome}`);
    assert.equal(KEY_BY_ID[last.key].shard, town.biome);
    assert.equal(q.steps.filter(s => s.kind === 'shard').length, 1);
    const ids = new Set();
    for (const s of q.steps) {
      assert.ok(!ids.has(s.id), `${s.id} twice`);
      ids.add(s.id);
      assert.ok(town.leaders[s.by], `${s.id}: ${s.by} isn't one of ${town.name}'s leaders`);
      assert.ok(s.thanks?.length, `${s.id}: no thanks`);
      assert.ok(s.n >= 1 && !stepText(s).includes('{n}'));
      if (s.kind === 'track') assert.ok(sent.has(s.on), `${s.id}: nothing sends '${s.on}'`);
      if (s.kind === 'gather') assert.ok(MATERIALS_BY_ID[s.item], `${s.id}: no material ${s.item}`);
      if (s.kind === 'craft' || s.kind === 'shard') assert.ok(KEY_BY_ID[s.key], `${s.id}: no key item ${s.key}`);
      if (s.gives) assert.ok(KEY_BY_ID[s.gives], `${s.id}: gives no key item ${s.gives}`);
      if (s.pick) assert.ok(s.pick.options.length >= 2 && s.pick.options.every(o => o.id && o.label && o.text));
    }
  }
  assert.deepEqual(Object.keys(QUESTS).sort(), ['clearing', ...Object.keys(TOWNS)].sort());
});

test('every biome with a town has two or three materials', () => {
  for (const town of [CLEARING, ...Object.values(TOWNS)]) {
    const n = MATERIALS.filter(m => m.biome === town.biome).length;
    assert.ok(n >= 2 && n <= 3, `${town.biome}: ${n} materials`);
  }
  assert.equal(new Set(MATERIALS.map(m => m.id)).size, MATERIALS.length);
});

test('a town is quiet till one of its leaders is beaten, then that leader opens the questline', () => {
  const town = TOWNS.shrine;
  assert.equal(greeterOf(town, {}), null);
  assert.equal(greeterOf(town, { gym: { jahmes: 1 } }), 'jahmes');
  assert.equal(greeterOf(town, { gym: { john: 2, jahmes: 1 } }), 'john');
  let st = townState({}, 'shrine');
  assert.equal(countTown(town, st, 'event', 1, { biome: 'shrine' }).st, st, 'a quiet town counts nothing');
  assert.equal(questStep(town, st), null);
  st = openQuest(st);
  assert.equal(openQuest(st), st);
  assert.equal(questStep(town, st), QUESTS.shrine.steps[0]);
  assert.deepEqual(questProgress(town, st), [0, QUESTS.shrine.steps.length]);
});

test('a questline walks its steps: gather from the Satchel, count a track step in its biome, a key item, the shard lights the stone', () => {
  const town = TOWNS.ruins, steps = QUESTS.ruins.steps;
  let st = openQuest(townState({}, 'ruins')), sat = satchelOf({}, false);
  const gather = questStep(town, st);
  assert.equal(gather.kind, 'gather');
  assert.ok(!stepReady(gather, st, sat));
  sat = addMat(sat, gather.item, gather.n);
  assert.ok(stepReady(gather, st, sat));
  st = handInStep(town, st);
  const craft = questStep(town, st);
  assert.equal(craft.kind, 'craft');
  assert.ok(!stepReady(craft, st, sat));
  assert.ok(stepReady(craft, st, addKey(sat, craft.key)));
  st = handInStep(town, st);
  const tr = questStep(town, st);
  assert.equal(tr.kind, 'track');
  assert.equal(countTown(town, st, tr.on, 1, { biome: 'shrine' }).st, st, 'another biome counts nothing');
  assert.equal(countTown(town, st, 'nope', 1, { biome: 'ruins' }).st, st);
  const r = countTown(town, st, tr.on, 5, { biome: 'ruins' });
  assert.ok(r.finished);
  st = r.st;
  assert.equal(st.quest.got, tr.n);
  assert.ok(stepReady(tr, st, sat));
  assert.ok(!countTown(town, st, tr.on, 1, { biome: 'ruins' }).finished, 'a finished step waits to be handed in');
  st = handInStep(town, st);
  assert.equal(st.quest.got, 0);
  assert.ok(!mended(st));
  assert.equal(questStep(town, st).kind, 'shard');
  st = handInStep(town, st);
  assert.ok(mended(st) && questDone(town, st));
  assert.deepEqual(questProgress(town, st), [steps.length, steps.length]);
  assert.equal(handInStep(town, st), st);
  // then the board's coin requests
  const req = currentRequest(town, st);
  assert.ok(countTown(town, st, req.on, req.n, { biome: 'ruins' }).finished);
});

test('a pick is remembered', () => {
  const town = TOWNS.shrine;
  let st = handInStep(town, openQuest(townState({}, 'shrine')));
  const step = questStep(town, st);
  assert.ok(step.pick);
  st = handInStep(town, st, step.pick.options[1].id);
  assert.equal(st.quest.picks[step.id], step.pick.options[1].id);
});

test('the Satchel keeps counts, key items once, and marks what is new', () => {
  let sat = satchelOf({}, false);
  sat = addMat(sat, 'wick', 3);
  sat = addMat(sat, 'wick', 2);
  assert.equal(matCount(sat, 'wick'), 5);
  assert.deepEqual(sat.fresh, ['wick']);
  sat = addMat(sat, 'wick', -9);
  assert.equal(matCount(sat, 'wick'), 0);
  assert.ok(sat.seen.includes('wick'));
  sat = addKey(addKey(sat, 'katana'), 'katana');
  assert.ok(hasKey(sat, 'katana'));
  assert.equal(sat.keys.length, 1);
  const lent = satchelOf({ satchel: sat }, true);
  assert.ok(lent.keys.length > 1 && matCount(lent, 'seeds') > 0);
});

test('materials drop only in their biome: fights never give a map-only one, sparkles put it first', async () => {
  const { fightDrop, markSparkles, biomeMats, DROPS, SPARKLES, matLine } = await import('../js/data/satchel.js');
  const { makeRng } = await import('../js/rng.js');
  const rand = makeRng(7);
  for (const biome of Object.values(TOWNS).map(t => t.biome)) {
    assert.ok(biomeMats(biome).length >= 2, `${biome}: 2-3 materials`);
    assert.ok(biomeMats(biome, true).length >= 1, `${biome}: a fight can drop something`);
    for (let i = 0; i < 200; i++) {
      const d = fightDrop(biome, 'elite', rand);
      assert.ok(d && MATERIALS_BY_ID[d.id].biome === biome && MATERIALS_BY_ID[d.id].from !== 'map');
      assert.ok(d.n >= DROPS.elite.n[0] && d.n <= DROPS.elite.n[1]);
      assert.ok(!matLine(d).includes('undefined'));
    }
    assert.equal(fightDrop(biome, 'ken', rand), null);
    const rooms = Array.from({ length: 12 }, (_, i) => ({ id: i, floor: i, type: ['fight', 'event', 'rest', 'shop', 'elite'][i % 5] }));
    const lit = markSparkles(rooms, biome, rand);
    assert.ok(lit.length >= SPARKLES.rooms[0] && lit.length <= SPARKLES.rooms[1]);
    for (const r of lit) assert.ok(SPARKLES.kinds.includes(r.type) && r.floor > 0 && MATERIALS_BY_ID[r.sparkle.id].biome === biome);
    if (biomeMats(biome).some(m => m.from === 'map')) assert.equal(MATERIALS_BY_ID[lit[0].sparkle.id].from, 'map');
  }
  assert.equal(fightDrop('forest', 'boss', rand), null, 'a biome without a town drops nothing');
  assert.deepEqual(markSparkles([{ id: 1, floor: 2, type: 'fight' }], 'forest', rand), []);
});

test('a gather step can be met in a run or two through its biome', async () => {
  const { DROPS, SPARKLES, biomeMats } = await import('../js/data/satchel.js');
  const mid = ([lo, hi]) => (lo + hi) / 2;
  for (const q of Object.values(QUESTS)) for (const s of q.steps.filter(x => x.kind === 'gather')) {
    const m = MATERIALS_BY_ID[s.item], fightMats = biomeMats(m.biome, true).length;
    const fights = m.from === 'map' ? 0 : (5 * DROPS.fight.odds * mid(DROPS.fight.n) + 2 * mid(DROPS.elite.n) + mid(DROPS.boss.n)) / fightMats;
    const sparkles = m.from === 'map' ? mid(SPARKLES.n) : (mid(SPARKLES.rooms) - (biomeMats(m.biome).some(x => x.from === 'map') ? 1 : 0)) * mid(SPARKLES.n) / biomeMats(m.biome).length;
    const pass = fights + sparkles;
    assert.ok(s.n / pass <= 2.5, `${s.id}: ${s.n} ${m.id} at ~${pass.toFixed(1)} a pass`);
  }
});

test('every step has its leader\'s word on the board and something from each leader at home, and more once it\'s lit', () => {
  for (const town of Object.values(TOWNS)) {
    const q = questOf(town), leaders = Object.keys(town.leaders);
    for (const s of q.steps) {
      assert.ok(q.talk[s.id]?.nudge, `${s.id}: no word on the board`);
      for (const id of leaders) assert.ok(q.talk[s.id][id]?.length >= 2, `${s.id}: ${id} says nothing about it at home`);
    }
    assert.deepEqual(Object.keys(q.talk).sort(), q.steps.map(s => s.id).sort(), `${town.id}: talk for a step that isn't one`);
    for (const id of leaders) assert.ok(q.after[id]?.length >= 2, `${town.id}: ${id} says nothing once it's lit`);
    assert.ok(q.chats.length >= 3 && q.chats.every(c => c.length >= 2), `${town.id}: the folk have little to say once it's lit`);
  }
});

test('at home a leader talks about where the questline stands first, with John\'s festival filled in', () => {
  const town = TOWNS.shrine, q = questOf(town);
  const quiet = homeTalk(town, 'john', townState({}, 'shrine'));
  assert.equal(quiet.topical, 0);
  assert.deepEqual(quiet.lines, town.leaders.john);
  let st = openQuest(townState({}, 'shrine'));
  assert.deepEqual(homeTalk(town, 'jahmes', st).lines.slice(0, 2), q.talk['sh-wicks'].jahmes);
  st = handInStep(town, handInStep(town, st), 'moon');
  const lanterns = homeTalk(town, 'john', st);
  assert.equal(lanterns.topical, q.talk['sh-lanterns'].john.length);
  assert.ok(lanterns.lines.some(l => l.includes('Moon Viewing')) && !lanterns.lines.some(l => l.includes('{pick}')));
  st = handInStep(town, handInStep(town, st));
  assert.ok(mended(st));
  assert.match(homeTalk(town, 'john', st).lines[0], /Moon Viewing was everything/);
  assert.match(folkChats(town, st)[0].join(' '), /still lit/);
  assert.ok(folkChats(town, st).flat().some(l => l.includes('Moon Viewing')));
  assert.equal(folkChats(town, openQuest(townState({}, 'shrine'))), town.chats);
  // a save mended by the old requests never picked: the fallback
  assert.match(questLine(town, { done: 5 }, q.after.john[0]), /autumn festival/);
});

test('the board\'s word carries its leader\'s name once, Phil\'s JONA keeping hers', () => {
  assert.match(stepNudge(TOWNS.shrine, QUESTS.shrine.steps[0], 'JAHMES'), /^JAHMES: WICKS/);
  assert.match(stepNudge(TOWNS.thornwood, QUESTS.thornwood.steps[0], 'PHIL'), /^PHIL: A Spirit/);
});

test('the Clearing\'s Waystone comes first: the Nietos\' questline lights it, and an old town questline counts as lit', () => {
  assert.equal(clearingLit({}), false);
  assert.equal(greeterOf(CLEARING, { gym: { nietos: 1 } }), 'nietos');
  let st = openQuest(townState({}, 'clearing'));
  assert.equal(questStep(CLEARING, st), QUESTS.clearing.steps[0]);
  // its Do step counts in the Clearing biome only
  assert.equal(countTown(CLEARING, st, 'fight', 1, { biome: 'shrine' }).st, st);
  st = countTown(CLEARING, st, 'fight', 9, { biome: 'clearing' }).st;
  assert.equal(st.quest.got, QUESTS.clearing.steps[0].n);
  for (const _ of QUESTS.clearing.steps) st = handInStep(CLEARING, st);
  assert.ok(mended(st) && questDone(CLEARING, st));
  assert.equal(clearingLit({ towns: { clearing: st } }), true);
  // done, the Clearing has no board: play counts into nothing, and nothing breaks
  assert.equal(countTown(CLEARING, st, 'fight', 1, { biome: 'clearing' }).st, st);
  assert.match(homeTalk(CLEARING, 'nietos', st).lines[0], /^BRITT: /);
  // a save that already opened (or mended) a town's questline keeps it
  assert.equal(clearingLit({ towns: { shrine: openQuest(townState({}, 'shrine')) } }), true);
  assert.equal(clearingLit({ towns: { wastes: { done: 5 } } }), true);
  assert.equal(clearingLit({ towns: { shrine: { met: true } } }), false);
});
