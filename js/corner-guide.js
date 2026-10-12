/* corner-guide.js  -  the little PC on Meowth's counter (the user's ask, 2026-10-12): what the Game Corner is, on one
   screen. Which games pay PokéCoins today and how much is left of the day's DAILY_CAP, then the arcade machines, their
   weekly leaderboards, the prize counter that sells every game for the Secret Base, the stamp card and the showcases. */

import { el } from './ui.js';
import { playSound } from './audio.js';
import { openPanel, key } from './corner-panel.js';
import { PLAYS, DAILY_CAP, GAME_CAP } from './data/corner.js';
import { ARCADE_GAMES } from './data/leaderboard.js';
import { potWon, gameWon, STAMPS } from './corner-pot.js';
import { playsLeft } from './casino-pot.js';

const PAYING = [
  ['slots', 'Slot machines', `${PLAYS.slots} paying spins`],
  ['plinko', 'Poké Ball Plinko', `${PLAYS.plinko} paying drops`],
  ['bj', 'Blackjack', `${PLAYS.bj} paying hands`],
  ['hl', 'High-Low', `${PLAYS.hl} paying hands`],
  ['voltorb', 'Voltorb Flip', `${PLAYS.voltorb} paying rounds`],
  ['quiz', "Who's That Pokémon?", '1 round of 5'],
  ['scratch', 'Scratch card', `fill the stamp card (${STAMPS} games)`],
];

function section(title, ...rest) {
  const s = el('section', 'gd-sec');
  s.append(el('h3', 'gd-h', title), ...rest);
  return s;
}

/** Opens the guide over the Game Corner; `onClose` when it shuts. */
export function openGuide(onClose) {
  const { root, shut } = openPanel('gd', 'Game Corner guide', { onClose, outside: true });
  const box = el('div', 'vf-panel gd-panel');
  const won = Math.min(potWon(), DAILY_CAP);
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'GAME CORNER GUIDE'));

  const bar = el('div', 'gd-bar');
  const fill = el('i');
  fill.style.width = `${(won / DAILY_CAP) * 100}%`;
  bar.append(fill, el('b', '', `${won} / ${DAILY_CAP} PokéCoins won today`));

  const list = el('ul', 'gd-list');
  for (const [id, name, plays] of PAYING) {
    const li = el('li', 'gd-row');
    const left = ['slots', 'plinko', 'bj', 'hl'].includes(id) ? ` · ${playsLeft(id)} left` : '';
    li.append(el('span', 'gd-name', name), el('span', 'gd-plays', `${plays}${left}`), el('span', 'gd-won', `${gameWon(id)} won`));
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
