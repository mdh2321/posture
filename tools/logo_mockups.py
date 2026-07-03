#!/usr/bin/env python3
"""Generate logo mockups for Aligned — 3 directions, rendered at 4x then
downscaled for clean anti-aliased edges. Outputs comparison sheets."""

from PIL import Image, ImageDraw
import os

SS = 4  # supersample factor
OUT = os.path.join(os.path.dirname(__file__), 'logo-mockups')
os.makedirs(OUT, exist_ok=True)

# Brand gradient (indigo -> purple), matching theme.css --primary-gradient
TOP = (102, 126, 234)    # #667eea
BOT = (118, 75, 162)     # #764ba2
WHITE = (255, 255, 255, 255)


def rounded_bg(size):
    """Rounded-square canvas with a vertical indigo->purple gradient."""
    grad = Image.new('RGB', (size, size))
    gd = ImageDraw.Draw(grad)
    for y in range(size):
        t = y / size
        r = int(TOP[0] + (BOT[0] - TOP[0]) * t)
        g = int(TOP[1] + (BOT[1] - TOP[1]) * t)
        b = int(TOP[2] + (BOT[2] - TOP[2]) * t)
        gd.line([(0, y), (size, y)], fill=(r, g, b))

    mask = Image.new('L', (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=255)

    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


def direction_a(size):
    """Standing-tall figure: head + shoulders + upright spine on a baseline."""
    img = rounded_bg(size)
    d = ImageDraw.Draw(img)
    cx = size // 2

    # head
    hr = int(size * 0.11)
    hy = int(size * 0.30)
    d.ellipse([cx - hr, hy - hr, cx + hr, hy + hr], fill=WHITE)

    # spine (vertical rounded bar)
    sw = int(size * 0.075)
    sy0 = int(size * 0.44)
    sy1 = int(size * 0.74)
    d.rounded_rectangle([cx - sw // 2, sy0, cx + sw // 2, sy1], radius=sw // 2, fill=WHITE)

    # shoulders (horizontal rounded bar)
    shw = int(size * 0.36)
    shy = int(size * 0.49)
    sht = int(size * 0.075)
    d.rounded_rectangle([cx - shw // 2, shy - sht // 2, cx + shw // 2, shy + sht // 2],
                        radius=sht // 2, fill=WHITE)

    # baseline (ground) — subtle, reinforces "aligned / grounded"
    bw = int(size * 0.42)
    by = int(size * 0.78)
    bt = int(size * 0.045)
    d.rounded_rectangle([cx - bw // 2, by - bt // 2, cx + bw // 2, by + bt // 2],
                        radius=bt // 2, fill=(255, 255, 255, 200))
    return img


def direction_b(size):
    """Alignment marks: center guide line + centered bar + corner brackets."""
    img = rounded_bg(size)
    d = ImageDraw.Draw(img)
    cx = size // 2

    # thin vertical guide line
    gw = max(2, int(size * 0.012))
    d.rounded_rectangle([cx - gw // 2, int(size * 0.22), cx + gw // 2, int(size * 0.78)],
                        radius=gw // 2, fill=(255, 255, 255, 150))

    # three centered rounded bars (snapping to the guide)
    bars = [(0.34, 0.34), (0.50, 0.50), (0.66, 0.42)]  # (y, width-fraction)
    bt = int(size * 0.075)
    for yf, wf in bars:
        bw = int(size * wf)
        by = int(size * yf)
        d.rounded_rectangle([cx - bw // 2, by - bt // 2, cx + bw // 2, by + bt // 2],
                            radius=bt // 2, fill=WHITE)
    return img


def direction_c(size):
    """Spine: head dot atop a column of rounded vertebra segments."""
    img = rounded_bg(size)
    d = ImageDraw.Draw(img)
    cx = size // 2

    # head dot
    hr = int(size * 0.085)
    hy = int(size * 0.26)
    d.ellipse([cx - hr, hy - hr, cx + hr, hy + hr], fill=WHITE)

    # vertebra segments — uniform rounded bars stacked with gaps
    seg_w = int(size * 0.26)
    seg_h = int(size * 0.075)
    gap = int(size * 0.035)
    top = int(size * 0.40)
    for i in range(4):
        y0 = top + i * (seg_h + gap)
        # gentle taper toward the bottom
        w = int(seg_w * (1 - i * 0.06))
        d.rounded_rectangle([cx - w // 2, y0, cx + w // 2, y0 + seg_h],
                            radius=seg_h // 2, fill=WHITE)
    return img


DIRECTIONS = {'a_figure': direction_a, 'b_alignment': direction_b, 'c_spine': direction_c}


def render(fn, final):
    big = fn(final * SS)
    return big.resize((final, final), Image.LANCZOS)


# Render each direction at the icon sizes used by the extension
for name, fn in DIRECTIONS.items():
    for sz in (16, 32, 48, 128):
        render(fn, sz).save(f'{OUT}/{name}_{sz}.png')
    print(f'rendered {name}')

# Comparison sheet: each direction at 128 with a 32 swatch beside it, on grey
pad = 24
cell_w = 128 + 32 + pad * 3
sheet = Image.new('RGB', (cell_w, (128 + pad) * 3 + pad), (235, 235, 238))
sd = ImageDraw.Draw(sheet)
for i, name in enumerate(DIRECTIONS):
    y = pad + i * (128 + pad)
    big = Image.open(f'{OUT}/{name}_128.png')
    small = Image.open(f'{OUT}/{name}_32.png')
    sheet.paste(big, (pad, y), big)
    sheet.paste(small, (pad * 2 + 128, y + 128 - 32), small)
sheet.save(f'{OUT}/comparison.png')
print(f'\nwrote {OUT}/comparison.png')
