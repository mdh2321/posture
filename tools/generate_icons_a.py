#!/usr/bin/env python3
"""Generate the production icon set from Logo A (standing figure).
Renders at 4x supersampling then downscales to each shipped size."""

from PIL import Image, ImageDraw
import os

SS = 4
DEST = os.path.join(os.path.dirname(__file__), '..', 'extension', 'assets', 'icons')

TOP = (102, 126, 234)   # #667eea
BOT = (118, 75, 162)    # #764ba2
WHITE = (255, 255, 255, 255)


def rounded_bg(size):
    grad = Image.new('RGB', (size, size))
    gd = ImageDraw.Draw(grad)
    for y in range(size):
        t = y / size
        r = int(TOP[0] + (BOT[0] - TOP[0]) * t)
        g = int(TOP[1] + (BOT[1] - TOP[1]) * t)
        b = int(TOP[2] + (BOT[2] - TOP[2]) * t)
        gd.line([(0, y), (size, y)], fill=(r, g, b))
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1],
                                           radius=int(size * 0.22), fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


def logo_a(size, small=False):
    """Standing figure. At tiny sizes drop the baseline so the mark stays clean."""
    img = rounded_bg(size)
    d = ImageDraw.Draw(img)
    cx = size // 2

    hr = int(size * 0.12) if small else int(size * 0.11)
    hy = int(size * 0.30)
    d.ellipse([cx - hr, hy - hr, cx + hr, hy + hr], fill=WHITE)

    sw = int(size * 0.09) if small else int(size * 0.075)
    sy0 = int(size * 0.44)
    sy1 = int(size * (0.76 if small else 0.74))
    d.rounded_rectangle([cx - sw // 2, sy0, cx + sw // 2, sy1],
                        radius=sw // 2, fill=WHITE)

    shw = int(size * 0.40) if small else int(size * 0.36)
    shy = int(size * 0.49)
    sht = int(size * 0.09) if small else int(size * 0.075)
    d.rounded_rectangle([cx - shw // 2, shy - sht // 2, cx + shw // 2, shy + sht // 2],
                        radius=sht // 2, fill=WHITE)

    if not small:
        bw = int(size * 0.42)
        by = int(size * 0.78)
        bt = int(size * 0.045)
        d.rounded_rectangle([cx - bw // 2, by - bt // 2, cx + bw // 2, by + bt // 2],
                            radius=bt // 2, fill=(255, 255, 255, 210))
    return img


os.makedirs(DEST, exist_ok=True)
for sz in (16, 32, 48, 96, 128):
    small = sz <= 32  # simplify the smallest icons (no baseline, thicker strokes)
    big = logo_a(sz * SS, small=small)
    big.resize((sz, sz), Image.LANCZOS).save(os.path.join(DEST, f'icon{sz}.png'))
    print(f'wrote icon{sz}.png')
print('\ndone')
