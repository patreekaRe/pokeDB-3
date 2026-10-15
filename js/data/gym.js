/* ============================================================
   gym.js  -  the Gym Leaders (the user's friends, 2026-10-12).

   Two a biome (the Clearing three), standing in front of its boss: each owns one or two of the
   biome's bosses and sends out whichever the run meets. Beating one earns
   their badge (`save.gym[id]`, counted per win; the Badge Case's Gym Badges,
   js/data/badges.js). They fight as Normal, like every boss.

   A leader's `sprite` is a file in assets/trainers/gym/ (front-facing, a
   transparent background, Gen 5 style); until one is given it's the shadow
   `unknown.png`; `sprites` (by boss id) dresses them for the boss they send out. Lines: `intro` before the boss (`{boss}` is its name),
   `beaten` once you win (its first line alone on a rematch), `won` when they
   beat you. Each is a list of speech-window lines, or a list of such lists, one
   picked at random each time (`talkOf()`). `battleName`, if set, is what the battle
   calls them when they send out their Pokémon (`name`, the chat name, everywhere else; the user's names, 2026-10-13).
   ============================================================ */

export const UNKNOWN_SPRITE = 'assets/trainers/gym/unknown.png';

const leader = (id, name, biome, bosses, badge, extra = {}) => ({
  id, name, biome, bosses, badge,
  sprite: null,
  intro: [`I'm ${name}, and this is my turf!`, 'You want to get past? You go through me. Go, {boss}!'],
  beaten: ['...Huh. You actually did it.', `Fine, you earned it. Take the ${badge}!`],
  won: ['Ha! Not today.', 'Come back when you\'re stronger.'],
  poster: ['Three times now. Okay, you\'re officially my biggest fan.', 'Here, a signed poster of me. Hang it somewhere everyone can see it!'],
  gold: ['FIVE times?! Nobody beats me five times.', 'You know what, you\'ve earned this. The Gold {badge}. Wear it with pride.'],
  visit: [
    ['Oh, hey! I was in the neighbourhood and thought I\'d drop by.', 'Cute place, {trainer}. Very you.', 'Anyway, I\'d better get going. See you at the gym!'],
    ['Knock knock! Surprise!', 'I wanted to see where my toughest challenger lives.', 'Not bad at all. Next time, though, I\'m winning. Bye!'],
    ['{trainer}! There you are.', 'I\'ve been training nonstop since you beat me. Five times. Not that I\'m counting.', 'Okay, I am counting. See you soon!'],
  ],
  posterSeen: 'Wait, is that my poster? Up on your wall? Okay, that\'s actually so sweet.',
  ...extra,
});

/* The rematch rewards (2026-10-13, the user's picks): a third win against a leader brings their signed poster for the
   Secret Base (js/data/furniture.js's `gym` source), a fifth their Gold badge (js/data/badges.js), and from then on they
   drop by your base now and then (leaderVisitor() in js/secret-base.js). */
export const GYM_POSTER = 3, GYM_GOLD = 5;
/* Their visits are switched off for now (2026-10-14, the user's call): no leader turns up in the Secret Base, though
   `?visit` still brings one for a page load. On for good: LEADER_VISITS_LIVE. */
