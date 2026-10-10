/* ============================================================
   augments.js  -  the Sky Pillar's augments (roadmap item 21, the user's
   call 2026-10-07: League's Arena / ARAM Mayhem, "a SHIT TON of augments").

   One of three before floor 1, then after every guardian (floors 10-90):
   Silver up to floor 30, Gold 40-60, Prismatic 70-90, with a small seeded
   chance of one slot one tier up after a guardian. Every offer comes from the week's seed
   (a stream per floor and per reroll), so everyone climbing that week sees
   the same three; only the choice differs. docs/augments.md is the plan.

   An augment is data: its effect keys are summed over every augment held
   by augEffects() (MULT keys multiply, `true` keys switch on), and the
   game (js/battle.js, js/run.js) and the bot (pokeDB-sim) read the sums.
   Fight keys (read by battle.js):
     startBlock, startStrength, startFocus, startWeak, startVuln   at the start of every fight
     turn1Draw, turn1Energy        on the first turn
     firstAttack                   extra damage on the fight's first attack
     onePunch                      the fight's first attack deals this many times as much
     attackBonus, blockBonus       on every attack / every card's block
     dmgMult, blockMult            your attacks / your cards' block, multiplied
     bossMult, executeMult, lastBreath   x damage against guardians / below 25% HP / while you're at 1 HP
     gambler                       [heads, tails]: each fight, a coin flip multiplies your attacks by one of them
     thorns, hitReduce, reflect    when an enemy attacks you: it takes n / you take n less / it takes that share back
     energyEachTurn, drawEachTurn  every turn
     lowDraw, lowEnergy            below half HP / below a quarter, every turn
     strengthEvery                 +1 strength every n turns
     healEachTurn                  at the start of every turn
     keepBlock                     the share of your block that carries over to the next turn
     comboFree                     every n-th card you play in a turn costs 0
     echoFirst, doubleEvery        the fight's first card / every n-th card of the fight is played twice
     powersFree                    your Powers cost 0 on turn 1
     refresh                       draw n whenever your discard pile is shuffled into your draw pile
     bodyguard                     block the first time each fight you drop below half HP
     steelNerves                   status cards exhaust the moment they're drawn
     retainN, retainDiscount       Still Waters' and Ebb and Flow's powers, from the start
     flurry, xPlus                 +n hits on multi-hit attacks / +n X
     comboBlock                    block when you play your 3rd attack in a turn
     patience                      block per PP left at the end of your turn
     randomCard                    a free random card of your type every turn
     timeWarp                      every n-th turn is yours again (the enemy skips its turn)
     avatar                        every card costs 1
     immortal                      you can't drop below 1 HP for the first n turns of a fight
     attackHeal, vampire, bulwark  per attack: heal n / heal that share of the damage / block that share
     nova                          { every, damage }: every n-th card of the fight hits the enemy
     handHurt                      lose n HP per card left in your hand at the end of your turn
     burnBonus, burnBlock, burnKeep, burnHeal, burnTickMult, exhaustDamage   Fire's
     seedBonus, seedThorns, seedKeep, seedHealMult, overheal, debuffTwice    Grass's
     discardTide, tideHalf, tideBlock, tideKeep, abyss                        Water's
     blazeAlways                   Blaze is on at any HP
     insight, mulligan             the enemy's next two moves show / once a fight, a new hand
     packRat                       every item works twice
     infiniteLoop, chaos           your discard pile is shuffled back in every turn / drawn cards cost a random 0-3
     hydra                         an attack hits again at this share of its damage
     copycat                       each turn the enemy's move joins your hand as a free card
     noCardBlock                   cards give no block
     skillDamage                   every Skill you play hits the enemy for n
     enemyTwice                    the enemy acts twice on turn 1
     noFightHeal                   nothing heals you in a fight
     hitReduce < 0                 every enemy attack deals that much more (Speed Demon)
     turnBlock, minBlock, healMult set bonuses: block every turn / at least n block on your turn / all healing x n
   Run keys (read by run.js): maxHp, maxHpMult, forget, upgradeRandom, upgradePick, prizeMult, martMult, fightHeal,
     restMult, itemSlots, itemNow, relicNow, itemOdds, alphaCards, rewardCards, rerolls, centerForget, guardianRelic,
     guardianBossRelic, cardShark, goldenTouch, speedrunner, bloodlust, abilityAdd, abilityMult, and the once-a-climb
     secondWind / rebirth (spent ids are kept on run.tower.spent); part c's pickyEater, recycler, moneyNow,
     prismaticNow, rewardTake, sludgeEvery, monk, riskyClimb, noCenters, guardianHp, enemyHp (every foe's HP, Sudden Death), relicEvery, offerPlus,
     newUpgraded.
   `trade: true` marks a trade-off (a cost with its power); `set` puts an augment in one of AUG_SETS, whose bonuses
   augEffects() adds once 2 or 3 of a set are held.
   ============================================================ */

