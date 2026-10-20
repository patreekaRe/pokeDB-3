"""Where each starter's head is in its front GIF, across every frame, for HEAD_FIT in js/data/sprite-fit.js: a duo's benched
partner shows only its head, zoomed, on the battle's nameplate (headShot() in js/battle.js; the user's call, 2026-10-20:
"you need to adjust for each pokemon because some move around a lot").

Per frame: the Pokémon's box (opaque pixels), and its head band, a square half the pose's median size from the box's top,
centred on that band's pixels. The entry is [cx, cy, size] in GIF pixels: the middle of where the head goes over the loop,
and the band grown by how far it travels, so a hop or a sway stays inside the circle. Shinies share their normal entry,
aura forms their base's plus the aura's padding (headFit()). Run from the repo root (needs Pillow and Node):
    python3 tools/head-fit.py            rewrites HEAD_FIT for every starter's front sprite
"""
import json
import re
import statistics
import subprocess
from PIL import Image, ImageSequence

ids = json.loads(subprocess.run(['node', '-e', "import('./js/data/starters.js').then(m => console.log(JSON.stringify("
                                 "[...new Set([...m.STARTERS, ...m.DUO_STARTERS].flatMap(s => s.line.map(f => f.id.replace(/-shiny$/, ''))))])))"],
                                capture_output=True, text=True, check=True).stdout)


def head(path):
    frames = []
    for f in ImageSequence.Iterator(Image.open(path)):
        a = f.convert('RGBA').getchannel('A').point(lambda v: 255 if v >= 128 else 0)
        box = a.getbbox()
        if box:
            frames.append((a, box))
    pose = statistics.median(max(r - l, b - t) for _, (l, t, r, b) in frames)
    s = max(8, round(pose * 0.5))
    xs, ys = [], []
    for a, (l, t, r, b) in frames:
        px, w = a.load(), a.size[0]
        cols = [x for y in range(t, min(t + s, a.size[1])) for x in range(l, r) if px[x, y]]
        xs.append(sum(cols) / len(cols) + 0.5 if cols else (l + r) / 2)
        ys.append(t + s / 2)
    travel = max(max(xs) - min(xs), max(ys) - min(ys))
    return [round((min(xs) + max(xs)) / 2, 1), round((min(ys) + max(ys)) / 2, 1), round(min(pose, s + travel), 1)]


lines = []
for i in sorted(ids):
    try:
        lines.append(f"  '{i}-front': {json.dumps(head(f'assets/pokemon/{i}-front.gif'), separators=(', ', ': '))},")
    except FileNotFoundError:
        pass
block = ("/* Each starter's head in its front GIF over the whole loop, [cx, cy, size] in GIF pixels (tools/head-fit.py): a duo's\n"
         "   benched partner's portrait shows just that, zoomed (headShot() in js/battle.js). */\n"
         "export const HEAD_FIT = {\n" + '\n'.join(lines) + "\n};\n")
path = 'js/data/sprite-fit.js'
src = open(path).read()
src = re.sub(r"/\* Each starter's head in its front GIF.*?\n};\n", '', src, flags=re.S)
open(path, 'w').write(src.rstrip('\n') + '\n\n' + block)
print(f'{len(lines)} heads')
