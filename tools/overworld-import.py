"""Imports a Pokemon Essentials overworld pack (Gen 1-7 OV Sprites: NNN.png, shiny NNNs.png, 4 x 4 frames) as
assets/overworld/<id>.png and <id>-shiny.png for every Pokemon with a battle GIF, a sheet drawn 2x2 a pixel halved back
to one pixel a pixel, and writes js/data/overworld.js, the ids that have one.

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
def doubled(im):
    """Whether every pixel is drawn as a 2x2 block (most of Gen 1-4); Gen 5 on is drawn at 1x, and halving it lost
    every other pixel of its outline."""
    w, h = im.size
    px = im.load()
    flat = lambda p: None if p[3] == 0 or p[:3] == (255, 255, 255) else p
    for y in range(0, h - 1, 2):
        for x in range(0, w - 1, 2):
            a = flat(px[x, y])
            if flat(px[x + 1, y]) != a or flat(px[x, y + 1]) != a or flat(px[x + 1, y + 1]) != a:
                return False
    return True

def clear_backdrop(im):
    """A few sheets (some shinies) come on solid white: clear the colour each frame's corner holds, flood-filled from every
    frame's edges so the same colour inside a sprite (eyes, bellies) stays."""
    w, h = im.size
    bg = im.getpixel((0, 0))
    if bg[3] == 0:
        return im
    px, size, seen = im.load(), w // 4, set()
    todo = [(x, y) for fy in range(0, h, size) for fx in range(0, w, size)
            for x in range(fx, fx + size) for y in (fy, fy + size - 1)]
    todo += [(x, y) for fy in range(0, h, size) for fx in range(0, w, size)
             for y in range(fy, fy + size) for x in (fx, fx + size - 1)]
    while todo:
        x, y = todo.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or px[x, y] != bg:
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        todo += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return im

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
            if doubled(im):
                im = im.resize((im.width // 2, im.height // 2), Image.NEAREST)
            clear_backdrop(im).save(os.path.join(out, name + '.png'), optimize=True)
    have.append(mon)

with open(os.path.join(root, 'js', 'data', 'overworld.js'), 'w') as fh:
    fh.write('// Pokemon with an overworld walking sheet in assets/overworld/ (tools/overworld-import.py writes this file).\n')
    fh.write('export const OVERWORLD = new Set(%s);\n' % json.dumps(have))
print(len(have), 'of', len(mons))
