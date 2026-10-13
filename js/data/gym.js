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

/* Clarence (the user's, 2026-10-13): lives to show his ass to his friends on Discord, a burlesque show every night "to help
   them play better" at Valorant, and is FURIOUS that a gym battle is keeping him from it. Two sprites, one per boss
   (`sprites`, read by leaderFor()). */
const CLARENCE = {
  sprite: 'assets/trainers/gym/clarence.png',
  sprites: { slaking: 'assets/trainers/gym/clarence.png', regigigas: 'assets/trainers/gym/clarence-2.png' },
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
  ],
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
  ],
  beaten: [
    ['Huh. Off-key performance from me today. Happens to the greats.', '♪ ...but in my eyes, she\'s still mine... ♪ Oh, you\'re still here? Take the {badge}.'],
    ['Wow. Okay. I lost. ♪ She\'s my Tylenol when I\'m in pain... ♪', 'What? I\'m coping. Here, the {badge}.'],
    ['♪ She was mine... ♪ Mm. That one\'s for my loss.', 'Don\'t look at me like that. Take the {badge}.'],
    ['♪ It\'s been three years, she hasn\'t written back... ♪', 'Huh? No, that\'s not about you. Here\'s your {badge}.'],
    ['Fine. You win. I\'ll be roasting Lawrence in voice chat to feel better.', '♪ She\'s soothing like the ocean... ♪ Ah. Didn\'t mean to sing. Take the {badge}.'],
  ],
  won: [
    ['♪ She helps me be a better man... ♪', 'Oh, you heard that? Yeah, I sing when I win. And when I don\'t. Mostly when I win.'],
    ['And that\'s the final note. Hold it... hold it...', '♪ No matter where you go, I won\'t be very far... ♪ Sorry. Habit.'],
    ['That win deserves an encore.', '♪ She\'s exactly what I need... ♪ Me, I mean. The win. That\'s what I need.'],
    ['♪ Like a tall glass of lemonade... ♪ Refreshing, right? Winning always is.', 'Oh, you\'re still here? I thought I was singing to myself.'],
    ['Ooh. ♪ Kinda like the feeling after your first kiss... ♪', 'That\'s what winning feels like. You wouldn\'t know.'],
  ],
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
  ],
  beaten: [
    ['Okay, you win! Good, now I can go home and practise. Spooky\'s been waiting by the door.', 'Here, the {badge}. It smells like lavender. Everything I own does.'],
    ['Wait, I lost? I was thinking about a riff the whole time. That counts as a warm-up, right?', 'Take the {badge}. Reya\'s going to be so disappointed in me. Spooky won\'t care.'],
    ['Ugh, fine, you earned it. I\'m going home to lie on the floor with my cats and Currents on vinyl.', 'The {badge}\'s yours!'],
    ['You know what, this is a sign. Quit work, play bass, live with Spooky and Reya forever.', '...Okay, maybe not quit. Take the {badge}.'],
    ['Good battle! I forgot what I was saying. Oh! Your badge! The {badge}!', 'Also Reya learned to open cabinets. Unrelated. Bye!'],
  ],
  won: [
    ['Wait, I won? I wasn\'t even paying attention! I was thinking about Spooky\'s little toe beans.', 'Okay, I have to go, Reya\'s on the cat cam doing something illegal.'],
    ['Yes! Okay, that\'s it, I\'m going home to play bass for six hours.', 'Spooky and Reya will sit in the case like it\'s a bed. It IS a bed. It\'s their bed now.'],
    ['GG! Okay, back to work emails. Then games. Then music. Then cats. Actually, cats first.'],
    ['That win was so clean. Like, Tame Impala bass line clean.', 'Reya would\'ve purred. Spooky would\'ve slept through it. Both valid.'],
    ['Okay I won, cool, can I go now? I left a lavender candle on and Spooky has a big fluffy tail.'],
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
  ],
  possess: [
    ['PHIL: {boss}... no... get away from me...', '*his eyes roll back and a cold, black light pours out of him*', 'JONA: WE ARE ONE SOUL NOW.', 'JONA: Take it, {boss}. Take all of me. Become my pawn.'],
    ['PHIL: JONA, not {boss}. Please, not {boss}...', '*his shadow tears loose from the floor and climbs up his back*', 'JONA: Phil does not give the orders here.', 'JONA: Drink, {boss}. Drink until there is nothing left of you but JONA.'],
    ['PHIL: I can feel her moving...', '*violet fire swallows him and the room goes cold*', 'JONA: I AM JONA. I WEAR PHIL.', 'JONA: {boss}... your soul is mine to move. RISE.'],
  ],
  beaten: [
    ['JONA: Impossible... no host has ever broken my hold...', '*the shadow peels off him and slithers away into the corner*', 'PHIL: ...Where am I? Was JONA talking again? Here, take the {badge}.'],
    ['JONA: This body is weak. I will find a stronger one.', 'PHIL: *gasps* It\'s quiet. First time in months. Take the {badge}, quick, before she\'s back.'],
    ['JONA: You broke the link... my pawn is looking at you, not at me...', 'PHIL: Thank you. Take the {badge}. She always comes back. She ALWAYS comes back.'],
    ['JONA: Remember my name, trainer. JONA.', 'PHIL: Please don\'t. Just take the {badge} and don\'t stand in my shadow on your way out.'],
  ],
  won: [
    ['JONA: Another soul for the dark.', 'JONA: Sleep now. JONA will visit you tonight.'],
    ['JONA: You see? There is no light here. There never was.', 'PHIL: ...I\'m sorry.'],
    ['JONA: Your Pokémon looked into my eyes at the end. It saw what I see.', 'JONA: It will never be the same.'],
    ['JONA: Lights out.', 'JONA: Phil says thank you for the meal. He does not mean it. I do.'],
  ],
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
  ],
  beaten: [
    ['Okay, you win. Good. That means I can go to bed.', 'Take the {badge}. If the boys ask, I\'m asleep. I\'m SO asleep.'],
    ['I lost because it\'s 2 a.m. That\'s my excuse and I\'m keeping it.', 'Here, the {badge}. Goodnight. Please.'],
    ['Four hours of sleep before my meeting. Three if the boys ping me again.', 'Take the {badge}.'],
    ['You know how old I am? Thirty-two. Remember that when you take the {badge}.', 'Now let me sleep.'],
  ],
  won: [
    ['Okay, I won. Great. Bed now.', '...The boys just invited me to an ARAM. No. NO. ...Okay, one.'],
    ['GG. It\'s 2:14 a.m. My meeting is in six hours and forty-six minutes.', 'I did that math in my head. That\'s how tired I am.'],
    ['Good game. Don\'t tell my manager I was up.'],
    ['That\'s game. Goodnight. I mean good morning. What day is it?'],
  ],
};

