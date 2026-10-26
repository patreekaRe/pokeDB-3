// Lists the cards one run can meet that read alike (the user's call, 2026-10-26: "no cards that repeat").
//   node tools/card-twins.mjs          every family, with each card's text
// A card's text is cut into lines (an "If ...:" / "Surface:" / "Punish:" clause and what follows it is one line), its
// numbers taken out, and its keywords (Exhaust, Retain, Power, Icicle...) each count as a line too. Two cards are:
//   twins       the same lines, whatever their cost (Bubble 5 damage / Weak 2 / Tide 1, Bubble Beam 6 / 2 / 2)
//   near twins  the same cost, and one is the other plus one line, sharing two or more lines of text (Whirlpool: 5
//               damage, Weak 2; Bubble: the same and Tide 1)
// A run meets its type's pool, the Neutral pool, its starting deck and its evolution cards; a Duo Run both types'. Two
// types' plain starting basics (only "Deal N damage." or "Gain N block.") may match: each type has its Strike and Defend.
// tests/cards.test.mjs fails on any family.
import { pathToFileURL } from 'node:url';

globalThis.location ||= { search: '' };
const { CARDS_BY_ID, poolForType, evolutionCardsFor, describe } = await import('../js/data/cards.js');
const { STARTERS_BY_ID } = await import('../js/data/starters.js');

export const STARTER = { fire: 'charmander', grass: 'bulbasaur', water: 'squirtle', psychic: 'mewtwo', electric: 'shinx', ice: 'vanillite', fighting: 'timburr', ground: 'trapinch', flying: 'starly', dark: 'deino' };
export const DUO_TYPES = ['fire', 'grass', 'water', 'electric', 'ice', 'fighting', 'ground', 'flying', 'dark'];
const DUO_ONLY = ['electric', 'ice', 'fighting', 'ground', 'flying', 'dark'];

const KEYWORDS = ['exhaust', 'retain', 'power', 'innate', 'ethereal', 'unplayable', 'icicle', 'illusion'];
const OWN_LINES = ['icicle', 'illusion', 'freeIn', 'growOnPlay', 'growOnRetain'];
// "Add a Cinder to your hand" and "Add 3 Cinders to your hand" read alike, and Punish is the older "If the enemy intends to
// attack" (docs/reference/cards.md's Dark), so those two read alike too
const strip = (s) => s.replace(/If the enemy intends to attack:/g, 'Punish:').replace(/\b(?:\d+|an?) ([A-Z][^.]*?) (to|into) your/g, (m, name, w) => `# ${name.replace(/ cards?$/, '').replace(/s$/, '')} ${w} your`)
  .replace(/\d+/g, '#').replace(/\b(card|time|turn)s\b/g, '$1');

/** A card's lines, numbers out: each sentence, a clause from its "...:" to the end as one, then its keywords. */
export function lines(card) {
  const bare = { ...card };
  for (const k of OWN_LINES) delete bare[k];
  const out = [];
  let clause = null;
  for (const s of strip(describe(bare)).split(/(?<=\.)\s+/).filter(Boolean)) {
    if (clause !== null) clause += ` ${s}`;
    else if (/^[^.]*:/.test(s)) clause = s;
    else out.push(s);
  }
  if (clause) out.push(clause);
  for (const k of KEYWORDS) if (card[k]) out.push(`[${k}]`);
  if (card.freeIn) out.push(`[free in ${card.freeIn}]`);
  if (card.growOnPlay) out.push(`[grows on play: ${Object.keys(card.growOnPlay)}]`);
  if (card.growOnRetain) out.push(`[grows on retain: ${Object.keys(card.growOnRetain)}]`);
  return out;
}

const starterIds = new Set(Object.values(STARTERS_BY_ID).flatMap(s => s.deck || []));
const plainBasic = (c, linesOf = lines) => starterIds.has(c.id) && /^(Deal # damage\.|Gain # block\.)$/.test(linesOf(c).join(' '));

/** Every card a run of this type can meet. */
export function runCards(type) {
  const cards = new Map();
  for (const c of [...poolForType(type, DUO_ONLY.includes(type)), ...STARTERS_BY_ID[STARTER[type]].deck.map(id => CARDS_BY_ID[id]), ...evolutionCardsFor(type, 1), ...evolutionCardsFor(type, 2)]) cards.set(c.id, c);
  return cards;
}

/** How two cards read alike: 'twin', 'near' or null. */
export function likeness(a, b, linesOf = lines) {
  const la = linesOf(a), lb = linesOf(b);
  if (la.slice().sort().join('|') === lb.slice().sort().join('|')) return 'twin';
  const [short, long] = la.length < lb.length ? [la, lb] : [lb, la];
  if (a.cost !== b.cost || long.length - short.length !== 1 || short.filter(l => !l.startsWith('[')).length < 2) return null;
  return short.every(l => long.includes(l)) ? 'near' : null;
}

/** Every pair that reads alike, with the runs that meet both: [{ a, b, kind, runs }]. */
export function twinReport() {
  const runs = Object.keys(STARTER).map(t => [t, runCards(t)]);
  for (const [i, a] of DUO_TYPES.entries()) for (const b of DUO_TYPES.slice(i + 1)) runs.push([`${a}+${b}`, new Map([...runCards(a), ...runCards(b)])]);
  const pairs = new Map(), seen = new Map();
  const linesOf = (c) => seen.get(c) || seen.set(c, lines(c)).get(c);
  for (const [run, cards] of runs) {
    const list = [...cards.values()];
    for (const [i, a] of list.entries()) for (const b of list.slice(i + 1)) {
      if (a.type !== b.type && plainBasic(a, linesOf) && plainBasic(b, linesOf)) continue;
      const kind = likeness(a, b, linesOf);
      if (!kind) continue;
      const key = [a.id, b.id].sort().join('~');
      const p = pairs.get(key) || { a, b, kind, runs: [] };
      p.runs.push(run);
      pairs.set(key, p);
    }
  }
  return [...pairs.values()];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const show = (c) => `${c.name} (${c.type}, ${c.cost}${c.evoOnly ? ', evolution' : starterIds.has(c.id) ? ', starting deck' : `, ${c.rarity || 'common'}`}): ${describe(c)}${KEYWORDS.filter(k => c[k] && k !== 'icicle' && k !== 'illusion').map(k => ` ${k[0].toUpperCase()}${k.slice(1)}.`).join('')}`;
  const report = twinReport();
  for (const kind of ['twin', 'near']) {
    const ps = report.filter(p => p.kind === kind);
    console.log(`\n${kind === 'twin' ? 'Twins' : 'Near twins'}: ${ps.length}`);
    for (const p of ps) console.log(`- ${show(p.a)}\n  ${show(p.b)}\n  (${p.runs.length > 3 ? `${p.runs.slice(0, 3).join(', ')} +${p.runs.length - 3}` : p.runs.join(', ')})`);
  }
}
