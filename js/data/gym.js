/* ============================================================
   gym.js  -  the Gym Leaders (the user's friends, 2026-10-12).

   Two a biome, standing in front of its boss: each owns one or two of the
   biome's bosses and sends out whichever the run meets. Beating one earns
   their badge (`save.gym[id]`, counted per win; the Badge Case's Gym Badges,
   js/data/badges.js). They fight as Normal, like every boss.

   A leader's `sprite` is a file in assets/trainers/gym/ (front-facing, a
   transparent background, Gen 5 style); until one is given it's the shadow
   `unknown.png`. Lines: `intro` before the boss (`{boss}` is its name),
   `beaten` once you win (its first line alone on a rematch), `won` when they
   beat you. Each is a list of speech-window lines, or a list of such lists, one
   picked at random each time (`talkOf()`).
   ============================================================ */

export const UNKNOWN_SPRITE = 'assets/trainers/gym/unknown.png';

const leader = (id, name, biome, bosses, badge, extra = {}) => ({
  id, name, biome, bosses, badge,
  sprite: null,
  intro: [`I'm ${name}, and this is my turf!`, 'You want to get past? You go through me. Go, {boss}!'],
  beaten: ['...Huh. You actually did it.', `Fine, you earned it. Take the ${badge}!`],
  won: ['Ha! Not today.', 'Come back when you\'re stronger.'],
  ...extra,
});

/* Lawrence (the user's, 2026-10-13): married to Britt, secretly gay, can't stop talking about his boyfriends, wants every
   match over fast so he can play Valorant with the boys, and Britt must never find out. */
const LAWRENCE = {
  sprite: 'assets/trainers/gym/lawrence.png',
  intro: [
    ['Oh. Em. Gee. A challenger? Ugh, fine, but make it QUICK.', 'My boyfriends are in the Valorant lobby and they get SO clingy when I\'m late.', 'Go, {boss}! Serve it, babe!'],
    ['Hiii! I\'m Lawrence, the fiercest, most fabulous Gym Leader in the Clearing.', 'Married? Me? To Britt? ...Yes. Happily. Very straight. Next question.', '{boss}, sweetie, end this fast. Daddy\'s got a duo queue.'],
    ['Shh! Is Britt around? No? Okay. Phew.', 'If anyone asks, I was at the gym ALL night. Battling. Not with Kyle. Or Marco. Or Dante.', 'Go, {boss}!'],
    ['A battle? Right NOW? I literally just told the boys I\'d be on in five.', 'Five minutes, honey. That\'s all you\'re getting. Work it, {boss}!'],
    ['Welcome to my gym, cutie! Love the glitter? It\'s for... my wife. Yes.', 'Now let\'s wrap this up. I\'ve got three boyfriends and a ranked match waiting.', '{boss}, slay!'],
    ['My boyfriend says I\'m the best Gym Leader he\'s ever had. My OTHER boyfriend agreed.', 'Britt thinks they\'re just my Valorant teammates. Which... they also are.', 'Go, {boss}! And not a word to my wife!'],
    ['Ugh, you\'re cute, but you\'re not THREE gay men waiting on Discord.', 'Let\'s make this the fastest gym battle in history. Go, {boss}!'],
  ],
  beaten: [
    ['Ugh, FINE, you win! Honestly? Good. Now I can log on.', 'Take the {badge}, and remember: you never saw me here. Especially not with Kyle.'],
    ['Okay, you SERVED. I\'ll allow it.', 'Here, the {badge}. It sparkles, like me. Now shoo, the boys are waiting!'],
    ['Lost? Me? Whatever, I\'ve got a match to get to anyway.', 'Take the {badge}, babe. And if Britt asks, I won. Easily. In a very straight way.'],
    ['Yay, it\'s over! I mean... oh no, I lost. So sad. Byeee!', 'The {badge} is yours. I\'m off to see my... teammates. Yes. Teammates.'],
    ['Fine, you win. Dante\'s gonna roast me so hard in voice chat.', 'Take the {badge}, cutie. Not one word to my wife.'],
  ],
  won: [
    ['And that\'s game, sweetie! Gay rights and quick fights!', 'Okay bye, the boys just sent me a lobby invite!'],
    ['Ace! Clutch! Fabulous! That\'s how we do it in Valorant AND in Pokémon.', 'Now excuse me, Daddy has a date. With his... friends.'],
    ['Aww, did I go too hard? Babe, I had somewhere to be.', 'Don\'t cry. And DON\'T tell Britt where I\'m going.'],
    ['Ten out of ten, no notes. {boss}, you ATE.', 'Now quick, before my wife gets home! Three boyfriends, one queue, zero time!'],
    ['Was that it? I barely broke a sweat. Marco will be so proud.', 'Off you go, honey. If you see Britt, I\'m... at the library.'],
  ],
};

export const GYM_LEADERS = [
  leader('lawrence', 'GAY TWINK LAWRENCE', 'clearing', ['snorlax', 'kangaskhan'], 'Glitter Badge', LAWRENCE),
  leader('britt', 'BRITT', 'clearing', ['miltank'], 'Acorn Badge'),
  leader('john', 'JOHN', 'shrine', ['stoutland', 'exploud'], 'Lantern Badge'),
  leader('jahmes', 'JAHMES', 'shrine', ['ursaring'], 'Torii Badge'),
  leader('clarence', 'CLARENCE JASPER', 'wastes', ['slaking', 'regigigas'], 'Magma Badge'),
  leader('shaun', 'SHAUN', 'wastes', ['lickilicky', 'porygonz'], 'Cinder Badge'),
  leader('pat', 'PAT', 'ruins', ['dunsparce', 'wigglytuff'], 'Tidal Badge'),
  leader('kayl', 'KAYL', 'ruins', ['granbull'], 'Rune Badge'),
  leader('phil', 'PHIL', 'thornwood', ['blissey', 'porygon'], 'Bramble Badge'),
  leader('ricky', 'RICKY', 'thornwood', ['porygon2'], 'Root Badge'),
  leader('machew', 'EDGELORD MACHEW', 'savanna', ['castform', 'loudred'], 'Eclipse Badge'),
  leader('jerome', 'JEROME', 'savanna', ['munchlax'], 'Sunburst Badge'),
];

export const GYM_BY_ID = Object.fromEntries(GYM_LEADERS.map(l => [l.id, l]));
const BY_BOSS = Object.fromEntries(GYM_LEADERS.flatMap(l => l.bosses.map(b => [b, l])));

/** The leader who sends out this boss, or null (Eternatus, Safari bosses, Sky Pillar guardians). */
export const leaderFor = (bossId) => BY_BOSS[bossId] ?? null;

/** A biome's leaders, in order. */
export const leadersOf = (biomeId) => GYM_LEADERS.filter(l => l.biome === biomeId);

export const spriteOf = (l) => l.sprite || UNKNOWN_SPRITE;

/** One of their `intro` / `beaten` / `won` speeches: the list itself, or one of its lists at random (cosmetic, so not seeded). */
export function talkOf(l, kind) {
  const said = l[kind];
  return Array.isArray(said[0]) ? said[Math.floor(Math.random() * said.length)] : said;
}

/** How many times you've beaten them. */
export const gymWins = (save, id) => save.gym?.[id] || 0;
