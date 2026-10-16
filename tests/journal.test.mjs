import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOURNAL_TASKS, JOURNAL_TABS, JOURNAL_RANKS, JOURNAL_BY_ID, journalProgress, journalReady, journalRank } from '../js/data/journal.js';
import { BADGES } from '../js/data/badges.js';

const save = (o = {}) => ({ stats: { runsWon: 0, winsBy: {}, bossKills: {}, level5WinsBy: {} }, maxLevel: 0, gym: {}, dex: { done: [], defeated: [] }, unlocked: [],
  shiny: { owned: [] }, badges: [], tower: {}, towns: {}, hallOfFame: [], safariDex: { caught: [] }, journal: { claimed: [] }, ...o });

test('every Journal task has a unique id, a tab, a goal and a coin reward', () => {
  assert.equal(new Set(JOURNAL_TASKS.map(t => t.id)).size, JOURNAL_TASKS.length);
  for (const t of JOURNAL_TASKS) {
    assert.ok(JOURNAL_TABS.some(x => x.id === t.tab), t.id);
    assert.ok(t.goal >= 1 && t.reward.coins > 0, t.id);
    if (!t.id.startsWith('starters-')) assert.equal(journalProgress(t, save()).n, 0, t.id);   // a fresh save has done nothing but own the free starters
  }
});

test('an old save\'s progress counts at once, from what it already keeps', () => {
  const s = save({ stats: { runsWon: 6, winsBy: { charmander: 5, squirtle: 1 }, bossKills: { 1: 4 }, level5WinsBy: {}, enemiesDefeated: 150 }, maxLevel: 3, gym: { lawrence: 2 } });
  const ready = journalReady(s).map(t => t.id);
  for (const id of ['wins-1', 'wins-5', 'wins-fire-5', 'wins-water-1', 'level-3', 'foes-100', 'bosses-3', 'gym-lawrence']) assert.ok(ready.includes(id), id);
  assert.ok(!ready.includes('wins-10') && !ready.includes('level-4') && !ready.includes('wins-grass-1'));
  s.journal.claimed = ready;
  assert.equal(journalReady(s).length, 0);
  assert.equal(journalRank(s).rank.name, JOURNAL_RANKS.filter(r => r.at <= ready.length).at(-1).name);
});

test('each rank past the first earns a badge with a name of its own', () => {
  for (const r of JOURNAL_RANKS.slice(1)) {
    const b = BADGES.find(x => x.name === `${r.name} Badge` && x.id.startsWith('journal-'));
    assert.ok(b, r.name);
    assert.ok(!b.test({}, save()));
    assert.ok(b.test({}, save({ journal: { claimed: JOURNAL_TASKS.slice(0, r.at).map(t => t.id) } })));
  }
  assert.equal(new Set(BADGES.map(b => b.name)).size, BADGES.length);
  assert.ok(JOURNAL_BY_ID['gym-all']);
});
