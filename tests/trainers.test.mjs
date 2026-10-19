// The Trainers app's pure part (js/data/trainers.js): friend codes, the list in the save, the public doc the rules take.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CODE_LETTERS, CODE_LEN, FRIENDS_MAX, BASE_MAX, rollCode, isCode, formatCode, parseCode, friendsOf, addFriend, dropFriend,
  trainerDoc, checkTrainer, cardDoc, lastSeen, TRAINER_KEYS, CARD_KEYS, blurbDoc, addId, addDoc, plazaPick, PLAZA_SHOWN, PLAZA_KEYS, ADD_KEYS } from '../js/data/trainers.js';

test('codes have no look-alikes and read either way', () => {
  for (const c of 'O0I1L') assert.ok(!CODE_LETTERS.includes(c));
  for (let i = 0; i < 200; i++) assert.ok(isCode(rollCode()));
  assert.equal(rollCode().length, CODE_LEN);
  assert.equal(formatCode('ABCDEFGH'), 'ABCD-EFGH');
  assert.equal(parseCode(' abcd-efgh '), 'ABCDEFGH');
  assert.equal(parseCode('ABCD EFGH'), 'ABCDEFGH');
  assert.equal(parseCode('ABCD-EFG0'), null);
  assert.equal(parseCode('ABCDEFGHJ'), null);
  assert.equal(parseCode(null), null);
});

test('the rules\' code pattern is CODE_LETTERS', () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  const [, cls] = rules.match(/c\.matches\('\[([^\]]+)\]\{8\}'\)/);
  const letters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(ch => new RegExp(`[${cls}]`).test(ch)).join('');
  assert.equal(letters, CODE_LETTERS);
});

test('adding is one way, once, never yourself, at most FRIENDS_MAX', () => {
  let list = [];
  ({ list } = addFriend(list, 'b', 'a'));
  assert.deepEqual(list, ['b']);
  assert.equal(addFriend(list, 'b', 'a').why, 'already');
  assert.equal(addFriend(list, 'a', 'a').why, 'self');
  assert.equal(addFriend(list, '', 'a').why, 'bad');
  const full = Array.from({ length: FRIENDS_MAX }, (_, i) => `u${i}`);
  assert.equal(addFriend(full, 'x', 'a').why, 'full');
  assert.deepEqual(dropFriend(['b', 'c'], 'b'), ['c']);
  assert.deepEqual(friendsOf({ friends: ['b', 'b', 7, 'a', 'c'] }, 'a'), ['b', 'c']);
  assert.deepEqual(friendsOf({}), []);
});

test('a trainer doc is what the rules take', () => {
  const doc = trainerDoc({ code: 'ABCDEFGH', name: ' ash ', card: { tier: 'gold', badges: ['first-win'], wins: 3.4, dex: 20, dexOf: 151, partner: 'starter:charmander:2' },
    buddy: 'starter:squirtle', base: { v: 2, rooms: [] } });
  assert.equal(checkTrainer(doc), null);
  assert.equal(doc.name, 'ASH');
  assert.equal(doc.card.wins, 3);
  assert.deepEqual(Object.keys(doc.card).sort(), [...CARD_KEYS].sort());
  assert.ok(Object.keys(doc).every(k => TRAINER_KEYS.includes(k)));
  assert.equal(JSON.parse(doc.base).v, 2);
  assert.equal(trainerDoc({ code: 'ABCDEFGH', name: '', card: {}, buddy: '' }).name, 'TRAINER');
  assert.equal(cardDoc({ tier: 'mauve' }).tier, 'green');
  assert.equal(checkTrainer({ ...doc, code: 'abc' }), 'bad code');
  assert.equal(checkTrainer({ ...doc, extra: 1 }), 'extra key');
  const huge = trainerDoc({ code: 'ABCDEFGH', name: 'A', card: {}, buddy: '', base: { junk: 'x'.repeat(BASE_MAX) } });
  assert.ok(!('base' in huge));
});

