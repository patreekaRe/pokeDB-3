// The Berry Booth's saved loadout (js/data/workshop.js's fitLoadout()): only what's still kept goes on a run.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fitLoadout, loadoutLine, boothBeckons } from '../js/data/workshop.js';

const ws = (kit) => ({ kit });

test('a loadout keeps only berries and a kit item still kept, in order, up to the pouch', () => {
  const lo = { berries: ['held-oran', 'held-oran', 'held-lum', 'held-pecha'], item: 'kit-potion' };
  assert.deepEqual(fitLoadout(lo, ws({ 'held-oran': 1, 'held-lum': 2, 'held-pecha': 1 })), { berries: ['held-oran', 'held-lum'], item: null });
  assert.deepEqual(fitLoadout(lo, ws({ 'held-oran': 2, 'held-lum': 1, 'held-pecha': 1, 'kit-potion': 1 })).berries, ['held-oran', 'held-oran', 'held-lum']);
  assert.equal(fitLoadout(lo, ws({ 'kit-potion': 3 })).item, 'kit-potion');
  assert.deepEqual(fitLoadout(undefined, ws({})), { berries: [], item: null });
  assert.deepEqual(fitLoadout({ berries: ['kit-potion'], item: 'held-oran' }, ws({ 'kit-potion': 1, 'held-oran': 1 })), { berries: [], item: null });
});

test('Prepare\'s line names the held berry, the pouch and the kit', () => {
  assert.match(loadoutLine({ berries: [], item: null }), /Berry Booth/);
  assert.equal(loadoutLine({ berries: ['held-oran', 'held-lum'], item: null }), 'Bringing: Oran (held) · Lum');
  assert.equal(loadoutLine({ berries: [], item: 'kit-potion' }), 'Bringing: Kit: Potion');
});

test('the booth beckons while held berries are kept and nothing is packed', () => {
  assert.equal(boothBeckons(undefined, ws({ 'held-oran': 1 })), true);
  assert.equal(boothBeckons({ berries: ['held-oran'] }, ws({ 'held-oran': 1 })), false);
  assert.equal(boothBeckons(undefined, ws({ 'kit-potion': 1 })), false);
  assert.equal(boothBeckons({ berries: ['held-oran'] }, ws({ 'held-lum': 1 })), true);
});
