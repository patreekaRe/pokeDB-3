"""The Awakened and Ascendant sprites (a legendary's 2nd and 3rd stage, each a notch more intense). Ascendant: a legendary's final form when its shiny is switched on (spriteUrl() in js/data/starters.js), so
evolving still changes something. The shiny GIF on a bigger canvas, every frame given (the user's ask: "obnoxiously
different"): a 3-ring aura that cycles through its type's colours, flares licking up off the top of its body, sparkles
orbiting it with trails, its type's particles rising (fire embers, water bubbles, grass leaves, psychic stars) and a power
pulse that flashes the body twice a loop. Everything moves on the GIF's own loop, so it repeats seamlessly.

Awakened (level 1, the 2nd stage) is the gentle version: two aura rings shimmering slowly, two orbiting sparkles and a few
drifting particles, no flares or flash, on the normal GIF and on the shiny one (`-awakened` / `-shiny-awakened`).

Run from the repo root (needs Pillow):
    python3 tools/ascendant-aura.py moltres fire
It writes assets/pokemon/moltres-ascendant-*.gif (from the -shiny pair), moltres-awakened-*.gif and
moltres-shiny-awakened-*.gif, front and back, and prints their SPRITE_FIT lines (the source's gaps plus the padding) for
js/data/sprite-fit.js.
"""
import math
import random
import sys
from PIL import Image, ImageSequence

# per type: aura colours to cycle through (light to deep), flare colours (tip to root), particle colours, particle shape
TYPES = {
    'fire':    dict(aura=['#fff8c0', '#ffd840', '#ff9820', '#f05010'], flare=['#fff8c0', '#ffc830', '#ff7010', '#c02808'],
                    bits=['#fff0a0', '#ff9820', '#f04010'], shape='ember'),
    'water':   dict(aura=['#e8ffff', '#90e8ff', '#40a8f8', '#2060d8'], flare=['#e8ffff', '#90e0ff', '#48a0f0', '#2860c8'],
                    bits=['#ffffff', '#a8e8ff', '#58b0f8'], shape='bubble'),
    'grass':   dict(aura=['#f8ffc8', '#c0f860', '#60d040', '#208830'], flare=['#f8ffc8', '#b8f058', '#58c840', '#207830'],
                    bits=['#d8ff80', '#78d848', '#389838'], shape='leaf'),
    'psychic': dict(aura=['#fff0ff', '#ffa8f8', '#e060f0', '#9030c8'], flare=['#fff0ff', '#ffa0f0', '#d058e8', '#8028b8'],
                    bits=['#ffffff', '#ffb0f8', '#e070f0'], shape='star'),
}
SPARK = (255, 255, 255, 255)


