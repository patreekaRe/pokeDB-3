/* home-arcade.js  -  the Game Corner's game prizes are playable in the Secret Base (2026-10-12, the user's ask): a tap on
   one in walk mode opens its game as free play (js/corner-pot.js's home flag: no paying plays, stamps or saved hands),
   the quiz endless with a streak. A new playable prize is a line here. */

import { setHome } from './corner-pot.js';

const GAMES = {
  slotmachine: () => import('./slots.js').then(m => m.openSlots),
  voltorbflip: () => import('./voltorb.js').then(m => m.openVoltorb),
  plinkoboard: () => import('./plinko.js').then(m => m.openPlinko),
  blackjacktable: () => import('./blackjack.js').then(m => m.openBlackjack),
  highlowtable: () => import('./highlow.js').then(m => m.openHighLow),
  quizmachine: () => import('./quiz.js').then(m => m.openQuiz),
};

export const homeGame = (kind) => kind in GAMES;

/** Opens `kind`'s game on the machine at home; `done` once it's shut. */
export async function playAtHome(kind, done) {
  const open = await GAMES[kind]();
  setHome(true);
  await open(() => { setHome(false); done?.(); });
}
