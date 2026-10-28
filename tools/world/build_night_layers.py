#!/usr/bin/env python3
"""Build the night world's parallax layers from Neev's original fly-through.

    python3 -m venv .venv && .venv/bin/pip install -r tools/world/requirements.txt
    .venv/bin/python tools/world/build_night_layers.py --video path/to/best_night.mp4

The fly-through is a camera rising straight up past a cut-away cross-section of
the world. Measured on the footage itself:
  * the cut face moves as one rigid sheet (every tile shifts by the same amount),
  * the landscape beyond the cut moves at in-between speeds that rise smoothly
    toward the viewer (ordinary ground-plane perspective), the clouds and the
    distant mountains barely at all,
  * the stars don't follow the camera: the day/night cycle was running, so the
    sky dome turns at a steady rate in time (about 0.33 deg/s).
So instead of shipping 142 video frames, the world is rebuilt as a multiplane
parallax: a slow sky, stars that turn with the clip's time, a few landscape
bands and objects each at its own measured speed (re-made every KEY_STEP of
camera travel, since the view of the landscape changes on the way down), and
the whole cross-section stitched into one tall image that moves at full speed
in front. The browser only transforms those layers (GPU compositing): nothing
is decoded or drawn per frame. Every layer is cropped to what can ever be seen
of it, and the cross-section below the surface frame ships as an opaque image,
so the browser skips drawing whatever it covers.

Needs ffmpeg built with libwebp (it decodes the video and encodes the layers).

Stages (each cached in --work, delete a file to redo that stage):
  1. path    camera travel per video frame, least squares over many frame pairs
  2. strip   the cut face stitched from the 4K frames, each row from where it crossed mid-screen
  3. speeds  per-pixel parallax speed over the surface frames -> ground line
  4. stars   the sky's rotation, fitted to tracked stars, and the stars on their own
  5. layers  sky, landscape bands and objects, each denoised at its own speed
  6. export  WebP layers at several widths + night-layers.json for the site
"""
import argparse, json, subprocess, sys
from pathlib import Path

import cv2
import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as sla
from PIL import Image
from scipy.linalg import expm
from scipy.optimize import least_squares

FW, FH = 3840, 2160            # the camera frame every layer is authored against
FIRST, LAST = 14, 853          # the segment the site has always used (deepest .. surface)
BAND = (1620, 2160)            # bottom rows: always the cut face, used to track the camera
SPEED_STEP = 0.05
NEAR_MIN_SPEED = 0.95          # only content moving rigidly with the cut face joins it
NEAR_FLOOR = 0.93              # below this share of the surface frame it is always the cut face
RIGID_MIN_SPEED = 0.75         # ...or this fast and unchanged across the whole stitch (trees on the cut edge)
RIGID_MAX_STD = 3.0            # luminance std (0-255) across the slit stitch that still counts as unchanged
SLIT_SIGMA = 150               # px: the slit the surface rows are re-stitched from
STITCH_SIGMA = 12              # px: ...and the much narrower one every row below the surface comes from
VIS_FALLOFF = 500              # px of camera travel: fallback content prefers frames near the surface
KEY_STEP = 150                 # px of camera travel between band keyframes
KEY_SHARP = 30                 # px of camera travel: each keyframe's look comes from frames this close to it
OBJ_MARGIN = 0.2               # an object moves at least this much faster than the terrain in its row
OBJ_MIN_SPEED = 0.4
OBJ_MIN_AREA = 120             # half-res px: smaller specks stay with their band
OBJ_FOOT = 50                  # half-res rows: an object's foot is at most this far below what's detected of it
LAND_MIN_SPEED = 0.15          # rows slower than this are sky and distant mountains
SKY_SPEED = 0.05               # ...which share one layer at this speed
MAX_FAR_LEVEL = 0.9            # landscape bands: 0.05 steps below 0.3, then 0.1 steps
FEATHER = 40                   # px (master) of soft edge at the top of each band
STAR_ROWS = 1300               # the sky never reaches below this row of the frame
STAR_KERNEL = 15               # px: smaller than this and brighter than around it -> maybe a star
STAR_MARGIN = 128              # px: stars drift into view from beyond the surface frame's top and sides
STAR_MIN = 6                   # top-hat level (0-255) below which the star layer is empty
STAR_PEAK = 12                 # ...and a speck must peak at least this bright to count as a star
STAR_STEADY = 0.3              # mean^2 / mean of squares over the frames it could show in: 1 = always there (clouds pass over stars)
STAR_SIZE = 24                 # px: a star is a small square or diamond, a smear is longer
WIDTHS = (1280, 1920, 2560, 3840)
WEBP_QUALITY = 90              # the landscape atlases and stars
NEAR_QUALITY = 95              # the cut face: its fine stone texture fills most of the page


def log(*a):
    print(*a, flush=True)


def decode(video, vf, w, h, channels):
    """Yield frames FIRST..LAST of the video through an ffmpeg filter as numpy arrays."""
    pix = {1: 'gray', 3: 'rgb24'}[channels]
    cmd = ['ffmpeg', '-v', 'error', '-i', str(video), '-vf',
           f"select='between(n\\,{FIRST}\\,{LAST})',{vf}format={pix}", '-vsync', '0',
           '-f', 'rawvideo', '-']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=1 << 26)
    size = w * h * channels
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, channels) if channels > 1 else np.frombuffer(buf, np.uint8).reshape(h, w)
    p.wait()


def phase_dy(a, b):
    """Sub-pixel vertical shift of content from a to b (positive = moved down)."""
    a = a - a.mean(); b = b - b.mean()
    win = np.hanning(a.shape[0])[:, None] * np.hanning(a.shape[1])[None, :]
    R = np.fft.rfft2(a * win) * np.conj(np.fft.rfft2(b * win))
    R /= np.abs(R) + 1e-9
    r = np.fft.irfft2(R, s=a.shape)
    H = r.shape[0]
    y, x = np.unravel_index(np.argmax(r), r.shape)
    ym, yp, c = r[(y - 1) % H, x], r[(y + 1) % H, x], r[y, x]
    den = ym - 2 * c + yp
    yy = y + (0.5 * (ym - yp) / den if den else 0)
    return -(yy - H if yy > H / 2 else yy)