def rgba(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def ring(filled, w, h):
    out = set()
    for (x, y) in filled:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            p = (x + dx, y + dy)
            if 0 <= p[0] < w and 0 <= p[1] < h and p not in filled:
                out.add(p)
    return out


def lighten(c, k):
    return tuple(min(255, int(v + (255 - v) * k)) for v in c[:3]) + (c[3],)


def ascend(src, dst, kind, seed, level=2):
    look = TYPES[kind]
    aura = [rgba(c) for c in look['aura']]
    flare = [rgba(c) for c in look['flare']]
    bits = [rgba(c) for c in look['bits']]
    im = Image.open(src)
    raw = [(f.convert('RGBA'), f.info.get('duration', 80)) for f in ImageSequence.Iterator(im)]
    n = len(raw)
    w0, h0 = raw[0][0].size
    pad = max(12, round(max(w0, h0) * 0.14)) if level == 2 else max(7, round(max(w0, h0) * 0.07))
    w, h = w0 + pad * 2, h0 + pad * 2
    rnd = random.Random(seed)
    # particles: each rises from somewhere along the bottom half and comes round once a loop
    motes = [dict(x=rnd.uniform(pad * 0.6, w - pad * 0.6), phase=rnd.random(), sway=rnd.uniform(1, 3),
                  speed=rnd.choice([1, 1, 2]), c=rnd.randrange(len(bits))) for _ in range(max(8, w // 9) if level == 2 else max(3, w // 30))]
    orbiters = (3 if w < 110 else 4) if level == 2 else 2
    frames = []
    for i, (fr, _) in enumerate(raw):
        t = i / n
        f = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        f.alpha_composite(fr, (pad, pad))
        px = f.load()
        body = {(x, y) for y in range(h) for x in range(w) if px[x, y][3] > 0}
        # the power pulse: the body flashes lighter twice a loop
        pulse = max(0.0, math.cos(t * math.pi * 4)) ** 6 * 0.45 if level == 2 else 0
        if pulse > 0.02:
            for (x, y) in body:
                px[x, y] = lighten(px[x, y], pulse)
        # flares: from each column's topmost body pixel, a flickering tongue of the type's colours
        tops = {}
        for (x, y) in body:
            if x not in tops or y < tops[x]:
                tops[x] = y
        for x, y0 in (tops.items() if level == 2 else ()):
            wave = math.sin(x * 0.9 + t * math.pi * 2 * 3) + math.sin(x * 0.37 - t * math.pi * 2 * 2 + seed)
            tall = int(max(0, wave + 0.6) * max(pad * 0.55, 6))
            for k in range(1, tall + 1):
                y = y0 - 2 - k
                if y < 0 or (x, y) in body:
                    continue
                c = flare[min(3, int((1 - k / (tall + 1)) * 4))]
                if k == tall and (x + i) % 2:
                    continue
                px[x, y] = c
        # the aura: three rings, their colours cycling so the glow seems to pour outwards
        filled = set(body)
        for r in range(3 if level == 2 else 2):
            rim = ring(filled, w, h)
            c = aura[(r - (i if level == 2 else i // 3)) % len(aura)] if level == 2 else aura[(r + i // 3) % 2]
            for (x, y) in rim:
                if px[x, y][3] == 0 or r == 0:
                    if r < 2 or (x + y + i) % 2 == 0:
                        px[x, y] = c
            filled |= rim
        # rising particles, in the type's shape
        for m in motes:
            p = (m['phase'] + t * m['speed']) % 1
            y = int(h - 2 - p * (h - 4))
            x = int(m['x'] + math.sin(p * math.pi * 2 * m['sway']) * 3)
            c = bits[m['c']]
            if p > 0.85 and (i % 2):
                continue   # fading out near the top
            shape = look['shape']
            pts = {'ember': [(0, 0), (0, -1)], 'bubble': [(-1, 0), (1, 0), (0, -1), (0, 1)],
                   'leaf': [(0, 0), (1, -1), (-1, 1)] if (i // 3) % 2 else [(0, 0), (-1, -1), (1, 1)],
                   'star': [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)]}[shape]
            for dx, dy in pts:
                xx, yy = x + dx, y + dy
                if 0 <= xx < w and 0 <= yy < h and (xx, yy) not in body:
                    px[xx, yy] = c
            if shape == 'bubble' and 0 <= x < w and 0 <= y < h and (x, y) not in body:
                px[x, y] = (0, 0, 0, 0)
        # sparkles orbiting on an ellipse round the body, each with a short trail
        cx, cy = w / 2, h / 2
        for k in range(orbiters):
            for trail in range(4 if level == 2 else 2):
                a = (t - trail * 0.018 + k / orbiters) * math.pi * 2
                x, y = int(cx + math.cos(a) * (w / 2 - 3)), int(cy + math.sin(a) * (h / 2 - 3) * 0.55)
                if 0 <= x < w and 0 <= y < h and (math.sin(a) < 0 or (x, y) not in body):   # passes behind on the far side
                    px[x, y] = SPARK if trail == 0 else aura[min(3, trail)]
                    if trail == 0:
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            if 0 <= x + dx < w and 0 <= y + dy < h and px[x + dx, y + dy][3] == 0:
                                px[x + dx, y + dy] = aura[0]
        frames.append(f)
    frames[0].save(dst, save_all=True, append_images=frames[1:], duration=[d for _, d in raw], loop=0, disposal=2)
    return pad


if __name__ == '__main__':
    sys.path.insert(0, '.')
    mon, kind = sys.argv[1], sys.argv[2]
    fit = {}
    for line in open('js/data/sprite-fit.js'):
        line = line.strip()
        if line.startswith("'") and ': [' in line:
            name, nums = line.split(': [')
            fit[name.strip("'")] = [int(v) for v in nums.split(']')[0].split(',')]
    for side in ('front', 'back'):
        for src, out, level in ((f'{mon}-shiny', f'{mon}-ascendant', 2), (mon, f'{mon}-awakened', 1), (f'{mon}-shiny', f'{mon}-shiny-awakened', 1)):
            pad = ascend(f'assets/pokemon/{src}-{side}.gif', f'assets/pokemon/{out}-{side}.gif', kind, sum(map(ord, out + side)), level)
            base = fit.get(f'{src}-{side}') or fit.get(f'{mon}-{side}') or [0, 0, 0, 0]
            print(f"  '{out}-{side}': [{', '.join(str(v + pad) for v in base)}],")
