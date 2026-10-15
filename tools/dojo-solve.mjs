/* dojo-solve.mjs  -  every line that clears a Kenmatta's dojo trial (js/data/dojo.js), by brute force, to check a new
   trial has its intended answer and no easy way round it (docs/reference/events.md's dojo section). A light copy of
   js/battle.js's rules for the effects trials use; it throws on any other, so add the rule here before using a card
   it doesn't know. The real engine is the judge: play the line found with tools/dojo-play.cjs.

     node tools/dojo-solve.mjs t9 t10     each trial's winning lines, grouped by the cards played each turn
*/
import { CARDS_BY_ID } from '../js/data/cards.js';
import { STARTERS_BY_ID } from '../js/data/starters.js';

const ABIL = { fire: 'blaze', grass: 'overgrow', water: 'torrent' };
const KNOWN = new Set(['damage','hits','block','heal','draw','tide','perTide','perTideHeld','tideMult','blockPerTide','seed','sap','weaken','vulnerable','burn','burnTimes','burnMult','bonusPerBurn','strength','flex','doubleStrength','strengthMult','focus','endure','nextEnergy','ifSeeded','ifEnemyAttacks','ifBurned','ifHurt','bonusIfLow','selfDamage','energy','healPerStrength','healPerSeed','blockNext','blur','seedKeep','guard','needsWounded','riptide','cardBlock','blockEachTurn','blockDamage','blockMult']);

