// The Pokédex's Friends app (js/data/friends.js): its "!" the first time it's seen, a friend's when they change, and
// what the next heart brings.
import test from 'node:test';
import assert from 'node:assert/strict';
import { friendsNews, friendFresh, friendStamp, seeFriends, friendPieces, nextHeart } from '../js/data/friends.js';
import { FRIENDS, HEARTS, HEART_PIECES } from '../js/data/workshop.js';

// the towns are on for good (TOWNS_LIVE), so the app shows once a gift-taking leader is beaten
const save = (more = {}) => ({ gym: {}, workshop: { liked: {}, fond: [] }, ...more });
const beat = (s, id) => ({ ...s, gym: { ...s.gym, [id]: 1 } });

test('the app wears a "!" from its first showing until it is opened, a save with hearts from the PC page too', () => {
  assert.equal(friendsNews(save()), false, 'no friend beaten: no app');
  const met = beat(save(), 'john');
  assert.equal(friendsNews(met), true);
  const old = { ...met, workshop: { liked: { john: 3 }, fond: ['john'] } };   // hearts given while the page was the PC's
  assert.equal(friendsNews(old), true);
  const opened = { ...old, friendsSeen: seeFriends(old) };
  assert.equal(friendsNews(opened), false, 'opened once: gone');
  assert.equal(FRIENDS.some(id => friendFresh(opened, id)), false, 'the first open marks no friend');
});

test('a friend met, given a heart or their favourite since the page last showed them wears a "!" till shown', () => {
  let s = beat(save(), 'john');
  s = { ...s, friendsSeen: seeFriends(s) };
  assert.equal(friendFresh(s, 'pat'), false, 'not met yet: nothing to see');
  s = beat(s, 'pat');
  assert.equal(friendFresh(s, 'pat'), true, 'new to the page');
  assert.equal(friendsNews(s), true);
  s = { ...s, friendsSeen: seeFriends(s, ['pat']) };
  assert.equal(friendsNews(s), false);
  s = { ...s, workshop: { liked: { john: 1 }, fond: [] } };
  assert.equal(friendFresh(s, 'john'), true, 'a new heart');
  s = { ...s, friendsSeen: seeFriends(s, ['john']) };
  assert.equal(friendFresh(s, 'john'), false);
  s = { ...s, workshop: { liked: { john: 9 }, fond: [] } };
  s = { ...s, friendsSeen: seeFriends(s, ['john']) };
  s = { ...s, workshop: { liked: { john: 11 }, fond: ['john'] } };
  assert.equal(friendStamp(s, 'john'), `${HEARTS}f`);
  assert.equal(friendFresh(s, 'john'), true, 'their favourite at full hearts: a new piece, no new heart');
});

test('the next heart names its piece and what else it brings, nothing at full hearts', () => {
  for (const id of FRIENDS) {
    const at3 = nextHeart(id, 2);
    assert.equal(at3.at, 3, id);
    assert.equal(at3.piece, HEART_PIECES[id][0], id);
    assert.ok(!at3.perks.includes('visits') && at3.perks.includes('requests'), id);   // visits are off (LEADER_VISITS_LIVE)
    assert.equal(nextHeart(id, 4).piece, HEART_PIECES[id][1], id);
    assert.equal(nextHeart(id, HEARTS), null, id);
  }
  assert.deepEqual(nextHeart('john', 0), { at: 2, piece: null, perks: ['letters'] });
  const pieces = friendPieces(save({ workshop: { liked: { john: 3 }, fond: [] } }), 'john');
  assert.deepEqual(pieces.map(p => p.got), [false, true, false]);
});