export const LEADER_VISITS_LIVE = false;
/** What this win (the `wins`th) brings: 'poster', 'gold' or null. */
export const gymMilestone = (wins) => (wins === GYM_POSTER ? 'poster' : wins === GYM_GOLD ? 'gold' : null);
/** Each leader's colours, light to dark: their badge's (js/trainercard.js) and their poster's. */
export const GYM_INK = {
  lawrence: ['#ffd0ec', '#e8509c', '#7a1850'],
  britt: ['#ffb4a0', '#e03c30', '#7a1410'],
  nietos: ['#e0f2ff', '#88c4f0', '#3a6ea8'],
  john: ['#c8d4ff', '#4c64d8', '#1c2470'],
  jahmes: ['#b8c4f0', '#38428c', '#121636'],
  clarence: ['#ffe0c0', '#ff8c70', '#a83c48'],
  shaun: ['#c0fff4', '#20b8b0', '#0c4a5a'],
  pat: ['#fff8b0', '#f8d040', '#b05a18'],
  kayl: ['#f0e0ff', '#b088e0', '#523478'],
  phil: ['#e0a0ff', '#6a1ca8', '#1c0630'],
  ricky: ['#f4d8b0', '#a86c40', '#40220e'],
  machew: ['#ff8a8a', '#a01020', '#1a0408'],
  jerome: ['#ffd0f0', '#ff5aa8', '#6a2a9c'],
};
/** Each leader's Pokédex entry, in the Gym Leaders app (js/gymdex.js): who they are, shown once they're beaten. */
export const GYM_BIO = {
  lawrence: 'Married to Britt and very straight, he says, too fast. His three "Valorant teammates" are waiting in the lobby, so every battle is over in minutes.',
  britt: 'Teaches 26 seven-year-olds all day. All she wants is to get home to Linc and play Sage, which her friends will never let her live down.',
  nietos: 'Law and Britt, battling together with baby Linc in a Pikachu suit, because nobody could babysit. Law swears there\'s no Valorant tonight.',
  john: 'A mechanical engineer who designs and tests parts for aircraft and spacecraft. Carries a Steam Deck, a Switch 2 and an AYN Thor, and still can\'t pick which one to play Fire Emblem on.',
  jahmes: 'A PA by day who screams with hype at every Valorant round by night. In bed at 11 p.m. sharp, no exceptions, mid-battle or not.',
  clarence: 'Puts on a burlesque show for the boys on Discord every night at nine, for morale. The week he missed one they went 0 and 5.',
  shaun: 'Tech support by day, Valorant IGL by night. Smurfs on noobs, flames his hardstuck friends, and will send you VOD notes whether you asked or not.',
  pat: 'Keeps "accidentally" singing Lemonade or She Was Mine, then acting surprised anyone heard. He knew. He always knows.',
  kayl: 'A property coordinator who\'d rather be playing bass. Loves lavender and Tame Impala, and loses her train of thought to her cats, Spooky and Reya.',
  phil: 'A ghost hunter possessed by a demon named JONA. She does all the talking, and turns his Pokémon into her lifeless pawns.',
  ricky: 'Only 32, but his friends in another time zone keep him up till 2 a.m. every night. Always has a meeting at nine. Always plays one more.',
  machew: 'Sure he\'s a hero out of Tales of Berseria, nine years down the ninja path. The katana is plastic and he\'s on shift till six.',
  jerome: 'Reads every r/GTA6 post the moment it\'s up. His baby was just born; he barely noticed. Every badge is two dollars toward GTA 6.',
};
/** A leader's poster, a Secret Base wall piece. */
export const posterKind = (id) => `${id}poster`;

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
    ['Babe, quick, act natural. Britt just texted "where are you".', 'I said "gym". Which is TRUE. Go, {boss}!'],
    ['Phil says hi. Well, JONA says hi. Phil says "help". Anyway, he\'s cute.', 'Focus, Lawrence. Go, {boss}!'],
    ['I put on my good crop top for this. Not for you. For after.', 'Go, {boss}, and don\'t get it dirty!'],
    ['Ricky stays up till 2 a.m. for me. That\'s commitment. That\'s a boyfriend. A TEAMMATE.', 'Go, {boss}!'],
    ['Rule one of my gym: what happens in the Clearing stays in the Clearing.', 'Rule two: Britt is NOT in the Clearing. Go, {boss}!'],
    ['CJ\'s doing his little show at nine and I promised I\'d be front row. On Discord. For morale.', 'Go, {boss}! Daddy has a seat to save.'],
  ],
  beaten: [
    ['Ugh, FINE, you win! Honestly? Good. Now I can log on.', 'Take the {badge}, and remember: you never saw me here. Especially not with Ricky.'],
    ['Okay, you SERVED. I\'ll allow it.', 'Here, the {badge}. It sparkles, like me. Now shoo, the boys are waiting!'],
    ['Lost? Me? Whatever, I\'ve got a match to get to anyway.', 'Take the {badge}, babe. And if Britt asks, I won. Easily. In a very straight way.'],
    ['Yay, it\'s over! I mean... oh no, I lost. So sad. Byeee!', 'The {badge} is yours. I\'m off to see my... teammates. Yes. Teammates.'],
    ['Fine, you win. Pat\'s gonna roast me so hard in voice chat.', 'Take the {badge}, cutie. Not one word to my wife.'],
    ['Ugh, I chipped a nail on that. Worth it? No.', 'Take the {badge}, sweetie. Tell the boys I lost gracefully.'],
    ['Okay, you ate and left no crumbs. Rude, but iconic.', 'The {badge} is yours. Now help me hide this glitter before Britt sees.'],
    ['Losing to you is the second most closeted thing I\'ve done today.', 'Take the {badge}. Don\'t ask about the first.'],
    ['Fine, fine! The boys are spamming my phone anyway. Seventeen hearts. From TEAMMATES.', 'Here\'s the {badge}, babe.'],
    ['I lost, but I looked GOOD losing. That counts.', 'Take the {badge}. Jahmes is screaming in the lobby, I have to go.'],
  ],
  won: [
    ['And that\'s game, sweetie! Gay rights and quick fights!', 'Okay bye, the boys just sent me a lobby invite!'],
    ['Ace! Clutch! Fabulous! That\'s how we do it in Valorant AND in Pokémon.', 'Now excuse me, Daddy has a date. With his... friends.'],
    ['Aww, did I go too hard? Babe, I had somewhere to be.', 'Don\'t cry. And DON\'T tell Britt where I\'m going.'],
    ['Ten out of ten, no notes. {boss}, you ATE.', 'Now quick, before my wife gets home! Three boyfriends, one queue, zero time!'],
    ['Was that it? I barely broke a sweat. John will be so proud.', 'Off you go, honey. If you see Britt, I\'m... at the library.'],
    ['Slay! Now the boys owe me a carry tonight.', 'Byeee, cutie. Remember: library.'],
    ['Was that a straight win? Yes. Very straight. The straightest.', '...Okay, I\'m late. Kisses!'],
    ['You lost to a man in a crop top. Let that sink in.', 'Now if you\'ll excuse me, Phil\'s been in the lobby for an hour.'],
    ['That\'s what happens when Daddy\'s in a hurry, honey.', 'Britt thinks I\'m at book club. Don\'t ruin book club.'],
  ],
  poster: ['Three times?! Babe, are you obsessed with me? Relatable.', 'Here, a signed poster. I signed it "Lawrence, very straight". Hang it somewhere Britt won\'t look.'],
  gold: ['FIVE?! Okay, you\'re officially one of the boys now. Honorary.', 'The Gold {badge}. It sparkles even harder than the normal one. Like me after a ranked win.'],
  visit: [
    ['Hiii, {trainer}! Hide me. Britt thinks I\'m at the store.', 'Oh, this place is CUTE. Very you. I\'d add more pink.', 'Okay, the boys are online. If Britt calls, I was never here. Byeee!'],
    ['Knock knock, it\'s Daddy! Just popping by between ranked games.', 'Ooh, is this where you train? It smells like effort.', 'Gotta run, Ricky\'s staying up for me. Kisses!'],
    ['{trainer}! Sweetie! I need an alibi for the last two hours.', 'You and me? We were... decorating. Here. Very straight decorating.', 'Perfect. Love you, mean it, bye!'],
  ],
  posterSeen: 'Oh my GOD, my poster. Up on your wall. Babe, that\'s my good side. They\'re all my good side.',
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
    ['I have a parent-teacher conference at seven. This is not on my calendar.', 'Go, {boss}!'],
    ['Inside voices. Walking feet. Battle faces.', 'Go, {boss}!'],
    ['Somebody glued their hand to a desk today. On purpose. I am beyond fear.', 'Go, {boss}!'],
    ['Law said he\'d be home by six. It\'s seven. He\'s "at the library".', 'Go, {boss}!'],
    ['I\'ve done recess duty in the rain. Nothing you do can hurt me.', 'Go, {boss}!'],
    ['One battle, then pajamas, then Linc, then one game on my phone. That\'s the dream.', 'Go, {boss}!'],
    ['I\'m going to count to three, and then it\'s a battle. One. Two.', 'Go, {boss}!'],
  ],
  beaten: [
    ['...Fine. I\'m going home. Linc doesn\'t care if I lose.', 'Take the {badge}.'],
    ['I didn\'t sign up for this. I signed up for summers off.', 'Here, the {badge}. You earned it.'],
    ['My team never protects the Sage. Story of my life.', 'The {badge} is yours.'],
    ['That\'s it. I\'m putting your name on the board.', '...Next to a gold star. Take the {badge}.'],
    ['I\'m too tired to be mad. Wake me up at 3:15.', 'The {badge}. Go on, take it.'],
    ['You won, but I still have papers to grade, so we both lost.', 'Here\'s the {badge}.'],
    ['Don\'t tell my friends about this. They\'ll never let me hear the end of it.', 'Take the {badge} and go.'],
    ['That was the longest day of my week, and it\'s Tuesday.', 'Take the {badge}.'],
    ['Well, you did your homework. I\'ll give you that.', 'Here, the {badge}. Don\'t lose it on the bus.'],
    ['I had a whole lesson plan for this battle. Nobody listened. Like always.', 'The {badge} is yours.'],
    ['Fine. I\'ll heal up. Sage always heals up.', 'Take the {badge}. And no, I\'m not rezzing you.'],
    ['You get a sticker. Not a gold star. A sticker.', 'And the {badge}. Fine.'],
  ],
  won: [
    ['Gold star for trying.', 'Now go home. I want to go home.'],
    ['That\'s what happens when you don\'t do your homework.'],
    ['Heal, wall, rez. Sage diff, sweetie.'],
    ['See? Support wins games.', 'Tell my friends.'],
    ['Back to your seat.', 'I\'ve got a son to feed and a ranked match to lose.'],
    ['I\'ve broken up recess fights tougher than you.'],
    ['You\'d last about four minutes in my classroom.'],
    ['And that\'s why we read the instructions.', 'Class dismissed.'],
    ['Don\'t worry, everybody fails a quiz now and then.', 'Retake is Friday.'],
    ['Wall up, heal up, win. Sage does it all. Again.'],
    ['I won. Now I\'m going to sit in my car for ten quiet minutes before I go inside.'],
    ['Line up at the door. Single file. Out.'],
  ],
  poster: ['Three times. You\'d be my favourite student. Don\'t tell the others.', 'Here, a signed poster. Laminated. I laminate everything.'],
  gold: ['Five times. That\'s honour roll.', 'The Gold {badge}. I used the good glitter. The kind I keep locked away from the kids.'],
  visit: [
    ['Hi, {trainer}. Sorry, I just need somewhere quiet for a minute.', 'This is nice. Nobody\'s crying. Nobody\'s eating glue.', 'Okay. Recharged. Back to Linc. Thank you.'],
    ['Is this your base? It\'s cleaner than my classroom. Low bar.', 'I\'d put a reading corner over there. Beanbags. Just saying.', 'Bye, {trainer}. Do your homework.'],
    ['Have you seen Law? He said he was at the library.', '...There is no library near here, is there.', 'Thanks, {trainer}. I\'ll find him.'],
  ],
  posterSeen: 'My poster? Up on a wall? That\'s more than my students do with my worksheets.',
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
    ['LAW: Okay, family huddle. Britt, you heal. I carry. Linc, you... be cute.', 'LINC: Ba!', 'BRITT: Why are you calling Valorant roles at a gym battle.', 'LAW: Go, {boss}!'],
    ['BRITT: Linc, sweetie, wave at the challenger.', 'LINC: *waves at the wall*', 'LAW: Close enough! Go, {boss}!'],
    ['LAW: Fun fact, this Pikachu suit cost more than my headset.', 'BRITT: Your headset cost more than our couch.', 'LINC: Pika!', 'BRITT: Go, {boss}!'],
    ['LINC: *chewing on a Poké Ball*', 'BRITT: Linc, spit that out. That\'s our {boss}.', 'LAW: ...Go, {boss}! Dry off first.'],
  ],
  beaten: [
    ['LAW: Britt, I love you more than anything, but we LOST.', 'LAW: Oh, umm... I mean, more than ALMOST anything. Ranked is ranked.', 'BRITT: Take the {badge} and leave before I hurt him.', 'LINC: Hehehe!'],
    ['LAW: Well, that\'s game. Can we go home now?', 'BRITT: You\'re carrying the diaper bag.', 'LINC: Bye-bye! Bye-bye!', 'BRITT: Take the {badge}, sweetie.'],
    ['BRITT: I told you we should have healed, Law.', 'LAW: You\'re the Sage, babe, that\'s literally your job.', 'BRITT: Don\'t you DARE.', 'LAW: ...Here, take the {badge}.'],
    ['LINC: Waaaah!', 'BRITT: It\'s okay, baby, Mommy and Daddy just lost a little.', 'LAW: A lot, actually.', 'BRITT: Take the {badge} before he gets louder.'],
    ['LAW: Okay, you win. Can you babysit on Friday?', 'BRITT: LAW.', 'LAW: What? They clearly have their life together.', 'LINC: Goo!', 'BRITT: The {badge} is yours. Ignore him.'],
    ['BRITT: You know what? Good. Now we can go home early.', 'LAW: Early enough for one ranked match?', 'BRITT: No.', 'LINC: Nooo! *giggles*', 'LAW: Take the {badge}...'],
    ['LAW: Babe, we lost. Can I go on for one game to cheer up?', 'BRITT: You can go on diaper duty.', 'LINC: Poo!', 'LAW: ...Take the {badge}.'],
    ['LINC: *claps*', 'BRITT: Linc, we don\'t clap for the other team.', 'LAW: He\'s a good sport. Gets it from me.', 'BRITT: Take the {badge}, sweetie.'],
    ['BRITT: Honestly? Well done. You beat two tired parents and a baby.', 'LAW: Mostly the baby.', 'LINC: Bah!', 'LAW: Here\'s the {badge}.'],
  ],
  won: [
    ['LAW: Rez me, Sage! Oh, umm... I mean, heal me, honey. Gym words.', 'BRITT: We won, Law. Nobody needs a rez.', 'LINC: Rez! Rez! Bababa!'],
    ['LAW: Did you see that? I\'m the fun parent!', 'LAW: Oh, umm, I mean... we\'re both fun. Equally.', 'BRITT: Linc, give Daddy back his headset.', 'LINC: Mine!'],
    ['LAW: Family wins! Family wins!', 'BRITT: Great. Now pack up, it\'s past his bedtime.', 'LINC: Yay-yay! Pika!'],
    ['BRITT: Gold star for trying.', 'LAW: Heal, wall, rez. Sage diff.', 'BRITT: That\'s MY line, Law.', 'LINC: Sage diff! Bababa!'],
    ['LINC: *throws a Poké Ball at you*', 'BRITT: Linc! We don\'t throw balls at people!', 'LAW: ...Unless they lose. Then it\'s fine.'],
    ['LAW: GG, no re. Okay, home. The boys have been waiting an hour.', 'BRITT: Linc, say bye-bye.', 'LINC: Buh-bye! *falls over*'],
    ['BRITT: Back to your seat. We\'re going home.', 'LAW: You heard the teacher.', 'LINC: Home! Home! Bwaa!'],
    ['LAW: Family W! Linc, high five!', 'LINC: *high-fives Law in the face*', 'BRITT: Perfect form, baby.'],
    ['BRITT: Teamwork gold stars for everyone.', 'LAW: Even me?', 'BRITT: Half a star.', 'LINC: Staaar!'],
    ['LAW: Okay, we won, Linc\'s asleep, Britt\'s happy. Perfect time for one ranked game.', 'BRITT: LAW.', 'LINC: *snores*'],
  ],
  poster: ['LAW: Three times? You\'re basically family now.', 'BRITT: Here, a signed family poster. Linc signed it too.', 'LINC: *it\'s a crayon scribble*'],
  gold: ['BRITT: Five times. Okay, you\'re Linc\'s godparent now.', 'LAW: Godtrainer!', 'LINC: Goo!', 'BRITT: The Gold {badge}. Keep it away from his mouth.'],
  visit: [
    ['Hi, {trainer}! It\'s the whole family! Britt said we should knock first.', '*Linc is already crawling under your table*', 'Okay, we\'ve got to go before nap time. Say bye-bye, Linc! ...He said bye.'],
    ['Surprise! We were out on a family walk and Linc pointed at your door.', '*Britt sinks into your chair* Oh, this is comfy. Law, we\'re getting one.', 'Bye, {trainer}! Law, give them back their remote.'],
  ],
  posterSeen: 'Look, Linc, it\'s us! On the wall! *Linc tries to eat the poster*',
};

/* Clarence (the user's, 2026-10-13): lives to show his ass to his friends on Discord, a burlesque show every night "to help
   them play better" at Valorant, and is FURIOUS that a gym battle is keeping him from it. His second sprite is only for his
   slide-in talks (`talk`, read by gymTalk() in js/gym.js), the first everywhere else (the user's call, 2026-10-13). */
