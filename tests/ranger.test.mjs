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

test('a week\'s expeditions: three tiers in different groups, the same all week, a bonus for all three', async () => {
  const { expeditionTasks, expeditionWeek, logWeekCatch, logWeekDay, logWeekTick } = await import('../js/data/ranger.js');
  const week = expeditionWeek(new Date('2026-10-14T12:00:00Z'));
  assert.equal(week, '2026-10-12');
  assert.equal(expeditionWeek(new Date('2026-10-18T23:00:00Z')), week);
  const tasks = expeditionTasks(week);
  assert.deepEqual(tasks.map(t => t.tier), ['easy', 'medium', 'hard', 'bonus']);
  assert.deepEqual(expeditionTasks(week).map(t => t.id), tasks.map(t => t.id));
  // every week over a year: no two of one group, so the three are different kinds of goal
  for (let i = 0; i < 52; i++) {
    const w = expeditionWeek(new Date(Date.UTC(2026, 0, 5 + i * 7)));
    const ids = expeditionTasks(w).slice(0, 3).map(t => t.id.split(':')[2]);
    assert.equal(new Set(ids).size, 3, w);
  }
  // a week's tally counts only that week, and a new week starts afresh
  let tally = logWeekCatch(undefined, week, { id: 'poliwag', ball: 'net', night: true, flawless: true, rare: true });
  tally = logWeekDay(tally, week, '2026-10-13');
  tally = logWeekTick(tally, week, 'bosses');
  assert.equal(tally.types.water, 1);
  assert.equal(tally.rare, 1);
  const fresh = logWeekCatch(tally, '2026-10-19', { id: 'poliwag', ball: 'safari' });
  assert.equal(fresh.catches, 1);
  assert.equal(fresh.bosses, undefined);
  const save = { safariDex: { caught: [] }, ranger: { claimed: [], log: {}, week: tally }, safari: {} };
  for (const t of tasks) assert.ok(t.count(save) >= 0 && t.count(save) <= Math.max(t.goal, 99));
  const other = { ...save, ranger: { ...save.ranger, week: { ...tally, key: '2026-10-05' } } };
  assert.ok(tasks.slice(0, 3).every(t => t.count(other) === 0));
});

test('a catch that finishes a task is told once, before it\'s logged; the ranks earn their badges', async () => {
  const { finishedBy } = await import('../js/data/ranger.js');
  const { BADGES } = await import('../js/data/badges.js');
  const now = new Date('2026-10-14T12:00:00Z');
  const save = { safariDex: { caught: [] }, ranger: { claimed: [], log: { balls: { net: 0 } } }, safari: {} };
  const ids = finishedBy(save, { id: 'poliwag', ball: 'net', night: false, turn: 2, flawless: false, inRun: 1 }, now).map(t => t.id);
  assert.ok(ids.includes('ball-net-1'));
  const done = { ...save, ranger: { claimed: [], log: { balls: { net: 1 } } } };
  assert.ok(!finishedBy(done, { id: 'poliwag', ball: 'great', inRun: 1 }, now).some(t => t.id === 'ball-net-1'));
  const scout = BADGES.find(b => b.id === 'ranger-2');
  assert.ok(scout && !scout.test({}, save));
  assert.ok(scout.test({}, { ...save, ranger: { claimed: ['species-5', 'species-10', 'species-25', 'rare-1', 'ball-great-1'] } }));
});
