"""Imports a Pokemon Essentials overworld pack (Gen 1-7 OV Sprites: NNN.png, shiny NNNs.png, 4 x 4 frames) as
assets/overworld/<id>.png and <id>-shiny.png for every Pokemon with a battle GIF, a sheet drawn 2x2 a pixel halved back
to one pixel a pixel, and writes js/data/overworld.js, the ids that have one.

python3 -I tools/overworld-import.py <pack folder> <national-dex names json, in dex order>
"""
import json, os, re, sys, unicodedata
from collections import Counter
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

def dark(im):
    return sum(1 for p in im.getdata() if p[3] and sum(p[:3]) < 150)

def rebuild_shiny(normal, shiny):
    """The normal sheet in the shiny's colours. Some of the pack's shinies are rough recolours (Snivy's lost most of its
    black outline, a few came on white), so each normal colour takes the shiny colour it most often sits under, lined up
    at the offset where the two agree best, and the black outline stays black."""
    shiny = clear_backdrop(shiny.copy())
    w, h = normal.size
    a, b = normal.load(), shiny.load()
    best = None
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            hits = sum(1 for y in range(0, h, 2) for x in range(0, w, 2)
                       if a[x, y][3] and 0 <= x + dx < w and 0 <= y + dy < h and b[x + dx, y + dy][3])
            if not best or hits > best[0]:
                best = (hits, dx, dy)
    _, dx, dy = best
    seen = {}
    for y in range(h):
        for x in range(w):
            if a[x, y][3] and 0 <= x + dx < w and 0 <= y + dy < h and b[x + dx, y + dy][3]:
                seen.setdefault(a[x, y], Counter())[b[x + dx, y + dy]] += 1
    swap = {c: n.most_common(1)[0][0] for c, n in seen.items() if sum(c[:3]) >= 60}
    out = normal.copy()
    o = out.load()
    for y in range(h):
        for x in range(w):
            if o[x, y][3] and o[x, y] in swap:
                o[x, y] = swap[o[x, y]]
    return out

def rough(normal, shiny):
    return shiny.size != normal.size or shiny.getpixel((0, 0))[3] > 0 or dark(shiny) < 0.6 * dark(normal)

have = []
for mon in mons:
    no = dex.get(mon)
    src = no and os.path.join(pack, f'{no:03d}.png')
    if not src or not os.path.exists(src):
        continue
    normal = Image.open(src).convert('RGBA')
    for suffix, name in (('', mon), ('s', mon + '-shiny')):
        f = os.path.join(pack, f'{no:03d}{suffix}.png')
        if os.path.exists(f):
            im = Image.open(f).convert('RGBA')
            if suffix and rough(normal, im) and im.size == normal.size:
                im = rebuild_shiny(normal, im)
            elif suffix and rough(normal, im):
                print('rough shiny, sizes differ:', mon, im.size, normal.size)
            if doubled(im):
                im = im.resize((im.width // 2, im.height // 2), Image.NEAREST)
            clear_backdrop(im).save(os.path.join(out, name + '.png'), optimize=True)
    have.append(mon)

with open(os.path.join(root, 'js', 'data', 'overworld.js'), 'w') as fh:
    fh.write('// Pokemon with an overworld walking sheet in assets/overworld/ (tools/overworld-import.py writes this file).\n')
    fh.write('export const OVERWORLD = new Set(%s);\n' % json.dumps(have))
print(len(have), 'of', len(mons))
