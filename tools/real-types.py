"""Writes js/data/real-types.js: the real 18-type chart and the real types of every Safari Pokemon and of every move
its def names, from PokeAPI's tables. Run it again after adding Safari Pokemon or moves (it needs node and the network):

    python3 tools/real-types.py           today's 18 types (Gen 6 on: Clefairy is Fairy); what the game ships
    python3 tools/real-types.py --gen5    Black and White's 17 (no Fairy, Steel resisting Ghost and Dark, Clefairy Normal)

docs/duo-design.md's open choice 13 picks between them.
"""
import csv, io, json, os, re, subprocess, sys, urllib.request

GEN5 = '--gen5' in sys.argv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/{}.csv'

# our id -> PokeAPI's, where they differ (a form's default)
SPECIES_ID = {'nidoranf': 'nidoran-f', 'nidoranm': 'nidoran-m', 'wormadam': 'wormadam-plant', 'basculin': 'basculin-red-striped',
              'frillish': 'frillish-male', 'jellicent': 'jellicent-male', 'mimejr': 'mime-jr', 'mrmime': 'mr-mime',
              'darmanitan': 'darmanitan-standard'}
# move names that are older spellings, or an Ability's name used as a move
MOVE_ID = {'Faint Attack': 'feint-attack', 'Hi Jump Kick': 'high-jump-kick'}
MOVE_TYPE = {'Forecast': 'normal', 'Stench': 'poison'}

ORDER = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
         'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']


def table(name):
    with urllib.request.urlopen(CSV.format(name)) as r:
        return list(csv.DictReader(io.StringIO(r.read().decode('utf-8'))))


def roster():
    js = ("import { SAFARI_ROSTER } from './js/data/safari.js'; import { ENEMY_DEFS } from './js/data/enemies.js';"
          "console.log(JSON.stringify(SAFARI_ROSTER.map(id => [id, ENEMY_DEFS[id].moves.map(m => m.name)])));")
    out = subprocess.run(['node', '--input-type=module', '-e', js], cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def main():
    types = {r['id']: r['identifier'] for r in table('types')}
    poke = {r['identifier']: r['id'] for r in table('pokemon')}
    slots = {}
    for r in table('pokemon_types'):
        slots.setdefault(r['pokemon_id'], []).append((int(r['slot']), types[r['type_id']]))
    move_ids = {r['identifier']: r['id'] for r in table('moves')}
    moves = {r['identifier']: types[r['type_id']] for r in table('moves')}
    efficacy = {(r['damage_type_id'], r['target_type_id']): int(r['damage_factor']) for r in table('type_efficacy')}
    if GEN5:
        # a "past" row holds what was true up to its generation: the earliest one from Gen 5 on is Gen 5's
        past = {}
        for r in table('pokemon_types_past'):
            if int(r['generation_id']) >= 5:
                past.setdefault(r['pokemon_id'], {}).setdefault(int(r['generation_id']), []).append((int(r['slot']), types[r['type_id']]))
        for pid, by_gen in past.items():
            slots[pid] = by_gen[min(by_gen)]
        for r in sorted(table('type_efficacy_past'), key=lambda r: -int(r['generation_id'])):
            if int(r['generation_id']) >= 5:
                efficacy[(r['damage_type_id'], r['target_type_id'])] = int(r['damage_factor'])
        groups = {r['id']: int(r['generation_id']) for r in table('version_groups')}
        names = {v: k for k, v in move_ids.items()}
        for r in sorted(table('move_changelog'), key=lambda r: -int(r['changed_in_version_group_id'])):
            if r['type_id'] and groups[r['changed_in_version_group_id']] > 5 and r['move_id'] in names and r['type_id'] in types:
                moves[names[r['move_id']]] = types[r['type_id']]
        ORDER.remove('fairy')
        # Moonblast, Fairy Wind... came with Fairy in Gen 6; Gen 5 had no Fairy, and its Fairy moves (Charm) were Normal
        moves = {k: 'normal' if t == 'fairy' else t for k, t in moves.items()}
    chart = {}
    for (ai, di), f in efficacy.items():
        a, d = types[ai], types[di]
        if a in ORDER and d in ORDER and f != 100:
            chart.setdefault(a, {}).setdefault({200: 'super', 50: 'half', 0: 'none'}[f], []).append(d)

    mons = roster()
    by_types, by_move, missing = {}, {}, []
    for id_, names in mons:
        pid = poke.get(SPECIES_ID.get(id_, id_))
        if not pid:
            missing.append(id_)
            continue
        key = ' '.join(t for _, t in sorted(slots[pid]))
        by_types.setdefault(key, []).append(id_)
        for n in names:
            t = MOVE_TYPE.get(n) or moves.get(MOVE_ID.get(n) or re.sub(r'[^a-z0-9-]', '', n.lower().replace(' ', '-')))
            if not t:
                missing.append(n)
                continue
            by_move.setdefault(t, set()).add(n)
    if missing:
        sys.exit(f'not found on PokeAPI: {missing} (add them to SPECIES_ID / MOVE_ID / MOVE_TYPE)')

    def keyed(k):
        return k if re.fullmatch(r'[a-z]+', k) else f"'{k}'"

    lines = ['/* Written by tools/real-types.py from PokeAPI\'s tables: run it again after adding Safari Pokémon or moves. */', '',
             f"/** Which chart and typings: 6 is today's 18 types, 5 Black and White's 17 (no Fairy; the script's --gen5). */",
             f"export const GEN = {5 if GEN5 else 6};", '',
             '/** The real chart, attacker -> what it hits for x2 (`super`), x0.5 (`half`) and x0 (`none`). */',
             'export const CHART = {']
    for a in ORDER:
        parts = [f"{k}: '{' '.join(sorted(chart[a][k], key=ORDER.index))}'" for k in ('super', 'half', 'none') if k in chart.get(a, {})]
        lines.append(f"  {a}: {{ {', '.join(parts)} }},")
    lines += ['};', '', '/** Every Safari Pokémon\'s real types, grouped by them (a dual type\'s first type first). */', 'export const SPECIES = {']
    for k in sorted(by_types, key=lambda k: [ORDER.index(t) for t in k.split()]):
        lines.append(f"  {keyed(k)}: '{' '.join(sorted(by_types[k]))}',")
    lines += ['};', '', '/** The real type of every move a Safari Pokémon uses, grouped by type, `|` between names. */', 'export const MOVES = {']
    for t in ORDER:
        if t in by_move:
            lines.append(f"  {t}: '{'|'.join(sorted(by_move[t]))}',")
    lines += ['};', '']
    with open(os.path.join(ROOT, 'js/data/real-types-table.js'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f'{len(mons)} Pokémon, {sum(len(v) for v in by_move.values())} moves')


main()