export function solve(trial, { maxLines = 50 } = {}) {
  const ab = ABIL[STARTERS_BY_ID[trial.starter].type];
  for (const id of trial.deck) for (const k of Object.keys(CARDS_BY_ID[id].effects)) if (!KNOWN.has(k)) throw new Error(`${id}: ${k}`);
  const maxHp = trial.maxHp ?? trial.hp;
  const s0 = { hp: trial.hp, maxHp, block: 0, energy: 0, nextEnergy: 0, str: 0, flex: 0, focus: 0, tide: ab === 'torrent' ? 2 : 0,
    endure: false, hurt: false, healed: false, guard: false, blockNext: 0, blur: 0, turn: 0, taken: 0, seedKeep: 0, riptide: 0, cardBlock: 0, blockEachTurn: 0,
    hand: [], draw: [...trial.deck], discard: [], en: { hp: trial.foe.hp, block: 0, burn: 0, seed: 0, sap: 0, weak: 0, vuln: 0, str: 0, mi: 0 }, log: [], turnLog: [] };
  const wins = [], seen = new Set();
  let reshuffles = 0, nodes = 0;
  const g = trial.goal, moves = trial.foe.moves;
  const clone = (s) => ({ ...s, hand: [...s.hand], draw: [...s.draw], discard: [...s.discard], en: { ...s.en }, log: [...s.log], turnLog: [...s.turnLog] });
  const low = (s) => s.hp < s.maxHp / 2;
  const heal = (s, n) => { const h = Math.min(n, s.maxHp - s.hp); s.hp += h; if (h > 0) s.healed = true; };
  const drawN = (s, n) => { for (let i = 0; i < n; i++) { if (s.hand.length >= 10) return true; if (!s.draw.length) { if (!s.discard.length) return true; return false; } s.hand.push(s.draw.shift()); } return true; };
  const move = (s) => moves[s.en.mi % moves.length];
  const finish = (s, by) => {
    if (ab === 'overgrow') heal(s, 3);
    const miss = g.turns && s.turn > g.turns ? 'turns' : g.noDamage && s.taken ? 'hit' : g.burn && by !== 'burn' ? 'burn' : g.full && s.hp < s.maxHp ? 'full' : null;
    if (!miss) wins.push([...s.turnLog, s.log.join(', ')].map((t, i) => `T${i + 1}: ${t}`).join(' | ') + ` [${by}]`);
  };
  const hurtEn = (s, d) => { const a = Math.min(s.en.block, d); s.en.block -= a; s.en.hp -= d - a; };
  const gainBlock = (s, n) => { s.block += n; if (s.riptide) hurtEn(s, s.riptide); };
  function hurtPlayer(s, n) {
    const a = Math.min(s.block, n); s.block -= a; let t = n - a;
    if (s.hp - t <= 0 && s.endure) t = s.hp - 1;
    s.hp = Math.max(0, s.hp - t); s.taken += t; if (t > 0) s.hurt = true;
  }
  function enemyTurn(s) {
    const en = s.en; en.block = 0;
    if (en.burn > 0) { const d = en.burn; en.burn -= 1; en.hp -= d; if (en.hp <= 0) return finish(s, 'burn'); }
    if (en.seed > 0) { const n = Math.min(en.seed, en.hp); if (!s.seedKeep) en.seed -= 1; en.hp -= n; heal(s, n); if (en.hp <= 0) return finish(s, 'seed'); }
    const m = move(s);
    if (m.kind === 'attack') {
      let d = Math.max(0, m.amount + en.str - en.sap); if (en.weak > 0) d = Math.floor(d * 0.75);
      if (s.guard) s.guard = false; else hurtPlayer(s, d);
    } else if (m.kind === 'defend') en.block += m.amount;
    else if (m.kind === 'buff') en.str += m.amount;
    if (en.weak > 0) en.weak -= 1; if (en.vuln > 0) en.vuln -= 1;
    en.mi += 1;
    if (s.hp <= 0) return;
    startTurn(s);
  }
  function startTurn(s) {
    if (g.turns && s.turn >= g.turns) return;   // trialBroken
    if (g.noDamage && s.taken) return;
    s.turn += 1;
    const fresh = s.blockNext + s.blockEachTurn;
    s.block = (s.blur ? s.block : 0) + fresh; if (s.blur) s.blur -= 1; s.blockNext = 0;
    if (fresh && s.riptide) { hurtEn(s, s.riptide); if (s.en.hp <= 0) return finish(s, 'hit'); }
    s.energy = 3 + s.nextEnergy; s.nextEnergy = 0; s.hurt = false; s.healed = false; s.endure = false;
    if (s.turn > 1) { s.turnLog.push(s.log.join(', ') || '-'); s.log = []; }
    if (!drawN(s, 5)) { reshuffles++; return; }
    explore(s);
  }
  function play(s, i) {
    const id = s.hand[i], c = CARDS_BY_ID[id], en = s.en;
    s.hand.splice(i, 1); s.energy -= c.cost; s.log.push(id);
    const e = { ...c.effects };
    const add = (x) => { for (const [k, n] of Object.entries(x)) if (k === 'bonus') e.damage = (e.damage || 0) + n; else e[k] = typeof n === 'number' ? (e[k] || 0) + n : n; };
    if (e.ifBurned && en.burn > 0) add(e.ifBurned);
    if (e.ifHurt && s.hurt) add(e.ifHurt);
    if (e.ifSeeded && en.seed > 0) add(e.ifSeeded);
    if (e.ifEnemyAttacks && move(s).kind === 'attack') add(e.ifEnemyAttacks);
    if (e.selfDamage) { const l = Math.min(e.selfDamage, s.hp - 1); if (l > 0) { s.hp -= l; s.taken += l; s.hurt = true; } }
    if (e.blockDamage && e.block) { gainBlock(s, e.block); e.block = 0; }
    if (e.damage || e.blockDamage) {
      let amt = e.blockDamage ? Math.floor(s.block * (e.blockDamage === true ? 1 : e.blockDamage)) : e.damage;
      if (e.bonusIfLow && low(s)) amt += e.bonusIfLow;
      if (e.bonusPerBurn) amt += e.bonusPerBurn * en.burn;
      if (e.perTide) amt += e.perTide * s.tide;
      if (e.perTideHeld) amt += e.perTideHeld * s.tide;
      amt += s.str * (e.strengthMult || 1);
      if (ab === 'blaze' && low(s)) amt += 3;
      const v = en.vuln > 0 ? 1.5 : 1;
      for (let h = 0; h < (e.hits || 1); h++) {
        const d = Math.floor((amt + (h === 0 ? s.focus : 0)) * v);
        const a = Math.min(en.block, d); en.block -= a; en.hp -= d - a;
        if (en.hp <= 0) break;
      }
      s.focus = 0;
      if (e.perTide) s.tide = 0;
    }
    for (let k = 0; k < (e.burn ? e.burnTimes || 1 : 0); k++) en.burn += e.burn;
    if (e.burnMult && en.burn) en.burn *= e.burnMult;
    if (e.weaken) en.weak += e.weaken;
    if (e.vulnerable) en.vuln += e.vulnerable;
    if (e.seed) en.seed += e.seed;
    if (e.sap) en.sap += e.sap;
    if (e.block) gainBlock(s, e.block);
    if (e.blockMult && s.block) gainBlock(s, s.block * (e.blockMult - 1));
    if (e.blockPerTide) { const t = s.tide; if (t) { s.tide = 0; gainBlock(s, e.blockPerTide * t); } }
    if (e.blockNext) s.blockNext += e.blockNext;
    if (e.blur) s.blur = Math.max(s.blur, e.blur);
    if (e.guard) s.guard = true;
    if (e.focus) s.focus += e.focus;
    if (e.strength) s.str += e.strength;
    if (e.flex) { s.str += e.flex; s.flex += e.flex; }
    if (e.doubleStrength && s.str > 0) s.str *= 2;
    if (e.tide) s.tide += e.tide;
    if (e.tideMult && s.tide) s.tide *= e.tideMult;
    if (e.nextEnergy) s.nextEnergy += e.nextEnergy;
    if (e.endure) s.endure = true;
    if (e.energy) s.energy += e.energy;
    if (e.heal) heal(s, e.heal);
    if (e.healPerStrength && s.str > 0) heal(s, e.healPerStrength * s.str);
    if (e.healPerSeed && en.seed > 0) heal(s, e.healPerSeed * en.seed);
    if (c.power) for (const k of ['seedKeep', 'riptide', 'cardBlock', 'blockEachTurn']) if (e[k]) s[k] += e[k];
    if (s.cardBlock) gainBlock(s, s.cardBlock);
    if (!c.exhaust && !c.power) s.discard.push(id);
    if (e.draw && !drawN(s, e.draw)) { reshuffles++; return false; }
    if (en.hp <= 0) { finish(s, 'hit'); return false; }
    return true;
  }
  function explore(s) {
    if (++nodes > 3e6 || wins.length >= maxLines) return;
    const key = JSON.stringify([s.turn, s.hp, s.block, s.energy, s.nextEnergy, s.str, s.flex, s.focus, s.tide, s.endure, s.hurt, s.healed, s.guard, s.blockNext, s.blur, s.taken, s.seedKeep, s.riptide, s.cardBlock, s.blockEachTurn, [...s.hand].sort(), s.draw, [...s.discard].sort(), s.en]);
    if (seen.has(key)) return; seen.add(key);
    const tried = new Set();
    s.hand.forEach((id, i) => {
      const c = CARDS_BY_ID[id];
      if (tried.has(id) || c.unplayable || c.cost === 'X' || c.cost > s.energy) return; tried.add(id);
      if (c.effects.needsWounded && s.hp >= s.maxHp) return;
      const t = clone(s);
      if (play(t, i)) explore(t);
    });
    // end the turn
    const t = clone(s);
    if (t.flex) { t.str -= t.flex; t.flex = 0; }
    const keep = t.hand.filter(id => CARDS_BY_ID[id].retain);
    t.discard.push(...t.hand.filter(id => !CARDS_BY_ID[id].retain)); t.hand = keep;
    enemyTurn(t);
  }
  startTurn(s0);
  return { wins, reshuffles, nodes };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { TRIALS } = await import('../js/data/dojo.js');
  const only = process.argv.slice(2);
  for (const t of TRIALS) {
    if (only.length && !only.includes(t.id)) continue;
    const r = solve(t, { maxLines: 100000 });
    const sets = new Map();
    for (const w of r.wins) {
      const k = w.replace(/ \[.*\]/, '').split(' | ').map(x => x.replace(/^T\d+: /, '').split(', ').sort().join(' + ')).join('  |  ');
      sets.set(k, (sets.get(k) || 0) + 1);
    }
    console.log(`${t.id} ${t.name}: ${r.wins.length} winning lines, ${sets.size} by the cards played each turn${r.reshuffles ? ` (${r.reshuffles} cut off at a reshuffle)` : ''}`);
    for (const [k, n] of sets) console.log(`  ${String(n).padStart(3)}x  ${k}`);
    if (r.wins[0]) console.log(`  e.g.  ${r.wins[0]}`);
  }
}
