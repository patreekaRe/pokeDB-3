/* ============================================================
   workshop.js  -  Kurt's Workshop in the Whispering Clearing (docs/roadmap.md's Towns step 6, session 3, 2026-10-14):
   Johto's Apricorn ball maker turns the Satchel's materials (js/data/satchel.js) into six kinds of thing, the first four
   no power in a run:
   - key    the questlines' Make steps (js/data/towns.js's QUESTS `craft`), into the Satchel's Key Items
   - piece  craft-only furniture from each town's shelf, into the Secret Base (js/data/furniture.js's 'craft' source)
   - gift   a present for a Gym Leader, handed over in their home; their favourite earns their signature piece
   - skin   an Apricorn ball's look for the Safari Ball (looks only: the odds stay the Safari Ball's)
   - held   a held berry (js/data/held.js) and
   - kit    a Bag item (js/data/items.js), both from backyard berries and the towns' finds (2026-10-15, the user's ask):
            made again and again, counted in `save.workshop.kit`; a Berry Pouch of up to POUCH held berries (packPouch())
            and one kit item (packOne()) are packed before a run
   A recipe shows once it can matter: a quest item while its town's questline is open, a town's pieces once you've been
   there, a gift once you've beaten whoever loves it, a held berry once the backyard's bought or that berry's been in the
   Satchel, the Apricorns and the run kit always. Pure: tests/workshop.test.mjs.
   The save's side and the window are js/workshop.js; the save is `save.workshop` (workshopOf()).
   ============================================================ */

import { MATERIALS_BY_ID } from './satchel.js';
import { HELD_BY_ID, POUCH } from './held.js';
import { ITEMS_BY_ID } from './items.js';

const key = (id, town, needs, more = {}) => ({ id, kind: 'key', town, makes: id, needs, ...more });
const piece = (id, name, town, needs, more = {}) => ({ id: `piece-${id}`, kind: 'piece', name, town, makes: id, needs, ...more });
const gift = (id, name, icon, leader, needs, text, sig) => ({ id: `gift-${id}`, kind: 'gift', name, icon, leader, makes: id, needs, text, sig });
const skin = (id, name, needs, text) => ({ id: `skin-${id}`, kind: 'skin', name, makes: id, sprite: `${id}-ball`, needs, text });
// a friend's secret recipe (step 8, session e): their own Safari Ball look, taught to Kurt at SECRET_AT hearts
const secret = (id, name, leader, needs, text) => ({ ...skin(id, name, needs, text), leader, secret: true });
const held = (id, needs) => { const h = HELD_BY_ID[id]; return { id: `held-${id}`, kind: 'held', name: h.name, makes: id, berry: h.berry, sprite: h.sprite, needs, text: h.text }; };
const kit = (id, needs) => { const i = ITEMS_BY_ID[id]; return { id: `kit-${id}`, kind: 'kit', name: i.name, makes: id, sprite: id, needs, text: i.text }; };

