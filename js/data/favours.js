/* ============================================================
   favours.js  -  a friend's own requests (docs/roadmap.md's step 8, session f; the user's pick, 2026-10-14). A Gym
   Leader at FAVOUR_HEARTS hearts or more (js/data/workshop.js's heartsOf()) posts a small request of their own on their
   town's board (the Quests app, js/questlog.js), beside the town's coin requests: counted from the missions' events in
   their own biome (the Nietos' in the Clearing's), one at a time, in order, round again, and handed in to them at home
   (homeRoom() in js/run.js) for FAVOUR_COINS. Nothing here touches a run, so no bot check. Pure (tests/favours.test.mjs).
   ============================================================ */

import { TOWNS } from './towns.js';

export const FAVOUR_HEARTS = 3;
/** What a friend's request pays, in PokéCoins (Coin Finder applies): a little over a town's own (REQUEST_COINS). */
export const FAVOUR_COINS = 60;

const ask = (id, text, n, on, note, thanks) => ({ id, text, n, on, note, thanks });

/** Each friend's requests, in order: `text` the job ({n} its count), `note` what they pinned on the board, `thanks` what
    they say as you hand it in. Only events that count in any biome and for any type (no Burn, Tide or Leech Seed). */
export const FAVOURS = {
  nietos: [
    ask('ni-quiet', 'Win {n} fights in the Clearing', 3, 'fight', 'Linc wakes at every noise. Could you clear the Meadow of the loud ones? - Law and Britt',
      ['It\'s so quiet out there now.', 'Linc slept through the whole afternoon. Thank you!']),
    ask('ni-stroll', 'Explore {n} ❓ rooms in the Clearing', 2, 'event', 'We want a new stroller walk. Find us somewhere nice in the woods? - Law and Britt',
      ['Two new walks! Kangaskhan already picked her favourite.']),
    ask('ni-shop', 'Buy {n} things at the Clearing\'s Mart', 2, 'mart', 'Out of everything. Again. Could you pick some bits up at the Mart? - Law and Britt',
      ['You\'re a lifesaver. We forgot the wipes again.', 'Britt: Law forgot the wipes.']),
  ],
  john: [
    ask('jo-scout', 'Explore {n} ❓ rooms in the Shrine', 2, 'event', 'Need intel on the Shrine\'s side paths before I commit to a route. Scout it? - John',
      ['Two side paths. Okay. That changes everything. Again.']),
    ask('jo-fast', 'Win {n} fights in the Shrine in 4 turns or fewer', 2, 'quick', 'Speedrun strat test: win fast in the Shrine and tell me how. - John',
      ['Under four turns? That\'s a Fire Emblem low-turn-count run. I respect it.']),
    ask('jo-pick', 'Learn {n} new moves in the Shrine', 2, 'learn', 'Can\'t choose a loadout. Learn some moves in the Shrine and I\'ll copy you. - John',
      ['I\'ll take all of them. No. One. No...']),
  ],
  jahmes: [
    ask('ja-early', 'Win {n} fights in the Shrine', 3, 'fight', 'Up at five. Shrine\'s noisy. Handle it before eleven, please. - Jahmes',
      ['Done before curfew. Good.']),
    ask('ja-clean', 'Win a fight in the Shrine without a scratch', 1, 'flawless', 'Clean fight in the Shrine. No damage. Discipline. - Jahmes',
      ['Not a scratch. That\'s how you get to bed on time.']),
    ask('ja-alpha', 'Beat an Alpha in the Shrine', 1, 'alpha', 'An Alpha keeps roaring at night. People are sleeping. - Jahmes',
      ['Quiet. Finally. I can sleep at 11 sharp again.']),
  ],
  clarence: [
    ask('cl-show', 'Deal 50 damage or more in one hit in the Wastes', 1, 'big-hit', 'Darling, I need a showstopper for the finale. One huge hit in the Wastes? - Clarence',
      ['THAT is a finale. The boys will be talking for weeks.']),
    ask('cl-props', 'Buy {n} things at the Wastes\' Mart', 2, 'mart', 'Out of rhinestones. Pick me up anything shiny at the Wastes\' Mart? - Clarence',
      ['Not rhinestones, but I can work with this. I can work with anything.']),
    ask('cl-boss', 'Beat a boss with over half your HP left', 1, 'healthy-boss', 'Win big and still look fabulous after. Half your HP, minimum. - Clarence',
      ['Not a hair out of place. Yes, darling. YES.']),
  ],
  shaun: [
    ask('sh-ticket', 'Win {n} fights in the Wastes', 3, 'fight', 'TICKET #4471: wild Pokémon chewing the Springs\' cables. Please resolve. - Shaun',
      ['Ticket closed. Have you tried turning them off and on again?']),
    ask('sh-tough', 'Win {n} fights against a type strong against yours', 2, 'tough', 'Scrim practice: win the bad matchups. Any biome. Gotta stay sharp. - Shaun',
      ['Played from behind and won. That\'s what I keep telling my team.']),
    ask('sh-patch', 'PP Up a move in the Wastes', 1, 'upgrade', 'Patch your kit before the next game. PP Up something in the Wastes. - Shaun',
      ['Patched and deployed. Good. Now don\'t touch it.']),
  ],
  pat: [
    ask('pa-bottle', 'Explore {n} ❓ rooms in the Sunken Ruins', 2, 'event', 'I threw a bottle into the Ruins and it never came back. Look for it? - Pat',
      ['You didn\'t find it? That\'s okay. It means it\'s still out there. *sniff*']),
    ask('pa-lemons', 'Buy {n} things at the Sunken Ruins\' Mart', 2, 'mart', 'I\'m out of lemons. The lemonade stand needs you! - Pat',
      ['Lemons! Or... not lemons. I\'ll make lemonade anyway. With love.']),
    ask('pa-song', 'Win {n} fights in the Sunken Ruins', 3, 'fight', 'I need a new verse. Go have an adventure in the Ruins and tell me about it? - Pat',
      ['Three fights... three verses! I\'m already crying, this is beautiful.']),
  ],
  kayl: [
    ask('ka-piers', 'Win {n} fights in the Sunken Ruins', 3, 'fight', 'Something\'s been knocking the piers loose. Same as the cats, but bigger. - Kayl',
      ['Piers are steady. The cats are still knocking things off shelves.']),
    ask('ka-rent', 'Win a fight in the Sunken Ruins without a scratch', 1, 'flawless', 'Tenant inspection: walk the Ruins and leave without a scratch on the place. - Kayl',
      ['Not a mark on it. Best tenant I\'ve had. Spooky disagrees.']),
    ask('ka-alpha', 'Beat an Alpha in the Sunken Ruins', 1, 'alpha', 'An Alpha moved into the Ruins without signing a lease. Evict it? - Kayl',
      ['Eviction served. I\'ll put the unit back up for rent.']),
  ],
  phil: [
    ask('ph-salt', 'Explore {n} ❓ rooms in Thornwood', 2, 'event', 'Need to know which paths in Thornwood are haunted. All of them? Check. - Phil',
      ['Haunted. Both of them. I knew it. Thank you for going so I didn\'t have to.']),
    ask('ph-alpha', 'Beat an Alpha in Thornwood', 1, 'alpha', 'Something big is moving in Thornwood at night. Could be JONA. Could be worse. - Phil',
      ['An Alpha? Oh good. Only an Alpha.']),
    ask('ph-exorcise', 'Forget a move', 1, 'forget', 'Get rid of something that\'s been hanging around too long. Any run. - Phil',
      ['Gone? Fully gone? Okay. I\'m putting a salt line round it anyway.']),
  ],
  ricky: [
    ask('ri-stream', 'Win {n} fights in Thornwood', 3, 'fight', 'Chat wants Thornwood content. Win some fights there, I\'ll clip it. - Ricky',
      ['Clipped. Chat says you\'re cracked.']),
    ask('ri-power', 'Play {n} Power cards', 2, 'power', 'Need a build guide for the stream. Play some Powers and I\'ll take notes. At 3 a.m. - Ricky',
      ['Powers? At this hour? Legendary.']),
    ask('ri-upgrade', 'PP Up a move in Thornwood', 1, 'upgrade', 'Upgrade something in Thornwood. Chat voted. I don\'t make the rules. - Ricky',
      ['Chat\'s spamming hype. You did that.']),
  ],
  machew: [
    ask('ma-trial', 'Win {n} fights in the Savanna in 4 turns or fewer', 2, 'quick', 'A true warrior ends a fight quickly. Show me, in the Savanna. - Machew',
      ['Swift. Like my blade. Which still has its price tag on.']),
    ask('ma-relic', 'Find a relic in the Savanna', 1, 'relic', 'The dunes hide an old treasure. I meditated on it. Go and find it. - Machew',
      ['The wind was right this time. Don\'t tell it.']),
    ask('ma-endure', 'Win {n} fights in the Savanna', 3, 'fight', 'Train with me in spirit. Win in the Savanna while I brood. - Machew',
      ['You trained. I brooded. We both grew.']),
  ],
  jerome: [
    ask('je-heist', 'Buy {n} things at the Savanna\'s Mart', 3, 'mart', 'Need supplies for the plan. Don\'t ask what plan. Savanna\'s Mart. - Jerome',
      ['Perfect. Step one complete. There\'s no step two.']),
    ask('je-caravan', 'Win {n} fights in the Savanna', 3, 'fight', 'Clear the caravan road in the Savanna. For totally legit reasons. - Jerome',
      ['Road\'s clear. The caravan will never know what hit it. Kidding.']),
    ask('je-big', 'Deal 50 damage or more in one hit in the Savanna', 1, 'big-hit', 'I need a distraction. A big one. One hit, 50 damage, in the Savanna. - Jerome',
      ['Now THAT\'s a distraction. Nobody saw a thing.']),
  ],
};

