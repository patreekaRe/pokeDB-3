import test from 'node:test';
import assert from 'node:assert/strict';
import { TOWNS, QUESTS, RING, HOME_LINES, homeLeaders, waystoneGuest, guestLines, mended } from '../js/data/towns.js';
import { markShard, KEY_BY_ID } from '../js/data/satchel.js';
import { GYM_BY_ID } from '../js/data/gym.js';

globalThis.location = { search: '?towns' };   // homeLeaders() only while the towns are on

const lit = (ids, welcomed = true) => ({ towns: Object.fromEntries(ids.map(id => [id, { quest: { step: 4, got: 0, picks: {}, lit: true, welcomed } }])) });

test('the shard floats over one of the map\'s Alphas, and only an Alpha', () => {
  const rooms = [{ type: 'fight' }, { type: 'elite' }, { type: 'event' }, { type: 'elite' }, { type: 'boss' }];
  const room = markShard(rooms, 'shard-shrine', () => 0.99);
  assert.equal(room, rooms[3]);
  assert.equal(rooms.filter(r => r.shard).length, 1);
  assert.equal(markShard([{ type: 'fight' }], 'shard-shrine', Math.random), null);
  for (const t of RING) assert.ok(KEY_BY_ID[`shard-${t.id}`], `${t.id}: its shard is a key item`);
});

test('a mended town\'s leaders come home, each with something to say', () => {
  assert.deepEqual(homeLeaders({}), []);
  const home = homeLeaders(lit(['shrine', 'ruins']));
  assert.deepEqual(home.map(h => h.id).sort(), [...Object.keys(TOWNS.shrine.leaders), ...Object.keys(TOWNS.ruins.leaders)].sort());
  for (const town of Object.values(TOWNS)) for (const id of Object.keys(town.leaders)) {
    assert.ok(GYM_BY_ID[id], `${id} is a Gym Leader`);
    assert.ok(HOME_LINES[id]?.length >= 3, `${id}: a few speeches for coming home`);
    for (const speech of HOME_LINES[id]) {
      assert.ok(Array.isArray(speech) && speech.length >= 2, `${id}: a speech is a few lines`);
      for (const line of speech) assert.ok(!/^[A-Z]+: /.test(line), `${id}: the Secret Base strips a speaker's name`);
    }
  }
  assert.ok(mended(lit(['wastes']).towns.wastes));
});

test('the leader who put the shard in welcomes you home first, then the guests rotate', () => {
  const first = waystoneGuest(lit(['wastes'], false), () => 0);
  assert.equal(first.id, QUESTS.wastes.steps.at(-1).by);
  assert.ok(first.welcome);
  assert.match(guestLines(first)[0], /Cinder Springs says thank you/);
  const after = waystoneGuest(lit(['wastes']), () => 0.99);
  assert.ok(!after.welcome && Object.keys(TOWNS.wastes.leaders).includes(after.id));
  assert.deepEqual(guestLines(after), HOME_LINES[after.id].at(-1), 'the day deals one of their speeches');
  assert.equal(waystoneGuest({}, () => 0), null);
});
