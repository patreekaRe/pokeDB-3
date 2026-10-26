// The Secret Base's records (js/data/records.js): each sold by a real town, each a song with loop points, and a
// friend's page can't slip an unknown song (or a prototype key) into a visit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.location ??= { search: '?records', pathname: '/', hostname: 'localhost' };
const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const { RECORDS, RECORDS_BY_ID, PLAYERS, PLAYER_KINDS, GIFT_RECORD, recordsOf } = await import('../js/data/records.js');
const { TOWNS } = await import('../js/data/towns.js');
const { readGuestBase, loadBase, PIECES } = await import('../js/secret-base.js');

test('every record is sold by a town with a trader, ids unique, a price', () => {
  assert.equal(new Set(RECORDS.map(r => r.id)).size, RECORDS.length);
  for (const r of RECORDS) {
    assert.match(r.ink, /^#[0-9a-f]{6}$/i, r.id);
    if (r.gift) { assert.equal(r.town, undefined, `${r.id} is a gift, never sold`); continue; }
    assert.ok(TOWNS[r.town]?.trader, `${r.id}: ${r.town} has no trader`);
    assert.ok(r.price > 0, r.id);
  }
  assert.ok(RECORDS_BY_ID[GIFT_RECORD]?.gift, "Smeargle's record is a gift");
  for (const id of Object.keys(TOWNS)) if (TOWNS[id].trader) assert.ok(recordsOf(id).length, `${id} sells no records`);
});

test('every record plays a track js/audio.js has, with loop points', () => {
  const audio = readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8');
  const tracks = audio.slice(audio.indexOf('const TRACKS = {'), audio.indexOf('};', audio.indexOf('const TRACKS = {')));
  const loops = audio.slice(audio.indexOf('const LOOP_POINTS = {'), audio.indexOf('};', audio.indexOf('const LOOP_POINTS = {')));
  for (const r of RECORDS) {
    const key = new RegExp(`^\\s*'?${r.track}'?\\s*:`, 'm');
    assert.match(tracks, key, `${r.track} isn't a track`);
    assert.match(loops, key, `${r.track} has no loop points`);
  }
});

test('the players are real furniture kinds, each one Smeargle can give', () => {
  const fams = new Set(Object.values(PIECES).map(p => p.fam));
  for (const f of PLAYERS) assert.ok(fams.has(f), f);
  for (const id of PLAYER_KINDS) assert.ok(PIECES[id] && !PIECES[id].gift, id);
});

test("a friend's base keeps a known song and drops anything else", () => {
  const base = (song) => JSON.stringify({ ...loadBase(), song });
  assert.equal(readGuestBase(base('lantern')).song, 'lantern');
  for (const bad of ['nope', '__proto__', 'constructor', 7, null]) assert.equal(readGuestBase(base(bad)).song, undefined, String(bad));
  assert.equal(RECORDS_BY_ID.toString, undefined);
});
