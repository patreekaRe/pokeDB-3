"""Where a sprite's body stands in its pose box, for BODY_X in js/data/sprite-fit.js.

A tail flame (Charmeleon), a big arm or a long tail widens the box to one side, so a box-centred Pokemon looks off
centre. The body is the span of columns at least 60% as tall as the tallest (head, torso and legs; a tail or arm is
thinner), its middle taken per frame and the median kept. Prints a BODY_X line for each sprite whose body sits 2 or
more GIF pixels off its pose box's middle (SPRITE_FIT). Run from the repo root:
  python3 tools/body-centre.py charmeleon-front charmeleon-back ...
"""
import json, re, subprocess, sys
from PIL import Image, ImageSequence

FIT = json.loads(subprocess.run(['node', '-e', "import('./js/data/sprite-fit.js').then(m => "
                                 "console.log(JSON.stringify(m.SPRITE_FIT)))"], capture_output=True, text=True).stdout)

def core(frame):
    alpha = frame.convert('RGBA').getchannel('A')
    w, h = alpha.size
    px = alpha.load()
    cols = [sum(1 for y in range(h) if px[x, y]) for x in range(w)]
    tall = [x for x, n in enumerate(cols) if n >= 0.6 * max(cols)]
    return (tall[0] + tall[-1] + 1) / 2

for name in sys.argv[1:]:
    im = Image.open(f'assets/pokemon/{name}.gif')
    w = im.size[0]
    mids = sorted(core(f) for f in ImageSequence.Iterator(im))
    _, _, left, right = FIT.get(name, [0, 0, 0, 0])
    d = round(mids[len(mids) // 2] - (w + left - right) / 2)
    if abs(d) >= 2: print(f"  '{name}': {d},")