# ── 1. camera path ────────────────────────────────────────────────────────────
def stage_path(video, work):
    out = work / 'path.npy'
    if out.exists():
        return np.load(out)
    log('1/6 path: decoding the bottom band of every frame')
    y0, y1 = BAND
    bands = np.stack([f[:, ::2].astype(np.float32) for f in
                      decode(video, f'crop={FW}:{y1 - y0}:0:{y0},', FW, y1 - y0, 1)])
    n = len(bands)
    pairs = []
    for base in (1, 4, 12, 30):            # short baselines are precise, long ones stop drift
        for k in range(0, n - base, 1 if base < 12 else 3):
            pairs.append((k, k + base, phase_dy(bands[k], bands[k + base])))
    A = sp.lil_matrix((len(pairs) + 1, n)); y = np.zeros(len(pairs) + 1)
    for r, (i, j, d) in enumerate(pairs):
        A[r, j], A[r, i], y[r] = 1, -1, d
    A[len(pairs), 0] = 1
    P = sla.lsqr(A.tocsr(), y, atol=1e-10, btol=1e-10)[0]
    res = np.array([P[j] - P[i] - d for i, j, d in pairs])
    log(f'   {n} frames, {len(pairs)} pairs, travel {P[-1]:.1f}px, residual rms {np.sqrt((res ** 2).mean()):.3f}px')
    W = P[-1] - P                          # world row of each frame's top edge (surface frame = 0)
    np.save(out, W)
    return W