const CLARENCE = {
  sprite: 'assets/trainers/gym/clarence.png',
  talk: 'assets/trainers/gym/clarence-2.png',
  intro: [
    ['ARE YOU KIDDING ME?! A CHALLENGER? NOW?!', 'The boys are on Discord RIGHT NOW waiting for the show!', 'Go, {boss}! END THIS!'],
    ['Do you know what time it is? It\'s SHOWTIME. Not gym time. SHOWTIME.', 'Every night at nine the cheeks come out. That\'s TRADITION.', 'Go, {boss}, and make it FAST!'],
    ['I had the lighting set up. I had the music queued. I had the feather boa ON.', 'And YOU walk in.', '{boss}! Get them OUT of here!'],
    ['You think the boys win their Valorant matches on SKILL?', 'No! They win because I show them my ass before every game! It\'s a MORALE thing!', 'And you\'re making them play without it. Go, {boss}!'],
    ['Listen, I don\'t WANT to be here. I want to be on camera doing my burlesque routine.', 'Twelve viewers. Twelve! That\'s a full house!', 'Go, {boss}! I\'m ANGRY now!'],
    ['Lawrence gets to leave early. Britt gets to leave early. Why do I get the challengers?!', 'My cheeks have an AUDIENCE, you know!', 'Go, {boss}!'],
    ['RAAAGH! Every second you\'re here is a second my ass is NOT on Discord!', 'Go, {boss}! Rage mode!'],
    ['The boys just pinged me. "Where\'s the cheeks, Clarence?" FIVE TIMES.', 'You know what I had to type back? "Gym battle." Do you know how EMBARRASSING that is?!', 'Go, {boss}!'],
    ['I\'ve got my webcam angled. I\'ve got the ring light. The boys are spamming peach emojis.', 'And I\'m standing here in a GYM. Talking to YOU.', '{boss}! Make this QUICK!'],
    ['Last week I missed ONE show and the boys went 0 and 5.', 'Zero. And. Five. Because they didn\'t see my ass first. You want that on your conscience?', 'Go, {boss}!'],
    ['New routine tonight. Took me all week. There\'s a SPIN at the end.', 'The boys don\'t even know it\'s coming. And YOU\'RE making me late for the premiere!', 'Go, {boss}!'],
    ['I spent an HOUR on my glitter. Do you know how hard it is to glitter THERE?', 'Go, {boss}! RUIN THEM!'],
    ['The boys made me a hype video. It\'s just my ass with Valorant kill sounds.', 'It\'s BEAUTIFUL. And I\'m MISSING THE PREMIERE. Go, {boss}!'],
    ['Jahmes has to leave at eleven. He gets ONE show a night. And you\'re STEALING IT.', 'Go, {boss}!'],
    ['I bought a new ring light. TWO HUNDRED DOLLARS. It\'s sitting at home, OFF.', 'Go, {boss}!'],
    ['You know what Shaun said last night? "The show was mid." MID?!', 'I\'m taking it out on YOU. Go, {boss}!'],
    ['The Discord channel is called #cheeks-for-morale. Sixty pinned messages. ALL clips.', 'Go, {boss}!'],
  ],
  beaten: [
    ['FINE! YOU WIN! Are you happy?!', 'Take the {badge} and GET OUT. The boys have been waiting TWENTY MINUTES.'],
    ['Great. Just great. Now I\'m late AND I lost.', 'Here, the {badge}. I need to go stretch. The routine doesn\'t do itself.'],
    ['You beat me. Whatever. My ass is still undefeated.', 'Take the {badge}.'],
    ['I hope you know Shaun\'s about to go into ranked WITHOUT his pregame show. That\'s on YOU.', 'The {badge}. Take it. Go.'],
    ['Okay, you won. Congrats. Wanna know a secret?', '...No. You don\'t get the show. The show is for the BOYS. Take the {badge}.'],
    ['Whatever. The boys don\'t care if I win. They care if I shake it.', 'Take the {badge}. I\'ve got cheeks to deliver.'],
    ['You beat me AND made me miss the opening number.', 'The boys are gonna have to watch the REPLAY. Like ANIMALS. Take the {badge}.'],
    ['Fine. Here\'s the {badge}. Now turn around. ALL the way around.', 'I\'m dropping my pants to get ready and you are NOT the boys.'],
    ['UNBELIEVABLE! I stretched for this! I STRETCHED!', 'Take the {badge}. My hamstrings are WASTED.'],
    ['Fine! FINE! I\'ll do a double show tomorrow to make up for it!', 'The {badge}. Go. The boys need me.'],
    ['Lost AND I\'ve got glitter in places glitter should never be.', 'Here\'s the {badge}. Don\'t ask.'],
    ['You know what? Respect. You fight like the boys clutch after a FULL show.', 'Take the {badge}. You still don\'t get to watch.'],
    ['RAAAGH! Okay. Deep breath. The show must go on.', 'Take the {badge}. I\'m going LIVE.'],
  ],
  won: [
    ['HA! Done! Now if you\'ll excuse me, I have a PERFORMANCE to give!', 'Boys, unmute me! The cheeks are coming!'],
    ['That took way too long. The boys already lost two rounds without me.', 'Showtime! Hit the lights!'],
    ['Finally! Out of my gym!', 'Five, six, seven, eight, and... TURN AROUND.'],
    ['You wasted my time, so I wasted you.', 'Now where\'s my boa? The boys need their good luck charm.'],
    ['GG. Now go home.', 'The boys always say they aim better after the show. That\'s SCIENCE.'],
    ['Done! Boys, I\'m back! Who\'s ready for the cheeks?!', '...What do you mean you started without me? THERE IS NO STARTING WITHOUT ME.'],
    ['That\'s how fast I win when my ass has somewhere to be.', 'Webcam on. Pants off. Boys, LET\'S GO!'],
    ['You lost. Don\'t feel bad, everyone loses to the cheeks eventually.', 'Ask the boys. They\'ve been losing to them for YEARS.'],
    ['HA! Boys, that one was for you! Peaches in the chat!'],
    ['DONE! The ring light\'s warming up! The boa is ON!', 'Bye, nobody! I mean you!'],
    ['You lost to a man in a feather boa. Live with that.', 'Now OUT. I need the room for the spin.'],
    ['That was my pregame warm-up. Thanks for the cardio.', 'Now the REAL performance begins. Not for you.'],
  ],
  poster: ['Three times?! Okay, you\'ve earned something. NOT the show.', 'A signed poster. Fully clothed. That\'s the only kind YOU get.'],
  gold: ['FIVE TIMES. You\'ve kept me from my audience more than anyone in HISTORY.', 'Take the Gold {badge}. There\'s a peach on the back. Don\'t ask why.'],
  visit: [
    ['{trainer}! Where\'s your best lighting? I need to rehearse a turn.', '...No, you can\'t watch. Face the wall.', 'Okay, perfect, the boys will LOVE it. Bye!'],
    ['I\'m only here because my ring light blew a fuse. Do you have a lamp?', 'This lamp\'s garbage. Whatever. It\'ll do in a pinch.', 'It\'s 8:55. I have to RUN. SHOWTIME!'],
    ['I came to scout. The boys want a new backdrop for the show.', 'Your base is... fine. Not cheek-worthy. Sorry.', 'Later, {trainer}!'],
  ],
  posterSeen: 'My poster! Wait. Why is it up so high? You hang it at CHEEK LEVEL.',
};

/* Pat (the user's, 2026-10-13): always "accidentally" singing bits of Lemonade (Passion) and She Was Mine (AJ Rafael),
   then pretending he didn't know anyone was listening; every line is about the singing (the user's call, 2026-10-13: no
   teaching kids). Only a short line of a song at a time. */
const PAT = {
  sprite: 'assets/trainers/gym/pat.png',
  intro: [
    ['*strums* ♪ She\'s my sunshine in the rain... ♪', 'Oh. You heard that? Didn\'t know someone was there.', 'Whatever. Go, {boss}.'],
    ['♪ So I hopped on a train, three in the afternoon... ♪', '...Oh, a challenger. Sorry, I\'m kind of in my zone right now.', 'Fine. Go, {boss}.'],
    ['*hums* Mm-mm-mmm... ♪ Like a tall glass of lemonade... ♪', 'Wait, was I humming out loud? Ugh, it happens every time I\'m near water.', 'Go, {boss}.'],
    ['♪ Like a tall glass of lemonade... ♪', 'Hm? Oh, no, don\'t clap. It\'s just something I do. Naturally.', 'Go, {boss}.'],
    ['Shh. Listen. ♪ Love has no distance, baby... ♪', 'You felt that, right? Everyone feels that.', 'Anyway. Go, {boss}.'],
    ['Hold on, I\'m warming up. Mi-mi-mi-miii...', '♪ She\'s exactly what I need... ♪ Sorry, sorry, it just comes out of me.', 'Go, {boss}.'],
    ['Oh, hey. Wasn\'t expecting an audience. ♪ In my eyes, you were mine... ♪', 'Yeah. I\'ve still got it.', 'Go, {boss}.'],
    ['*whistles a tune and doesn\'t notice you for a long, long time*', '...Oh! Sorry. Lost in the music. Go, {boss}.'],
    ['♪ She\'s soothing like the ocean... ♪', 'Huh? No, I always sing when I\'m alone. You just happened to be here. Go, {boss}.'],
    ['Mm. The acoustics in here are perfect. Wasted on a battle, honestly.', '♪ Lemonade... ♪ Sorry. Go, {boss}.'],
    ['I\'m not singing. I\'m tuning. There\'s a difference.', '♪ She was mine... ♪ ...See? Tuning. Go, {boss}.'],
    ['Did Lawrence send you? He always sends people when I\'m mid-song.', 'Whatever. Go, {boss}.'],
    ['*plays a slow chord with his eyes closed*', '...You can stay. It\'s fine. You can listen. Go, {boss}.'],
  ],
  beaten: [
    ['Huh. Off-key performance from me today. Happens to the greats.', '♪ ...but in my eyes, she\'s still mine... ♪ Oh, you\'re still here? Take the {badge}.'],
    ['Wow. Okay. I lost. ♪ She\'s my Tylenol when I\'m in pain... ♪', 'What? I\'m coping. Here, the {badge}.'],
    ['♪ She was mine... ♪ Mm. That one\'s for my loss.', 'Don\'t look at me like that. Take the {badge}.'],
    ['♪ It\'s been three years, she hasn\'t written back... ♪', 'Huh? No, that\'s not about you. Here\'s your {badge}.'],
    ['Fine. You win. I\'ll be roasting Lawrence in voice chat to feel better.', '♪ She\'s soothing like the ocean... ♪ Ah. Didn\'t mean to sing. Take the {badge}.'],
    ['♪ It\'s been three years... ♪ since I lost a battle. Well. Until now.', 'Take the {badge}.'],
    ['You hit hard. Like a key change nobody saw coming.', '♪ She\'s my sunshine in the rain... ♪ Here, the {badge}.'],
    ['Okay, I\'m writing a song about this. It\'s called "The Challenger".', '♪ La la la... ♪ Still working on it. Take the {badge}.'],
    ['*sets the guitar down slowly*', '...Take the {badge}. I need to sing this one off.'],
    ['That loss? Minor key. Very moving, actually.', 'Here\'s the {badge}. ♪ Mm-mm-mmm... ♪'],
  ],
  won: [
    ['♪ She helps me be a better man... ♪', 'Oh, you heard that? Yeah, I sing when I win. And when I don\'t. Mostly when I win.'],
    ['And that\'s the final note. Hold it... hold it...', '♪ No matter where you go, I won\'t be very far... ♪ Sorry. Habit.'],
    ['That win deserves an encore.', '♪ She\'s exactly what I need... ♪ Me, I mean. The win. That\'s what I need.'],
    ['♪ Like a tall glass of lemonade... ♪ Refreshing, right? Winning always is.', 'Oh, you\'re still here? I thought I was singing to myself.'],
    ['Ooh. ♪ Kinda like the feeling after your first kiss... ♪', 'That\'s what winning feels like. You wouldn\'t know.'],
    ['*strums a victory chord*', '♪ In my eyes, you were mine... ♪ Oh, sorry, you\'re still here?'],
    ['That\'s a wrap. Standing ovation optional.', '...You\'re not standing. That\'s fine. ♪ Love has no distance, baby... ♪'],
    ['Winning makes me want to sing. Losing makes me want to sing. Everything does, really.'],
    ['♪ So I hopped on a train... ♪', 'Huh? Oh, I won. Right. Anyway.'],
  ],
  poster: ['Three times. I\'d write you a song, but... okay, I already wrote one. Don\'t ask to hear it.', 'Here, a signed poster. I drew a little music note. ♪ Like that. ♪'],
  gold: ['Five. You\'re my most loyal audience. I mean challenger. Same thing.', 'The Gold {badge}. ♪ She\'s exactly what I need... ♪ That one\'s for you. Sort of.'],
  visit: [
    ['*he\'s sitting on your doorstep with his guitar*', '♪ Like a tall glass of lemonade... ♪ Oh! {trainer}! Didn\'t know you lived here.', 'I definitely didn\'t look it up. Okay, bye.'],
    ['Hey. Good acoustics in here. You ever notice that?', '♪ Mm-mm-mmm... ♪ Yeah. Really good.', 'Anyway, gotta go roast Lawrence in voice chat. See you.'],
    ['Just passing through. Don\'t mind me.', '♪ No matter where you go, I won\'t be very far... ♪ That\'s not about you.', '...It\'s a little about you. Bye.'],
  ],
  posterSeen: 'Oh. My poster. Where everyone can see it. ♪ She was mine... ♪ Sorry. I get emotional.',
};

