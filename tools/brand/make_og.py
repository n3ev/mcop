#!/usr/bin/env python3
"""The link preview card (public/og.png, 1200x630) for Discord, X, iMessage...

    python3 tools/brand/make_og.py

Neev's night render as the backdrop, the logo, the line, and an advancement
toast in the corner. Needs Pillow; run from the repo root.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
PUB = ROOT / 'public'
FONT = str(PUB / 'assets/fonts/Monocraft.ttf')
W, H = 1200, 630


def cover(im, w, h, fy=0.5):
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x = (im.width - w) // 2
    y = round((im.height - h) * fy)
    return im.crop((x, y, x + w, y + h))


def text(draw, xy, s, size, fill, shadow=(0, 0, 0, 200), off=None, anchor='la'):
    f = ImageFont.truetype(FONT, size)
    off = off or max(2, size // 14)
    draw.text((xy[0] + off, xy[1] + off), s, font=f, fill=shadow, anchor=anchor)
    draw.text(xy, s, font=f, fill=fill, anchor=anchor)
    return f


def toast(title, name, icon, scale=3):
    """the game's advancement toast at GUI scale `scale`"""
    bg = Image.open(PUB / 'assets/textures/gui/toast-advancement.png').convert('RGBA')
    t = bg.resize((bg.width * scale, bg.height * scale), Image.NEAREST)
    ic = Image.open(icon).convert('RGBA').resize((16 * scale, 16 * scale), Image.NEAREST)
    t.alpha_composite(ic, (8 * scale, 8 * scale))
    d = ImageDraw.Draw(t)
    text(d, (30 * scale, 7 * scale), title, 8 * scale - 2, (255, 255, 85), shadow=(63, 63, 21), off=scale)
    text(d, (30 * scale, 18 * scale), name, 8 * scale - 2, (255, 255, 255), shadow=(63, 63, 63), off=scale)
    return t


def main():
    bg = cover(Image.open(PUB / 'assets/world/night-poster.webp').convert('RGB'), W, H, fy=0.42).convert('RGBA')
    # darken toward the text and the edges so the words carry
    shade = Image.new('RGBA', (W, H))
    sd = ImageDraw.Draw(shade)
    for y in range(H):
        a = int(150 * max(0, 1 - y / (H * 0.95)) ** 1.2 + 40)
        sd.line([(0, y), (W, y)], fill=(8, 6, 18, a))
    bg = Image.alpha_composite(bg, shade)
    vig = Image.new('L', (W, H), 0)
    ImageDraw.Draw(vig).ellipse((-W * 0.25, -H * 0.4, W * 1.25, H * 1.35), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(90))
    dark = Image.new('RGBA', (W, H), (4, 3, 10, 255))
    bg = Image.composite(bg, dark, vig)

    logo = Image.open(PUB / 'assets/logo/mcop-static.png').convert('RGBA')
    logo = logo.resize((250, 250), Image.LANCZOS)
    glow = Image.new('RGBA', (W, H))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((70, 120, 380, 430), fill=(255, 150, 60, 70))
    bg = Image.alpha_composite(bg, glow.filter(ImageFilter.GaussianBlur(50)))
    bg.alpha_composite(logo, (100, 150))

    d = ImageDraw.Draw(bg)
    text(d, (400, 196), 'Find a Minecraft', 62, (255, 255, 255))
    text(d, (400, 270), 'buddy.', 62, (255, 255, 255))
    text(d, (404, 362), 'Matched by playstyle. Private server.', 24, (255, 216, 118))
    text(d, (404, 398), 'One hour together. Free.', 24, (255, 216, 118))
    text(d, (404, 470), 'mcop.world', 30, (143, 209, 92))

    t = toast('Advancement Made!', 'Player Two', PUB / 'assets/textures/items/totem_of_undying.png', 3)
    bg.alpha_composite(t, (W - t.width - 26, 26))
    out = PUB / 'og.png'
    bg.convert('RGB').save(out, optimize=True)
    print(out, out.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