import { hashString, makeRng } from '../rng.js';
import { FLIGHT, TOP_FLOOR } from './tower.js';

export const AUG_TIERS = ['silver', 'gold', 'prismatic'];
export const AUG_TIER_NAMES = { silver: 'Silver', gold: 'Gold', prismatic: 'Prismatic' };
export const AUG_REROLLS = 1;           // a climb's rerolls (Deep Pockets adds one)
export const AUG_TIER_UP = 0.1;         // each slot's seeded chance of being one tier up (Arena's surprise)
export const AUG_OFFER = 3;
// Risky Climb's Alphas start where the tower's own do (landingTypes()): from floor 1 they killed the bot on floor 1 or 2
export const RISKY_FROM = 3;

export const AUGMENTS = [
  // ---------- Silver (floors 1-30) ----------
  { id: 'thick-skin',     tier: 'silver', icon: '🧱', name: 'Thick Skin',     text: '+15 max HP.', maxHp: 15 },
  { id: 'iron-wall',      tier: 'silver', icon: '🛡️', name: 'Iron Wall',      text: 'Start every fight with 6 block.', startBlock: 6, set: 'ironclad' },
  { id: 'light-pack',     tier: 'silver', icon: '🎒', name: 'Light Pack',     text: 'Forget 2 moves from your deck.', forget: 2 },
  { id: 'sharpened',      tier: 'silver', icon: '🔪', name: 'Sharpened',      text: 'PP Up 3 random moves in your deck.', upgradeRandom: 3, set: 'card-smith' },
  { id: 'training-day',   tier: 'silver', icon: '📘', name: 'Training Day',   text: 'PP Up a move of your choice now, and again after every guardian.', upgradePick: 1, set: 'card-smith' },
  { id: 'pocket-change',  tier: 'silver', icon: '💴', name: 'Pocket Change',  text: '+50% ₽ from fights.', prizeMult: 1.5 },
  { id: 'big-spender',    tier: 'silver', icon: '🏷️', name: 'Big Spender',    text: 'Poké Mart prices are 25% lower.', martMult: 0.75 },
  { id: 'field-medic',    tier: 'silver', icon: '🩹', name: 'Field Medic',    text: 'Heal 3 HP after every won fight.', fightHeal: 3, set: 'glutton' },
  { id: 'rest-stop',      tier: 'silver', icon: '🏥', name: 'Rest Stop',      text: 'Pokémon Centers heal 50% more.', restMult: 1.5 },
  { id: 'first-strike',   tier: 'silver', icon: '⚡', name: 'First Strike',   text: 'Your first attack each fight deals +8 damage.', firstAttack: 8 },
  { id: 'warm-up',        tier: 'silver', icon: '🔥', name: 'Warm Up',        text: 'Draw 2 more cards on turn 1.', turn1Draw: 2 },
  { id: 'early-bird',     tier: 'silver', icon: '🐦', name: 'Early Bird',     text: '+1 PP on turn 1 of every fight.', turn1Energy: 1 },
  { id: 'hoarder',        tier: 'silver', icon: '👜', name: 'Hoarder',        text: '+1 item slot, and an item now.', itemSlots: 1, itemNow: 1 },
  { id: 'lucky-find',     tier: 'silver', icon: '🍀', name: 'Lucky Find',     text: 'A random relic now.', relicNow: 1, set: 'high-roller' },
  { id: 'scavenger',      tier: 'silver', icon: '🦝', name: 'Scavenger',      text: 'Fights drop items twice as often.', itemOdds: 2 },
  { id: 'thorn-coat',     tier: 'silver', icon: '🌵', name: 'Thorn Coat',     text: 'Enemies take 3 damage when they attack you.', thorns: 3 },
  { id: 'steady-hands',   tier: 'silver', icon: '🤲', name: 'Steady Hands',   text: 'Cards that give block give 2 more.', blockBonus: 2 },
  { id: 'heavy-hitter',   tier: 'silver', icon: '🥊', name: 'Heavy Hitter',   text: 'Your attacks deal +2 damage.', attackBonus: 2 },
  { id: 'alpha-hunter',   tier: 'silver', icon: '🎯', name: 'Alpha Hunter',   text: 'Alphas give an extra card reward.', alphaCards: 1 },
  { id: 'second-helping', tier: 'silver', icon: '🍽️', name: 'Second Helping', text: 'Card rewards offer 4 cards.', rewardCards: 1 },
  { id: 'deep-pockets',   tier: 'silver', icon: '🎲', name: 'Deep Pockets',   text: '+1 augment reroll this climb.', rerolls: 1 },
  { id: 'tough-hide',     tier: 'silver', icon: '🦏', name: 'Tough Hide',     text: 'Take 1 less damage from every enemy attack.', hitReduce: 1 },
  { id: 'clean-slate',    tier: 'silver', icon: '🧽', name: 'Clean Slate',    text: 'At a Pokémon Center, the PC can also forget a move.', centerForget: true },
  { id: 'lucky-coin',     tier: 'silver', icon: '🪙', name: 'Lucky Coin',     text: 'Guardians have a 25% chance to give an extra relic.', guardianRelic: 0.25 },
  { id: 'inner-focus',    tier: 'silver', icon: '🧘', name: 'Inner Focus',    text: 'Start every fight with 1 strength.', startStrength: 1 },
  { id: 'picky-eater',    tier: 'silver', icon: '🥢', name: 'Picky Eater',    text: 'Reroll a fight\'s card reward once, for 30 ₽.', pickyEater: 30 },
  { id: 'insight',        tier: 'silver', icon: '🔭', name: 'Insight',        text: 'See the enemy\'s next two moves; your first attack each fight deals +3.', insight: true, firstAttack: 3 },
  { id: 'mulligan',       tier: 'silver', icon: '🔄', name: 'Mulligan',       text: 'Once a fight, shuffle your hand into your draw pile and draw that many.', mulligan: 1 },
  { id: 'cursed-gold',    tier: 'silver', trade: true, icon: '💰', name: 'Cursed Gold',  text: '+300 ₽ now; Poké Mart prices are 25% higher.', moneyNow: 300, martMult: 1.25, set: 'high-roller' },
  { id: 'heavy-pack',     tier: 'silver', trade: true, icon: '🧳', name: 'Heavy Pack',   text: 'Take 2 moves from every card reward; a Sludge joins your deck after every guardian.', rewardTake: 1, sludgeEvery: 1 },
  { id: 'risky-climb',    tier: 'silver', trade: true, icon: '🧗', name: 'Risky Climb',  text: 'From floor 3 on, every landing fight is an Alpha; Alphas pay double ₽.', riskyClimb: true },
  { id: 'kindling',       tier: 'silver', type: 'fire',  icon: '🪵', name: 'Kindling',   text: 'Every Burn you apply is 2 higher.', burnBonus: 2 },
  { id: 'ember-skin',     tier: 'silver', type: 'fire',  icon: '🧯', name: 'Ember Skin', text: 'Start every fight with 8 block; heal 4 HP after every won fight.', startBlock: 8, fightHeal: 4 },
  { id: 'deep-roots',     tier: 'silver', type: 'grass', icon: '🌳', name: 'Deep Roots', text: 'Overgrow heals 3 more.', abilityAdd: 3 },
  { id: 'pollinate',      tier: 'silver', type: 'grass', icon: '🐝', name: 'Pollinate',  text: 'Every Leech Seed you apply is 1 higher.', seedBonus: 1 },
  { id: 'still-pool',     tier: 'silver', type: 'water', icon: '💧', name: 'Still Pool', text: 'Torrent starts fights with 3 more Tide.', abilityAdd: 3 },
  { id: 'undertow',       tier: 'silver', type: 'water', icon: '🌀', name: 'Undertow',   text: 'Gain 1 Tide whenever a card discards a card.', discardTide: 1 },

  // ---------- Gold (floors 40-60) ----------
  { id: 'second-wind',    tier: 'gold', icon: '🌬️', name: 'Second Wind',    text: 'Once this climb, survive a fatal hit at 1 HP and heal 30% of your max HP.', secondWind: 0.3 },
  { id: 'echo',           tier: 'gold', icon: '🔁', name: 'Echo',           text: 'The first card you play each fight is played twice.', echoFirst: true, set: 'tempo' },
  { id: 'overflow',       tier: 'gold', icon: '🫗', name: 'Overflow',       text: 'Half your block carries over to your next turn.', keepBlock: 0.5, set: 'ironclad' },
  { id: 'double-down',    tier: 'gold', icon: '✌️', name: 'Double Down',    text: 'Every 5th card you play in a fight is played twice.', doubleEvery: 5, set: 'tempo' },
  { id: 'combo-master',   tier: 'gold', icon: '🎼', name: 'Combo Master',   text: 'Every 3rd card you play in a turn costs 0.', comboFree: 3, set: 'tempo' },
  { id: 'momentum',       tier: 'gold', icon: '📈', name: 'Momentum',       text: 'Gain 1 strength every 3rd turn of a fight.', strengthEvery: 3, set: 'snowball' },
  { id: 'bulwark',        tier: 'gold', icon: '🏰', name: 'Bulwark',        text: 'Gain block equal to 20% of the damage your attacks deal.', bulwark: 0.2, set: 'ironclad' },
  { id: 'siphon',         tier: 'gold', icon: '🩸', name: 'Siphon',         text: 'Heal 1 HP whenever you play an attack.', attackHeal: 1, set: 'glutton' },
  { id: 'executioner',    tier: 'gold', icon: '🪓', name: 'Executioner',    text: 'Your attacks deal double damage to enemies below 25% HP.', executeMult: 2, set: 'snowball' },
  { id: 'opening-act',    tier: 'gold', icon: '🎭', name: 'Opening Act',    text: 'Your Powers cost 0 on turn 1.', powersFree: true },
  { id: 'deck-diet',      tier: 'gold', icon: '🥗', name: 'Deck Diet',      text: 'Forget 4 moves from your deck; -5 max HP.', forget: 4, maxHp: -5 },
  { id: 'refresh',        tier: 'gold', icon: '♻️', name: 'Refresh',        text: 'Draw 1 card whenever your discard pile is shuffled into your draw pile.', refresh: 1 },
  { id: 'ambush',         tier: 'gold', icon: '🥷', name: 'Ambush',         text: 'Enemies start every fight with 2 Vulnerable.', startVuln: 2 },
  { id: 'intimidate',     tier: 'gold', icon: '😠', name: 'Intimidate',     text: 'Enemies start every fight with 2 Weak.', startWeak: 2 },
  { id: 'bodyguard',      tier: 'gold', icon: '💂', name: 'Bodyguard',      text: 'The first time each fight you drop below half HP, gain 15 block.', bodyguard: 15, set: 'ironclad' },
  { id: 'spoils-of-war',  tier: 'gold', icon: '👑', name: 'Spoils of War',  text: 'Guardians give a second boss relic to choose.', guardianBossRelic: 1 },
  { id: 'golden-touch',   tier: 'gold', icon: '✨', name: 'Golden Touch',   text: 'After every fight, gain ₽ equal to your biggest hit in it.', goldenTouch: 1 },
  { id: 'duelist',        tier: 'gold', icon: '🤺', name: 'Duelist',        text: 'Your attacks deal 25% more damage.', dmgMult: 1.25 },
  { id: 'comeback',       tier: 'gold', icon: '🔙', name: 'Comeback',       text: 'While below half HP, draw 1 more card a turn.', lowDraw: 1 },
  { id: 'last-stand',     tier: 'gold', icon: '🚩', name: 'Last Stand',     text: 'While below 25% HP, +1 PP a turn.', lowEnergy: 1 },
  { id: 'card-shark',     tier: 'gold', icon: '🃏', name: 'Card Shark',     text: 'Every card reward also offers an upgraded rare.', cardShark: 1, set: 'card-smith' },
  { id: 'steel-nerves',   tier: 'gold', icon: '🧠', name: 'Steel Nerves',   text: 'Status cards (Poison, Confusion...) exhaust the moment they\'re drawn.', steelNerves: true },
  { id: 'retainer',       tier: 'gold', icon: '📌', name: 'Retainer',       text: 'At the end of your turn, keep 1 card of your choice in your hand.', retainN: 1 },
  { id: 'fortress',       tier: 'gold', icon: '🏯', name: 'Fortress',       text: 'Your cards\' block is 30% higher, but your attacks deal 15% less.', blockMult: 1.3, dmgMult: 0.85, set: 'ironclad' },
  { id: 'guardian-slayer', tier: 'gold', icon: '⚔️', name: 'Guardian Slayer', text: 'Your attacks deal 30% more damage to guardians.', bossMult: 1.3 },
  { id: 'flurry',         tier: 'gold', icon: '🌪️', name: 'Flurry',         text: 'Your multi-hit attacks hit 1 more time.', flurry: 1 },
  { id: 'overcharge',     tier: 'gold', icon: '🔋', name: 'Overcharge',     text: 'X-cost cards get +1 X.', xPlus: 1, needs: 'x' },
  { id: 'combo-breaker',  tier: 'gold', icon: '💥', name: 'Combo Breaker',  text: 'When you play your 3rd attack in a turn, gain 8 block.', comboBlock: 8 },
  { id: 'patience',       tier: 'gold', icon: '⏳', name: 'Patience',       text: 'End your turn with PP left: 4 block for each.', patience: 4 },
  { id: 'recycler',       tier: 'gold', icon: '♻️', name: 'Recycler',       text: 'After every fight, each of your moves exhausted in it gets PP Up.', recycler: true, set: 'card-smith' },
  { id: 'pack-rat',       tier: 'gold', icon: '🐀', name: 'Pack Rat',       text: 'Every item works twice when you use it; +1 item slot.', packRat: true, itemSlots: 1 },
  { id: 'darkrais-deal',  tier: 'gold', trade: true, icon: '🌑', name: 'Darkrai\'s Deal', text: 'A random Prismatic augment now; -20 max HP.', prismaticNow: 1, maxHp: -20 },
  { id: 'berserker',      tier: 'gold', trade: true, icon: '😤', name: 'Berserker',      text: 'Start every fight with 4 strength; cards that give block give 1 less.', startStrength: 4, blockBonus: -1 },
  { id: 'pacifist',       tier: 'gold', trade: true, icon: '🕊️', name: 'Pacifist',       text: 'Your attacks deal half; your cards\' block is 75% higher, and enemies take 3 when they attack you.', dmgMult: 0.5, blockMult: 1.75, thorns: 3 },
  { id: 'monk',           tier: 'gold', trade: true, icon: '📿', name: 'Monk',           text: 'Forget all your attacks but 3 (your best stay); every Skill you play deals 5 damage.', monk: 3, skillDamage: 5 },
  { id: 'speed-demon',    tier: 'gold', trade: true, icon: '👟', name: 'Speed Demon',    text: '+1 PP a turn; take 2 more damage from every enemy attack.', energyEachTurn: 1, hitReduce: -2 },
  { id: 'sudden-death',   tier: 'gold', trade: true, icon: '💀', name: 'Sudden Death',   text: 'Every enemy has 25% less HP; so do you (-25% max HP).', enemyHp: 0.75, maxHpMult: 0.75 },
  { id: 'no-mercy',       tier: 'gold', trade: true, icon: '🗡️', name: 'No Mercy',       text: 'Your attacks deal 40% more; Pokémon Centers become fights.', dmgMult: 1.4, noCenters: true },
  { id: 'heat-shield',    tier: 'gold', type: 'fire',  icon: '🔰', name: 'Heat Shield',  text: 'Whenever you apply Burn, gain 3 block.', burnBlock: 3 },
  { id: 'wildfire-aug',   tier: 'gold', type: 'fire',  icon: '🌋', name: 'Wildfire',     text: 'Burn never goes down, and heals you 1 HP whenever it hurts an enemy.', burnKeep: true, burnHeal: 1 },
  { id: 'cauterize',      tier: 'gold', type: 'fire',  icon: '🩹', name: 'Cauterize',    text: 'Heal 3 HP whenever Burn hurts an enemy.', burnHeal: 3 },
  { id: 'photosynthesis', tier: 'gold', type: 'grass', icon: '☀️', name: 'Photosynthesis', text: 'Heal 2 HP at the start of every turn.', healEachTurn: 2, set: 'glutton' },
  { id: 'thorn-garden',   tier: 'gold', type: 'grass', icon: '🥀', name: 'Thorn Garden', text: 'An enemy with Leech Seed takes 3 damage when it attacks.', seedThorns: 3 },
  { id: 'overbloom',      tier: 'gold', type: 'grass', icon: '🌺', name: 'Overbloom',    text: 'Healing past your max HP becomes twice as much block.', overheal: 2 },
  { id: 'rising-tide',    tier: 'gold', type: 'water', icon: '🌊', name: 'Rising Tide',  text: 'Spending Tide only spends half of it.', tideHalf: true },
  { id: 'tidal-armor',    tier: 'gold', type: 'water', icon: '🐚', name: 'Tidal Armor',  text: 'At the end of your turn, gain 1 block per Tide.', tideBlock: 1 },
  { id: 'riptide-rush',   tier: 'gold', type: 'water', icon: '🏄', name: 'Riptide Rush', text: 'Cards kept in your hand cost 1 less (Retain).', retainDiscount: 1 },

  // ---------- Prismatic (floors 70-90) ----------
  { id: 'glass-cannon',   tier: 'prismatic', icon: '🔮', name: 'Glass Cannon',   text: 'Your attacks deal double damage; your max HP is halved.', dmgMult: 2, maxHpMult: 0.5 },
  { id: 'vampire',        tier: 'prismatic', icon: '🦇', name: 'Vampire',        text: 'Heal 10% of the damage your attacks deal.', vampire: 0.1, set: 'glutton' },
  { id: 'overclock',      tier: 'prismatic', icon: '⚙️', name: 'Overclock',      text: '+2 PP a turn; after turn 1, draw 1 fewer card.', energyEachTurn: 2, drawEachTurn: -1, turn1Draw: 1, set: 'tempo' },
  { id: 'metronome-mind', tier: 'prismatic', icon: '🎵', name: 'Metronome Mind', text: 'Every turn, a random card of your type joins your hand, free.', randomCard: 1 },
  { id: 'mirror-force',   tier: 'prismatic', icon: '🪞', name: 'Mirror Force',   text: 'Enemies take back half of every attack they hit you with.', reflect: 0.5 },
  { id: 'time-warp',      tier: 'prismatic', icon: '⌛', name: 'Time Warp',      text: 'Every 4th turn of a fight, the enemy skips its turn.', timeWarp: 4 },
  { id: 'avatar',         tier: 'prismatic', icon: '🧿', name: 'Avatar',         text: 'Every card costs 1 PP (X cards stay X).', avatar: true },
  { id: 'legend',         tier: 'prismatic', icon: '🌟', name: 'Legend',         text: '+30 max HP, and your Ability\'s numbers are doubled.', maxHp: 30, abilityMult: 2 },
  { id: 'bloodlust',      tier: 'prismatic', icon: '🩸', name: 'Bloodlust',      text: 'Every 2 fights won from now on: +1 strength for the rest of the climb.', bloodlust: 2, set: 'snowball' },
  { id: 'immortal',       tier: 'prismatic', icon: '♾️', name: 'Immortal',       text: 'You can\'t drop below 1 HP for the first 3 turns of every fight.', immortal: 3 },
  { id: 'gambler',        tier: 'prismatic', icon: '🎰', name: 'Gambler',        text: 'Every fight, a coin flip: your attacks deal triple damage, or 25% less.', gambler: [3, 0.75], set: 'high-roller' },
  { id: 'one-punch',      tier: 'prismatic', icon: '👊', name: 'One Punch',      text: 'Your first attack each fight deals 5 times as much.', onePunch: 5 },
  { id: 'living-legend',  tier: 'prismatic', icon: '🗿', name: 'Living Legend',  text: 'Start every fight with 3 strength, 3 Focus and 10 block.', startStrength: 3, startFocus: 3, startBlock: 10 },
  { id: 'speedrunner',    tier: 'prismatic', icon: '⏱️', name: 'Speedrunner',    text: 'Win a fight in 3 turns or fewer: heal 10 HP and +1 max HP.', speedrunner: 3, set: 'snowball' },
  { id: 'nova',           tier: 'prismatic', icon: '💫', name: 'Nova',           text: 'Every 10th card you play in a fight deals 50 damage to the enemy.', nova: { every: 10, damage: 50 } },
  { id: 'pandemonium',    tier: 'prismatic', icon: '👹', name: 'Pandemonium',    text: '+2 PP and 1 more card a turn; lose 1 HP for every card left in your hand at its end.', drawEachTurn: 1, energyEachTurn: 2, handHurt: 1 },
  { id: 'last-breath',    tier: 'prismatic', icon: '😮‍💨', name: 'Last Breath', text: 'At 1 HP your attacks deal triple damage; once this climb, a fatal hit leaves you at 1 HP.', lastBreath: 3, secondWind: 0 },
  { id: 'infinite-loop',  tier: 'prismatic', icon: '➰', name: 'Infinite Loop',  text: 'Every turn your discard pile is shuffled back into your draw pile first; draw 1 more card a turn.', infiniteLoop: true, drawEachTurn: 1 },
  { id: 'chaos-theory',   tier: 'prismatic', icon: '🌀', name: 'Chaos Theory',   text: 'Every card you draw costs a random 0-3 PP; draw 2 more cards a turn.', chaos: true, drawEachTurn: 2, set: 'high-roller' },
  { id: 'hydra',          tier: 'prismatic', icon: '🐉', name: 'Hydra',          text: 'Every attack hits again for half its damage.', hydra: 0.5 },
  { id: 'copycat',        tier: 'prismatic', icon: '🐱', name: 'Copycat',        text: 'Every turn, the enemy\'s next move joins your hand as a free card, at half its power.', copycat: true },
  { id: 'soul-bond',      tier: 'prismatic', icon: '🔗', name: 'Soul Bond',      text: 'Two random relics now, and another after every guardian.', relicNow: 2, relicEvery: 1 },
  { id: 'phoenix',        tier: 'prismatic', type: 'fire',  icon: '🐦‍🔥', name: 'Phoenix',  text: 'Blaze is always on, and its bonus is doubled. Heal 2 HP at the start of every turn.', blazeAlways: true, abilityMult: 2, healEachTurn: 2 },
  { id: 'rebirth',        tier: 'prismatic', type: 'fire',  icon: '🔥', name: 'Rebirth',    text: 'Once this climb, at 0 HP: revive at full HP with 3 strength.', rebirth: 3 },
  { id: 'supernova',      tier: 'prismatic', type: 'fire',  icon: '☄️', name: 'Supernova',  text: 'Burn deals double damage; every card you exhaust deals 6 to the enemy.', burnTickMult: 2, exhaustDamage: 6 },
  { id: 'world-tree',     tier: 'prismatic', type: 'grass', icon: '🌲', name: 'World Tree', text: 'Leech Seed never goes down, and heals you double.', seedKeep: true, seedHealMult: 2 },
  { id: 'spore-storm',    tier: 'prismatic', type: 'grass', icon: '🍄', name: 'Spore Storm', text: 'Every Weak, Vulnerable, Leech Seed and Sap you apply is applied twice.', debuffTwice: true },
  { id: 'tsunami-aug',    tier: 'prismatic', type: 'water', icon: '🌊', name: 'Tsunami',    text: 'Spending Tide never uses it up: it only counts it.', tideKeep: true },
  { id: 'abyss',          tier: 'prismatic', type: 'water', icon: '🕳️', name: 'Abyss',      text: 'For every 10 Tide you gain in a fight, +1 PP a turn for the rest of it.', abyss: 10 },
];