/* Kayl (the user's, 2026-10-13): a project coordinator at a property management company, heavy ADHD, loves lavender and
   Tame Impala, and only wants to work on her music, play bass and play video games, but work (and gym battles) keep
   getting in the way. She can't stop talking about her cats, Spooky and Reya: every speech has them in it. */
const KAYL = {
  sprite: 'assets/trainers/gym/kayl.png',
  intro: [
    ['Oh! Hi! Sorry, I was texting my cat sitter. Spooky knocked a mug off the counter again.', 'Wait, why are you here? Oh, the battle. Right. Go, {boss}!'],
    ['Okay, so I had a whole bass line in my head on the way here and now it\'s GONE.', 'Reya would\'ve remembered it. She sits on my amp when I practise. Go, {boss}!'],
    ['I have three tenant emails, a work order and a lease renewal due by five. And now you.', 'Spooky and Reya are home alone judging me. Let\'s do this. Go, {boss}!'],
    ['Do you smell lavender? I put lavender in everything. Reya hates it. Spooky rolls in it.', 'Anyway! Battle! Focus! ...Go, {boss}!'],
    ['♪ Feels like we only go backwards... ♪ Sorry, Tame Impala\'s been on repeat all week.', 'Spooky sleeps through the whole album. Reya only likes the bass parts. Go, {boss}!'],
    ['Wait, did I feed Reya? I fed Spooky. I think I fed Reya. Reya would tell me.', 'She would SCREAM at me. Okay, she\'s fed. Go, {boss}!'],
    ['I was literally about to play video games. Controller in hand. Spooky on my lap. Reya on my keyboard.', 'And then my phone buzzed: GYM BATTLE. Go, {boss}!'],
    ['Okay, okay, I\'m here! I parked, forgot my keys, went back, Reya was sitting on them.', 'Is that a sign? That\'s a sign. Go, {boss}!'],
    ['Okay, so, a tenant called about a leaky faucet, then I thought of a bass riff, and now I\'m here?', 'Oh! Battle! Go, {boss}!'],
    ['Spooky got lavender oil on her tail and now she smells AMAZING and won\'t let me near her.', 'Go, {boss}!'],
    ['I made a playlist for this battle. It\'s just Currents. The whole album. Twice.', 'Go, {boss}!'],
    ['Reya screamed for food at 4 a.m. I fed her. She screamed at 4:05 for more food.', 'I\'m running on spite. Go, {boss}!'],
    ['Wait. Did I lock the office? I had the keys. Where are my... oh, they\'re in my hand.', 'Go, {boss}!'],
    ['I\'ve got six work orders open, a bass with a new string and a game I haven\'t started.', 'You\'re the fourth thing. Go, {boss}!'],
  ],
  beaten: [
    ['Okay, you win! Good, now I can go home and practise. Spooky\'s been waiting by the door.', 'Here, the {badge}. It smells like lavender. Everything I own does.'],
    ['Wait, I lost? I was thinking about a riff the whole time. That counts as a warm-up, right?', 'Take the {badge}. Reya\'s going to be so disappointed in me. Spooky won\'t care.'],
    ['Ugh, fine, you earned it. I\'m going home to lie on the floor with my cats and Currents on vinyl.', 'The {badge}\'s yours!'],
    ['You know what, this is a sign. Quit work, play bass, live with Spooky and Reya forever.', '...Okay, maybe not quit. Take the {badge}.'],
    ['Good battle! I forgot what I was saying. Oh! Your badge! The {badge}!', 'Also Reya learned to open cabinets. Unrelated. Bye!'],
    ['Oh no, I lost. Reya\'s going to yell. She yells at everything, though.', 'Take the {badge}.'],
    ['I was thinking about how Spooky\'s tail is basically a feather duster. Wait, did I lose?', 'Yeah, I lost. The {badge}\'s yours!'],
    ['Okay, home. Lavender bath. Bass. Cats. Bed. In that order. Probably.', 'Here, the {badge}.'],
    ['That was so fun! I lost, but it was fun! Oh, I have an idea for a song now.', 'Take the {badge}, I need to write this down before I forget!'],
    ['I swear I had a plan. It was right here. Reya probably sat on it.', 'Take the {badge}.'],
  ],
  won: [
    ['Wait, I won? I wasn\'t even paying attention! I was thinking about Spooky\'s little toe beans.', 'Okay, I have to go, Reya\'s on the cat cam doing something illegal.'],
    ['Yes! Okay, that\'s it, I\'m going home to play bass for six hours.', 'Spooky and Reya will sit in the case like it\'s a bed. It IS a bed. It\'s their bed now.'],
    ['GG! Okay, back to work emails. Then games. Then music. Then cats. Actually, cats first.'],
    ['That win was so clean. Like, Tame Impala bass line clean.', 'Reya would\'ve purred. Spooky would\'ve slept through it. Both valid.'],
    ['Okay I won, cool, can I go now? I left a lavender candle on and Spooky has a big fluffy tail.'],
    ['I won? Oh my gosh. Spooky\'s going to sleep through the celebration.', 'Reya\'s going to scream about it. Same thing, really.'],
    ['GG! Okay, I need to text my landlord, my tenants and my cats. In that order. No, cats first.'],
    ['That was such a vibe. Like the end of a Tame Impala song.', 'You know, the long fade-out ones.'],
    ['Wait, what were we doing? Oh! I won. Cool! Bye!'],
  ],
  poster: ['Three times! Okay, you get a poster. I sprayed it with lavender. Sorry. Habit.', 'Spooky was supposed to pawprint it. She fell asleep on it instead. There\'s fur.'],
  gold: ['Five?! Wow. Reya\'s only beaten me at staring contests that many times.', 'The Gold {badge}! It\'s lavender-scented. Everything is.'],
  visit: [
    ['Hi, {trainer}! I was on my way to a property inspection, then I saw your house, then...', '...I forget. Oh! It needs lavender in here.', 'Okay, I have to go, I think I left the cats\' food out. Bye!'],
    ['Hey! I brought you a lavender candle. Wait. Where did I put it.', 'It\'s in my bag. It\'s always in my bag. Here!', '...That\'s my bass pick. Okay, bye!'],
    ['{trainer}! Do you have cats? You should get cats. Two. Spooky and Reya kinds of cats.', 'Okay, maybe not the Reya kind. She opens cabinets.', 'See you!'],
  ],
  posterSeen: 'My poster! You hung it! Spooky would knock it down. Reya would sit under it and scream. Love that for you.',
};

/* JONA at home (the user's ask, 2026-10-15): her own lines, one a tap on her in Phil's corner, and now and then a talk
   between her and Phil, both sliding in (gymTalk()'s `pair` in js/gym.js; `homeJona()` in js/run.js). */
export const JONA_HOME = {
  lines: [
    'You may look at me. Briefly.',
    'Phil thinks this corner is mine. Every corner is mine. This one simply has the best view of him.',
    'The salt on the sills is adorable. He replaces it every morning. I step over it every night.',
    'Do not sit in the rocking chair. It is taken.',
    'The chair rocks because I am bored. Be more interesting and it will stop.',
    'Phil has not slept a full night since the spring. Neither have I. I simply do not need to.',
    'Your soul has a pleasant hum. Like a kettle just before it screams.',
    'The candles float because I hold them. If I let go, the treehouse burns. Be polite.',
    'I count the knots in the floorboards while he sleeps. Four hundred and twelve. He has not noticed one is new.',
    'That meter on the desk beeps when I am near. It never stops beeping. Draw your own conclusions.',
    'He bought a camcorder to catch me on film. I am in every frame. He deletes them without watching.',
    'Misdreavus is not my pet. We are colleagues.',
    'The Ghostcap Stew glows. He eats it in the dark to check. I find this unbearably sad.',
    'Phil talks in his sleep. Mostly apologies. Mostly to me.',
    'You beat me once. Do not grow fond of the feeling.',
    'I was here before the tree. The tree grew round me. Ask it.',
    'Ricky waves at our window at three in the morning. I wave back. Phil does not know which of us he means.',
    'Highbough is full of ghosts. Pleasant ones. I find them exhausting.',
    'The organ plays at midnight. Phil blames the wind. The wind cannot play in D minor.',
    'I like your Pokémon. It looked at me in the fight and did not blink. Most of them blink.',
    'Phil leaves a light on for himself. I leave a dark on for me.',
    'Every mirror in this house shows me first. He has stopped shaving.',
    'Do not touch the doll. It is not haunted. That is precisely why I keep it. It is the only quiet thing here.',
    'He tried an exorcism in the summer. I helped him with the Latin. His pronunciation was dreadful.',
    'I do not hate Phil. One does not hate a coat. One simply wears it.',
    'Bring me nothing from Kurt\'s Workshop. I want nothing. I have everything. I have Phil.',
    'You smell of the Clearing. Grass and Pokédollars. How wholesome.',
    'When the candles gutter, it is me, saying hello. When they all go out at once, it is me, saying more.',
    'The runes on the floor glow violet. My colour. He chose it to keep me in. I chose it first.',
    'Phil thinks I want his body. I want his attention. The body came with it.',
    'He named his Blissey after his mother. I named nothing. Names are leashes.',
    'You walked in without knocking. Good. Knocking is for things that wait to be let in.',
    'Stand a little closer. No. Not that close. Perfect. Right there, where it is coldest.',
    'I am JONA. I was JONA before your grandmother\'s grandmother learned to fear the dark.',
    'He keeps a torch on the desk. The batteries die whenever I am fond of him. They die often.',
    'The bats on the garland are paper. The bat behind you is not.',
    'Sometimes I let him win a small argument. It keeps his heart beating. I need it beating.',
    'If you hear your name whispered tonight, do not answer. It will only encourage me.',
    'Phil writes "GO AWAY JONA" on the steamed-up window. I write "NO" underneath. It is our little game.',
    'Your Pokémon will dream of me tonight. Tell it I said nothing in particular. It will worry more.',
    'I have possessed kings. I have possessed a lighthouse. Phil is my favourite. Do not tell him.',
    'The portrait on the wall is of me. Phil thinks it is his great-aunt. Let him.',
    'Five hundred years, and a ghost hunter with a salt shaker is the one who finally made me laugh.',
    'He reads ghost stories to calm down. I read them over his shoulder and correct the details.',
    'Leave the door open on your way out. The draught carries my voice down to the bridges. The others enjoy it less.',
    'The cobwebs are decorative. The spiders are not.',
    'I do not sleep, but I rest my eyes. Mine are the two glowing ones under the desk. Now you know.',
    'Phil asked me once what I want. I said "more". He has been buying candles ever since.',
    'I find your Waystones charming. Little lights, to keep the dark out. The dark is patient.',
    'He hums when he is frightened. He hums all day. It is a good song. I would never tell him.',
    'Nobody sits in the chair. Nobody. Except, now and then, at night, someone does.',
    'Come back after eleven. The house is more honest then.',
    'Go on, little trainer. Go. JONA has been watching you since the gate. JONA will keep watching.',
    'THE DARK REMEMBERS YOUR NAME. ...Forgive me. I get carried away.',
    '*she smiles with far too many teeth, and every candle in the room leans towards you*',
    '*the rocking chair stops dead. She is looking at it, not at you. It starts again.*',
  ],
  duets: [
    ['PHIL: JONA, please. We have a guest.', 'JONA: I can see that. I can see all of them. Their bones are lovely.', 'PHIL: You can\'t say things like that to people!', 'JONA: I just did. Look, it is still standing. Brave little thing.', 'PHIL: ...Sorry about her. Tea? It\'s just tea. I checked.', 'JONA: He checked. He checks everything. It is the most charming thing about him.'],
    ['PHIL: Did you move the salt again?', 'JONA: I would never touch the salt.', 'PHIL: It\'s in a smiley face on the windowsill, JONA.', 'JONA: Then someone must have touched it. Someone with taste.', 'PHIL: *sighs* At least it\'s still on the sill.', 'JONA: For you, Phil. Always for you.'],
    ['PHIL: You didn\'t have to scare the trainer at the gym like that.', 'JONA: I did not scare them. I PERFORMED for them.', 'PHIL: The floating. The voice. The eyes, JONA.', 'JONA: The eyes are my best feature.', 'PHIL: ...They are pretty good eyes.', 'JONA: I KNOW.', '*the candles flare up, pleased with themselves*'],
    ['PHIL: Can I have one night off? One. I\'ll beg.', 'JONA: You have had every night off for a month. You simply spent them awake.', 'PHIL: Because you sing!', 'JONA: Because you listen.', 'PHIL: ...It\'s a nice song.', 'JONA: Go to bed, Phil. I will hum it quieter.'],
  ],
};