/* John (the user's, 2026-10-13): an engineer who only wants to play Fire Emblem, keeps getting pulled away from it, and can
   never decide whether to play on his Steam Deck, his Switch 2 or his new AYN Thor. */
const JOHN = {
  sprite: 'assets/trainers/gym/john.png',
  intro: [
    ['I was on chapter 14. Chapter FOURTEEN. Do you know how hard it is to keep everyone alive on Classic?', 'And now I have to battle. Go, {boss}!'],
    ['I had a whole day planned. Work, then Fire Emblem. Work ran late. Then this.', 'Every single thing gets between me and Fire Emblem. Go, {boss}!'],
    ['Okay, quick question before we start. Steam Deck, Switch 2 or my new AYN Thor?', 'I\'ve been standing here for twenty minutes deciding. Go, {boss}!'],
    ['I just got the AYN Thor. Two screens. TWO. Do you know what that does for Fire Emblem?', '...I haven\'t actually played it yet. I keep getting interrupted. Go, {boss}!'],
    ['I fix bridges all day. Real ones. Load-bearing. And I still can\'t fix my lack of Fire Emblem time.', 'Go, {boss}!'],
    ['A gym battle is basically a Fire Emblem map. You\'re the enemy phase.', 'I\'m going to bait you into my best unit. Go, {boss}!'],
    ['I brought the Steam Deck. Then I thought, no, the Switch 2. Then I grabbed the Thor too.', 'My bag weighs nine kilos. Go, {boss}!'],
  ],
  beaten: [
    ['That\'s fine. In Fire Emblem I\'d just reset the chapter.', '...I can\'t reset this, can I? Take the {badge}.'],
    ['You lost me my best unit. Permadeath. I\'m going to need a minute.', 'Here, the {badge}. Now I\'m going home to play Fire Emblem. On... the Switch 2. Or the Deck.'],
    ['Okay, that was a good strategy. Very Fire Emblem of you. Weapon triangle and everything.', 'The {badge} is yours.'],
    ['Good. Great. Now I have NO reason not to play Fire Emblem tonight.', 'Take the {badge}. ...Thor. Definitely the Thor. Maybe the Deck.'],
    ['I lost because I was thinking about my support conversations. That\'s on me.', 'Take the {badge}.'],
  ],
  won: [
    ['Ha! Turn one, no losses. That\'s how you clear a map.', 'Now if you\'ll excuse me, I have a save file waiting.'],
    ['GG. That\'s my S rank. Back to Fire Emblem.', '...On which one though. Steam Deck? Switch 2? The Thor?'],
    ['You walked right into my range. Should\'ve checked the danger zone.', 'Fire Emblem teaches you that.'],
    ['Okay, I won, and it\'s still early. Fire Emblem time.', '...My work phone\'s ringing. Of course it is.'],
  ],
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
  ],
  beaten: [
    ['NOOOOOO! ...Okay, wait, it\'s 10:58. This is actually perfect.', 'Take the {badge}. I\'m going to bed.'],
    ['AAAAAAAH! GG! GG! You were CRACKED!', 'Here\'s the {badge}. Goodnight! Eleven o\'clock! BYE!'],
    ['I could\'ve won that. I let you win. It\'s 10:59.', 'The {badge}\'s yours. Sleep is mine.'],
    ['*checks the clock* 11:00.', '*he drops the {badge} on the floor and is gone*'],
    ['WHAT A GAME! WHAT A GAME! I\'M SCREAMING!', '...It\'s eleven. Take the {badge}. *walks out mid-sentence*'],
  ],
  won: [
    ['LET\'S GOOOOOOO! I\'M SCREAMING! I\'M ACTUALLY SCREAMING!', 'Okay, bed. Goodnight.'],
    ['YESSSS! Okay, that took four minutes. That\'s one ARAM Mayhem before eleven.', 'BYE!'],
    ['*his alarm goes off*', '*he leaves*'],
    ['AAAAAAH, GG! I had patients all day and I STILL had energy for that!', 'It\'s 10:57. I need to brush my teeth. Bye!'],
  ],
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
  ],
  beaten: [
    ['Okay, that was lag. My ping spiked. That\'s on my ISP.', 'Fine. Take the {badge}. I\'ll be on my main next time.'],
    ['Not bad. You\'d still need me to carry you in ranked, but not bad.', 'The {badge}\'s yours.'],
    ['Huh. Okay. You can come play with my friends. You\'re better than them, at least.', 'Take the {badge}.'],
    ['I wasn\'t even trying. I was thinking about the VOD I have to review for the boys.', 'Here, the {badge}. Watch your crosshair placement.'],
    ['Did you just... outplay me? Me?', 'Take the {badge}. I need to go flame my friends to feel better.'],
  ],
  won: [
    ['Diff.', 'Watch the replay. I\'ll send you notes.'],
    ['That\'s what I do to noobs on my smurf every night.', 'Come back after you\'ve watched some guides.'],
    ['GG EZ. And I mean that as coaching. It was easy. Get better.'],
    ['You played like my friends. That\'s not a compliment.', 'Ticket closed.'],
  ],
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
  ],
  beaten: [
    ['...Impossible. My Mystic Arte...', 'Take the {badge}. You\'ve earned the right to walk my path. For now.'],
    ['Heh. So this is defeat. Velvet tasted it too, before she rose again.', 'The {badge} is yours. We will meet again. In the next arc.'],
    ['*kneels dramatically, sword in the ground*', '...Take the {badge}. I need a moment. Don\'t look at me.'],
    ['You fight with conviction. Like Eizen. Like a true pirate of the Aifread.', 'Here. The {badge}. Use it to save this world. I couldn\'t.'],
    ['My hood fell down. You saw my face. Now you must take the {badge} and leave.', 'And tell no one.'],
  ],
  won: [
    ['...Hmph. As expected. Darkness always wins.', 'Come back when you\'ve felt true despair.'],
    ['Nothing personnel, kid.', '*vanishes in a puff of smoke. He\'s behind the pillar.*'],
    ['Was that your strongest? Even Laphicet hits harder.', 'Train in the mountains. Find your reason to fight.'],
    ['Another soul falls to my blade. The world is one step closer to salvation.', '...I\'m going to go play Berseria again. Fourth time.'],
  ],
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
  ],
  beaten: [
    ['Cool. Whatever. Take the {badge}.', 'Hey, is it true you can rob a Vice City strip mall in one go? Someone on Reddit said...'],
    ['That\'s fine, they pay me the same either way.', 'Here, the {badge}. That\'s two more dollars to GTA 6.'],
    ['You won? Huh. I was scrolling. Didn\'t see.', 'Take the {badge}. Did you see the new leak though?'],
    ['My baby cried the whole time I was battling. I didn\'t notice. I was refreshing r/GTA6.', 'Take the {badge}.'],
    ['Okay, gg. Hey, if GTA 6 gets delayed again I\'m going to lose it. Again.', 'The {badge}\'s yours.'],
  ],
  won: [
    ['Nice. That\'s one more paycheck. One step closer to Vice City.', '...What? Oh. Yeah. Good battle or whatever.'],
    ['I won? Cool. Did you know you can have a pet in GTA 6? Unconfirmed. Probably.'],
    ['GG. My kid\'s first word is going to be "Leonida". I\'m making sure of it.'],
    ['That\'s it? Cool. Back to Reddit.', '*he\'s already scrolling*'],
  ],
};

