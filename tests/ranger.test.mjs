import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TASKS, TABS, RANKS, RANGER_FURNITURE, TASKS_BY_ID, progressOf, readyTasks, rangerSlots, rankOf, rewardText, logCatch, logDay } from '../js/data/ranger.js';
import { BALLS_BY_ID } from '../js/data/balls.js';
import { SAFARI_ROSTER, SAFARI_DEX_PAGES } from '../js/data/safari.js';
import { FURNITURE_BY_KIND, earnedFurniture } from '../js/data/furniture.js';

const blank = () => ({ safariDex: { caught: [] }, ranger: { claimed: [], log: {} }, safari: {}, badges: [], unlocked: [], feats: [], corner: {}, gym: {}, workshop: {} });

test('every task has a unique id, a tab, a goal it can reach and a reward in words', () => {
  assert.equal(new Set(TASKS.map(t => t.id)).size, TASKS.length);
  const full = { ...blank(), safariDex: { caught: [...SAFARI_ROSTER] } };
  for (const t of TASKS) {
    assert.ok(TABS.some(x => x.id === t.tab), t.id);
    assert.ok(t.goal >= 1, t.id);
    assert.ok(rewardText(t.reward).length, t.id);
    if (t.reward.balls) assert.ok(BALLS_BY_ID[t.reward.balls[0]], t.id);
    // a Pokédex task is done once every Safari Pokémon is caught: none asks for more than there are
    if (t.tab === 'research') assert.ok(progressOf(t, full).done, t.id);
  }
});

test('the Safari furniture set: each piece earned by a real task, through the ranger source, once it is claimed', () => {
  for (const f of RANGER_FURNITURE) {
    assert.ok(TASKS_BY_ID[f.task], f.task);
    assert.equal(TASKS_BY_ID[f.task].reward.kind, f.kind);
    assert.deepEqual(FURNITURE_BY_KIND[f.kind].from, ['ranger', f.task]);
  }
  const save = blank();
  assert.ok(!earnedFurniture(save).some(p => p.kind === 'rangerflag'));
  save.ranger.claimed.push('species-10');
  assert.ok(earnedFurniture(save).some(p => p.kind === 'rangerflag'));
});

test('a task is ready once done and until claimed; claims raise the rank and the base\'s room', () => {
  const save = blank();
  save.safariDex.caught = SAFARI_ROSTER.slice(0, 25);
  const ready = readyTasks(save).map(t => t.id);
  assert.ok(ready.includes('species-5') && ready.includes('species-25'));
  assert.ok(!ready.includes('species-50'));
  save.ranger.claimed = ['species-5', 'species-10', 'species-25'];
  assert.ok(!readyTasks(save).some(t => save.ranger.claimed.includes(t.id)));
  assert.equal(rangerSlots(save), 1);
  assert.equal(rankOf(save).rank.name, RANKS[0].name);
  save.ranger.claimed.push('rare-1', 'ball-great-1');
  assert.equal(rankOf(save).rank.name, RANKS[1].name);
});

test('an area survey counts only that area\'s Pokémon', () => {
  const [a, b] = SAFARI_DEX_PAGES;
  const only = b.ids.filter(id => !a.ids.includes(id)).slice(0, 10);
  const save = { ...blank(), safariDex: { caught: only } };
  assert.equal(progressOf(TASKS_BY_ID[`area-${a.area}-10`], save).n, 0);
  assert.equal(progressOf(TASKS_BY_ID[`area-${b.area}-10`], save).done, true);
});

test('the catch log counts balls, night, first turns, unhurt catches and the best run', () => {
  let l = logCatch({}, { ball: 'net', night: true, turn: 1, flawless: true, inRun: 1 });
  l = logCatch(l, { ball: 'net', night: false, turn: 3, flawless: false, inRun: 2 });
  assert.deepEqual({ catches: l.catches, net: l.balls.net, night: l.night, turn1: l.turn1, flawless: l.flawless, best: l.best }, { catches: 2, net: 2, night: 1, turn1: 1, flawless: 1, best: 2 });
  assert.equal(progressOf(TASKS_BY_ID['ball-net-1'], { ...blank(), ranger: { claimed: [], log: l } }).done, true);
});

test('days in a row: a streak grows on the next UTC day, resets after a gap, counts a day once', () => {
  let l = logDay({}, '2026-10-30');
  l = logDay(l, '2026-10-31');
  l = logDay(l, '2026-11-01');
  l = logDay(l, '2026-11-01');
  assert.equal(l.streak, 3);
  l = logDay(l, '2026-11-03');
  assert.equal(l.streak, 1);
  assert.equal(l.bestStreak, 3);
});