/* Phil (the user's, 2026-10-13): possessed by a demon named JONA (the user's calls, 2026-10-13: she always takes him and
   always talks for him): Phil gets a word in, then JONA ("JONA: " lines, `voices`, her name on the tag). JONA links his soul
   with his Pokémon, fills them with dark energy and they become lifeless pawns. `possess`: in the battle, once his
   Pokémon is out, you see JONA take him (a dark aura over his sprite) and pour herself into his Pokémon, which burns with a
   dark Super Saiyan aura all fight (gymTalk()'s `possess` in js/gym.js, the battle's intro in js/battle.js). */
const PHIL = {
  sprite: 'assets/trainers/gym/phil.png',
  voices: ['PHIL', 'JONA'],
  demon: 'JONA',   // her lines take the screen over (demonSwap() in js/gym.js)
  intro: [
    ['PHIL: You shouldn\'t have come. I can\'t... hold her back much longer...', 'JONA: Phil isn\'t home right now. I am JONA, and I answer the door.', 'JONA: Go, {boss}.'],
    ['PHIL: Run. Please. Before she wakes up.', 'JONA: Too late. JONA is always awake.', 'JONA: Go, {boss}. Show them what we are.'],
    ['PHIL: I haven\'t slept in weeks. She won\'t let me.', 'JONA: Sleep is for the living. Phil is mine now.', 'JONA: Go, {boss}.'],
    ['PHIL: Do you hear that whispering? That\'s her.', 'JONA: I have been saying your name all night, little trainer.', 'JONA: Go, {boss}. Let us feed.'],
    ['PHIL: My Pokémon used to have eyes like yours. Bright. Alive.', 'JONA: Now they have mine.', 'JONA: Go, {boss}.'],
    ['PHIL: There\'s salt on every sill in my house. She just steps over it.', 'JONA: Salt. How quaint.', 'JONA: Go, {boss}.'],
    ['PHIL: My EMF reader hasn\'t stopped beeping since I woke up.', 'JONA: It beeps for me. Everything does.', 'JONA: Go, {boss}.'],
    ['PHIL: Please, if I start to float, just... look away.', 'JONA: LOOK AT ME, TRAINER. LOOK AT JONA.', 'JONA: Go, {boss}.'],
    ['PHIL: I went ghost hunting once. Just once. I found one.', 'JONA: He found ME.', 'JONA: Go, {boss}.'],
    ['PHIL: The candles keep going out when I...', 'JONA: Darkness suits him. It will suit you too.', 'JONA: Go, {boss}.'],
  ],
  possess: [
    ['PHIL: {boss}... no... get away from me...', '*his eyes roll back and a cold, black light pours out of him*', 'JONA: WE ARE ONE SOUL NOW.', 'JONA: Take it, {boss}. Take all of me. Become my pawn.'],
    ['PHIL: JONA, not {boss}. Please, not {boss}...', '*his shadow tears loose from the floor and climbs up his back*', 'JONA: Phil does not give the orders here.', 'JONA: Drink, {boss}. Drink until there is nothing left of you but JONA.'],
    ['PHIL: I can feel her moving...', '*violet fire swallows him and the room goes cold*', 'JONA: I AM JONA. I WEAR PHIL.', 'JONA: {boss}... your soul is mine to move. RISE.'],
    ['PHIL: Not again... not in front of a challenger...', '*his voice drops an octave and every candle gutters out*', 'JONA: AGAIN. ALWAYS AGAIN.', 'JONA: {boss}, open your soul. JONA is coming in.'],
  ],
  beaten: [
    ['JONA: Impossible... no host has ever broken my hold...', '*the shadow peels off him and slithers away into the corner*', 'PHIL: ...Where am I? Was JONA talking again? Here, take the {badge}.'],
    ['JONA: This body is weak. I will find a stronger one.', 'PHIL: *gasps* It\'s quiet. First time in months. Take the {badge}, quick, before she\'s back.'],
    ['JONA: You broke the link... my pawn is looking at you, not at me...', 'PHIL: Thank you. Take the {badge}. She always comes back. She ALWAYS comes back.'],
    ['JONA: Remember my name, trainer. JONA.', 'PHIL: Please don\'t. Just take the {badge} and don\'t stand in my shadow on your way out.'],
    ['JONA: No... the light... it burns...', 'PHIL: It\'s gone quiet. Oh, thank goodness. Take the {badge}, please.'],
    ['JONA: You think this is over? I am patient. I am eternal.', 'PHIL: She says that every time. Here, the {badge}. Run while she\'s sulking.'],
    ['JONA: My pawn... has its own will again... how...', 'PHIL: {boss}, you\'re back! Oh, buddy. Take the {badge}, trainer. Thank you.'],
    ['*the shadow lets go of him all at once and he stumbles*', 'PHIL: Was I... floating? I was floating. Take the {badge}.'],
  ],
  won: [
    ['JONA: Another soul for the dark.', 'JONA: Sleep now. JONA will visit you tonight.'],
    ['JONA: You see? There is no light here. There never was.', 'PHIL: ...I\'m sorry.'],
    ['JONA: Your Pokémon looked into my eyes at the end. It saw what I see.', 'JONA: It will never be the same.'],
    ['JONA: Lights out.', 'JONA: Phil says thank you for the meal. He does not mean it. I do.'],
    ['JONA: Darkness is not a defeat. It is a homecoming.', 'PHIL: Please go home. A real home. With lights.'],
    ['JONA: Your soul trembled, trainer. I heard it.', 'JONA: I will hear it again.'],
    ['JONA: Phil is weeping. How tedious.', 'PHIL: ...I\'m fine. Go.'],
  ],
  poster: ['PHIL: Three times. You\'re the only one who keeps breaking her hold.', 'PHIL: A signed poster. If its eyes follow you round the room... that\'s normal. I think.'],
  gold: ['PHIL: Five times. Because of you I\'ve had the longest quiet of my life.', 'JONA: Do not get comfortable.', 'PHIL: ...The Gold {badge}. Take it. Quickly.'],
  visit: [
    ['*Phil slips in quietly and checks your windowsills for salt*', 'It\'s quiet here. She doesn\'t like it. I like it.', 'Thank you, {trainer}. I\'ll go before she notices.'],
    ['Hi, {trainer}. Sorry. I just needed somewhere bright for a minute.', '*every light in the base flickers at once*', '...She found me. I\'m going. Lock the door.'],
    ['I brought you a ghost-hunting kit. Just in case.', '*a whisper from nowhere: "he will need it"*', 'Ignore that. Bye.'],
  ],
  posterSeen: 'My poster... her eyes are in it. Could you turn it to the wall at night? Please.',
};

/* Ricky (the user's, 2026-10-13): in his thirties, he only looks this old because his friends keep him up playing
   Valorant and ARAM from a different time zone. It's always 1 or 2 a.m., he has a meeting in the morning, and he should not
   be battling at this hour. */