export const RECIPES = [
  // the questlines' Make steps: each from its own biome, but Machew's katana wants Cinder Springs' ore, and the Spirit
  // Lantern a Shrine wick, so the other roads matter (the user's plan)
  key('waystone-chime', 'clearing', { acorn: 4, glowmoss: 1 }),   // the Nietos' (step 7), from the Clearing's own
  key('festival-lanterns', 'shrine', { wick: 3, washi: 3 }),
  key('comms-relay', 'wastes', { 'copper-wire': 4, 'magma-ore': 1 }),
  key('sequin-costume', 'wastes', { 'ember-sequin': 5, 'copper-wire': 1 }),
  key('pier-supports', 'ruins', { driftwood: 5, 'sea-glass': 1 }),
  key('spirit-lantern', 'thornwood', { ghostcap: 3, wick: 1 }, { at: 'cauldron' }),
  key('katana', 'savanna', { 'magma-ore': 4, resin: 2 }),
  // craft-only furniture, two a town, and John's festival's own piece once you've picked it
  piece('daruma', 'Daruma', 'shrine', { washi: 3, wick: 1 }),
  piece('chochin', 'Paper lantern', 'shrine', { washi: 2, wick: 2 }, { pick: ['sh-spirits', 'lantern'] }),
  piece('teaset', 'Tea set', 'shrine', { washi: 2, wick: 2 }, { pick: ['sh-spirits', 'moon'] }),
  piece('taiko', 'Taiko drum', 'shrine', { washi: 2, wick: 2 }, { pick: ['sh-spirits', 'fireworks'] }),
  piece('steamrocks', 'Steam rocks', 'wastes', { 'magma-ore': 3 }),
  piece('massagechair', 'Massage chair', 'wastes', { 'copper-wire': 3, 'ember-sequin': 2 }),
  piece('shipwreck', 'Shipwreck', 'ruins', { driftwood: 4, 'sea-glass': 1 }),
  piece('jellylamp', 'Jelly lamp', 'ruins', { 'sea-glass': 3 }),
  piece('seedtrays', 'Seed trays', 'thornwood', { seeds: 3 }),
  piece('flytrap', 'Flytrap', 'thornwood', { seeds: 2, ghostcap: 2 }),
  piece('brasslantern', 'Brass lantern', 'savanna', { resin: 2, spice: 1 }),
  piece('bedouintent', 'Bedouin tent', 'savanna', { resin: 3, spice: 2 }),
  // a gift a Gym Leader, each someone's favourite: given in their home, it earns their signature piece (`sig`)
  gift('fan', 'Paper Fan', '🪭', 'john', { washi: 2, wick: 1 }, 'A folding fan with the festival\'s three choices painted on it. Fan it at John till he picks.', 'luckycat'),
  gift('curry', 'Wake-Up Curry', '🍛', 'jahmes', { spice: 3 }, 'Savanna Spice, a lot of it. Nobody has gone to bed early after a bowl.', 'zabuton'),
  gift('mirror', 'Stage Mirror', '🪞', 'clarence', { 'sea-glass': 2, 'ember-sequin': 1 }, 'A hand mirror rimmed in sequins. For checking the pose between poses.', 'wavebyobu'),
  gift('keyboard', 'Clicky Keyboard', '⌨️', 'shaun', { 'copper-wire': 3, resin: 1 }, 'Hand-wired, every key louder than the last. He\'ll say the wiring\'s wrong.', 'pingpong'),
  gift('lemonade', 'Tall Lemonade', '🍋', 'pat', { spice: 1, resin: 1 }, 'Like a tall glass of lemonade. Sweetened with Acacia Resin. Pat might cry.', 'pearlstand'),
  gift('cattower', 'Cat Tower', '🐈', 'kayl', { driftwood: 3, resin: 1 }, 'Driftwood shelves and a rope post. For the cats, who are tenants too.', 'octopuschair'),
  gift('stew', 'Ghostcap Stew', '🍲', 'phil', { ghostcap: 2, spice: 1 }, 'It glows a little. Phil eats it in the dark to check. Jona wants none.', 'scarecrow'),
  gift('cocoa', 'Ember Cocoa', '☕', 'ricky', { spice: 1, 'ember-sequin': 1 }, 'Hot cocoa that fizzes. For the third hour of a stream at 3 a.m.', 'hammock'),
  gift('incense', 'Shadow Incense', '🪔', 'machew', { resin: 2, wick: 1 }, 'Acacia smoke for meditating on failure. Machew has a lot to meditate on.', 'sphinx'),
  gift('heistmap', 'Heist Map', '🗺️', 'jerome', { washi: 2, resin: 1 }, 'A map of the bandits\' camp. Every route is labelled IN AND OUT.', 'goldurn'),
  // the Clearing's own: the Nietos, given at their house by the plaza
  gift('rattle', 'Acorn Rattle', '🪇', 'nietos', { acorn: 3, glowmoss: 1 }, 'Whisper Acorns in a glowing rattle. It hums Linc to sleep, so Law and Britt finally get a night off.', 'bigkangaskhandoll'),
  // Kurt's own trade: an Apricorn's look for the Safari Ball
  skin('level', 'Level Ball', { 'magma-ore': 3 }, 'A red Apricorn, cured over Cinder Springs\' ore.'),
  skin('lure', 'Lure Ball', { driftwood: 3 }, 'A blue Apricorn, carved for the fishermen of Driftwood Landing.'),
  skin('moon', 'Moon Ball', { ghostcap: 3 }, 'A yellow Apricorn that glows like Ghostcap after dark.'),
  skin('friend', 'Friend Ball', { seeds: 3 }, 'A green Apricorn, planted and picked in Thornwood.'),
  skin('love', 'Love Ball', { 'ember-sequin': 3 }, 'A pink Apricorn, sequinned. Clarence asked for one first.'),
  skin('heavy', 'Heavy Ball', { 'copper-wire': 3 }, 'A black Apricorn, banded in copper. It still flies like a Safari Ball.'),
  skin('fast', 'Fast Ball', { resin: 3 }, 'A white Apricorn, varnished in Acacia Resin.'),
  // each friend's secret recipe, from their own town's materials
  secret('nest', 'Nest Ball', 'nietos', { acorn: 3, glowmoss: 2 }, 'Law and Britt\'s secret: a green Apricorn lined with Glowmoss, a nest for Linc. They swear he naps in it.'),
  secret('repeat', 'Repeat Ball', 'john', { wick: 2, washi: 3 }, 'John\'s secret: he painted it, scrubbed it off and painted it again. He still can\'t pick.'),
  secret('dream', 'Dream Ball', 'jahmes', { washi: 3, wick: 2 }, 'Jahmes\'s secret: pink as a sleep mask. He finishes one by 10:59, every time.'),
  secret('cherish', 'Cherish Ball', 'clarence', { 'ember-sequin': 3, 'magma-ore': 2 }, 'Clarence\'s secret: sequinned red, for a Pokémon that deserves an entrance.'),
  secret('sport', 'Sport Ball', 'shaun', { 'copper-wire': 3, 'ember-sequin': 2 }, 'Shaun\'s secret: team colours. He calls the throw before you make it.'),
  secret('heal', 'Heal Ball', 'pat', { 'sea-glass': 3, driftwood: 2 }, 'Pat\'s secret: soft pink, like a tall glass of lemonade. He sang to it while it dried.'),
  secret('park', 'Park Ball', 'kayl', { driftwood: 3, 'sea-glass': 2 }, 'Kayl\'s secret: for walking Spooky and Reya, who refuse to be walked.'),
  secret('premier', 'Premier Ball', 'phil', { ghostcap: 3, seeds: 2 }, 'Phil\'s secret: white as a sheet. He says JONA picked it.'),
  secret('jet', 'Jet Ball', 'ricky', { seeds: 3, ghostcap: 2 }, 'Ricky\'s secret: it flies like a 2 a.m. espresso. He has never thrown one before noon.'),
  secret('beast', 'Beast Ball', 'machew', { resin: 3, spice: 2 }, 'Machew\'s secret: he says it\'s for beasts. It\'s for the cover of his journal.'),
  secret('poke', 'Poké Ball', 'jerome', { spice: 3, resin: 2 }, 'Jerome\'s secret: the very first Poké Ball, lifted from a museum case. He swears it was a replica.'),
  // held berries, a town's find in each so the backyard pulls you round the roads
  held('oran', { oran: 3, acorn: 1 }),
  held('sitrus', { sitrus: 3, 'sea-glass': 1 }),
  held('cheri', { cheri: 3, spice: 1 }),
  held('pecha', { pecha: 3, washi: 1 }),
  held('lum', { lum: 3, ghostcap: 1 }),
  // the run kit: a Bag item to start a run with
  kit('potion', { oran: 2, glowmoss: 1 }),
  kit('super-potion', { sitrus: 2, oran: 1, resin: 1 }),
  kit('x-attack', { cheri: 2, 'magma-ore': 1 }),
  kit('x-defend', { pecha: 2, driftwood: 1 }),
  kit('revive', { lum: 2, sitrus: 1, 'sea-glass': 1, 'ember-sequin': 1 }),
];
export const RECIPES_BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));

