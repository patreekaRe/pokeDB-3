/* mall-crowd.js  -  who's about in the Poké Mall's hall, and what they say (the user's ask, 2026-10-12: a few Pokémon
   standing around, one or two walking about, one coming or going, a new lot two or three times a day). js/corner-crowd.js
   walks them, the same as the Game Corner's regulars (js/data/corner-crowd.js has the fields). `play` is what one says
   standing at a spot (a shop window, a fountain, the vending machines). A new one is an entry here (its front GIF in
   assets/pokemon/, a cry in js/audio.js's CRIES). */

export const SHOPPERS = [
  {
    id: 'marill', name: 'Marill', move: 'hop', speed: 1.7, likes: ['stand'],
    quips: ['Ma-rill!', 'Bounce, bounce...', 'I could sit by that fountain all day.', 'Rill rill~'],
    play: ['The fountain sings if you listen.', 'I see a Magikarp-shaped coin in there!', 'Splash!', 'So sparkly.'],
    you: ['Marill! Hi {name}!', 'Did you throw a coin in the fountain? I did. Twice.', 'My tail floats, so I never get lost in here.', 'The Furniture store has a beach ball. I want it SO much.'],
  },
  {
    id: 'sentret', name: 'Sentret', move: 'hop', speed: 1.9, likes: ['stand'],
    quips: ['Sen!', 'Keeping watch...', 'All clear on the east side!', 'Who goes there?'],
    play: ['On lookout duty.', 'I see everything from here.', 'Tail stand! Ta-da!', 'Hmm, suspicious shutters.'],
    you: ['Sentret! I saw you come in, {name}.', 'I\'m the mall\'s lookout. Unofficially.', 'Something is moving in behind those shutters. I\'m sure of it.', 'Stay alert, {name}!'],
  },
  {
    id: 'teddiursa', name: 'Teddiursa', move: 'walk', speed: 1.2, likes: ['stand'],
    quips: ['Teddi~', '*licks paw*', 'Is there honey here?', 'Hmm, snacks...'],
    play: ['The soda machine has honey flavour. I checked.', 'Mmm, smells sweet over here.', 'One more drink...', 'Sticky paws, sorry!'],
    you: ['Teddi! Want some honey, {name}?', 'The vending machines take paws. Probably.', 'I bought a teddy bear doll. It\'s me! Sort of.', 'Have you seen any Beedrill? Just asking.'],
  },
  {
    id: 'buneary', name: 'Buneary', move: 'hop', speed: 2.0, likes: ['stand'],
    quips: ['Bun bun!', 'Is my fur okay?', 'Window shopping is the best shopping.', 'Hop, hop!'],
    play: ['Ooh, that lamp would go with my ears.', 'Look at that rug!', 'I need it. I need ALL of it.', 'So cute...'],
    you: ['Buneary! Love your style, {name}.', 'I\'m saving up for a whole bedroom set.', 'Smeargle painted me a mirror. It\'s my favourite thing.', 'Do my ears look fluffy today? Be honest.'],
  },
  {
    id: 'skitty', name: 'Skitty', move: 'hop', speed: 2.1, likes: ['stand'],
    quips: ['Nya!', 'Ooh, my tail!', 'Chase, chase!', 'What\'s that shiny thing?'],
    play: ['The lights in here are so twirly.', 'I almost caught my tail!', 'Nyaa, so many things.', 'Pounce!'],
    you: ['Skitty! Wanna play, {name}?', 'I chased my tail all the way here.', 'That big Poké Ball on the fountain looks so bouncy.', 'Meowth says I\'m too cute for the Game Corner. Rude!'],
  },
  {
    id: 'minccino', name: 'Minccino', move: 'hop', speed: 1.9, likes: ['stand'],
    quips: ['Minc!', 'Dust! Everywhere!', '*sweeps*', 'This floor could be shinier.'],
    play: ['I polished this spot. You\'re welcome.', 'Spotless!', 'Hmm, a fingerprint on the glass.', 'Tidy, tidy.'],
    you: ['Minccino! Wipe your feet, {name}!', 'My cousin runs the store upstairs. Very tidy.', 'I keep the fountain\'s rim shiny. Nobody asked.', 'Your Pokémon has a little dust on it. May I?'],
  },
  {
    id: 'lillipup', name: 'Lillipup', move: 'walk', speed: 1.6, likes: ['stand'],
    quips: ['Arf!', '*sniff sniff*', 'Good smells!', 'Where did my Trainer go?'],
    play: ['I\'m waiting here like a good pup.', 'Arf! Someone dropped a snack!', 'Sit. Stay. I\'m doing great.', 'Wag, wag.'],
    you: ['Arf! Hi {name}! Hi! Hi!', 'Are you my Trainer? No? That\'s okay!', 'I\'m very good at waiting. The best.', 'Can I sniff your bag? Thanks!'],
  },
  {
    id: 'bidoof', name: 'Bidoof', move: 'walk', speed: 0.9, likes: ['stand'],
    quips: ['Bidoof.', 'Doof doof.', 'Nice wood on those benches.', 'Hmm.'],
    play: ['This bench is good wood. Very good wood.', 'Don\'t mind me. Just admiring.', 'Bidoo...', 'I could build one of these.'],
    you: ['Bidoof! Hi, {name}.', 'I\'m not here to chew the benches. Promise.', 'Everyone\'s so nice here. Even to me.', 'I bought a dam kit. It\'s a bookshelf now.'],
  },
  {
    id: 'vulpix', name: 'Vulpix', move: 'walk', speed: 1.7, likes: ['stand'],
    quips: ['Vul!', 'Six tails, zero worries.', 'Warm in here.', 'Hmm hm.'],
    play: ['That fireplace in the window... perfect.', 'I like the lamps. Cosy.', 'Don\'t splash me, please.', 'Pretty.'],
    you: ['Vulpix! Hello, {name}.', 'Keep me away from the fountain. Thanks.', 'I came for the fireplace. Staying for the vibes.', 'Brush my tails? Kidding. Unless...'],
  },
  {
    id: 'growlithe', name: 'Growlithe', move: 'walk', speed: 2.0, likes: ['stand'],
    quips: ['Grrowl!', 'Patrolling!', 'All safe here!', 'Rrruff!'],
    play: ['On guard!', 'Nobody gets past me.', 'Very loyal. Very alert.', 'Ruff! Nothing to report.'],
    you: ['Ruff! Shop safely, {name}!', 'I guard the mall. Nobody asked me to.', 'That Meowth used to be Team Rocket. I\'m watching it.', 'Want me to walk you to the Game Corner?'],
  },
  {
    id: 'ditto', name: 'Ditto', move: 'hop', speed: 1.3, likes: ['stand'],
    quips: ['Di-tto.', '*wobbles*', 'Could I be a bench? I could be a bench.', 'Blob.'],
    play: ['Shh. I\'m a statue.', 'Don\'t look at me. I\'m decor.', 'I\'m a lamp now. Bzzzz.', 'Can you tell which one is me?'],
    you: ['Ditto! You found me, {name}.', 'I was a fountain for a whole hour yesterday.', 'Want me to be your Pokémon? I can do it!', 'Shh, I\'m hiding from Smeargle. It wants to paint me.'],
  },
  {
    id: 'hoppip', name: 'Hoppip', move: 'float', speed: 1.4, likes: ['stand'],
    quips: ['Hop-pip!', 'Whee~', 'The air con is so breezy.', 'Floaty...'],
    play: ['I\'m stuck on a draught again.', 'Up, up...', 'Someone hold my leaf?', 'Drifting nicely.'],
    you: ['Hoppip! Catch me if I blow away, {name}!', 'The skylight is SO high. I want to see it.', 'I came in on the breeze. Lucky!', 'Do they sell paperweights? For me?'],
  },
  {
    id: 'cherubi', name: 'Cherubi', move: 'hop', speed: 1.5, likes: ['stand'],
    quips: ['Cheru!', 'Sunny skylight...', 'Photosynthesis time.', 'Bouncy berries!'],
    play: ['This palm is my friend.', 'Lovely sunny spot!', 'Mmm, the planters smell nice.', 'Soaking it up.'],
    you: ['Cheru! Hello, {name}!', 'The palms are on the sides now. More sun for me!', 'Is there a garden shop coming? Please say yes.', 'I\'m ripening nicely, thank you.'],
  },
  {
    id: 'aipom', name: 'Aipom', move: 'hop', speed: 2.2, likes: ['stand'],
    quips: ['Ai-pom!', 'What\'s this button do?', 'Hee hee!', 'Grab it with my tail!'],
    play: ['I can reach the top shelf with my tail.', 'Ooh, a guide map! Mine now.', 'Poke, poke.', 'So many buttons!'],
    you: ['Aipom! Gimme five, {name}!', 'I pressed every button on the guide. Twice.', 'Bet I can climb that escalator the wrong way.', 'Got anything in your pocket? Just curious.'],
  },
  {
    id: 'zigzagoon', name: 'Zigzagoon', move: 'walk', speed: 2.0, likes: ['stand'],
    quips: ['Zig!', 'Zag!', 'Pickup! Did I pick something up?', 'Ooh, a coin!'],
    play: ['Something shiny under this bench...', 'Finders keepers!', 'Zigzag, zigzag.', 'Sniff, sniff.'],
    you: ['Zig! Hi, {name}!', 'I found a PokéCoin on the floor. I\'m rich!', 'I can\'t walk in a straight line. It\'s fine.', 'Wanna see what I picked up today?'],
  },
  {
    id: 'audino', name: 'Audino', move: 'walk', speed: 1.3, likes: ['stand'],
    quips: ['Audi~', 'Everyone looks healthy today.', 'Listening...', 'Hmm hm.'],
    play: ['I can hear the fountain\'s heartbeat. Kidding.', 'Taking a break from the Center.', 'So peaceful.', 'Deep breaths.'],
    you: ['Audino! You look well, {name}.', 'Day off from the Pokémon Center. Shh.', 'Your Pokémon\'s heartbeat says it loves you.', 'Remember to drink water. Fountain water doesn\'t count.'],
  },
  {
    id: 'furret', name: 'Furret', move: 'walk', speed: 1.8, likes: ['stand'],
    quips: ['Fur-ret!', 'Long day. Long me.', 'Weeee~', 'Stretchy!'],
    play: ['I take up a whole bench. Sorry.', 'Just stretching out.', 'Cosy spot.', 'Mmm, carpet.'],
    you: ['Furret! Hi, {name}!', 'The red carpet is long. Like me!', 'I walked the whole carpet. Took a while.', 'Hug? It\'s a long hug.'],
  },
  {
    id: 'glameow', name: 'Glameow', move: 'walk', speed: 1.5, likes: ['stand'],
    quips: ['Glam.', 'Darling, the lighting.', 'Hmph.', 'Fabulous.'],
    play: ['That window display? Dreadful. I adore it.', 'I\'ll take the gold one.', 'Mirror, mirror...', 'Simply divine.'],
    you: ['Glameow. Charmed, {name}.', 'Meowth works now? How quaint.', 'The gold trim here suits me, don\'t you think?', 'I only shop where the floor is marble.'],
  },
];