const RICKY = {
  sprite: 'assets/trainers/gym/ricky.png',
  intro: [
    ['*yawns* It\'s 1 a.m. Do you know it\'s 1 a.m.? I have a meeting at nine.', 'Fine. One battle. Go, {boss}.'],
    ['I\'m thirty-two. I know. I know what I look like. It\'s the time zones.', 'The boys get on at their dinner. That\'s my 2 a.m. Go, {boss}.'],
    ['I said "one ARAM" four hours ago.', 'And now this. Go, {boss}.'],
    ['My back hurts, my eyes hurt, and my standup is in six hours.', 'Let\'s get this over with. Go, {boss}.'],
    ['The boys said "one more Valorant game." That was at midnight. It\'s ten to two.', 'I should be asleep. I should NOT be battling. Go, {boss}.'],
    ['Do you know what my calendar says for tomorrow? "8:30 Sync. 9:00 Planning. 10:00 Review."', 'And here I am. In a gym. At 2 a.m. Go, {boss}.'],
    ['It\'s 1:47. My alarm goes off at 7:30. Do the math. Actually, don\'t.', 'Go, {boss}.'],
    ['I aged three years this week. Not from work. From ARAM.', 'Go, {boss}.'],
    ['My manager asked if I\'m okay. In standup. In front of everyone.', 'I\'m fine. Go, {boss}.'],
    ['The boys out west are just getting started. I\'m just getting... finished.', 'Go, {boss}.'],
    ['I\'ve had four coffees and three of them were today.', 'Go, {boss}.'],
    ['My calendar has a block called "sleep" at 11 p.m. I\'ve never once attended.', 'Go, {boss}.'],
  ],
  beaten: [
    ['Okay, you win. Good. That means I can go to bed.', 'Take the {badge}. If the boys ask, I\'m asleep. I\'m SO asleep.'],
    ['I lost because it\'s 2 a.m. That\'s my excuse and I\'m keeping it.', 'Here, the {badge}. Goodnight. Please.'],
    ['Four hours of sleep before my meeting. Three if the boys ping me again.', 'Take the {badge}.'],
    ['You know how old I am? Thirty-two. Remember that when you take the {badge}.', 'Now let me sleep.'],
    ['That\'s fine. I couldn\'t feel my hands anyway.', 'Take the {badge}.'],
    ['If I go to bed right now I get five hours. I won\'t, but I could.', 'Here, the {badge}.'],
    ['Good. You won. Now I can say "last game" and mean it.', 'The {badge} is yours. ...They\'re inviting me to another one.'],
    ['I\'m going to fall asleep in my nine o\'clock. I can feel it.', 'Take the {badge}.'],
    ['At least losing was quick. I respect a short meeting.', 'Here\'s the {badge}.'],
  ],
  won: [
    ['Okay, I won. Great. Bed now.', '...The boys just invited me to an ARAM. No. NO. ...Okay, one.'],
    ['GG. It\'s 2:14 a.m. My meeting is in six hours and forty-six minutes.', 'I did that math in my head. That\'s how tired I am.'],
    ['Good game. Don\'t tell my manager I was up.'],
    ['That\'s game. Goodnight. I mean good morning. What day is it?'],
    ['Good game. One more? ...No. No. I have a meeting.', '...Okay, one more.'],
    ['I won at 2 a.m. That\'s like winning twice.', 'Bed. Real bed this time.'],
    ['GG. I\'m logging off. Lawrence will ask why. Tell him I died.'],
    ['I won. My standup is in seven hours. Neither of those feels real.'],
  ],
  poster: ['Three times. That\'s three nights I wasn\'t sleeping. You owe me.', 'A signed poster. My hand was shaking. It\'s the coffee.'],
  gold: ['Five. You\'ve seen me at 2 a.m. more than my manager has seen me at nine.', 'The Gold {badge}. Don\'t ask what time it is. It\'s late. It\'s always late.'],
  visit: [
    ['*yawns* Hey, {trainer}. Sorry, I\'ve been up since... yesterday.', 'Mind if I sit on your couch for a minute? Just a minute.', '*he wakes an hour later* ...I have a meeting. Bye.'],
    ['Is it okay if I take a call here? It\'s a 9 a.m. sync. Camera off.', '...Okay, they didn\'t notice I was gone. They never do.', 'Thanks, {trainer}.'],
    ['Nice place. Blackout curtains would really tie it together.', 'Trust me. Sleep\'s precious.', 'Anyway, the boys are online. Again. See you.'],
  ],
  posterSeen: 'My poster? Up there? I look so tired in it. I look tired in everything.',
};

/* John (the user's, 2026-10-13; a mechanical engineer on aircraft and spacecraft, 2026-10-14): an engineer who only wants to play Fire Emblem, keeps getting pulled away from it, and can
   never decide whether to play on his Steam Deck, his Switch 2 or his new AYN Thor. */
const JOHN = {
  sprite: 'assets/trainers/gym/john.png',
  intro: [
    ['I was on chapter 14. Chapter FOURTEEN. Do you know how hard it is to keep everyone alive on Classic?', 'And now I have to battle. Go, {boss}!'],
    ['I had a whole day planned. Work, then Fire Emblem. Work ran late. Then this.', 'Every single thing gets between me and Fire Emblem. Go, {boss}!'],
    ['Okay, quick question before we start. Steam Deck, Switch 2 or my new AYN Thor?', 'I\'ve been standing here for twenty minutes deciding. Go, {boss}!'],
    ['I just got the AYN Thor. Two screens. TWO. Do you know what that does for Fire Emblem?', '...I haven\'t actually played it yet. I keep getting interrupted. Go, {boss}!'],
    ['I design parts that fly. Real ones. Stress-tested. And I still can\'t engineer more Fire Emblem time.', 'Go, {boss}!'],
    ['A gym battle is basically a Fire Emblem map. You\'re the enemy phase.', 'I\'m going to bait you into my best unit. Go, {boss}!'],
    ['I brought the Steam Deck. Then I thought, no, the Switch 2. Then I grabbed the Thor too.', 'My bag weighs nine kilos. Go, {boss}!'],
    ['My boss called at 5:58. Two minutes before I was free. TWO.', 'I had the Deck charged and everything. Go, {boss}!'],
    ['Would Fire Emblem be better on the Thor\'s top screen or the bottom one?', 'Don\'t answer. I\'ll be thinking about it all battle. Go, {boss}!'],
    ['I\'m playing this like Classic mode. If {boss} goes down, it\'s gone forever. Emotionally.', 'Go, {boss}!'],
    ['I stress-tested a wing bracket today. It held. Let\'s see if you do.', 'Go, {boss}!'],
    ['Okay, I\'ve decided. The Switch 2. ...No. The Deck. ...Go, {boss}!'],
    ['Every unit in my army has an A support. Three hundred hours. No regrets.', 'Go, {boss}!'],
  ],
  beaten: [
    ['That\'s fine. In Fire Emblem I\'d just reset the chapter.', '...I can\'t reset this, can I? Take the {badge}.'],
    ['You lost me my best unit. Permadeath. I\'m going to need a minute.', 'Here, the {badge}. Now I\'m going home to play Fire Emblem. On... the Switch 2. Or the Deck.'],
    ['Okay, that was a good strategy. Very Fire Emblem of you. Weapon triangle and everything.', 'The {badge} is yours.'],
    ['Good. Great. Now I have NO reason not to play Fire Emblem tonight.', 'Take the {badge}. ...Thor. Definitely the Thor. Maybe the Deck.'],
    ['I lost because I was thinking about my support conversations. That\'s on me.', 'Take the {badge}.'],
    ['I\'d have won if I\'d checked your movement range. Rookie mistake.', 'Take the {badge}.'],
    ['That\'s a game over. In Fire Emblem I\'d just turn back time. Divine Pulse. Mila\'s Turnwheel. Anything.', 'Here, the {badge}.'],
    ['Okay. I\'m going home. I\'ll play on whichever handheld is closest to the door.', '...It\'ll take me ten minutes to decide. Take the {badge}.'],
    ['My work phone buzzed mid-battle. That\'s why I lost. That\'s always why I lose.', 'The {badge} is yours.'],
    ['You broke my formation. Like a cavalier through archers.', 'Take the {badge}. You earned it.'],
  ],
  won: [
    ['Ha! Turn one, no losses. That\'s how you clear a map.', 'Now if you\'ll excuse me, I have a save file waiting.'],
    ['GG. That\'s my S rank. Back to Fire Emblem.', '...On which one though. Steam Deck? Switch 2? The Thor?'],
    ['You walked right into my range. Should\'ve checked the danger zone.', 'Fire Emblem teaches you that.'],
    ['Okay, I won, and it\'s still early. Fire Emblem time.', '...My work phone\'s ringing. Of course it is.'],
    ['Enemy phase over. Nobody died. Perfect run.', 'Now I just have to decide which handheld to celebrate on.'],
    ['You went for the bait. My tankiest unit, your best hit. Classic.', 'GG.'],
    ['I won! I\'m going home! I\'m playing Fire Emblem!', '...Is that a work email? No. I didn\'t see it.'],
    ['Seize. Map cleared.', 'Steam Deck, Switch 2, Thor. Eeny, meeny...'],
  ],
  poster: ['Three wins? You\'d be on my A-team. Literally. S support.', 'Here, a signed poster. It took me twenty minutes to pick the pen.'],
  gold: ['Five times. That\'s a better record than my Classic runs.', 'The Gold {badge}. Machined to tolerance. I checked it myself.'],
  visit: [
    ['Hey, {trainer}. I just needed a quiet spot to play some Fire Emblem.', 'I brought the Deck, the Switch 2 and the Thor. I\'ve been here twenty minutes. I haven\'t picked.', 'Okay. Work\'s calling. Of course it is. See you.'],
    ['Nice base. That shelf\'s rated for less than you\'ve got on it. Just a professional note.', 'You\'d make a good tactician. Bases are kind of maps.', 'Anyway, chapter 15 awaits. Bye!'],
    ['{trainer}! Quick. Thor or Deck? I\'ll do whatever you say.', '...Actually, let me think about it on the way home.', 'See you!'],
  ],
  posterSeen: 'My poster! And you hung it dead level. As an engineer, I respect that.',
};

/* Jahmes (the user's, 2026-10-13): a PA who treats patients all day and only wants to play Valorant and ARAM Mayhem all
   night, screaming at everything, but he is in bed at 11 p.m. sharp, no exceptions: he'd throw the battle to make it, and
   sometimes he just leaves without saying goodbye. */
