/* The Clearing's townspeople (2026-10-28, the user's ask: people in the Clearing, people only; Oak and Sonia kept as
   they are): neighbours on the Gen 4 walking sheets (assets/overworld/), walked by the towns' crowd code
   (js/corner-crowd.js) from js/hub-3d.js's clearingCrowd(). They come in through the north gate and stand about the
   lawns, the plaza and the pond. Lines as the towns' folk: quips, play (at their spot), you (to you). */

export const CLEARING_FOLK = [
  { id: 'youngster', person: true, name: 'Youngster', move: 'walk', speed: 1.6, likes: ['stand'],
    quips: ['I like shorts!', 'Hey!', 'Battle me! ...Later.', 'Whoa, a Pidgey!'],
    play: ['My Rattata is in the top percentage.', 'I\'m training for the Sky Pillar. Floor one. Then floor two.', 'Shorts are comfy and easy to wear.', 'Hup! Hup!'],
    you: ['Hey, {name}! Did you beat Kenmatta yet? I didn\'t.', 'I bet my buddy could beat yours. I bet a lot of things.', 'The Pokéstop by the gate spins faster if you believe.'] },
  { id: 'lass', person: true, name: 'Lass', move: 'walk', speed: 1.4, likes: ['stand'],
    quips: ['Hmph.', 'Cute!', 'Don\'t stare.', 'La la la.'],
    play: ['The Poké Mall has new furniture. I want ALL of it.', 'My buddy needs a bow. Every buddy needs a bow.', 'Hm hm hmm.', 'So pretty today.'],
    you: ['Oh, {name}. Your buddy\'s cute. Mine\'s cuter.', 'Professor Oak says I ask too many questions. Is that a question?', 'Have you seen inside the Ancient Tree? I heard someone LIVES there.'] },
  { id: 'picnicker', person: true, name: 'Picnicker', move: 'walk', speed: 1.3, likes: ['stand'],
    quips: ['Picnic time!', 'Want a sandwich?', 'Lovely weather.', 'Mmm.'],
    play: ['The pond is the best spot. The duck agrees.', 'I packed three sandwiches. I\'ll eat four.', 'Checkered blanket, check.', 'Sun\'s out!'],
    you: ['Hi, {name}! Sit down a while!', 'The duck stole my crust again. Every day. I bring an extra now.', 'Berries from the Berry Booth make the best jam.'] },
  { id: 'gardener', person: true, name: 'Gardener', move: 'walk', speed: 1.0, likes: ['stand'],
    quips: ['Weeds.', 'Hm, dry.', '*snip snip*', 'Grow, little ones.'],
    play: ['Mind the flowerbeds, please.', 'The Ancient Tree drinks more than all my plants together.', 'Snip. Snip. There.', 'Rain tomorrow, I\'d say.'],
    you: ['Afternoon, {name}. Wipe your buddy\'s feet.', 'Something under the west lawn keeps cracking my flagstones. Old roots, I\'d guess.', 'The Nietos\' garden? Very fine. Don\'t tell them I said.'] },
  { id: 'poke-fan', person: true, name: 'Poké Fan', move: 'walk', speed: 1.2, likes: ['stand'],
    quips: ['Adorable!', 'Ohh, look at it!', 'Precious.', 'Squee.'],
    play: ['I\'ve counted every Pokémon in the Clearing today. Twice.', 'The Buddy Projector! I could watch it all day. I have.', 'So fluffy...', 'May I pet it? No? Okay.'],
    you: ['{name}! Your buddy! Can I hold it? Just for a second?', 'I have a scrapbook of every buddy that walks past. You\'re on page forty.', 'If you ever need a Pokémon minded, I\'m RIGHT here.'] },
  { id: 'schoolkid', person: true, name: 'School Kid', move: 'walk', speed: 1.5, likes: ['stand'],
    quips: ['Homework...', 'Type chart, type chart...', 'Beep boop.', 'Ugh, quiz tomorrow.'],
    play: ['Fire beats Grass. Grass beats Water. Water beats... my homework.', 'I\'m reading the quest board for extra credit.', 'Level up, level up.', 'Hmm, is that right?'],
    you: ['{name}, quick: what\'s super effective on homework?', 'Professor Sonia stays up later than my teacher. She says sleep is a myth.', 'I\'m writing a report on the Sky Pillar. I\'ve only seen floor one.'] },
];

export const CLEARING_SHARED = {
  deciding: ['Where to now...', 'Hmm.', 'Nice day for it.', 'A walk, I think.', 'Let\'s see the plaza.'],
  stand: ['Lovely out.', 'So peaceful here.', 'Hm hm hmm.', 'The Clearing\'s busy today.'],
  arriving: ['Morning, everyone!', 'Made it!', 'Back again!', 'Hello, Clearing!'],
  leaving: ['Off I go.', 'See you!', 'Home time.', 'Bye now!'],
  nearYou: ['Oh, hi!', 'Hello there!', 'Nice buddy!', 'Hey, {name}!'],
};

export const CLEARING_CHATS = [
  ['Did you see the duck today?', 'It took my sandwich.', 'It takes everyone\'s sandwich.', 'It\'s a very good duck.'],
  ['Is Professor Oak by the PC?', 'Only in the day.', 'And at night?', 'Professor Sonia. She brings snacks.'],
  ['Who lives in the Ancient Tree?', 'Someone with a LOT of furniture.', 'I saw a sofa go in.', 'Two sofas.'],
  ['The ground cracked again in the west.', 'Again?', 'Something wants out, Oak says.', '...I\'ll stand over here.'],
  ['Have you been to the Poké Mall?', 'Twice today.', 'Did you buy anything?', 'A lamp. And a lamp.'],
  ['Kenmatta shouted at a tree.', 'Why?', 'He said it wasn\'t trying hard enough.', 'Fair.'],
];