/** The Workshop's shelves, in its window's order. */
export const TABS = [
  { id: 'key', name: 'Quest' },
  { id: 'piece', name: 'Furniture' },
  { id: 'gift', name: 'Gifts' },
  { id: 'skin', name: 'Apricorns' },
  { id: 'held', name: 'Held berries' },
  { id: 'kit', name: 'Run kit' },
];
/** The shelves made again and again, each make one more kept to pack for a run (`ws.kit`, by recipe id). */
export const REPEAT = ['held', 'kit'];
export const repeats = (recipe) => REPEAT.includes(recipe.kind);

/** The gifts, by the Gym Leader who loves each. */
export const GIFTS = RECIPES.filter(r => r.kind === 'gift');
export const GIFT_BY_ID = Object.fromEntries(GIFTS.map(g => [g.makes, g]));
export const FAVOURITE = Object.fromEntries(GIFTS.map(g => [g.leader, g]));
export const SKINS = RECIPES.filter(r => r.kind === 'skin');
export const SKIN_BY_ID = Object.fromEntries(SKINS.map(s => [s.makes, s]));

/** Who a gift is handed to, by name: the Nietos are Law and Britt at home. */
export const gifteeOf = (leader, name) => (leader === 'nietos' ? 'Law and Britt' : name);