# ── 2. the cut face, stitched ────────────────────────────────────────────────
def stage_strip(video, work, W):
    names = ('strip.npy', 'surface_sharp.npy', 'surface_std.npy')
    if all((work / n).exists() for n in names):
        return np.load(work / names[0], mmap_mode='r'), np.load(work / names[1]), np.load(work / names[2])
    log('2/6 strip: stitching the cross-section from 4K frames')
    H = int(np.ceil(W.max())) + FH + 2
    acc = np.zeros((H, FW, 3), np.float32)
    wsum = np.zeros((H, 1, 1), np.float32)
    # each row from the few frames where it crossed the middle of the screen: the
    # cut face is rigid, so any frames would do, but through its openings (a lava
    # cave) the view behind shifts as the camera moves, and averaging more frames
    # smears that into streaks
    rows = np.arange(FH + 1)
    win = (np.exp(-0.5 * ((rows[:FH] - FH / 2) / STITCH_SIGMA) ** 2) + 1e-3).astype(np.float32)[:, None]
    # the surface rows again, from a wider slit at the frame centre: content that
    # is almost but not quite rigid (trees on the cut edge) stays crisp, and how
    # much a pixel changes over that short stretch of camera travel tells near
    # (unchanged) from far (sliding past)
    slit = (np.exp(-0.5 * ((rows - FH / 2) / SLIT_SIGMA) ** 2) + 0.01).astype(np.float32)[:, None]
    sacc = np.zeros((FH, FW, 3), np.float32); swsum = np.zeros((FH, 1), np.float32)
    sy = np.zeros((FH, FW), np.float32); sy2 = np.zeros((FH, FW), np.float32)
    for k, f in enumerate(decode(video, '', FW, FH, 3)):
        iw = int(np.floor(W[k])); frac = float(W[k] - iw)
        M = np.float32([[1, 0, 0], [0, 1, frac]])
        img = cv2.warpAffine(f, M, (FW, FH + 1), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        wt = cv2.warpAffine(np.repeat(win, 4, axis=1), M, (4, FH + 1), flags=cv2.INTER_LINEAR)[:, :1]
        acc[iw:iw + FH + 1] += img.astype(np.float32) * wt[:, :, None]
        wsum[iw:iw + FH + 1] += wt[:, :, None]
        if k % 2 and k != len(W) - 1:
            continue
        if iw < FH:
            n = min(FH - iw, FH + 1)
            ws = slit[:n] if frac == 0 else cv2.warpAffine(np.repeat(slit, 4, axis=1), M, (4, FH + 1), flags=cv2.INTER_LINEAR)[:n, :1]
            part = img[:n].astype(np.float32)
            sacc[iw:iw + n] += part * ws[:, :, None]; swsum[iw:iw + n] += ws
            Y = cv2.cvtColor(img[:n], cv2.COLOR_RGB2GRAY).astype(np.float32)
            sy[iw:iw + n] += Y * ws; sy2[iw:iw + n] += Y * Y * ws
        if k % 100 == 0:
            log(f'   frame {k}/{len(W)}')
    strip = (acc / np.maximum(wsum, 1e-6)).clip(0, 255).astype(np.uint8)
    sw = np.maximum(swsum, 1e-6)
    sharp = (sacc / sw[:, :, None]).clip(0, 255).astype(np.uint8)
    std = np.sqrt(np.maximum(sy2 / sw - (sy / sw) ** 2, 0)).astype(np.float32)
    np.save(work / names[0], strip); np.save(work / names[1], sharp); np.save(work / names[2], std)
    return strip, sharp, std


# ── 3. parallax speeds over the surface -> the ground line ───────────────────
def stage_speeds(video, work, W, surface_std):
    out = work / 'speeds.npz'
    if out.exists():
        z = np.load(out)
        return z['speed'], z['matte']
    log('3/6 speeds: per-pixel parallax speed over the surface frames')
    # surface frames only (camera within 300px of the top), every other one, half size
    half = {}
    for k, f in enumerate(decode(video, '', FW, FH, 3)):
        if W[k] <= 300 and k % 2 == 0:
            half[k] = cv2.resize(cv2.cvtColor(f, cv2.COLOR_RGB2GRAY), (FW // 2, FH // 2), interpolation=cv2.INTER_AREA).astype(np.float32)
    ks = sorted(half)
    speeds = np.round(np.arange(0, 1 + 1e-9, SPEED_STEP), 3)
    costs = []
    for s in speeds:
        al = [cv2.warpAffine(half[k], np.float32([[1, 0, 0], [0, 1, s * W[k] / 2]]), (FW // 2, FH // 2),
                             flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) for k in ks]
        costs.append(cv2.blur(np.stack(al).var(axis=0), (9, 9)))
    costs = np.stack(costs)
    speed = speeds[costs.argmin(axis=0)].astype(np.float32)
    speed[(costs.max(axis=0) - costs.min(axis=0)) < 2.0] = -1        # flat: undecided
    # fill undecided pixels (flat sky, flat dark rock) from their decided
    # neighbours, so sky inherits sky speeds and rock inherits rock speeds
    h, w = speed.shape
    und = (speed < 0).astype(np.uint8)
    speed = cv2.inpaint((np.clip(speed, 0, 1) * 255).astype(np.uint8), und, 9, cv2.INPAINT_TELEA).astype(np.float32) / 255
    # the near layer's matte: whatever moves rigidly with the cut face. per
    # pixel, so a tree on the cut edge keeps the sky between its branches.
    std = cv2.resize(surface_std, (w, h), interpolation=cv2.INTER_AREA)
    near = ((speed >= NEAR_MIN_SPEED) | ((speed >= RIGID_MIN_SPEED) & (std < RIGID_MAX_STD))).astype(np.uint8)
    near[int(h * NEAR_FLOOR):] = 1
    near = cv2.morphologyEx(near, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    near = cv2.morphologyEx(near, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    # keep only what is attached to the cut face: a stray fragment of a far object
    # would otherwise split it across two layers and leave a ghost as they part
    n_lab, labels = cv2.connectedComponents(near, connectivity=8)
    attached = np.unique(labels[int(h * NEAR_FLOOR):])
    near = np.isin(labels, attached[attached > 0]).astype(np.uint8)
    matte = cv2.GaussianBlur(cv2.resize(near.astype(np.float32), (FW, FH), interpolation=cv2.INTER_LINEAR), (0, 0), 1.5)
    np.savez(out, speed=speed, matte=matte)
    rows = np.where((matte < 0.5).any(axis=1))[0]
    log(f'   far content down to row {rows.max() if len(rows) else 0} (master px), near share of surface frame {matte.mean():.2f}')
    return speed, matte


def isotonic_increasing(y, w):
    """Weighted least-squares fit of a non-decreasing sequence (pool adjacent violators).
    Rows with little evidence (clouds, empty sky) get little say."""
    blocks = []
    for yi, wi in zip(y, w):
        blocks.append([float(yi), float(wi) + 1e-6, 1])
        while len(blocks) > 1 and blocks[-2][0] > blocks[-1][0]:
            v2, w2, c2 = blocks.pop(); v1, w1, c1 = blocks.pop()
            blocks.append([(v1 * w1 + v2 * w2) / (w1 + w2), w1 + w2, c1 + c2])
    return np.concatenate([np.full(c, v, np.float32) for v, _, c in blocks])


# ── 4. the stars ─────────────────────────────────────────────────────────────
def star_tophat(f):
    """Specks smaller than STAR_KERNEL and brighter than their surroundings."""
    return cv2.morphologyEx(f, cv2.MORPH_TOPHAT, cv2.getStructuringElement(cv2.MORPH_RECT, (STAR_KERNEL, STAR_KERNEL)))


def star_candidates(gray, vis):
    """Centres of the bright specks in a frame's sky rows (one per speck), where the sky shows."""
    th = star_tophat(gray).astype(np.float32)
    n, lab, st, _ = cv2.connectedComponentsWithStats((th > 35).astype(np.uint8), connectivity=8)
    ys, xs = np.nonzero(lab)
    l, w = lab[ys, xs], th[ys, xs]
    sw = np.bincount(l, w, n) + 1e-6
    c = np.c_[np.bincount(l, w * xs, n) / sw, np.bincount(l, w * ys, n) / sw]
    ok = (np.arange(n) > 0) & (st[:, cv2.CC_STAT_AREA] >= 3) & (st[:, cv2.CC_STAT_WIDTH] <= 30) & (st[:, cv2.CC_STAT_HEIGHT] <= 30)
    c = c[ok]
    return c[vis[c[:, 1].astype(int), c[:, 0].astype(int)] > 0.5]


def track_stars(dets):
    """Chain each speck to the one its last two sightings predict, from the surface frame
    down. Returns tracks of (frame, x, y) rows."""
    tracks, active = [], []
    for k in sorted(dets, reverse=True):
        d = dets[k]; used = np.zeros(len(d), bool); alive = []
        for tr in active:
            k1, x1, y1 = tr[-1]
            v = (np.subtract(tr[-1][1:], tr[-2][1:]) / (tr[-2][0] - k1)) if len(tr) > 1 else np.zeros(2)
            dist = np.hypot(*(d - (np.array([x1, y1]) + v * (k1 - k))).T) + np.where(used, np.inf, 0)
            j = int(dist.argmin()) if len(d) else -1
            if j >= 0 and dist[j] < 3:
                used[j] = True; tr.append((k, *d[j])); alive.append(tr)
            elif k1 - k <= 9:
                alive.append(tr)                                        # lost for a sighting or two (cloud)
        for j in np.where(~used)[0]:
            tracks.append([(k, *d[j])]); alive.append(tracks[-1])
        active = alive
    return [np.array(t) for t in tracks if len(t) >= 15]


def apply_h(H, pts):
    v = np.c_[pts, np.ones(len(pts))] @ H.T
    return v[:, :2] / v[:, 2:3]


def fit_sky_turn(tracks, N):
    """The sky's motion as a one-parameter group of homographies, H(n) = expm(n G): star
    coordinates (the surface frame's px) -> px of the frame n frames before the surface.
    A dome turning at a steady rate, seen through a fixed camera, is exactly such a group.
    Fitted jointly with every star's own position; tracks that don't follow the sky (a
    light on a far hill, a track that jumped) are dropped and the fit redone."""
    nrm = np.array([[1e-3, 0, -FW / 2e3], [0, 1e-3, -FH / 2e3], [0, 0, 1]])  # px -> ~unit coords, for conditioning
    inv = np.linalg.inv(nrm)
    def G_of(g):
        return np.array([[g[0], g[1], g[2]], [g[3], g[4], g[5]], [g[6], g[7], 0.0]])
    def H_of(g, n):
        return inv @ expm(n * G_of(g)) @ nrm
    g = np.zeros(8)
    while True:
        ns = np.concatenate([N - t[:, 0] for t in tracks]); obs = np.concatenate([t[:, 1:] for t in tracks])
        tid = np.concatenate([np.full(len(t), i) for i, t in enumerate(tracks)])
        P0 = np.concatenate([apply_h(H_of(g, -(N - t[0, 0])), t[:1, 1:]) for t in tracks])  # first sightings, turned back
        def resid(x):
            P = x[8:].reshape(-1, 2); out = np.empty_like(obs)
            for n in np.unique(ns):
                m = ns == n
                out[m] = apply_h(H_of(x[:8], n), P[tid[m]])
            return (out - obs).ravel()
        sparsity = sp.lil_matrix((2 * len(obs), 8 + 2 * len(tracks)), dtype=int)
        sparsity[:, :8] = 1
        for r, i in enumerate(tid):
            sparsity[2 * r:2 * r + 2, 8 + 2 * i:10 + 2 * i] = 1
        x = least_squares(resid, np.r_[g, P0.ravel()], jac_sparsity=sparsity, loss='soft_l1', f_scale=1.0, x_scale='jac').x
        g = x[:8]
        e = resid(x).reshape(-1, 2)
        rms = np.array([np.sqrt((e[tid == i] ** 2).sum(1).mean()) for i in range(len(tracks))])
        if (rms <= 2).all():
            break
        tracks = [t for t, r in zip(tracks, rms) if r <= 2]
    e = np.hypot(*e.T)
    log(f'   sky turn fitted to {len(tracks)} star tracks ({len(e)} sightings), residual median {np.median(e):.2f}px, 99% {np.percentile(e, 99):.2f}px')
    return inv @ G_of(g) @ nrm


STAR_SHIFT = np.array([[1, 0, -STAR_MARGIN], [0, 1, -STAR_MARGIN], [0, 0, 1]], np.float64)   # star image px -> star coords


def star_to_frame(G, n):
    """Star image px -> px of the frame n frames before the surface frame."""
    return expm(n * G) @ STAR_SHIFT


def stage_stars(video, work, W, matte):
    out = work / 'stars.npz'
    if out.exists():
        z = np.load(out)
        return z['G'], z['rgba']
    log('4/6 stars: the sky turns with time, so the stars get a layer of their own')
    N = len(W) - 1
    near = np.clip(matte, 0, 1).astype(np.float32)
    def open_sky(k):                                                    # not behind the cut face
        return 1 - cv2.warpAffine(near, np.float32([[1, 0, 0], [0, 1, -W[k]]]), (FW, STAR_ROWS), flags=cv2.INTER_LINEAR,
                                  borderMode=cv2.BORDER_CONSTANT, borderValue=1)
    dets = {k: star_candidates(f, open_sky(k)) for k, f in enumerate(decode(video, f'crop={FW}:{STAR_ROWS}:0:0,', FW, STAR_ROWS, 1))
            if k % 3 == 0 or k == N}
    G = fit_sky_turn(track_stars(dets), N)
    # every frame's specks, turned back into star coordinates and averaged where the sky
    # shows: stars line up and stay, anything that moves differently (a torch on a far
    # hill) smears out. a star is there in nearly every frame it could be seen in; a
    # smear passes through, so how steady a speck is tells them apart
    SW, SH = FW + 2 * STAR_MARGIN, STAR_ROWS + STAR_MARGIN
    acc = np.zeros((SH, SW, 3), np.float32); ws = np.zeros((SH, SW), np.float32)
    b1 = np.zeros((SH, SW), np.float32); b2 = np.zeros((SH, SW), np.float32)
    bg = None
    for k, f in enumerate(decode(video, f'crop={FW}:{STAR_ROWS}:0:0,', FW, STAR_ROWS, 3)):
        if k % 2 and k != N:
            continue
        vis = open_sky(k)
        if vis.max() < 1e-3:
            continue
        M = star_to_frame(G, N - k)
        th = cv2.warpPerspective(star_tophat(f), M, (SW, SH), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP).astype(np.float32)
        v = cv2.warpPerspective(vis, M, (SW, SH), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP)
        acc += th * v[:, :, None]; ws += v
        b = cv2.GaussianBlur(th.max(axis=2), (0, 0), 1.5)               # blurred: steady under the fit's ~1px jitter
        b1 += b * v; b2 += b * b * v
        if k == N:
            sky = cv2.morphologyEx(f, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (STAR_KERNEL, STAR_KERNEL)))
            bg = cv2.warpPerspective(cv2.GaussianBlur(sky, (0, 0), 8).astype(np.float32), STAR_SHIFT, (SW, SH),
                                     flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    th = acc / np.maximum(ws, 1e-6)[:, :, None]
    th[ws < 3] = 0                                                      # seen in too few frames to trust
    lum = th.max(axis=2)
    steady = (b1 / np.maximum(ws, 1e-6)) ** 2 / np.maximum(b2 / np.maximum(ws, 1e-6), 1e-6)
    # a star: a steady local peak whose bright core (30% of its peak and up) is star-sized;
    # a smear's core is long, and two stars side by side still have a core each
    keep = np.zeros(lum.shape, np.uint8)
    R = STAR_SIZE
    for y, x in np.argwhere((lum == cv2.dilate(lum, np.ones((5, 5), np.uint8))) & (lum >= STAR_PEAK) & (steady >= STAR_STEADY)):
        y0, x0 = max(0, y - R), max(0, x - R)
        _, lab, st, _ = cv2.connectedComponentsWithStats((lum[y0:y + R + 1, x0:x + R + 1] >= 0.3 * lum[y, x]).astype(np.uint8), connectivity=8)
        i = lab[y - y0, x - x0]
        if st[i, cv2.CC_STAT_WIDTH] <= STAR_SIZE and st[i, cv2.CC_STAT_HEIGHT] <= STAR_SIZE:
            keep[y0:y + R + 1, x0:x + R + 1] |= (lab == i).astype(np.uint8)
    keep = cv2.dilate(keep, np.ones((5, 5), np.uint8)).astype(bool) & (lum >= STAR_MIN)
    # as an overlay on the sky: star colour at partial opacity reproduces sky + speck
    alpha = np.clip(lum / np.maximum(255 - bg.max(axis=2), 1), 0, 1) * keep
    rgb = np.where(alpha[:, :, None] > 0, bg + th / np.maximum(alpha, 1 / 255)[:, :, None], 255)
    rgba = np.dstack([rgb.clip(0, 255), alpha * 255]).astype(np.uint8)
    log(f'   {cv2.connectedComponents(keep.astype(np.uint8))[0] - 1} stars, layer {SW}x{SH}')
    np.savez(out, G=G, rgba=rgba)
    return G, rgba


def destar(f, G, n, mask):
    """The frame with its stars painted over by the sky around them."""
    m = cv2.warpPerspective(mask, star_to_frame(G, n), (FW, STAR_ROWS), flags=cv2.INTER_LINEAR)[:, :, None]
    if m.max() < 1e-3:
        return f
    top = f[:STAR_ROWS].astype(np.float32)
    sky = cv2.morphologyEx(f[:STAR_ROWS], cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (STAR_KERNEL, STAR_KERNEL)))
    out = f.copy()
    out[:STAR_ROWS] = (top * (1 - m) + sky * m).astype(np.uint8)
    return out


# ── 5. sky, terrain bands, objects ───────────────────────────────────────────
def level_of(s):
    q = round(s / 0.05) * 0.05 if s < 0.3 else round(s / 0.1) * 0.1
    return round(min(q, MAX_FAR_LEVEL), 3)


def layer_plan(speed, matte):
    """Split everything that isn't the cut face into layers, each with one speed:
    the sky with the distant mountains (barely moving; speed can't tell drifting
    clouds from far peaks at this resolution, so they share one slow layer),
    terrain bands below it (one speed per run of rows), and objects that are
    clearly nearer than the terrain behind them (trees on a far hill), grouped
    by their own speed."""
    h, w = speed.shape
    far = cv2.resize(matte, (w, h), interpolation=cv2.INTER_AREA) < 0.5
    med = np.zeros(h, np.float32); wt = np.zeros(h, np.float32)
    for yy in range(h):
        v = speed[yy][far[yy]]
        if len(v):
            med[yy], wt[yy] = np.median(v), len(v) / w
    prof = isotonic_increasing(med, wt)                                # nearer rows never move slower
    land_rows = np.where(prof >= LAND_MIN_SPEED)[0]
    R = int(land_rows[0]) if len(land_rows) else h                     # first row where the land clearly moves
    far_rows = np.where(far.any(axis=1))[0]
    lowest = min(FH, int(far_rows.max()) * 2 + 2 + FEATHER)            # past this the cut face covers the screen
    def soft(m):
        up = cv2.resize(m.astype(np.float32), (FW, FH), interpolation=cv2.INTER_LINEAR)
        return np.clip(cv2.GaussianBlur(up, (0, 0), 2), 0, 1)
    layers = [{'kind': 'sky', 'speed': SKY_SPEED, 'top': 0, 'alpha': np.ones((min(lowest, R * 2 + FEATHER), FW), np.float32)}]
    level = np.array([level_of(v) for v in prof])
    runs = []
    for yy in range(R, h):
        if not far[yy].any():
            continue
        if runs and level[yy] == runs[-1][0] and yy == runs[-1][2]:
            runs[-1][2] = yy + 1
        else:
            runs.append([float(level[yy]), yy, yy + 1])
    for i, (L, r0, r1) in enumerate(runs):
        r0, r1 = r0 * 2, r1 * 2
        top = max(0, r0 - FEATHER)
        bottom = lowest if i == len(runs) - 1 else min(lowest, r1)
        if bottom <= top:
            continue
        ramp = np.ones(bottom - top, np.float32)
        ramp[:r0 - top] = np.linspace(0, 1, r0 - top, dtype=np.float32)
        layers.append({'kind': 'band', 'speed': L, 'top': top, 'alpha': ramp[:, None].repeat(FW, axis=1)})
    obj = (far & (np.arange(h)[:, None] >= R) & (speed >= prof[:, None] + OBJ_MARGIN) & (speed >= OBJ_MIN_SPEED)).astype(np.uint8)
    obj = cv2.morphologyEx(obj, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(obj, connectivity=8)
    # each object moves as one, and no faster than the ground just below it: a tree
    # stands on the land. per-pixel speeds of small dark trees are noisy, and one
    # measured too fast drifts up into the sky as the camera goes down.
    clevel = np.zeros(n, np.float32)
    for i in range(1, n):
        y, hh, area = stats[i, cv2.CC_STAT_TOP], stats[i, cv2.CC_STAT_HEIGHT], stats[i, cv2.CC_STAT_AREA]
        if area < OBJ_MIN_AREA:
            continue
        s = min(float(np.median(speed[lab == i])), float(prof[min(h - 1, y + hh - 1 + OBJ_FOOT)]) + 0.05)
        if s >= prof[y] + OBJ_MARGIN / 2:                              # still clearly faster than the rows it reaches up into
            clevel[i] = level_of(s)
    olev = clevel[lab]
    for L in sorted(set(olev[olev > 0].tolist())):
        m = olev == L
        m = cv2.dilate(m.astype(np.uint8), np.ones((3, 3), np.uint8))
        rws = np.where(m.any(axis=1))[0]
        top, bottom = max(0, int(rws.min()) * 2 - 8), min(FH, int(rws.max()) * 2 + 10)
        layers.append({'kind': 'object', 'speed': float(L), 'top': top, 'alpha': soft(m)[top:bottom]})
    rank = {'sky': 0, 'band': 1, 'object': 2}
    layers.sort(key=lambda l: (l['speed'], rank[l['kind']]))
    return layers, lowest


def stage_bands(video, work, W, speed, matte, G, stars):
    out = work / 'layers.npz'
    if out.exists():
        z = np.load(out, allow_pickle=True)
        return list(z['keyframes'])
    log('5/6 layers: sky, terrain bands and objects at their own speeds')
    layers, lowest = layer_plan(speed, matte)
    # the stars have their own layer: the sky and bands are built from frames without them
    # (they'd smear into streaks, since they don't move at any parallax speed)
    star_mask = cv2.GaussianBlur(cv2.dilate((stars[:, :, 3] > 0).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32), (0, 0), 1)
    N = len(W) - 1
    for l in layers:
        log(f"   {l['kind']:6s} speed {l['speed']:.2f}  rows {l['top']}-{l['top'] + l['alpha'].shape[0]}")
    # every layer is rebuilt from the frames where it is actually visible. working
    # nearest to farthest, each layer only takes pixels nothing nearer covers in
    # that frame, so nothing nearer gets baked in (and later slides off as a ghost).
    # the camera's view of the landscape changes on the way down (from looking down
    # on it to looking across it), so each layer is built at a series of camera
    # heights (keyframes) that the site crossfades between.
    # visibility is soft anyway: track coverage at half resolution
    HW, HH = FW // 2, FH // 2
    near_ext = np.ones((HH + int(np.ceil(W.max() / 2)) + 4, HW), np.float32)
    near_ext[:HH] = cv2.resize(np.clip(matte, 0, 1), (HW, HH), interpolation=cv2.INTER_AREA)
    alphas_h = [cv2.resize(l['alpha'], (HW, max(1, l['alpha'].shape[0] // 2)), interpolation=cv2.INTER_AREA) for l in layers]
    keys = np.arange(0, lowest + KEY_STEP, KEY_STEP, dtype=np.float32)
    shapes = [l['alpha'].shape for l in layers]
    # each keyframe's look comes from the frames within KEY_SHARP of its own height: a band
    # holds a little depth, so averaging over a longer stretch of travel blurs it. the
    # frames within KEY_STEP fill in what those few don't see; every frame, what none do.
    saccs = [[np.zeros(sh + (3,), np.float32) for sh in shapes] for _ in keys]
    swss = [[np.zeros(sh, np.float32) for sh in shapes] for _ in keys]
    accs = [[np.zeros(sh + (3,), np.float32) for sh in shapes] for _ in keys]
    wss = [[np.zeros(sh, np.float32) for sh in shapes] for _ in keys]
    gacc = [np.zeros(sh + (3,), np.float32) for sh in shapes]
    gws = [np.zeros(sh, np.float32) for sh in shapes]
    first = None
    for k, f in enumerate(decode(video, '', FW, FH, 3)):
        t = float(W[k])
        if k == N:
            first = destar(f, G, 0, star_mask)                          # the surface frame: last resort for never-seen pixels
        sharp_j = [(j, 1 - abs(t - kw) / KEY_SHARP) for j, kw in enumerate(keys) if abs(t - kw) < KEY_SHARP]
        wide = k % 2 == 0 or k == N                                     # every other frame is plenty for the rest
        if (not wide and not sharp_j) or t > lowest + KEY_STEP:
            continue
        near_j = [(j, 1 - abs(t - kw) / KEY_STEP) for j, kw in enumerate(keys) if abs(t - kw) < KEY_STEP] if wide else []
        g = np.exp(-t / VIS_FALLOFF)
        th = t / 2
        cov = cv2.warpAffine(near_ext, np.float32([[1, 0, 0], [0, 1, -th]]), (HW, HH), flags=cv2.INTER_LINEAR,
                             borderMode=cv2.BORDER_CONSTANT, borderValue=1)
        clean = None
        for i in reversed(range(len(layers))):
            l = layers[i]; n = l['alpha'].shape[0]; nh = alphas_h[i].shape[0]; sp_ = l['speed']; top = l['top']
            Mvh = np.float32([[1, 0, 0], [0, 1, (sp_ * t - top) / 2]])  # layer row r <- screen row top + r - speed*t
            vis_h = 1 - cv2.warpAffine(cov, Mvh, (HW, nh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=1)
            if vis_h.max() > 1e-3:
                vis = cv2.resize(vis_h, (FW, n), interpolation=cv2.INTER_LINEAR)
                Mv = np.float32([[1, 0, 0], [0, 1, sp_ * t - top]])
                if l['kind'] != 'object' and clean is None:
                    clean = destar(f, G, N - k, star_mask)
                src = cv2.warpAffine(f if l['kind'] == 'object' else clean, Mv, (FW, n), flags=cv2.INTER_LINEAR,
                                     borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
                if wide:
                    gacc[i] += src * (vis * g)[:, :, None]; gws[i] += vis * g
                for j, wj in near_j:
                    accs[j][i] += src * (vis * wj)[:, :, None]; wss[j][i] += vis * wj
                for j, wj in sharp_j:
                    saccs[j][i] += src * (vis * wj)[:, :, None]; swss[j][i] += vis * wj
            Mah = np.float32([[1, 0, 0], [0, 1, (top - sp_ * t) / 2]])  # screen row y <- layer row y - top + speed*t
            a_scr = cv2.warpAffine(alphas_h[i], Mah, (HW, HH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
            cov = cov + (1 - cov) * a_scr
    keyframes = []
    for j, kw in enumerate(keys):
        kls = []
        for i, l in enumerate(layers):
            wj = wss[j][i]
            # a keyframe only ever shows within its stretch of camera travel: whatever
            # nearer layers hide all through it is never seen, so it's left out and the
            # layer cropped to the rest (less to download, decode and composite)
            seen_here = cv2.dilate((wj > 1e-3).astype(np.uint8), np.ones((17, 17), np.uint8))
            alpha = (np.clip(l['alpha'], 0, 1) * seen_here * 255).astype(np.uint8)
            ys, xs = np.nonzero(alpha)
            if not len(ys):
                continue                                                # not visible around this camera height
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            seen = gws[i][y0:y1, x0:x1, None]
            surface = first[l['top'] + y0:l['top'] + y1, x0:x1].astype(np.float32)
            fallback = np.where(seen > 1e-3, gacc[i][y0:y1, x0:x1] / np.maximum(seen, 1e-6), surface)
            e_wide, e_all = 0.01, 0.0005                                # how little the wider sources weigh where the near frames see
            box = (slice(y0, y1), slice(x0, x1))
            rgb = ((saccs[j][i][box] + accs[j][i][box] * e_wide + fallback * e_all)
                   / (swss[j][i][box][:, :, None] + wj[box][:, :, None] * e_wide + e_all)).clip(0, 255).astype(np.uint8)
            kls.append({'kind': l['kind'], 'speed': l['speed'], 'top': int(l['top'] + y0), 'left': int(x0),
                        'rgba': np.dstack([rgb, alpha[y0:y1, x0:x1]])})
        keyframes.append({'w': float(kw), 'layers': kls})
    log(f'   {len(layers)} layers at {len(keys)} camera heights (every {KEY_STEP}px), {sum(len(k["layers"]) for k in keyframes)} layer images')
    np.savez(out, keyframes=np.array(keyframes, dtype=object))
    return keyframes


# ── 6. export ────────────────────────────────────────────────────────────────
NEAR_OVERLAP = 8               # px (master): the surface part reaches this far over the solid body (no seam)


def near_layers(strip, sharp, matte):
    """The stitched cross-section, in two parts. The surface rows come from the slit stitch
    (crisper for trees on the edge), blended into the full stitch, and the matte keeps only
    near content; that part is cropped to where it starts. Below the surface frame it's
    solid rock: an opaque image, so the browser skips drawing whatever it covers."""
    rgb = np.array(strip)
    blend = np.clip((np.arange(FH) - (FH - 256)) / 256, 0, 1).astype(np.float32)[:, None, None]
    rgb[:FH] = (sharp.astype(np.float32) * (1 - blend) + rgb[:FH].astype(np.float32) * blend).astype(np.uint8)
    alpha = (np.clip(matte, 0, 1) * 255).astype(np.uint8)
    rows = np.nonzero(alpha.max(axis=1))[0]
    r0 = int(rows.min()) if len(rows) else FH
    top = np.dstack([rgb[r0:FH + NEAR_OVERLAP], np.vstack([alpha[r0:], np.full((NEAR_OVERLAP, FW), 255, np.uint8)])])
    return top, r0, rgb[FH:]


STAR_PAD = 4                   # px (master) of empty margin around each star sprite


def star_sprites(stars):
    """Every star cut out with a clear margin and packed into a small sheet: the browser
    moves them one by one instead of compositing a whole sky-sized sheet that's empty
    almost everywhere. Returns the sheet and [x, y, w, h, sheet x, sheet y] per star, x/y
    in frame px at the surface."""
    a = np.pad(stars, ((STAR_PAD, STAR_PAD), (STAR_PAD, STAR_PAD), (0, 0)))
    n, _, st, _ = cv2.connectedComponentsWithStats((a[:, :, 3] > 0).astype(np.uint8), connectivity=8)
    boxes = [(x - STAR_PAD, y - STAR_PAD, w + 2 * STAR_PAD, h + 2 * STAR_PAD) for x, y, w, h in st[1:, :4]]
    SW = 512
    placed, x, y, row_h = [], 0, 0, 0
    for bx, by, bw, bh in sorted(boxes, key=lambda b: -b[3]):
        if x + bw > SW:
            x, y, row_h = 0, y + row_h, 0
        placed.append((bx, by, bw, bh, x, y))
        x += bw; row_h = max(row_h, bh)
    sheet = np.zeros((y + row_h, SW, 4), np.uint8)
    for bx, by, bw, bh, sx, sy in placed:
        sheet[sy:sy + bh, sx:sx + bw] = a[by:by + bh, bx:bx + bw]
    off = STAR_MARGIN + STAR_PAD                                        # padded star image px -> frame px
    return sheet, [[int(bx - off), int(by - off), int(bw), int(bh), int(sx), int(sy)] for bx, by, bw, bh, sx, sy in placed]


def save_layer(img, name, outdir, quality=WEBP_QUALITY):
    """Every width variant as WebP, encoded with libwebp's 'drawing' preset (through
    ffmpeg): the default photo tuning's noise shaping and deblocking smooth away the
    dark, low-contrast texture a night scene is made of."""
    sizes = {}
    for w in WIDTHS:
        scale = w / FW                                                  # the variant for a w-wide frame
        size = (round(img.shape[1] * scale), round(img.shape[0] * scale))
        im = Image.fromarray(img).resize(size, Image.LANCZOS) if w != FW else Image.fromarray(img)
        alpha = img.shape[2] == 4 and img[:, :, 3].min() < 255
        raw = np.asarray(im.convert('RGBA' if alpha else 'RGB'))
        path = outdir / f'{name}-{w}.webp'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba' if alpha else 'rgb24',
                        '-s', f'{raw.shape[1]}x{raw.shape[0]}', '-i', '-', '-c:v', 'libwebp', '-preset', 'drawing',
                        '-quality', str(quality), '-compression_level', '6', '-pix_fmt', 'yuva420p' if alpha else 'yuv420p',
                        str(path)], input=raw.tobytes(), check=True)
        sizes[w] = path.stat().st_size
    return sizes


ATLAS_GAP = 16                 # px (master) of replicated edge around each layer in an atlas
OBJ_SPLIT_GAP = 160            # px (master): objects further apart than this get layers of their own


def split_sparse(layers):
    """Objects are trees scattered across the landscape: one tight layer per cluster
    instead of one wide layer that's empty almost everywhere (less to decode, keep and
    composite)."""
    out = []
    for l in layers:
        if l['kind'] != 'object':
            out.append(l)
            continue
        a = l['rgba'][:, :, 3] > 0
        cols = np.nonzero(a.any(axis=0))[0]
        for run in np.split(cols, np.nonzero(np.diff(cols) > OBJ_SPLIT_GAP)[0] + 1):
            x0, x1 = int(run[0]), int(run[-1]) + 1
            rows = np.nonzero(a[:, x0:x1].any(axis=1))[0]
            y0, y1 = int(rows[0]), int(rows[-1]) + 1
            out.append({**l, 'left': l['left'] + x0, 'top': l['top'] + y0, 'rgba': l['rgba'][y0:y1, x0:x1]})
    return out


def atlas(layers):
    """Pack a keyframe's layers into one image (one request, one decode): rows of layers
    side by side, tallest first, each ringed by its own replicated edge so resizing never
    bleeds a neighbour in. Returns the image and each layer's (x, y) in it."""
    g = ATLAS_GAP
    pos = [None] * len(layers)
    x = y = row_h = 0
    for i in sorted(range(len(layers)), key=lambda i: -layers[i]['rgba'].shape[0]):
        h, w = layers[i]['rgba'].shape[:2]
        if x and x + w + 2 * g > FW + 2 * g:
            x, y, row_h = 0, y + row_h, 0
        pos[i] = (x + g, y + g)
        x += w + 2 * g; row_h = max(row_h, h + 2 * g)
    img = np.zeros((y + row_h, FW + 2 * g, 4), np.uint8)
    for l, (px, py) in zip(layers, pos):
        r = l['rgba']
        img[py - g:py + r.shape[0] + g, px - g:px + r.shape[1] + g] = cv2.copyMakeBorder(r, g, g, g, g, cv2.BORDER_REPLICATE)
    return img, pos


def stage_export(work, outdir, manifest_path, W, strip, sharp, matte, keyframes, G, stars):
    log('6/6 export')
    outdir.mkdir(parents=True, exist_ok=True)
    for old in outdir.glob('*.webp'):
        old.unlink()
    total = {w: 0 for w in WIDTHS}
    kfs = []
    for j, kf in enumerate(keyframes):
        layers = split_sparse(kf['layers'])
        img, pos = atlas(layers)
        name = f'kf{j:02d}'
        sizes = save_layer(img, name, outdir)
        for w in WIDTHS: total[w] += sizes[w]
        kfs.append({'w': round(kf['w'], 1), 'file': name, 'width': int(img.shape[1]), 'height': int(img.shape[0]),
                    'layers': [{'kind': l['kind'], 'speed': round(float(l['speed']), 3),
                                'left': int(l['left']), 'top': int(l['top']), 'width': int(l['rgba'].shape[1]), 'height': int(l['rgba'].shape[0]),
                                'atlasX': int(x), 'atlasY': int(y)}
                               for l, (x, y) in zip(layers, pos)]})
    top, top_y, body = near_layers(strip, sharp, matte)
    for name, img in (('near-top', top), ('near-body', body)):
        sizes = save_layer(img, name, outdir, NEAR_QUALITY)
        for w in WIDTHS: total[w] += sizes[w]
    sheet, sprites = star_sprites(stars)
    sizes = save_layer(sheet, 'stars', outdir)
    for w in WIDTHS: total[w] += sizes[w]
    # camera travel against normalised video time u (0 = deepest frame, 1 = surface)
    u = np.linspace(0, 1, 129)
    path = np.interp(u * (len(W) - 1), np.arange(len(W)), W)
    manifest = {
        'source': 'best_night.mp4 frames %d-%d' % (FIRST, LAST),
        'frame': {'width': FW, 'height': FH},
        'widths': list(WIDTHS),
        'keyStep': KEY_STEP,
        'keyframes': kfs,
        'near': {'top': {'file': 'near-top', 'y': top_y, 'height': int(top.shape[0])},
                 'body': {'file': 'near-body', 'y': FH, 'height': int(body.shape[0])}},
        # each star sits at [x, y] (frame px) at the surface; deeper in, the sky has turned
        # by expm((1 - u) * turn), a homography in frame px
        'stars': {'file': 'stars', 'width': int(sheet.shape[1]), 'height': int(sheet.shape[0]),
                  'turn': [[float('%.6g' % v) for v in row] for row in (G * (len(W) - 1))], 'sprites': sprites},
        'travel': [round(float(t), 2) for t in path],
    }
    manifest_path.write_text(json.dumps(manifest, indent=1) + '\n')
    for w in WIDTHS:
        log(f'   {w}w total {total[w] / 1e6:.2f} MB ({len(kfs)} keyframe atlases, the cut face, {len(sprites)} stars)')
    return manifest


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--video', required=True, type=Path)
    ap.add_argument('--work', type=Path, default=Path('.world-build'))
    ap.add_argument('--out', type=Path, default=Path('public/assets/world/night'))
    ap.add_argument('--manifest', type=Path, default=Path('src/data/night-layers.json'))
    a = ap.parse_args()
    a.work.mkdir(parents=True, exist_ok=True)
    W = stage_path(a.video, a.work)
    strip, sharp, surface_std = stage_strip(a.video, a.work, W)
    speed, matte = stage_speeds(a.video, a.work, W, surface_std)
    G, stars = stage_stars(a.video, a.work, W, matte)
    bands = stage_bands(a.video, a.work, W, speed, matte, G, stars)
    stage_export(a.work, a.out, a.manifest, W, strip, sharp, matte, bands, G, stars)


if __name__ == '__main__':
    sys.exit(main())
