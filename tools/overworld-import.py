"""Imports a Pokemon Essentials overworld pack (Gen 1-7 OV Sprites: NNN.png, shiny NNNs.png, 4 x 4 frames, every pixel
drawn 2x2) as assets/overworld/<id>.png and <id>-shiny.png for every Pokemon with a battle GIF, halved back to one pixel
a pixel, and writes js/data/overworld.js, the ids that have one.

python3 -I tools/overworld-import.py <pack folder> <national-dex names json, in dex order>
"""
import json, os, re, sys, unicodedata
from PIL import Image

pack, names_json = sys.argv[1], sys.argv[2]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'assets', 'overworld')
os.makedirs(out, exist_ok=True)

def slug(s):
    s = unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()
    s = s.replace('♀', '-f').replace('♂', '-m')
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9-]+', '-', s)).strip('-')

dex = {}
for i, n in enumerate(json.load(open(names_json, encoding='utf-8')), 1):
    dex[slug(n)] = i
    dex[slug(n).replace('-', '')] = i

mons = sorted(f[:-len('-front.gif')] for f in os.listdir(os.path.join(root, 'assets', 'pokemon'))
              if f.endswith('-front.gif') and '-shiny-' not in f)
have = []
for mon in mons:
    no = dex.get(mon)
    src = no and os.path.join(pack, f'{no:03d}.png')
    if not src or not os.path.exists(src):
        continue
    for suffix, name in (('', mon), ('s', mon + '-shiny')):
        f = os.path.join(pack, f'{no:03d}{suffix}.png')
        if os.path.exists(f):
            im = Image.open(f).convert('RGBA')
            im.resize((im.width // 2, im.height // 2), Image.NEAREST).save(os.path.join(out, name + '.png'), optimize=True)
    have.append(mon)

with open(os.path.join(root, 'js', 'data', 'overworld.js'), 'w') as fh:
    fh.write('// Pokemon with an overworld walking sheet in assets/overworld/ (tools/overworld-import.py writes this file).\n')
    fh.write('export const OVERWORLD = new Set(%s);\n' % json.dumps(have))
print(len(have), 'of', len(mons))