/** The save's Workshop: furniture and skins `made`, `gifts` held (counts), held berries and run kit kept (`kit`, counts by recipe id), each leader's `liked` (gifts given) and `heard` (heart lines said, js/data/towns.js's HEART_LINES), those
    `fond` of you (their favourite given, their signature piece earned) and the Safari Ball's `skin` (null: its own). */
export function workshopOf(save) {
  return { made: [], gifts: {}, kit: {}, liked: {}, heard: {}, fond: [], skin: null, ...(save.workshop || {}) };
}

/** What a recipe needs that the Satchel lacks: [{ id, need, have }] (empty when it can be made). */
export function shortOf(recipe, sat) {
  return Object.entries(recipe.needs).map(([id, need]) => ({ id, need, have: sat.mats[id] || 0 })).filter(m => m.have < m.need);
}

/** Made already, for good: a key item held, a piece or skin made (a gift, a held berry or run kit can always be made again). */
export function isMade(recipe, ws, sat) {
  if (recipe.kind === 'key') return sat.keys.includes(recipe.makes);
  if (recipe.kind === 'gift' || repeats(recipe)) return false;
  return ws.made.includes(recipe.id);
}

/** Whether the Workshop shows a recipe (see the top of this file). `towns` is the save's per-town states
    (js/data/towns.js's townState() of each), `wins` a Gym Leader's wins, `hearts` a friend's hearts, `yard` the backyard
    bought, `mats` the materials ever held (the Satchel's `seen`). */
export function shows(recipe, { towns, wins, hearts = () => 0, yard = false, mats = [] }) {
  if (recipe.kind === 'held') return yard || mats.includes(recipe.berry);
  if (recipe.kind === 'kit') return true;
  if (recipe.kind === 'key') return !!towns[recipe.town]?.quest;
  if (recipe.kind === 'piece') {
    const st = towns[recipe.town];
    if (!st?.met) return false;
    return !recipe.pick || st.quest?.picks?.[recipe.pick[0]] === recipe.pick[1];
  }
  if (recipe.kind === 'gift') return wins(recipe.leader) > 0;
  if (recipe.secret) return taught(hearts, recipe.leader);
  return true;
}

/** The Satchel's materials with a recipe's taken out (call only when shortOf() is empty). */
export function spend(recipe, sat) {
  const mats = { ...sat.mats };
  for (const [id, n] of Object.entries(recipe.needs)) mats[id] = Math.max(0, (mats[id] || 0) - n);
  return { ...sat, mats };
}

/** The Workshop once a recipe's made (the Satchel's side, a key item, is js/workshop.js's). */
export function madeInto(recipe, ws) {
  if (recipe.kind === 'gift') return { ...ws, gifts: { ...ws.gifts, [recipe.makes]: (ws.gifts[recipe.makes] || 0) + 1 } };
  if (repeats(recipe)) return { ...ws, kit: { ...ws.kit, [recipe.id]: (ws.kit?.[recipe.id] || 0) + 1 } };
  if (recipe.kind === 'key' || ws.made.includes(recipe.id)) return ws;
  return { ...ws, made: [...ws.made, recipe.id] };
}

/** The held berries and run kit kept to pack for a run, [{ recipe, n }], in the Workshop's order. */
export const packable = (ws) => RECIPES.filter(r => repeats(r) && ws.kit?.[r.id] > 0).map(r => ({ recipe: r, n: ws.kit[r.id] }));

/** One kept thing packed for a run: { ws (one fewer kept), held: a held berry's id } or { ws, item: an item's id }; null
    if none is kept. */
