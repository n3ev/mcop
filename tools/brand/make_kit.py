#!/usr/bin/env python3
"""App icons and a social kit, all from Neev's logo.

    python3 tools/brand/make_kit.py

public/favicon.ico            16 + 32 px are the campfire on its own (the 2x2
                              logo turns to mush at tab size), 48 px the logo
public/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
                              the logo on a night tile, for the web manifest
                              and iOS home screens
public/press/                 avatar, banners for X, YouTube and Discord, a
                              phone-story card and a transparent lockup

Needs Pillow; run from the repo root. The logo itself is never redrawn: the
spark-free still is the median of the animation's frames.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from make_og import PUB, cover, text, toast

NIGHT_TOP, NIGHT_BOTTOM = (42, 38, 80), (14, 12, 28)


def still_logo():
    """the logo without the drifting sparks: per-pixel median of every frame"""
    an = Image.open(PUB / 'assets/logo/mcop.webp')
    frames = []
    for i in range(an.n_frames):
        an.seek(i)
        frames.append(np.asarray(an.convert('RGBA')))
    im = Image.fromarray(np.median(np.stack(frames), axis=0).astype(np.uint8))
    return im.crop(im.getbbox())


def campfire(logo):
    """the O tile on its own. it sits bottom-left in the 2x2 logo with its
    flame tip rising between the M's legs, so above the legs' bottom edge only
    the tip's own columns are kept (pixel numbers are for the 300 px art)"""
    a = np.asarray(logo).copy()
    a[:120, :44, 3] = 0
    a[:120, 73:, 3] = 0
    tile = Image.fromarray(a).crop((0, 104, 120, logo.height))   # the P starts at 125
    return tile.crop(tile.getbbox())


def fit(im, box):
    s = min(box[0] / im.width, box[1] / im.height)
    return im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)


def square(im, size, fill=0.9):
    c = Image.new('RGBA', (size, size))
    im = fit(im, (size * fill, size * fill))
    c.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2))
    return c


def night_tile(size, glow_at=(0.36, 0.7)):
    """a dusk gradient, a few stars and the campfire's warm glow"""
    a = np.linspace(0, 1, size)[:, None, None]
    g = (np.array(NIGHT_TOP) * (1 - a) + np.array(NIGHT_BOTTOM) * a) * np.ones((size, size, 3))
    tile = Image.fromarray(g.astype(np.uint8)).convert('RGBA')
    rnd = np.random.default_rng(7)
    d = ImageDraw.Draw(tile)
    for _ in range(size // 9):
        x, y = rnd.integers(0, size, 2)
        if y > size * 0.55:
            continue
        s = max(1, size // 256) * (2 if rnd.random() < 0.15 else 1)
        d.rectangle((x, y, x + s - 1, y + s - 1), fill=(255, 255, 255, int(rnd.integers(70, 200))))
    glow = Image.new('RGBA', (size, size))
    cx, cy, r = size * glow_at[0], size * glow_at[1], size * 0.3
    ImageDraw.Draw(glow).ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 140, 50, 90))
    return Image.alpha_composite(tile, glow.filter(ImageFilter.GaussianBlur(size * 0.12)))


def icon(logo, size, fill):
    t = night_tile(size)
    t.alpha_composite(square(logo, size, fill))
    return t


def backdrop(w, h, fy=0.42, shade=150):
    """Neev's night render, darkened toward the top-left where words go"""
    bg = cover(Image.open(PUB / 'assets/world/night-poster.webp').convert('RGB'), w, h, fy).convert('RGBA')
    over = Image.new('RGBA', (w, h))
    d = ImageDraw.Draw(over)
    for y in range(h):
        d.line([(0, y), (w, y)], fill=(8, 6, 18, int(shade * max(0, 1 - y / (h * 0.95)) ** 1.2 + 40)))
    bg = Image.alpha_composite(bg, over)
    vig = Image.new('L', (w, h), 0)
    ImageDraw.Draw(vig).ellipse((-w * 0.25, -h * 0.4, w * 1.25, h * 1.35), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(min(w, h) * 0.14))
    return Image.composite(bg, Image.new('RGBA', (w, h), (4, 3, 10, 255)), vig)