const JAHMES = {
  sprite: 'assets/trainers/gym/jahmes.png',
  intro: [
    ['YOOOOO! A CHALLENGER! LET\'S GOOOOO!', 'Okay, it\'s 10:41. We have nineteen minutes. Go, {boss}!'],
    ['I saw patients for ten hours today. TEN HOURS. I\'M SO HYPED TO NOT BE AT WORK!', 'Bed at eleven though. Go, {boss}!'],
    ['WHAT\'S UP! I was in the middle of ARAM Mayhem and I SCREAMED when I saw you walk in!', 'My neighbours hate me. Go, {boss}!'],
    ['Okay, listen, it\'s IMPORTANT that I\'m asleep by 11 p.m. Not 11:01. ELEVEN.', 'If this goes long, I WILL forfeit. Go, {boss}!'],
    ['AAAAAAAH! Sorry, sorry. I just clutched a 1v4 before I came here. I\'m still SCREAMING inside.', 'Go, {boss}!'],
    ['I set three alarms. One says "BATTLE". One says "VALORANT". One says "SLEEP. NOW. JAHMES."', 'Let\'s go! Go, {boss}!'],
    ['Patients today told me I look tired. I AM tired. I am also SO READY.', 'Ten minutes. Then bed. Go, {boss}!'],
    ['YO! YO! YO! IT\'S 10:50! TEN MINUTES! I\'VE NEVER BEEN MORE READY!', 'Go, {boss}!'],
    ['I took a patient\'s blood pressure today and it was LOWER THAN MY HYPE.', 'Go, {boss}!'],
    ['ARAM MAYHEM GAVE ME FOUR PENTAKILLS TODAY. FOUR! I\'M STILL VIBRATING!', 'Bed at eleven. Go, {boss}!'],
    ['My toothbrush is already loaded. Toothpaste on. Waiting by the sink.', 'That\'s how serious I am. Go, {boss}!'],
    ['CLARENCE\'S SHOW IS AT NINE BUT I CAN\'T STAY FOR THE ENCORE. ELEVEN, BABY.', 'Go, {boss}!'],
    ['Before we start: if my alarm goes off, the battle is over. That\'s medical advice.', 'Go, {boss}!'],
  ],
  beaten: [
    ['NOOOOOO! ...Okay, wait, it\'s 10:58. This is actually perfect.', 'Take the {badge}. I\'m going to bed.'],
    ['AAAAAAAH! GG! GG! You were CRACKED!', 'Here\'s the {badge}. Goodnight! Eleven o\'clock! BYE!'],
    ['I could\'ve won that. I let you win. It\'s 10:59.', 'The {badge}\'s yours. Sleep is mine.'],
    ['*checks the clock* 11:00.', '*he drops the {badge} on the floor and is gone*'],
    ['WHAT A GAME! WHAT A GAME! I\'M SCREAMING!', '...It\'s eleven. Take the {badge}. *walks out mid-sentence*'],
    ['NOOOO! ...Wait. 10:52. That\'s EIGHT more minutes of ARAM. LET\'S GO!', 'Take the {badge}!'],
    ['YOU\'RE SO CRACKED! I\'M SCREAMING AT YOU! IN A GOOD WAY!', 'The {badge}! Bye! Eleven!'],
    ['*his alarm rings mid-yell*', '*he presses the {badge} into your hand, still yelling, and leaves*'],
    ['OKAY, OKAY, YOU WIN. As a medical professional I prescribe me: sleep.', 'Here\'s the {badge}. Goodnight!'],
    ['I\'M NOT EVEN MAD! I\'M HYPED! FOR YOU! AND FOR BED!', 'Take the {badge}!'],
  ],
  won: [
    ['LET\'S GOOOOOOO! I\'M SCREAMING! I\'M ACTUALLY SCREAMING!', 'Okay, bed. Goodnight.'],
    ['YESSSS! Okay, that took four minutes. That\'s one ARAM Mayhem before eleven.', 'BYE!'],
    ['*his alarm goes off*', '*he leaves*'],
    ['AAAAAAH, GG! I had patients all day and I STILL had energy for that!', 'It\'s 10:57. I need to brush my teeth. Bye!'],
    ['LET\'S GOOOO! WHAT A CLUTCH! I\'M TELLING THE BOYS!', '...Tomorrow. It\'s 10:59.'],
    ['GGGGGG! I gotta go! Retainer in! Lights off! BYE!'],
    ['THAT WAS INSANE! Okay. Okay. Breathing. Heart rate high. Bed now.', 'Doctor\'s orders. Well. PA\'s orders.'],
    ['*he\'s already in pajamas*', 'GG! GOODNIGHT!'],
  ],
  poster: ['THREE TIMES?! YOU\'RE MY FAVOURITE PERSON! I\'M SCREAMING!', 'HERE! SIGNED POSTER! I signed it in all caps because that\'s how I talk!'],
  gold: ['FIVE?! FIIIIVE?! THE GOLD {badge}! I\'M CRYING! I\'M SCREAMING! I\'M BOTH!', '...Okay, it\'s 10:58. Take it. Love you. Bye.'],
  visit: [
    ['YOOOO, {trainer}! I WAS IN THE AREA! THIS PLACE IS SICK!', 'Wait, what time is it? 10:54?! I have to go! BYE!', '*he\'s already out the door*'],
    ['Hey, hey, hey! I\'m on my lunch break. I have twelve minutes. LET\'S HANG OUT!', 'This is a great base. Ten out of ten. Patient approved.', 'Back to the clinic! LET\'S GOOO!'],
    ['{trainer}! Is there a bed in here? Not for now. Just asking for 11 p.m.', 'Okay, cool, good to know. Bye!'],
  ],
  posterSeen: 'IS THAT MY POSTER?! ON YOUR WALL?! I\'M SCREAMING! I\'M SCREAMING AT A WALL!',
};

/* Shaun (the user's, 2026-10-13): tech support by day, fixing computers all day, a Valorant pro who smurfs on noobs and is
   obsessed with coaching his friends, flaming them when they're bad and reminding them he carries them. */
const SHAUN = {
  sprite: 'assets/trainers/gym/shaun.png',
  intro: [
    ['Have you tried turning your team off and on again?', 'Because it\'s not working. Go, {boss}!'],
    ['I fixed eleven laptops today. Every one of them was "the internet\'s broken". It was never the internet.', 'Let\'s see if you\'re broken too. Go, {boss}!'],
    ['I\'m on my smurf account right now, basically. This is my Iron 1 lobby.', 'Go, {boss}. Don\'t make it too easy.'],
    ['Okay, before we start, quick coaching: your positioning is terrible.', 'Like, I can tell from here. Go, {boss}!'],
    ['My friends are hardstuck. I carry them every night. Every. Night.', 'You\'re about to see why. Go, {boss}!'],
    ['Last night I dropped 34 kills and my friends still lost me the game.', 'I\'m in a mood. Go, {boss}!'],
    ['Ticket #4471: challenger thinks they can win.', 'Status: closing it now. Go, {boss}!'],
    ['Ticket #4502: "My Wi-Fi is slow." They had 47 Chrome tabs open.', 'Let\'s see how many tabs YOU have open. Go, {boss}!'],
    ['My friends have been Silver since 2020. I coach them every night. I am TIRED.', 'Go, {boss}!'],
    ['Quick comms: you go A, I go A, you lose. That\'s the strat.', 'Go, {boss}!'],
    ['I watched your last three battles. You crouch-spam. Don\'t crouch-spam.', 'Go, {boss}!'],
    ['Before you ask, yes, my ping is fine. Today.', 'Go, {boss}!'],
    ['Someone at work asked me to "download more RAM". I\'m in a mood.', 'Go, {boss}!'],
  ],
  beaten: [
    ['Okay, that was lag. My ping spiked. That\'s on my ISP.', 'Fine. Take the {badge}. I\'ll be on my main next time.'],
    ['Not bad. You\'d still need me to carry you in ranked, but not bad.', 'The {badge}\'s yours.'],
    ['Huh. Okay. You can come play with my friends. You\'re better than them, at least.', 'Take the {badge}.'],
    ['I wasn\'t even trying. I was thinking about the VOD I have to review for the boys.', 'Here, the {badge}. Watch your crosshair placement.'],
    ['Did you just... outplay me? Me?', 'Take the {badge}. I need to go flame my friends to feel better.'],
    ['My monitor\'s at 60 hertz here. I play on 360. That\'s the diff.', 'Take the {badge}.'],
    ['Okay, I underestimated you. I\'d bump you to Plat. Low Plat.', 'Here\'s the {badge}.'],
    ['That one\'s on my support. Oh, wait. I don\'t have a support. I AM the support.', 'Take the {badge}. I need to go tell Britt to wall better.'],
    ['I\'m opening a ticket about this. Category: rigged.', 'The {badge}\'s yours.'],
    ['Fine. You\'re cracked. You\'d still flash your own team, though.', 'Take the {badge}. VOD notes incoming.'],
  ],
  won: [
    ['Diff.', 'Watch the replay. I\'ll send you notes.'],
    ['That\'s what I do to noobs on my smurf every night.', 'Come back after you\'ve watched some guides.'],
    ['GG EZ. And I mean that as coaching. It was easy. Get better.'],
    ['You played like my friends. That\'s not a compliment.', 'Ticket closed.'],
    ['Next time, try using your utility.', 'Notes are in your inbox.'],
    ['Iron lobby things.', 'Ticket resolved. Please rate my service five stars.'],
    ['I carried that whole fight solo. As usual.', 'If only my friends could see this.'],
    ['34 kills energy. Except this time I won.', 'Feels good not to be held back by teammates.'],
  ],
  poster: ['Three wins. Okay. You\'re officially not hardstuck.', 'A signed poster. The signature\'s my in-game name. You\'ll know it from the kill feed.'],
  gold: ['Five times. You\'re a better duo than any of my friends. Don\'t tell them. Actually, do.', 'The Gold {badge}. Radiant tier. Respect.'],
  visit: [
    ['{trainer}. Your router\'s behind a metal shelf. That\'s why your Wi-Fi\'s slow.', 'Move it two feet left. You\'re welcome.', 'That\'ll be fifty dollars. Kidding. Bye.'],
    ['Hey. I came to review your setup. Base looks fine. Crosshair\'s still bad.', 'I\'ll send notes.', 'Later.'],
    ['Quick favour. Can you queue with my friends tonight? They need someone better than them.', 'You\'re better than them. The bar\'s on the floor.', 'Cool. See you on Discord.'],
  ],
  posterSeen: 'My poster\'s up? Nice. It\'s crooked, though. Two degrees. I can tell.',
};

/* Machew (the user's, 2026-10-13): the ultimate edgelord weeb, obsessed with Tales of Berseria, sure he is a character in
   it out to save the world, all ninja, swords and brooding. */
const MACHEW = {
  sprite: 'assets/trainers/gym/machew.png',
  intro: [
    ['...So. You found me. Few ever do.', 'The wind whispered your name. I did not listen. Go, {boss}.'],
    ['This world is rotting. The Abbey calls it "order". I call it a cage.', 'And I am the blade that cuts it open. Go, {boss}!'],
    ['You think this is a gym? Fool. This is a battlefield. My battlefield.', '*draws his katana. It\'s plastic.* Go, {boss}!'],
    ['Velvet would understand me. Rokurou would understand me. You? You understand nothing.', 'Go, {boss}. Show them the darkness.'],
    ['I don\'t battle for badges. I battle for a world where no one has to cry again.', '...Also it\'s my shift till six. Go, {boss}!'],
    ['My left arm... it\'s acting up again. The daemonblight wants out.', 'Stand back. Go, {boss}!'],
    ['Tch. Another challenger. They always come at sunset, when my power is strongest.', 'It\'s 2 p.m. Go, {boss}!'],
    ['I\'ve walked the path of the shadow ninja for nine years. Since I was twelve.', 'It ends here. For you. Go, {boss}!'],
    ['The shadows told me you were coming. So did my manager. He said "customer".', 'Go, {boss}.'],
    ['I have no name. ...It\'s Machew. It\'s on my name tag. Ignore the name tag.', 'Go, {boss}.'],
    ['Velvet sought vengeance. Rokurou sought a worthy blade. I seek... my break at four.', 'Go, {boss}.'],
    ['*a dramatic gust lifts his hood. It\'s the AC.*', 'Feel that? Destiny. Go, {boss}.'],
    ['I\'ve already seen this fight end. In a dream. I won.', 'Don\'t prove the dream wrong. Go, {boss}.'],
    ['Do you hear that? The sound of steel being unsheathed.', '*squeak* ...The saya\'s a bit tight. Go, {boss}!'],
  ],
  beaten: [
    ['...Impossible. My Mystic Arte...', 'Take the {badge}. You\'ve earned the right to walk my path. For now.'],
    ['Heh. So this is defeat. Velvet tasted it too, before she rose again.', 'The {badge} is yours. We will meet again. In the next arc.'],
    ['*kneels dramatically, sword in the ground*', '...Take the {badge}. I need a moment. Don\'t look at me.'],
    ['You fight with conviction. Like Eizen. Like a true pirate of the Aifread.', 'Here. The {badge}. Use it to save this world. I couldn\'t.'],
    ['My hood fell down. You saw my face. Now you must take the {badge} and leave.', 'And tell no one.'],
    ['*clutches his arm* The daemonblight... it\'s spreading... no, wait, I slept on it funny.', 'Take the {badge}.'],
    ['So the hero falls. This is the part where the music turns sad.', '...That\'s just the store\'s radio. Take the {badge}.'],
    ['This isn\'t the end of my arc. It\'s the midpoint twist.', 'The {badge} is yours. For now.'],
    ['You have defeated the shadow. But the shadow... remembers.', 'Here, the {badge}. I have to clock back in.'],
    ['A Mystic Arte, deflected? Impossible. Only Velvet could...', '...Are you Velvet? No? Take the {badge}.'],
  ],
  won: [
    ['...Hmph. As expected. Darkness always wins.', 'Come back when you\'ve felt true despair.'],
    ['Nothing personnel, kid.', '*vanishes in a puff of smoke. He\'s behind the pillar.*'],
    ['Was that your strongest? Even Laphicet hits harder.', 'Train in the mountains. Find your reason to fight.'],
    ['Another soul falls to my blade. The world is one step closer to salvation.', '...I\'m going to go play Berseria again. Fourth time.'],
    ['*sheathes the katana slowly. It takes three tries.*', '...Your journey ends here.'],
    ['The darkness claims another. As foretold.', 'Now leave me. My break\'s nearly over.'],
    ['Hmph. Strength needs no reason. Eizen taught me that.', '...I think he said that. Something like that.'],
    ['Tch. Weak.', '*he poses against the pillar for a good thirty seconds*'],
  ],
  poster: ['Three times you\'ve faced the darkness and walked out. Respect.', 'Take this signed poster. The pose is called "Abyssal Silence". Don\'t laugh.'],
  gold: ['Five. You are worthy of the true blade.', '...I mean the Gold {badge}. The katana stays with me. It was nineteen dollars.'],
  visit: [
    ['*he\'s already standing in a corner of your base, arms crossed*', '...You live here? It\'s too bright. The shadows have nowhere to rest.', 'I must go. My shift starts in ten minutes.'],
    ['{trainer}. I sensed a disturbance in your base. It was your fridge humming.', 'Carry on.', '*he leaves through the window. He comes back for the door.*'],
    ['I was patrolling. I do this every night.', '...It\'s 3 p.m. I\'m on lunch.', 'Farewell, {trainer}. Until the next arc.'],
  ],
  posterSeen: '...My poster. On your wall. So you understand the darkness after all.',
};