export const MALL_SHARED = {
  deciding: ['Where to next...', 'Which shop first?', 'Hmm, just looking.', 'Ooh, what\'s over there?', 'Window shopping!', 'Maybe a drink first.', 'I could sit a while.', 'So much to see.'],
  stand: ['Just looking!', 'Ooh, pretty.', 'Hmm hm hm.', 'Nice and calm here.', 'Love this place.', 'Someday I\'ll buy that.'],
  arriving: ['Made it!', 'Ooh, it\'s busy today.', 'Hello, mall!', 'Back again!', 'Smells like new furniture.', 'Shopping time!'],
  leaving: ['Okay, home time.', 'Bye, everyone!', 'See you tomorrow!', 'My bag is full!', 'That was fun.', 'Off I go!'],
  nearYou: ['Oh! Hi, {name}!', 'Nice to see you, {name}.', '{name}! Shopping too?', 'Hey {name}, love the mall, right?', 'Hi {name}! Have a nice day!', '{name}! Tried the Game Corner?'],
};

export const MALL_CHATS = [
  ['Buy anything nice?', 'Just a lamp. You?', 'A lamp too! Twins!'],
  ['Have you been to the Game Corner?', 'Meowth runs it now!', 'THE Meowth? Wow.'],
  ['What\'s behind the shutters?', 'A new shop, I bet.', 'I hope it\'s snacks.'],
  ['Lovely fountains, {other}.', 'I threw a wish in.', 'What did you wish for?', 'A bigger fountain.'],
  ['Is the store upstairs open?', 'You need the lift. It costs a bit.', 'Worth it, I hear!'],
  ['Hi {other}!', 'Oh, hi! Long time!', 'Same time tomorrow?', 'Deal!'],
  ['Smeargle painted all this furniture?', 'Every single piece.', 'It must be so tired.'],
  ['Nice day, isn\'t it?', 'Every day\'s nice in here.', 'True. No rain indoors.'],
];