test('the rules\' trainer keys match the doc\'s', () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  const list = (s) => s.split(',').map(x => x.trim().replace(/'/g, ''));
  assert.deepEqual(list(rules.match(/d\.keys\(\)\.hasOnly\(\[('code'[^\]]*)\]\)/)[1]), TRAINER_KEYS);
  assert.deepEqual(list(rules.match(/c\.keys\(\)\.hasOnly\(\[([^\]]*)\]\)/)[1]), CARD_KEYS);
});

test('last seen reads naturally', () => {
  const now = Date.parse('2026-10-17T12:00:00Z');
  assert.equal(lastSeen(0, now), 'Not seen yet');
  assert.equal(lastSeen(now - 60000, now), 'Online just now');
  assert.equal(lastSeen(now - 20 * 60000, now), 'Seen 20 min ago');
  assert.equal(lastSeen(now - 5 * 3600000, now), 'Seen 5 h ago');
  assert.equal(lastSeen(now - 4 * 86400000, now), 'Seen 4 days ago');
});

test('a blurb is bounded, a note starts unseen, the Plaza is newest first without you', () => {
  const b = blurbDoc({ name: ' gary oak the very best ', tier: 'mauve', badges: 5000, wins: -3, buddy: 'starter:charmander', partner: 7 });
  assert.equal(b.name, 'GARY OAK THE VER');
  assert.equal(b.tier, 'green');
  assert.equal(b.badges, 999);
  assert.equal(b.wins, 0);
  assert.equal(b.partner, '');
  assert.equal(addId('to', 'from'), 'to_from');
  const n = addDoc('b', 'a', { name: 'misty' });
  assert.equal(n.seen, false);
  assert.deepEqual([...Object.keys(n), 'at'].sort(), [...ADD_KEYS].sort());
  assert.deepEqual([...Object.keys(blurbDoc()), 'at'].sort(), [...PLAZA_KEYS].sort());
  const many = Array.from({ length: 40 }, (_, i) => ({ uid: `u${i}`, at: i }));
  const pick = plazaPick([...many, { uid: 'me', at: 999 }, { uid: 'u39', at: 1 }], 'me');
  assert.equal(pick.length, PLAZA_SHOWN);
  assert.equal(pick[0].uid, 'u39');
  assert.ok(!pick.some(e => e.uid === 'me'));
  assert.equal(new Set(pick.map(e => e.uid)).size, pick.length);
});

test('the rules\' Plaza and note keys match the docs\'', () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  const list = (s) => s.split(',').map(x => x.trim().replace(/'/g, '')).sort();
  assert.deepEqual(list(rules.match(/request\.resource\.data\.keys\(\)\.hasOnly\(\[('name'[^\]]*)\]\)/)[1]), [...PLAZA_KEYS].sort());
  assert.deepEqual(list(rules.match(/d\.keys\(\)\.hasOnly\(\[('from'[^\]]*)\]\)/)[1]), [...ADD_KEYS].sort());
});

test('the card\'s newer numbers: kept in bounds, and "none" on a page from before them', () => {
  const c = cardDoc({ rank: 2, top: 5, fave: 'cyndaquil', pillar: 18 });
  assert.deepEqual([c.rank, c.top, c.fave, c.pillar], [2, 5, 'cyndaquil', 18]);
  const old = cardDoc({ tier: 'gold', wins: 3 });
  assert.deepEqual([old.rank, old.top, old.fave, old.pillar], [-1, -1, '', 0]);
  assert.deepEqual([cardDoc({ top: -1 }).top, cardDoc({ top: 0 }).top, cardDoc({ rank: 99 }).rank], [-1, 0, 20]);
  assert.deepEqual([cardDoc({ shinies: 7, ranger: 3 }).shinies, cardDoc({ shinies: 7, ranger: 3 }).ranger], [7, 3]);
  assert.deepEqual([old.shinies, old.ranger], [0, -1]);
});