/* Jerome (the user's, 2026-10-13): madly obsessed with Reddit posts about GTA 6, it's all he talks about; his baby was just
   born and he barely notices; he doesn't care about being a Gym Leader, he's only doing it to pay for GTA 6. */
const JEROME = {
  sprite: 'assets/trainers/gym/jerome.png',
  intro: [
    ['Hold on, hold on. Did you see the new GTA 6 post on Reddit? Someone zoomed in on the trailer and found a gas station.', 'A GAS STATION. Anyway. Go, {boss}.'],
    ['I\'m only a Gym Leader for the money. GTA 6 Ultimate Edition doesn\'t pay for itself.', 'Go, {boss}. Make it quick.'],
    ['Yeah, I had a baby last week. Cool. Did you know Leonida has a whole Florida Keys map?', 'Go, {boss}.'],
    ['Someone on r/GTA6 counted every palm tree in trailer 2. Four hundred and twelve. I checked. It\'s four hundred and eleven.', 'Go, {boss}.'],
    ['My wife says I don\'t hold the baby enough. I said I\'d hold the baby when GTA 6 comes out.', 'She didn\'t like that. Go, {boss}.'],
    ['Every badge I hand out is two dollars. The game\'s seventy. I need thirty-five of you.', 'You\'re number nine. Go, {boss}.'],
    ['Lucia and Jason, man. Bonnie and Clyde. That\'s me and my wife. Except she\'s mad at me.', 'Go, {boss}.'],
    ['Wait, I\'m reading a theory. Hold on. ...It\'s about the alligators.', 'Okay, go, {boss}.'],
    ['There\'s a new post saying the map\'s 40% bigger than GTA 5. Forty. Percent.', 'Go, {boss}.'],
    ['My wife said "Jerome, the baby\'s crying." I said "Lucia\'s in a car chase."', 'I paused the chase. Not the baby. Go, {boss}.'],
    ['Someone found a billboard in the trailer for an alligator wrestling show. In Leonida. I need it.', 'Go, {boss}.'],
    ['Are you on Reddit? You look like the guy who posted the theory about Jason\'s tattoo.', 'No? Whatever. Go, {boss}.'],
    ['My baby\'s name? Uh. It\'s... hold on, I wrote it down somewhere. Anyway, Vice City.', 'Go, {boss}.'],
    ['I taped a release countdown over the crib. My wife took it down. I put it back up.', 'Go, {boss}.'],
  ],
  beaten: [
    ['Cool. Whatever. Take the {badge}.', 'Hey, is it true you can rob a Vice City strip mall in one go? Someone on Reddit said...'],
    ['That\'s fine, they pay me the same either way.', 'Here, the {badge}. That\'s two more dollars to GTA 6.'],
    ['You won? Huh. I was scrolling. Didn\'t see.', 'Take the {badge}. Did you see the new leak though?'],
    ['My baby cried the whole time I was battling. I didn\'t notice. I was refreshing r/GTA6.', 'Take the {badge}.'],
    ['Okay, gg. Hey, if GTA 6 gets delayed again I\'m going to lose it. Again.', 'The {badge}\'s yours.'],
    ['Cool. That\'s a loss. Doesn\'t matter. Have you seen trailer 2 frame by frame?', 'Take the {badge}.'],
    ['GG. If they announce a delay right now, I\'m quitting this gym.', 'Here, the {badge}.'],
    ['Huh, I lost. Someone found a car with Leonida plates, though. That\'s bigger news.', 'The {badge}\'s yours.'],
    ['My wife texted "come home". I sent her a link to a leak. She hasn\'t replied.', 'Take the {badge}.'],
    ['Whatever. Two bucks a badge. You\'re funding my pre-order. Thanks.', 'The {badge}\'s yours.'],
  ],
  won: [
    ['Nice. That\'s one more paycheck. One step closer to Vice City.', '...What? Oh. Yeah. Good battle or whatever.'],
    ['I won? Cool. Did you know you can have a pet in GTA 6? Unconfirmed. Probably.'],
    ['GG. My kid\'s first word is going to be "Leonida". I\'m making sure of it.'],
    ['That\'s it? Cool. Back to Reddit.', '*he\'s already scrolling*'],
    ['Yeah, I won. Anyway, check out this post. Hold on. Hold on. It\'s loading.'],
    ['GG. My son\'s first steps are going to happen while I\'m on r/GTA6. Worth it.'],
    ['That\'s one more badge for the pre-order fund. Thirty-four to go.', '...Thirty-four. Right?'],
    ['Nice. Hey, you think the beaches will have sharks? Someone on Reddit said...', '*he doesn\'t finish. He\'s reading.*'],
  ],
  poster: ['Three times? Okay, here\'s a signed poster. I wanted a GTA 6 cover on it, but legal said no.', 'If anyone asks, it\'s a collector\'s item. Like the Ultimate Edition.'],
  gold: ['Five times? You\'re basically my biggest fan. After me. I\'m Rockstar\'s biggest fan.', 'The Gold {badge}. That\'s like ten bucks toward GTA 6. Fine.'],
  visit: [
    ['Hey. Is your Wi-Fi good? I need to refresh r/GTA6 and my phone\'s on 2%.', '...Okay, nothing new. Cool base. Bye.'],
    ['{trainer}. Quick question. You think Vice City will have Secret Bases like this?', 'If it does, I\'m copying your layout.', 'Gotta go, my wife\'s calling. Probably about the baby. Or the countdown.'],
    ['*he walks in still scrolling*', 'Oh. This is your house. I thought it was a GameStop.', 'My bad. Later.'],
  ],
  posterSeen: 'Oh, my poster. Cool. Could\'ve been a GTA 6 poster, though. Just saying.',
};

export const GYM_LEADERS = [
  leader('lawrence', 'LAW', 'clearing', ['snorlax'], 'Closet Badge', { ...LAWRENCE, battleName: 'GAY TWINK DADDY LAWRENCE' }),
  leader('britt', 'BRITT', 'clearing', ['miltank'], 'Apple Badge', { ...BRITT, battleName: 'EXHAUSTED TEACHER BRITT' }),
  leader('nietos', 'THE NIETOS', 'clearing', ['kangaskhan'], 'Pacifier Badge', NIETOS),
  leader('john', 'JOHN', 'shrine', ['stoutland', 'exploud'], 'Dilemma Badge', { ...JOHN, battleName: 'INDECISIVE GAMER JOHN' }),
  leader('jahmes', 'JAHMES', 'shrine', ['ursaring'], 'Curfew Badge', { ...JAHMES, battleName: 'CRACKHEAD 11PM CURFEW JAHMES' }),
  leader('clarence', 'CLARENCE', 'wastes', ['slaking', 'regigigas'], 'Peach Badge', { ...CLARENCE, battleName: 'BURLESQUE BOI CLARENCE' }),
  leader('shaun', 'SHAUN', 'wastes', ['lickilicky', 'porygonz'], 'Comms Badge', { ...SHAUN, battleName: 'TECH SUPPORT IGL SHAUN' }),
  leader('pat', 'PAT', 'ruins', ['dunsparce', 'wigglytuff'], 'Serenade Badge', { ...PAT, battleName: 'HOPELESS ROMANTIC PAT' }),
  leader('kayl', 'KAYL', 'ruins', ['granbull'], 'Whisker Badge', { ...KAYL, battleName: 'PROPERTY COORDINATOR KAYL' }),
  leader('phil', 'PHIL', 'thornwood', ['blissey', 'porygon'], 'Possession Badge', { ...PHIL, battleName: 'GHOST HUNTER PHIL' }),
  leader('ricky', 'RICKY', 'thornwood', ['porygon2'], 'All-Nighter Badge', { ...RICKY, battleName: 'EAST COAST RICKY' }),
  leader('machew', 'MACHEW', 'savanna', ['castform', 'loudred'], 'Katana Badge', { ...MACHEW, battleName: 'EDGELORD MACHEW' }),
  leader('jerome', 'JEROME', 'savanna', ['munchlax'], 'Vice Badge', { ...JEROME, battleName: 'GTA FANATIC JEROME' }),
];

export const GYM_BY_ID = Object.fromEntries(GYM_LEADERS.map(l => [l.id, l]));
const BY_BOSS = Object.fromEntries(GYM_LEADERS.flatMap(l => l.bosses.map(b => [b, l])));

/** The leader who sends out this boss, or null (Eternatus, Safari bosses, Sky Pillar guardians). */
export function leaderFor(bossId) {
  const l = BY_BOSS[bossId];
  return l?.sprites?.[bossId] ? (AS_BOSS[bossId] ??= { ...l, sprite: l.sprites[bossId] }) : l ?? null;
}
const AS_BOSS = {};

/** A biome's leaders, in order. */
export const leadersOf = (biomeId) => GYM_LEADERS.filter(l => l.biome === biomeId);

/** A line's voice: `{ who, text }` when it starts with one of the leader's `voices` ("LAW: ..."), else the line. */
export function voiced(l, line) {
  const m = l.voices && /^([A-Z]+): (.*)$/s.exec(line);
  return m && l.voices.includes(m[1]) ? { who: m[1], text: m[2], demon: m[1] === l.demon } : line;
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