export const AUGMENTS_BY_ID = Object.fromEntries(AUGMENTS.map(a => [a.id, a]));

/* Sets (ARAM Mayhem's): 2 of a set's augments held give its first bonus, 3 its second as well (both stay). A bonus is
   effect keys like an augment's; maxHp and upgradeRandom happen once, when the set reaches it (takeAugment()). */
export const AUG_SETS = [
  { id: 'snowball',    name: 'Snowball',    icon: '☃️', bonus: { 2: { startStrength: 1, text: '+1 strength at the start of every fight' }, 3: { startStrength: 2, text: '+2 more' } } },
  { id: 'ironclad',    name: 'Ironclad',    icon: '🛡️', bonus: { 2: { turnBlock: 3, text: '+3 block every turn' }, 3: { minBlock: 10, text: 'start every turn with at least 10 block' } } },
  { id: 'high-roller', name: 'High Roller', icon: '🎲', bonus: { 2: { rerolls: 1, text: '+1 augment reroll' }, 3: { offerPlus: 1, text: 'every augment pick shows 4' } } },
  { id: 'glutton',     name: 'Glutton',     icon: '🍖', bonus: { 2: { maxHp: 10, text: '+10 max HP' }, 3: { healMult: 1.5, text: 'all your healing +50%' } } },
  { id: 'tempo',       name: 'Tempo',       icon: '🎶', bonus: { 2: { drawEachTurn: 1, text: 'draw 1 more card a turn' }, 3: { turn1Energy: 1, text: '+1 PP on turn 1' } } },
  { id: 'card-smith',  name: 'Card Smith',  icon: '⚒️', bonus: { 2: { upgradeRandom: 2, text: 'PP Up 2 random moves' }, 3: { newUpgraded: true, text: 'every move you learn comes PP Upped' } } },
];
export const AUG_SETS_BY_ID = Object.fromEntries(AUG_SETS.map(s => [s.id, s]));
export const setMembers = (set) => AUGMENTS.filter(a => a.set === set).map(a => a.id);

