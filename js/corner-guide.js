/* corner-guide.js  -  the little PC on Meowth's counter (the user's ask, 2026-10-12): what the Game Corner is, on one
   screen. Which games pay PokéCoins today and how much is left of the day's DAILY_CAP, then the arcade machines, their
   weekly leaderboards, the prize counter that sells every game for the Secret Base, the stamp card and the showcases. */

import { el } from './ui.js';
import { playSound } from './audio.js';
import { openPanel, key } from './corner-panel.js';
import { PLAYS, DAILY_CAP, GAME_CAP, QUIZ_LEN } from './data/corner.js';
import { ARCADE_GAMES } from './data/leaderboard.js';
import { potWon, gameWon, STAMPS } from './corner-pot.js';
import { playsLeft, puzzlesPlayed } from './casino-pot.js';
import { stampState } from './scratch.js';

/** Each paying game's row: its name and how far through today's paying plays you are (the user's ask, 2026-10-12: the
    quiz read "1 round of 5" after all five were answered, and a scratched stamp card never said it was complete). */
function paying() {
  const done = puzzlesPlayed(), st = stampState();
  const left = (id, n, what) => [`${n} paying ${what} · ${playsLeft(id)} left`, playsLeft(id) === 0];
  return [
    ['slots', 'Slot machines', ...left('slots', PLAYS.slots, 'spins')],
    ['plinko', 'Poké Ball Plinko', ...left('plinko', PLAYS.plinko, 'drops')],
    ['bj', 'Blackjack', ...left('bj', PLAYS.bj, 'hands')],
    ['hl', 'High-Low', ...left('hl', PLAYS.hl, 'hands')],
    ['voltorb', 'Voltorb Flip', `${PLAYS.voltorb} paying rounds · ${PLAYS.voltorb - done.voltorb} left`, done.voltorb >= PLAYS.voltorb],
    ['quiz', "Who's That Pokémon?", done.quiz >= QUIZ_LEN ? `${QUIZ_LEN} of ${QUIZ_LEN} answered · done` : `${done.quiz} of ${QUIZ_LEN} answered`, done.quiz >= QUIZ_LEN],
    ['scratch', 'Scratch card', st.paid ? 'Stamp card complete · scratched'
      : st.ready ? 'Stamp card complete! Tap Meowth for it' : `stamp card ${st.n} of ${STAMPS} games`, st.paid],
  ];
}

function section(title, ...rest) {
  const s = el('section', 'gd-sec');
  s.append(el('h3', 'gd-h', title), ...rest);
  return s;
}

/** Opens the guide over the Game Corner; `onClose` when it shuts. */
export function openGuide(onClose) {
  const { root, shut } = openPanel('gd', 'Game Corner guide', { onClose });
  const box = el('div', 'vf-panel gd-panel');
  const won = Math.min(potWon(), DAILY_CAP);
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'GAME CORNER GUIDE'));

  const bar = el('div', 'gd-bar');
  const fill = el('i');
  fill.style.width = `${(won / DAILY_CAP) * 100}%`;
  bar.append(fill, el('b', '', `${won} / ${DAILY_CAP} PokéCoins won today`));

  const list = el('ul', 'gd-list');
  for (const [id, name, plays, done] of paying()) {
    const li = el('li', `gd-row${done ? ' done' : ''}`);
    li.append(el('span', 'gd-name', `${done ? '✓ ' : ''}${name}`), el('span', 'gd-plays', plays), el('span', 'gd-won', `${gameWon(id)} won`));
    list.append(li);
  }

  box.append(head,
    section('💰 WIN UP TO 500 A DAY',
      el('p', 'gd-p', `Every game here is free. Each day (UTC) the first plays of these games pay real PokéCoins, up to ${DAILY_CAP} a day in all and ${GAME_CAP} from any one game. After that they're just for fun.`),
      bar, list),
    section('🕹️ ARCADE MACHINES',
      el('p', 'gd-p', 'The machines by the walls are free to play for fun. They don\'t pay coins, but they keep your best score.'),
      el('p', 'gd-p', `🏆 Weekly leaderboards: ${ARCADE_GAMES.map(g => g.name).join(', ')}. Your best score each week goes up, played here or at home. The board over Meowth shows the top three; tap it for the whole board.`)),
    section('🏠 TAKE THEM HOME',
      el('p', 'gd-p', 'Meowth\'s prize counter sells every game as furniture. Put one in your Secret Base and tap it there to play any time, as much as you like (home play pays no coins).')),
    section('🎟️ STAMP CARD',
      el('p', 'gd-p', `Play ${STAMPS} different games in one day to fill Meowth's stamp card, then tap Meowth for a scratch card. It always wins!`)),
    section('✨ SHOWCASES',
      el('p', 'gd-p', 'The screens on the back wall sell Pokémon, shinies and perks for PokéCoins. Tap one, then tap again to browse.')),
    key('Got it!', 'vf-go', () => { playSound('confirm'); shut(); }));
  root.append(box);
}
