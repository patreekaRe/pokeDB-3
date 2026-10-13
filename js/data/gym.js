/* ============================================================
   gym.js  -  the Gym Leaders (the user's friends, 2026-10-12).

   Two a biome (the Clearing three), standing in front of its boss: each owns one or two of the
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

/* The Nietos (the user's, 2026-10-13): Law and Britt battling together, their baby Linc in a Pikachu suit along because
   they couldn't find a babysitter. `voices`: a line starting "LAW: " / "BRITT: " / "LINC: " puts that name on the tag. */
const NIETOS = {
  sprite: 'assets/trainers/gym/nietos.png',
  voices: ['LAW', 'BRITT', 'LINC'],
  firstIntro: true,
  intro: [
    ['LAW: Welcome to the gym of THE NIETOS!', 'BRITT: We couldn\'t find a babysitter, so this is a family battle now.', 'LINC: Pika-boo! Bababa!', 'LAW: Go, {boss}! Make it quick, he naps at seven.'],
    ['BRITT: Okay, we have twenty minutes before Linc melts down.', 'LAW: Fifteen. The boys are already in the lobby.', 'BRITT: Law, NO Valorant tonight. You promised.', 'LINC: Gaaah!', 'LAW: ...Go, {boss}!'],
    ['LAW: Hold on, hold on. Babe, did you pack the snacks?', 'BRITT: I packed the snacks, the wipes, the backup Pikachu suit AND you.', 'LINC: Num num!', 'BRITT: Go, {boss}! Mommy needs to go home.'],
    ['BRITT: I taught twenty-six kids today. Now I have to battle one more.', 'LAW: Technically they\'re a trainer, babe.', 'BRITT: Technically I don\'t care.', 'LINC: Bwaaa!', 'LAW: Go, {boss}!'],
    ['LAW: Our babysitter cancelled. Again. Third time this week.', 'BRITT: So you get all three of us.', 'LINC: Pikaaa-chuuu! *blows a raspberry*', 'LAW: That means good luck. Go, {boss}!'],
    ['LAW: Babe, I\'m all yours tonight. No Valorant, I swear.', 'LAW: Oh, umm... I mean, after one match. Or five.', 'BRITT: LAW.', 'LINC: Five! Fiiive!', 'LAW: ...Go, {boss}!'],
    ['LAW: I already changed Linc\'s diaper before we came!', 'LAW: Oh, umm... I mean, Britt did. I watched. Supportively.', 'BRITT: He held the wipes. Barely.', 'LINC: Poo-poo!', 'BRITT: Go, {boss}!'],
    ['LINC: Dada! Dada! Ba!', 'LAW: Not now, buddy, Daddy\'s working.', 'BRITT: Daddy\'s "working" with his headset still on.', 'LAW: ...Go, {boss}!'],
  ],
  beaten: [
    ['LAW: Britt, I love you more than anything, but we LOST.', 'LAW: Oh, umm... I mean, more than ALMOST anything. Ranked is ranked.', 'BRITT: Take the {badge} and leave before I hurt him.', 'LINC: Hehehe!'],
    ['LAW: Well, that\'s game. Can we go home now?', 'BRITT: You\'re carrying the diaper bag.', 'LINC: Bye-bye! Bye-bye!', 'BRITT: Take the {badge}, sweetie.'],
    ['BRITT: I told you we should have healed, Law.', 'LAW: You\'re the Sage, babe, that\'s literally your job.', 'BRITT: Don\'t you DARE.', 'LAW: ...Here, take the {badge}.'],
    ['LINC: Waaaah!', 'BRITT: It\'s okay, baby, Mommy and Daddy just lost a little.', 'LAW: A lot, actually.', 'BRITT: Take the {badge} before he gets louder.'],
    ['LAW: Okay, you win. Can you babysit on Friday?', 'BRITT: LAW.', 'LAW: What? They clearly have their life together.', 'LINC: Goo!', 'BRITT: The {badge} is yours. Ignore him.'],
    ['BRITT: You know what? Good. Now we can go home early.', 'LAW: Early enough for one ranked match?', 'BRITT: No.', 'LINC: Nooo! *giggles*', 'LAW: Take the {badge}...'],
  ],
  won: [
    ['LAW: Rez me, Sage! Oh, umm... I mean, heal me, honey. Gym words.', 'BRITT: We won, Law. Nobody needs a rez.', 'LINC: Rez! Rez! Bababa!'],
    ['LAW: Did you see that? I\'m the fun parent!', 'LAW: Oh, umm, I mean... we\'re both fun. Equally.', 'BRITT: Linc, give Daddy back his headset.', 'LINC: Mine!'],
    ['LAW: Family wins! Family wins!', 'BRITT: Great. Now pack up, it\'s past his bedtime.', 'LINC: Yay-yay! Pika!'],
    ['BRITT: Gold star for trying.', 'LAW: Heal, wall, rez. Sage diff.', 'BRITT: That\'s MY line, Law.', 'LINC: Sage diff! Bababa!'],
    ['LINC: *throws a Poké Ball at you*', 'BRITT: Linc! We don\'t throw balls at people!', 'LAW: ...Unless they lose. Then it\'s fine.'],
    ['LAW: GG, no re. Okay, home. The boys have been waiting an hour.', 'BRITT: Linc, say bye-bye.', 'LINC: Buh-bye! *falls over*'],
    ['BRITT: Back to your seat. We\'re going home.', 'LAW: You heard the teacher.', 'LINC: Home! Home! Bwaa!'],
  ],
};

export const GYM_LEADERS = [
  leader('lawrence', 'GAY TWINK DADDY LAWRENCE', 'clearing', ['snorlax'], 'Glitter Badge', LAWRENCE),
  leader('britt', 'BRITT', 'clearing', ['miltank'], 'Acorn Badge', BRITT),
  leader('nietos', 'THE NIETOS', 'clearing', ['kangaskhan'], 'Pacifier Badge', NIETOS),
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

/** A line's voice: `{ who, text }` when it starts with one of the leader's `voices` ("LAW: ..."), else the line. */
export function voiced(l, line) {
  const m = l.voices && /^([A-Z]+): (.*)$/s.exec(line);
  return m && l.voices.includes(m[1]) ? { who: m[1], text: m[2] } : line;
}

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