/** How many of each set's augments are held: { snowball: 2, ... }. */
export function setCounts(ids = []) {
  const out = {};
  for (const id of ids) { const set = AUGMENTS_BY_ID[id]?.set; if (set) out[set] = (out[set] || 0) + 1; }
  return out;
}

/** The set bonuses held: [{ set, n, ...keys }] for every threshold (2, 3) reached. */
export function setBonuses(ids = []) {
  const out = [];
  for (const [set, n] of Object.entries(setCounts(ids))) {
    for (const at of [2, 3]) if (n >= at) out.push({ set, n: at, ...AUG_SETS_BY_ID[set].bonus[at] });
  }
  return out;
}

/** The bonuses a set reaches when `id` joins `ids` (none, or one: its 2 or its 3). */
export const newBonuses = (ids, id) => setBonuses([...ids, id]).filter(b => !setBonuses(ids).some(x => x.set === b.set && x.n === b.n));

const MULT = new Set(['dmgMult', 'blockMult', 'bossMult', 'executeMult', 'lastBreath', 'onePunch', 'prizeMult', 'martMult', 'restMult', 'itemOdds', 'abilityMult', 'maxHpMult', 'burnTickMult', 'seedHealMult', 'overheal', 'guardianHp', 'healMult', 'enemyHp']);
const SKIP = new Set(['id', 'tier', 'type', 'icon', 'name', 'text', 'needs', 'trade', 'set']);

