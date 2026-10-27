// A new Safari player's first catches move into the Secret Base by themselves (js/safari-home.js), the first with a window.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.location ??= { search: '', pathname: '/', hostname: 'localhost' };
const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const { getSave, markSafari } = await import('../js/storage.js');
const { moveInFirst, FIRST_HOME } = await import('../js/safari-home.js');
const { SAFARI_DEX_PAGES } = await import('../js/data/safari.js');

test('the first two catches move in, the first with a window, the third stays out', () => {
  const ids = [...new Set(SAFARI_DEX_PAGES.flatMap(p => p.ids))].slice(0, FIRST_HOME + 1);
  const got = ids.map(id => { markSafari('caught', id); return moveInFirst(id, false); });
  assert.ok(got[0].told && got[0].told.feat && /Secret Base/.test(got[0].told.hint) && /6 in each room/.test(got[0].told.hint));
  assert.ok(got[1] && !got[1].told);
  assert.equal(got[2], null);
  assert.deepEqual(getSave().secretBase.mons, ids.slice(0, FIRST_HOME));
  assert.ok(!(getSave().secretBase.v >= 2), 'no base is made before one is bought');
});