export function packOne(ws, id) {
  const r = RECIPES_BY_ID[id];
  if (!r || !repeats(r) || !(ws.kit?.[id] > 0)) return null;
  return { ws: { ...ws, kit: { ...ws.kit, [id]: ws.kit[id] - 1 } }, ...(r.kind === 'held' ? { held: r.makes } : { item: r.makes }) };
}

/** A Berry Pouch packed for a run from held berry recipe ids (up to POUCH, repeats while enough are kept): { ws (those
    taken out), berries: held berry ids, in order }. Any not kept are skipped. */
export function packPouch(ws, ids) {
  const kit = { ...ws.kit }, berries = [];
  for (const id of ids.slice(0, POUCH)) {
    const r = RECIPES_BY_ID[id];
    if (r?.kind !== 'held' || !(kit[id] > 0)) continue;
    kit[id] -= 1;
    berries.push(r.makes);
  }
  return { ws: { ...ws, kit }, berries };
}

/** The Berry Booth's saved loadout (`save.loadout`, js/berrybooth.js) held to what's still kept: { berries: held berry
    recipe ids, up to POUCH, the first held as the run sets out; item: a run kit recipe id or null }. */
export function fitLoadout(lo, ws) {
  const room = { ...ws.kit };
  const berries = (lo?.berries || []).slice(0, POUCH).filter(id => RECIPES_BY_ID[id]?.kind === 'held' && room[id]-- > 0);
  const item = RECIPES_BY_ID[lo?.item]?.kind === 'kit' && ws.kit?.[lo.item] > 0 ? lo.item : null;
  return { berries, item };
}

/** Whether the Berry Booth beckons (a "!" over the Clearing's kiosk): held berries kept and nothing packed. */
export function boothBeckons(lo, ws) {
  const now = fitLoadout(lo, ws);
  return !now.berries.length && !now.item && packable(ws).some(o => o.recipe.kind === 'held');
}

/** Prepare's one line on what a run sets out with (the user's pick, 2026-10-23: read-only, packed at the Berry Booth). */
export function loadoutLine({ berries, item }) {
  if (!berries.length && !item) return 'Nothing packed: visit the Berry Booth by the Clearing\'s gate.';
  const short = (id) => HELD_BY_ID[RECIPES_BY_ID[id].makes].name.replace(/ Berry$/, '');
  const parts = berries.map((id, i) => (i ? short(id) : `${short(id)} (held)`));
  if (item) parts.push(`Kit: ${RECIPES_BY_ID[item].name}`);
  return `Bringing: ${parts.join(' · ')}`;
}

/** A gift handed to `leader`: one fewer held, their liking up (two for their favourite), and their favourite the first
    time makes them fond of you (their signature piece). Returns { ws, favourite, first }. */
export function giveGift(ws, giftId, leader) {
  const g = GIFT_BY_ID[giftId];
  if (!g || !(ws.gifts[giftId] > 0)) return { ws, favourite: false, first: false };
  const favourite = g.leader === leader, first = favourite && !ws.fond.includes(leader);
  return {
    favourite, first,
    ws: { ...ws, gifts: { ...ws.gifts, [giftId]: ws.gifts[giftId] - 1 }, liked: { ...ws.liked, [leader]: (ws.liked[leader] || 0) + (favourite ? 2 : 1) },
      fond: first ? [...ws.fond, leader] : ws.fond },
  };
}

/** A friend's hearts (the user's picks, 2026-10-14; docs/roadmap.md's step 8): `liked` shown as up to HEARTS, so a gift
    fills one and their favourite two. Gifts past the last still count in `liked`, so the cap can move later. */
export const HEARTS = 5;
export const heartsOf = (ws, leader) => Math.min(HEARTS, ws.liked?.[leader] || 0);

/** Everyone who takes a gift, the Nietos (home) first. */
export const FRIENDS = ['nietos', ...GIFTS.map(g => g.leader).filter(id => id !== 'nietos')];

/** The gifts' first-time words, each once a save in `ws.told` (js/held-tips.js): Kurt's `giftTalk` on the first gift
    made (GIFT_TOLD), and each friend's GIFT_MEET hello (js/data/towns.js) the first time home after their Gym, unless
    they've had a gift already. */
export const GIFT_TOLD = 'gift';
export const meetKey = (leader) => `meet-${leader}`;
export const withTold = (ws, key) => ({ ...ws, told: { ...ws.told, [key]: true } });
export const giftMeetDue = (ws, leader) => !ws.told?.[meetKey(leader)] && !(ws.liked?.[leader] > 0);