/** Every held augment's effects in one object: numbers add up (MULT keys multiply), `true` keys switch on, objects
    (Nova) are kept. `spent` drops the once-a-climb ones already used. */
export function augEffects(ids = [], spent = []) {
  const out = {};
  for (const a of [...ids.map(id => AUGMENTS_BY_ID[id]), ...setBonuses(ids)]) {
    if (!a) continue;
    const id = a.id;
    for (const [k, v] of Object.entries(a)) {
      if (k === 'n') continue;   // a set bonus's threshold
      if (SKIP.has(k)) continue;
      if ((k === 'secondWind' || k === 'rebirth') && spent.includes(id)) continue;
      if (typeof v === 'number') out[k] = MULT.has(k) ? (out[k] ?? 1) * v : (k === 'secondWind' ? Math.max(out[k] ?? 0, v) : (out[k] || 0) + v);
      else if (v === true) out[k] = true;
      else out[k] = v;
    }
  }
  return out;
}

/** The once-a-climb augment a fatal hit uses up first (Rebirth, then Second Wind / Last Breath), or null. */
export function lifeline(ids = [], spent = []) {
  const left = ids.filter(id => !spent.includes(id));
  return left.find(id => AUGMENTS_BY_ID[id]?.rebirth) ?? left.find(id => AUGMENTS_BY_ID[id]?.secondWind !== undefined) ?? null;
}

