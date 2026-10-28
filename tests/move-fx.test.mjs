import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CARDS_BY_ID } from '../js/data/cards.js';
import { MOVE_FX, TYPE_FX } from '../js/data/move-fx.js';

test('every move given its own effect is a card, and every effect is one js/movefx.js draws', async () => {
  const ids = new Set(Object.keys(CARDS_BY_ID));
  const src = await readFile(new URL('../js/movefx.js', import.meta.url), 'utf8');
  const drawn = new Set([...src.slice(src.indexOf('const MOVES = {')).matchAll(/^  (\w+)\(A, B/gm)].map(m => m[1]));
  for (const [id, kind] of Object.entries(MOVE_FX)) {
    assert.ok(ids.has(id), `${id} is not a card`);
    assert.ok(drawn.has(kind), `${id}: no effect called ${kind}`);
  }
  for (const kind of Object.values(TYPE_FX)) assert.ok(drawn.has(kind), `no effect called ${kind}`);
});