/** Each friend's second and third signature pieces (step 8, session d), in their first one's style: given at
    HEART_AT[0] and HEART_AT[1] hearts. js/data/furniture.js's `heart` source owns them while `liked` is that high, so an
    old save already there has them on load. */
export const HEART_AT = [3, 5];
export const HEART_PIECES = {
  nietos: ['linccrib', 'tiredcouch'],
  john: ['omikuji', 'handheldtansu'],
  jahmes: ['curfewclock', 'curfewfuton'],
  clarence: ['ringlight', 'showvanity'],
  shaun: ['helpdeskrack', 'tripledesk'],
  pat: ['serenadeguitar', 'lemonadestand'],
  kayl: ['bassamp', 'vinylconsole'],
  phil: ['saltcandelabra', 'nobodychair'],
  ricky: ['coffeecart', 'allnightmoon'],
  machew: ['katanastand', 'broodpillar'],
  jerome: ['neonpalm', 'heistsafe'],
};
/** A friend's heart pieces, [{ kind, at }]. */
export const heartPieces = (leader) => (HEART_PIECES[leader] || []).map((kind, i) => ({ kind, at: HEART_AT[i] }));
/** The heart pieces a friend gives as their hearts go from `was` to `now`. */
export const heartGifts = (leader, was, now) => heartPieces(leader).filter(p => was < p.at && now >= p.at).map(p => p.kind);

/** Friends who drop by your Secret Base (step 8, session c): everyone at VISIT_HEARTS or more, their town mended or
    not; `best` (at HEARTS) also come again after the day's visit and sit on your furniture. `at(id)` is their hearts. */
export const VISIT_HEARTS = 3;
export function baseFriends(at) {
  const all = FRIENDS.filter(id => at(id) >= VISIT_HEARTS);
  return { all, best: all.filter(id => at(id) >= HEARTS) };
}

/** A recipe's needs as a line ("🕯️ 2/3 · 📜 3/3"). */
export const needsLine = (recipe, sat) => Object.entries(recipe.needs)
  .map(([id, n]) => `${MATERIALS_BY_ID[id].icon} ${Math.min(sat.mats[id] || 0, n)}/${n}`).join(' · ');

/** The Safari Ball's sprite: its own, or the Apricorn skin carried. */
export const safariSprite = (ws) => (ws.skin && SKIN_BY_ID[ws.skin] ? SKIN_BY_ID[ws.skin].sprite : 'safari-ball');

/** Each friend teaches Kurt their secret recipe (SECRETS, their own Safari Ball look) at SECRET_AT hearts, between their
    second and third signature pieces; nothing saved, so an old save that far along knows them on load. */
export const SECRET_AT = 4;
export const SECRETS = Object.fromEntries(SKINS.filter(s => s.secret).map(s => [s.leader, s]));
export const taught = (hearts, leader) => hearts(leader) >= SECRET_AT;

/** Friends' letters (step 8, session e): once a UTC day, on coming home, a friend at MAIL_HEARTS or more may write
    (MAIL_ODDS), the closer the likelier to be the one, with PokéCoins (MAIL_COINS a heart, well under the Game
    Corner's ~380 a day) or a material from their own town. `at(id)` is a friend's hearts, `rand` a 0-1 roll (cosmetic:
    nothing about a run). Returns { from, title, text, coins } or { from, title, text, mat: { id, n } }, or null. */
export const MAIL_HEARTS = 2, MAIL_ODDS = 0.4, MAIL_COINS = 15;
export function friendLetter(at, rand, biomeOf, mats) {
  const who = FRIENDS.filter(id => at(id) >= MAIL_HEARTS);
  if (!who.length || rand() >= MAIL_ODDS) return null;
  let r = rand() * who.reduce((n, id) => n + at(id), 0), from = who[0];
  for (const id of who) { r -= at(id); if (r < 0) { from = id; break; } }
  const lines = FRIEND_MAIL[from], [title, text] = lines[Math.floor(rand() * lines.length)], hearts = at(from);
  const own = mats(biomeOf(from));
  if (!own.length || rand() < 0.5) return { from, title, text, coins: MAIL_COINS * hearts };
  return { from, title, text, mat: { id: own[Math.floor(rand() * own.length)].id, n: hearts >= SECRET_AT ? 2 : 1 } };
}