def put_logo(bg, logo, x, y, h):
    lg = fit(logo, (h * 2, h))
    glow = Image.new('RGBA', bg.size)
    r = h * 0.62
    cx, cy = x + lg.width * 0.5, y + h * 0.55
    ImageDraw.Draw(glow).ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 150, 60, 70))
    bg.alpha_composite(glow.filter(ImageFilter.GaussianBlur(h * 0.2)))
    bg.alpha_composite(lg, (round(x), round(y)))
    return lg.width


def words(bg, x, y, scale, center=False):
    """the line, the pitch and the address, stacked; `scale` 1 = the OG card"""
    d = ImageDraw.Draw(bg)
    a = 'ma' if center else 'la'
    big, mid = round(62 * scale), round(24 * scale)
    text(d, (x, y), 'Find a Minecraft', big, (255, 255, 255), anchor=a)
    text(d, (x, y + big * 1.2), 'buddy.', big, (255, 255, 255), anchor=a)
    y2 = y + big * 2.6
    text(d, (x, y2), 'Matched by playstyle. Private server.', mid, (255, 216, 118), anchor=a)
    text(d, (x, y2 + mid * 1.5), 'One hour together. Free.', mid, (255, 216, 118), anchor=a)
    text(d, (x, y2 + mid * 4.4), 'mcop.world', round(30 * scale), (143, 209, 92), anchor=a)


def save(im, path, opaque=True):
    path.parent.mkdir(parents=True, exist_ok=True)
    (im.convert('RGB') if opaque else im).save(path, optimize=True)
    print(f'{path.relative_to(PUB.parent)}  {im.width}x{im.height}  {path.stat().st_size // 1024} KB')


def main():
    logo = still_logo()
    fire = campfire(logo)
    press = PUB / 'press'

    # tab + home-screen icons
    ico = [square(fire, 16, 1.0), square(fire, 32, 1.0), square(logo, 48, 1.0)]
    ico[2].save(PUB / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
    print('public/favicon.ico  16/32 campfire, 48 logo')
    save(icon(logo, 180, 0.78), PUB / 'apple-touch-icon.png')
    save(icon(logo, 192, 0.8), PUB / 'icon-192.png')
    save(icon(logo, 512, 0.8), PUB / 'icon-512.png')
    save(icon(logo, 512, 0.6), PUB / 'icon-maskable-512.png')   # inside the 80% safe circle

    # social kit
    save(logo, press / 'mcop-logo.png', opaque=False)
    save(icon(logo, 1024, 0.72), press / 'mcop-avatar-1024.png')

    bg = backdrop(1500, 500, fy=0.5)          # X header: the profile photo covers the bottom left
    put_logo(bg, logo, 560, 70, 360)
    words(bg, 900, 120, 0.85)
    save(bg, press / 'mcop-banner-x-1500x500.png')

    bg = backdrop(2560, 1440, fy=0.42)        # YouTube: only the middle 1546x423 shows everywhere
    put_logo(bg, logo, 560, 520, 400)
    words(bg, 940, 548, 1.3)
    save(bg, press / 'mcop-banner-youtube-2560x1440.png')

    bg = backdrop(960, 540, fy=0.42)          # Discord server banner
    put_logo(bg, logo, 70, 120, 300)
    words(bg, 380, 150, 0.82)
    save(bg, press / 'mcop-banner-discord-960x540.png')

    bg = backdrop(1080, 1920, fy=0.5, shade=110)   # a phone story / TikTok card
    lw = fit(logo, (1200, 600)).width
    put_logo(bg, logo, (1080 - lw) / 2, 330, 600)
    words(bg, 540, 1030, 1.4, center=True)
    t = toast('Advancement Made!', 'Player Two', PUB / 'assets/textures/items/totem_of_undying.png', 5)
    bg.alpha_composite(t, ((1080 - t.width) // 2, 1650))
    save(bg, press / 'mcop-story-1080x1920.png')

    lock = Image.new('RGBA', (1400, 420))     # transparent lockup for dark backgrounds
    lg = fit(logo, (400, 360))
    lock.alpha_composite(lg, (30, (420 - lg.height) // 2))
    words(lock, 420, 70, 0.95)
    save(lock, press / 'mcop-lockup-dark.png', opaque=False)


if __name__ == '__main__':
    main()