/** The tier a pick at this floor offers: the start and floors 10-30 Silver, 40-60 Gold, 70-90 Prismatic. */
export const augTier = (floor) => (floor >= 70 ? 'prismatic' : floor >= 40 ? 'gold' : 'silver');

/** The floors a climb picks an augment at: before floor 1 (0), then after every guardian but the top. */
export const AUG_FLOORS = Array.from({ length: TOP_FLOOR / FLIGHT }, (_, i) => i * FLIGHT);

/** Can a run with this starter type and deck be offered it? */
export function augAllowed(aug, { type, deck = [], cards = {} } = {}) {
  if (aug.type && aug.type !== type) return false;
  if (aug.needs === 'x') return deck.some(id => cards[id]?.cost === 'X');
  return true;
}

/** The three augments offered at a floor (and after `reroll` rerolls there), from the week's seed: everyone climbing
    that week sees the same ones, whatever they hold, except that an augment already held (or not allowed) is skipped,
    walking on down the same seeded order. A reroll never shows one the floor's earlier offers did. Each slot has
    AUG_TIER_UP's chance of being one tier up, at most one slot an offer, and never before floor 1. */
export function augmentOffer({ seed, floor, reroll = 0, type, held = [], deck = [], cards = {}, extra = 0 }) {
  const shown = [];
  for (let r = 0; r < reroll; r++) shown.push(...offerAt({ seed, floor, reroll: r, type, held: [...held, ...shown], deck, cards, extra }).map(a => a.id));
  return offerAt({ seed, floor, reroll, type, held: [...held, ...shown], deck, cards, extra });
}