/** What each friend writes, [title, letter] (the Nietos sign as Law and Britt). Something's always tucked inside. */
export const FRIEND_MAIL = {
  nietos: [
    ['Linc slept!', 'Four whole hours. We don\'t know what to do with ourselves. Here\'s a little something. Love, Law and Britt.'],
    ['From the couch', 'Britt graded forty papers and Law fell asleep on the remote. Come by the house soon. Love, Law and Britt.'],
    ['Kangaskhan says hi', 'She tucked this into the pouch for you, next to Linc\'s rattle. Love, Law and Britt.'],
  ],
  john: [
    ['Help me pick', 'Which handheld should I bring to the festival? Don\'t answer, I\'ll change my mind. This is for you. - John'],
    ['Thank you (I think)', 'I wrote this letter three times and sent the first one. Here, for being a good friend. - John'],
    ['Festival leftovers', 'We had too much of this after the festival. Or not enough. Anyway, it\'s yours. - John'],
  ],
  jahmes: [
    ['Before 11', 'Writing this at 10:52. Lights out soon. Something for you, sent early. - Jahmes'],
    ['Up early', 'I was up at five, like a normal person. Found this and thought of you. - Jahmes'],
    ['Curfew notice', 'Reminder: bed by eleven. Enclosed, a reward for listening to me. - Jahmes'],
  ],
  clarence: [
    ['A standing ovation', 'Last night\'s show sold out, darling. You get a cut. Don\'t spend it all on sequins. - Clarence'],
    ['Backstage pass', 'The boys loved the new routine. Here\'s a little something from the tip jar. - Clarence'],
    ['Encore', 'They wanted one more number, so I wrote you one more letter. Kisses. - Clarence'],
  ],
  shaun: [
    ['Ticket closed', 'Fixed the Springs\' router again. Turning it off and on works, everyone. Here, your share. - Shaun'],
    ['GG', 'We won scrims. I called every play. Enclosed: your support bonus. - Shaun'],
    ['Comms check', 'Testing, testing. If this reached you, the relay works. Keep what\'s inside. - Shaun'],
  ],
  pat: [
    ['A song for you', 'I wrote you a song, but it was about lemonade again. So here\'s this instead. - Pat'],
    ['Message in a bottle', 'This one\'s not a love letter, I promise. Mostly. Something from the lagoon. - Pat'],
    ['Thinking of you', 'The tide came in and I thought of my friends. Then I cried a bit. Here! - Pat'],
  ],
  kayl: [
    ['Rent\'s in', 'The tenants paid on time for once. The cats did not. Your share. - Kayl'],
    ['From Spooky and Reya', 'They knocked this off the shelf, so it\'s yours now. - Kayl'],
    ['Property update', 'All the piers are standing. I checked twice. Thanks for the help. - Kayl'],
  ],
  phil: [
    ['Do not open at night', 'JONA moved my candles again. Found this where they used to be. Keep it. - Phil'],
    ['Evidence', 'Enclosed: proof of the paranormal. Or a gift. Hard to say. - Phil'],
    ['Salt line holds', 'Nothing got in last night. I think. Here\'s something for the road. - Phil'],
  ],
  ricky: [
    ['2:47 a.m.', 'One more game, then bed. Found this while not going to bed. - Ricky'],
    ['Meeting at 9', 'I will be at my 9 a.m. meeting. I will not be awake. Here, for you. - Ricky'],
    ['Stream highlights', 'Chat says hi. Chat also sent you this. - Ricky'],
  ],
  machew: [
    ['On failure', 'I meditated on failure for six hours. Then I found this. Take it. - Machew'],
    ['The blade', 'Yes, the price tag is still on the katana. No, I won\'t take it off. Here. - Machew'],
    ['From the dunes', 'The wind told me you needed this. The wind is usually wrong. - Machew'],
  ],
  jerome: [
    ['Totally legit', 'This fell off a caravan. Don\'t ask which one. - Jerome'],
    ['The plan', 'Step one: send you this. Step two: there is no step two. - Jerome'],
    ['GTA VI update', 'Still not out. Here\'s something to make the wait easier. - Jerome'],
  ],
};
