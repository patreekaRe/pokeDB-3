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
  whackmachine: () => import('./arcade-whack.js').then(m => m.openWhack),
  flapcabinet: () => import('./arcade-flap.js').then(m => m.openFlap),
  pongcabinet: () => import('./arcade-pong.js').then(m => m.openPong),
  gastlymaze: () => import('./arcade-maze.js').then(m => m.openMaze),
  stackercabinet: () => import('./arcade-stacker.js').then(m => m.openStacker),
  dashcabinet: () => import('./arcade-runner.js').then(m => m.openRunner),
  memorycabinet: () => import('./arcade-memory.js').then(m => m.openMemory),
  slowpokeclaw: () => import('./arcade-claw.js').then(m => m.openClaw),
  pokeskeeball: () => import('./arcade-skeeball.js').then(m => m.openSkeeball),
  pokepinball: () => import('./arcade-pinball.js').then(m => m.openPinball),
  volleycabinet: () => import('./arcade-volley.js').then(m => m.openVolley),
  unowncabinet: () => import('./arcade-wordsearch.js').then(m => m.openWordSearch),
  crossingcabinet: () => import('./arcade-crossing.js').then(m => m.openCrossing),
  ekanscabinet: () => import('./arcade-snake.js').then(m => m.openSnake),
  invaderscabinet: () => import('./arcade-invaders.js').then(m => m.openInvaders),
  breakoutcabinet: () => import('./arcade-breakout.js').then(m => m.openBreakout),
  singalongcabinet: () => import('./arcade-rhythm.js').then(m => m.openRhythm),
  bubblecabinet: () => import('./arcade-bubble.js').then(m => m.openBubble),
  berrycabinet: () => import('./arcade-berry.js').then(m => m.openBerry),
  dittocabinet: () => import('./arcade-ditto.js').then(m => m.openDitto),
  bowlingcabinet: () => import('./arcade-bowling.js').then(m => m.openBowling),
  pokepuzzle: () => import('./arcade-puzzle.js').then(m => m.openPuzzle),
};

export const homeGame = (kind) => kind in GAMES;

/** An arcade cabinet is full screen and opaque, so the 3D room behind it sits still till it shuts (it was drawing every
    frame under the game and costing the game its frame rate). */
export const cabinetUp = () => !!document.querySelector('.cg-overlay.ar');

/** Opens `kind`'s game on the machine at home; `done` once it's shut. */
export async function playAtHome(kind, done) {
  const open = await GAMES[kind]();
  setHome(true);
  await open(() => { setHome(false); done?.(); });
}