export const GYM_LEADERS = [
  leader('lawrence', 'LAW', 'clearing', ['snorlax'], 'Glitter Badge', { ...LAWRENCE, battleName: 'GAY TWINK DADDY LAWRENCE' }),
  leader('britt', 'BRITT', 'clearing', ['miltank'], 'Acorn Badge', { ...BRITT, battleName: 'EXHAUSTED TEACHER BRITT' }),
  leader('nietos', 'THE NIETOS', 'clearing', ['kangaskhan'], 'Pacifier Badge', NIETOS),
  leader('john', 'JOHN', 'shrine', ['stoutland', 'exploud'], 'Lantern Badge', { ...JOHN, battleName: 'INDECISIVE GAMER JOHN' }),
  leader('jahmes', 'JAHMES', 'shrine', ['ursaring'], 'Torii Badge', { ...JAHMES, battleName: 'CRACKHEAD 11PM CURFEW JAHMES' }),
  leader('clarence', 'CLARENCE', 'wastes', ['slaking', 'regigigas'], 'Magma Badge', { ...CLARENCE, battleName: 'BURLESQUE BOI CLARENCE' }),
  leader('shaun', 'SHAUN', 'wastes', ['lickilicky', 'porygonz'], 'Cinder Badge', { ...SHAUN, battleName: 'TECH SUPPORT IGL SHAUN' }),
  leader('pat', 'PAT', 'ruins', ['dunsparce', 'wigglytuff'], 'Tidal Badge', PAT),
  leader('kayl', 'KAYL', 'ruins', ['granbull'], 'Rune Badge', { ...KAYL, battleName: 'PROPERTY COORDINATOR KAYL' }),
  leader('phil', 'PHIL', 'thornwood', ['blissey', 'porygon'], 'Bramble Badge', { ...PHIL, battleName: 'GHOST HUNTER PHIL' }),
  leader('ricky', 'RICKY', 'thornwood', ['porygon2'], 'Root Badge', { ...RICKY, battleName: 'EAST COAST RICKY' }),
  leader('machew', 'MACHEW', 'savanna', ['castform', 'loudred'], 'Eclipse Badge', { ...MACHEW, battleName: 'EDGELORD MACHEW' }),
  leader('jerome', 'JEROME', 'savanna', ['munchlax'], 'Sunburst Badge', { ...JEROME, battleName: 'GTA FANATIC JEROME' }),
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