/* `extra` (High Roller's 3: every pick shows 4) walks on down the floor's own tier after the three, drawing no rolls, so
   the three are still everyone's three. */
function offerAt({ seed, floor, reroll, type, held, deck, cards, extra = 0 }) {
  const rng = makeRng(hashString(`${seed}|aug:${floor}${reroll ? `:r${reroll}` : ''}`));
  const base = AUG_TIERS.indexOf(augTier(floor));
  // Every slot still draws its roll so the shuffles below (and this week's other offers) stay as they were.
  const rolls = Array.from({ length: AUG_OFFER }, () => rng() < AUG_TIER_UP);
  const up = floor === 0 ? -1 : rolls.indexOf(true);
  const tiers = rolls.map((_, i) => AUG_TIERS[Math.min(AUG_TIERS.length - 1, base + (i === up ? 1 : 0))]);
  const order = (tier) => {
    const pool = AUGMENTS.filter(a => a.tier === tier);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool;
  };
  const decks = Object.fromEntries(AUG_TIERS.map(t => [t, order(t)]));
  const out = [];
  for (const tier of tiers) {
    const next = [...decks[tier], ...decks[AUG_TIERS[base]]].find(a => !out.includes(a) && !held.includes(a.id) && augAllowed(a, { type, deck, cards }));
    if (next) out.push(next);
  }
  for (let i = 0; i < extra; i++) {
    const next = decks[AUG_TIERS[base]].find(a => !out.includes(a) && !held.includes(a.id) && augAllowed(a, { type, deck, cards }));
    if (next) out.push(next);
  }
  return out;
}

