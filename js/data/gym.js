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
    ['Shh! Is Britt around? No? Okay. Phew.', 'If anyone asks, I was at the gym ALL night. Battling. Not with Phil. Or CJ. Or Jahmes.', 'Go, {boss}!'],
    ['A battle? Right NOW? I literally just told the boys I\'d be on in five.', 'Five minutes, honey. That\'s all you\'re getting. Work it, {boss}!'],
    ['Welcome to my gym, cutie! Love the glitter? It\'s for... my wife. Yes.', 'Now let\'s wrap this up. I\'ve got three boyfriends and a ranked match waiting.', '{boss}, slay!'],
    ['My boyfriend says I\'m the best Gym Leader he\'s ever had. My OTHER boyfriend agreed.', 'Britt thinks they\'re just my Valorant teammates. Which... they also are.', 'Go, {boss}! And not a word to my wife!'],
    ['Ugh, you\'re cute, but you\'re not THREE gay men waiting on Discord.', 'Let\'s make this the fastest gym battle in history. Go, {boss}!'],
  ],
  beaten: [
    ['Ugh, FINE, you win! Honestly? Good. Now I can log on.', 'Take the {badge}, and remember: you never saw me here. Especially not with Ricky.'],
    ['Okay, you SERVED. I\'ll allow it.', 'Here, the {badge}. It sparkles, like me. Now shoo, the boys are waiting!'],
    ['Lost? Me? Whatever, I\'ve got a match to get to anyway.', 'Take the {badge}, babe. And if Britt asks, I won. Easily. In a very straight way.'],
    ['Yay, it\'s over! I mean... oh no, I lost. So sad. Byeee!', 'The {badge} is yours. I\'m off to see my... teammates. Yes. Teammates.'],
    ['Fine, you win. Pat\'s gonna roast me so hard in voice chat.', 'Take the {badge}, cutie. Not one word to my wife.'],
  ],
  won: [
    ['And that\'s game, sweetie! Gay rights and quick fights!', 'Okay bye, the boys just sent me a lobby invite!'],
    ['Ace! Clutch! Fabulous! That\'s how we do it in Valorant AND in Pokémon.', 'Now excuse me, Daddy has a date. With his... friends.'],
    ['Aww, did I go too hard? Babe, I had somewhere to be.', 'Don\'t cry. And DON\'T tell Britt where I\'m going.'],
    ['Ten out of ten, no notes. {boss}, you ATE.', 'Now quick, before my wife gets home! Three boyfriends, one queue, zero time!'],
    ['Was that it? I barely broke a sweat. John will be so proud.', 'Off you go, honey. If you see Britt, I\'m... at the library.'],
  ],
};

/* Britt (the user's, 2026-10-13): an elementary school teacher worn out by the kids, who only wants to get home to her son
   Linc and play Valorant (a Sage main, which her friends never let go) and Pokémon on her phone. `firstIntro`: her first
   intro is the one you meet till you beat her. */
const BRITT = {
  sprite: 'assets/trainers/gym/britt.png',
  firstIntro: true,
  intro: [
    ['I\'ve had twenty-six seven-year-olds today. You think YOU scare me?', 'Go, {boss}!'],
    ['School\'s out, and I\'m on my way home to Linc. Make this quick.', 'Go, {boss}!'],
    ['Sit down. Hands to yourself. We\'re going to battle NICELY.', 'Go, {boss}!'],
    ['Do you have a hall pass? No? Then it\'s a battle.', 'Go, {boss}!'],
    ['Linc\'s asleep, the dishes are done, and I was THIS close to logging on. Let\'s go.', 'Go, {boss}!'],
    ['Go ahead, make a Sage joke. My friends already did.', 'Go, {boss}!'],
  ],
  beaten: [
    ['...Fine. I\'m going home. Linc doesn\'t care if I lose.', 'Take the {badge}.'],
    ['I didn\'t sign up for this. I signed up for summers off.', 'Here, the {badge}. You earned it.'],
    ['My team never protects the Sage. Story of my life.', 'The {badge} is yours.'],
    ['That\'s it. I\'m putting your name on the board.', '...Next to a gold star. Take the {badge}.'],
    ['I\'m too tired to be mad. Wake me up at 3:15.', 'The {badge}. Go on, take it.'],
    ['You won, but I still have papers to grade, so we both lost.', 'Here\'s the {badge}.'],
    ['Don\'t tell my friends about this. They\'ll never let me hear the end of it.', 'Take the {badge} and go.'],
  ],
  won: [
    ['Gold star for trying.', 'Now go home. I want to go home.'],
    ['That\'s what happens when you don\'t do your homework.'],
    ['Heal, wall, rez. Sage diff, sweetie.'],
    ['See? Support wins games.', 'Tell my friends.'],
    ['Back to your seat.', 'I\'ve got a son to feed and a ranked match to lose.'],
    ['I\'ve broken up recess fights tougher than you.'],
    ['You\'d last about four minutes in my classroom.'],
  ],
};

export const GYM_LEADERS = [
  leader('lawrence', 'GAY TWINK DADDY LAWRENCE', 'clearing', ['snorlax', 'kangaskhan'], 'Glitter Badge', LAWRENCE),
  leader('britt', 'BRITT', 'clearing', ['miltank'], 'Acorn Badge', BRITT),
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

/** One of their `intro` / `beaten` / `won` speeches: the list itself, or one of its lists at random (cosmetic, so not seeded).
    `fresh` (never beaten) gives a `firstIntro` leader their first intro. */
export function talkOf(l, kind, fresh = false) {
  const said = l[kind];
  if (fresh && kind === 'intro' && l.firstIntro && Array.isArray(said[0])) return said[0];
  return Array.isArray(said[0]) ? said[Math.floor(Math.random() * said.length)] : said;
}

/** How many times you've beaten them. */
export const gymWins = (save, id) => save.gym?.[id] || 0;