/** The town a friend lives in (the Nietos at home in the Clearing), so their requests count in its biome. */
export const FRIEND_TOWN = { nietos: 'clearing', ...Object.fromEntries(Object.values(TOWNS).flatMap(t => Object.keys(t.leaders).map(id => [id, t.id]))) };
const biomeOf = (leader) => (FRIEND_TOWN[leader] === 'clearing' ? 'clearing' : TOWNS[FRIEND_TOWN[leader]]?.biome);
/** Requests that count anywhere, not only in the friend's biome (their text names no place). */
const ANYWHERE = new Set(['tough', 'power', 'forget', 'healthy-boss']);

/** A friend's saved request: `done` handed in, `got` towards the one up now, `ready` once it's finished. */
export const favourOf = (save, leader) => ({ done: 0, got: 0, ready: false, ...(save.favours?.[leader] || {}) });
/** Whether a friend has a request up: at FAVOUR_HEARTS or more (`hearts` theirs). */
export const asking = (leader, hearts) => !!FAVOURS[leader] && hearts >= FAVOUR_HEARTS;
/** Their request up now: in order, round again once every one is done. */
export const currentFavour = (leader, fs) => FAVOURS[leader][fs.done % FAVOURS[leader].length];
export const favourText = (f) => f.text.replace('{n}', f.n);

/** Count play into a friend's request (`biome` the run's biome): the new state and whether it just finished. */
export function countFavour(leader, fs, event, amount, biome) {
  const f = currentFavour(leader, fs);
  if (fs.ready || f.on !== event || !(amount > 0) || (!ANYWHERE.has(f.on) && biome !== biomeOf(leader))) return { fs, finished: false };
  const got = Math.min(f.n, fs.got + amount);
  return { fs: { ...fs, got, ready: got >= f.n }, finished: got >= f.n };
}

/** Hand the finished request in: the next one up. */
export const handInFavour = (fs) => (fs.ready ? { ...fs, done: fs.done + 1, got: 0, ready: false } : fs);