/** Darkrai's Deal: the Prismatic it hands over, from the week's seed and the floor it was taken at, so everyone who
    takes it there gets the same one (the first allowed one not held, down that seeded order). */
export function dealPrismatic({ seed, floor, type, held = [], deck = [], cards = {} }) {
  const rng = makeRng(hashString(`${seed}|aug:${floor}:deal`));
  const pool = AUGMENTS.filter(a => a.tier === 'prismatic');
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.find(a => !held.includes(a.id) && augAllowed(a, { type, deck, cards })) ?? null;
}

/** Copycat: the enemy's coming move as a free card that exhausts, at half its power (`hit` is what the attack would deal
    you now). Shared by battle.js and the bot. */
export function copyCard(move, hit = 0) {
  const half = (n) => Math.max(1, Math.ceil(n / 2));
  const effects = move.kind === 'attack' || move.kind === 'drain' ? { damage: half(hit), ...(move.kind === 'drain' ? { heal: half(move.heal || 0) } : {}) }
    : move.kind === 'defend' ? { block: half(move.amount) }
    : move.kind === 'buff' ? { strength: half(move.amount) }
    : move.kind === 'charge' ? { block: 8 }
    : { draw: 1 };
  return { id: 'copycat', name: move.name, type: 'normal', token: true, cost: 0, exhaust: true, art: '🐱', copied: true, effects };
}
