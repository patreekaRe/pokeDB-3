"""The Ascendant sprites: a legendary's shiny GIF with a glowing aura in its type's colour, for its final form
when its shiny is switched on (spriteUrl() in js/data/starters.js). Run from the repo root, e.g.
    python3 tools/ascendant-aura.py assets/pokemon/moltres-shiny-front.gif assets/pokemon/moltres-ascendant-front.gif fire
(needs Pillow). Every frame keeps its timing; the outer ring and sparkles shift each frame, so the aura shimmers."""
import sys
from PIL import Image, ImageSequence
# the aura's colours per type: [inner ring, outer ring, sparkle]
AURA = {
  'fire':    ['#fff4a0', '#f8a030', '#ffffff'],
  'water':   ['#c8f8ff', '#40a8f8', '#ffffff'],
  'grass':   ['#e8ffa0', '#58d048', '#ffffff'],
  'psychic': ['#ffd8ff', '#d060e8', '#ffffff'],
}
hexrgb = lambda h: tuple(int(h[i:i+2], 16) for i in (1, 3, 5)) + (255,)
def grow(mask, w, h):
    out = set()
    for (x, y) in mask:
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            p = (x+dx, y+dy)
            if 0 <= p[0] < w and 0 <= p[1] < h and p not in mask: out.add(p)
    return out
def aura(src, dst, kind):
    im = Image.open(src)
    frames, durs = [], []
    for i, fr in enumerate(ImageSequence.Iterator(im)):
        f = fr.convert('RGBA'); w, h = f.size; px = f.load()
        body = {(x, y) for y in range(h) for x in range(w) if px[x, y][3] > 0}
        ring1 = grow(body, w, h)
        ring2 = grow(body | ring1, w, h)
        ring3 = grow(body | ring1 | ring2, w, h)
        inner, outer, spark = map(hexrgb, AURA[kind])
        for (x, y) in ring1: px[x, y] = inner
        for (x, y) in ring2: px[x, y] = outer
        # the outermost ring shimmers: a checker that shifts each frame, with sparkles running round it
        for k, (x, y) in enumerate(sorted(ring3)):
            if (k * 7 + i * 5) % 37 == 0: px[x, y] = spark
            elif (x + y + i) % 2 == 0: px[x, y] = outer
        frames.append(f); durs.append(fr.info.get('duration', 80))
    frames[0].save(dst, save_all=True, append_images=frames[1:], duration=durs, loop=0, disposal=2, optimize=False)
if __name__ == '__main__':
    aura(*sys.argv[1:4])
