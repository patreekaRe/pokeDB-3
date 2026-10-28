import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { BALL_LOOKS } from '../js/ball-looks.js';
import { BALLS } from '../js/data/balls.js';
import { SKINS, workshopOf, ownsSkin, ownedSkins, withBought, apricornToday, isMade, SKIN_BY_ID } from '../js/data/workshop.js';
import { workshopOpen } from '../js/data/towns.js';

test('every ball thrown has a 3D look and its sheet (run tools/ball-sheets.mjs after adding one)', () => {
  for (const sprite of ['poke-ball', ...BALLS.map(b => b.sprite), ...SKINS.map(s => s.sprite)]) {
    assert.ok(BALL_LOOKS.includes(sprite), `${sprite} has no look in js/ball-looks.js`);
    assert.ok(existsSync(new URL(`../assets/balls/${sprite}.webp`, import.meta.url)), `${sprite} has no sheet`);
  }
});

test('the Outfitter sells one of Kurt\'s seven Apricorns a day, every one within a week, never a secret one', () => {
  const week = ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'].map(apricornToday);
  assert.equal(new Set(week).size, 7);
  assert.ok(week.every(r => r.kind === 'skin' && !r.secret));
  assert.equal(apricornToday('2026-11-03'), week[0]);
});

test('a bought Apricorn ball is yours and carried, but doesn\'t open Kurt\'s Workshop', () => {
  const love = SKIN_BY_ID.love, ws = withBought(workshopOf({}), love);
  assert.ok(ownsSkin(ws, love) && isMade(love, ws, { keys: [] }));
  assert.equal(ws.skin, 'love');
  assert.deepEqual(ownedSkins(ws), [love]);
  assert.deepEqual(ws.made, []);
  assert.equal(workshopOpen({ workshop: ws }), false);
});
