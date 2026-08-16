"""
Builds public/textures/skyline.png from the source skyline PHOTO.

SUPERSEDED, kept as a fallback. The plate is now rendered from our own city
model instead — see scripts/render-skyline-plate.py and
scripts/pack-skyline-render.py, which produce a smaller file (574 KB vs 1513),
need no alpha painting at all, and let the palette be set rather than matched.
Use this only to go back to the stock photo.

Run:  python scripts/build-skyline-plate.py
Needs: Pillow  (pip install pillow)

Asset-build only — nothing in the web build depends on Python. Committed so the
plate can be regenerated if the source art is ever recropped or replaced.

Three things happen here, and the order matters:

1. CROP above the source's own road. Left in, the road floats in mid-air over
   the yard at the plate's base.

2. VERTICAL ALPHA RAMP over the top 42%. This is the load-bearing step. The
   plate is a flat quad standing in a 3D scene; without the ramp its top edge
   is a hard horizontal line across the sky and it reads as a billboard — the
   "it looks like a projector" problem. The ramp lets the painted sky dissolve
   into the live sky dome so there is no edge to see.

   A previous revision of this script lost the ramp while gaining step 3, and
   the plate immediately went back to reading as an opaque rectangle. If you
   are editing this file, that is the step not to drop.

3. HORIZONTAL EXTENSION to a wider canvas, transparent, with the skyline's own
   left/right edges feathered into it. The camera's ~108-degree FOV sees past
   the art's own width from most of the yard; the extension means the quad can
   be wide enough to cover that without stretching the skyline itself.

   The extension is TRANSPARENT rather than edge-replicated on purpose. Seeing
   past the skyline shows the sky dome, which is painted from the same navy the
   art uses (see components/sky-dome.tsx) — so there is nothing to hide. An
   earlier attempt replicated the edge columns outward to cover the gap, which
   smears the outermost buildings into 1200px horizontal streaks and solves a
   problem that matching the sky solves properly.

4096 is the target width on purpose: plenty of mobile GPUs cap textures at
4096 in either dimension, and going wider risks a silent downscale or a failed
upload on exactly the devices this most needs to work on.
"""

import os

from PIL import Image

SRC = os.path.expanduser(r"~\Downloads\skyline.png")
DST = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public", "textures", "skyline.png",
)

TARGET_W = 4096
FADE_FRACTION = 0.42   # top share of the canvas the vertical ramp covers
FEATHER_FRACTION = 0.16  # share of the art's width feathered at each side
ROAD_THRESHOLD = 28    # mean row brightness below which we call it the road


def smoothstep(t):
    return t * t * (3 - 2 * t)


def main():
    im = Image.open(SRC).convert("RGBA")
    W, H = im.size
    px = im.load()

    def row_mean(y):
        xs = range(0, W, 7)
        return sum(px[x, y][0] + px[x, y][1] + px[x, y][2] for x in xs) / (3 * len(list(xs)))

    # Walk up from the bottom until the rows stop being the dark road.
    base = H
    for y in range(H - 1, -1, -4):
        if row_mean(y) > ROAD_THRESHOLD:
            base = y
            break

    crop = im.crop((0, 0, W, min(H, base + 12)))
    cw, ch = crop.size

    # --- 2. vertical ramp: transparent at the top, opaque by FADE_FRACTION ---
    #
    # NOTE: getchannel/putalpha, NOT `img.split()[3].load()`. split() returns
    # COPIES of the bands, so writing through it modifies a throwaway image and
    # the original keeps its original alpha. Both alpha passes in this script
    # were written that way and silently did nothing for their entire life —
    # the plate shipped fully opaque, read as a hard rectangle in the sky, and
    # sent two rounds of debugging after the plate's SIZE instead.
    fade_end = int(ch * FADE_FRACTION)
    alpha = crop.getchannel("A")
    a = alpha.load()
    for y in range(fade_end):
        k = smoothstep(y / fade_end)
        for x in range(cw):
            a[x, y] = int(a[x, y] * k)
    crop.putalpha(alpha)

    # --- 3. horizontal extension, art centred, remainder transparent ---
    out = Image.new("RGBA", (TARGET_W, ch), (0, 0, 0, 0))
    ox = (TARGET_W - cw) // 2
    out.paste(crop, (ox, 0))

    feather = int(cw * FEATHER_FRACTION)
    oalpha = out.getchannel("A")
    oa = oalpha.load()
    for i in range(feather):
        k = smoothstep(i / feather)
        for y in range(ch):
            lx, rx = ox + i, ox + cw - 1 - i
            oa[lx, y] = int(oa[lx, y] * k)
            oa[rx, y] = int(oa[rx, y] * k)
    out.putalpha(oalpha)

    # Guard the ramp. It is invisible in the file listing and its absence only
    # shows up as "the sky looks a bit off" three steps downstream, so assert it
    # here rather than trusting that the loops above did anything.
    mid = ox + cw // 2
    top_a = out.getpixel((mid, 0))[3]
    ramp_a = out.getpixel((mid, fade_end // 2))[3]
    body_a = out.getpixel((mid, fade_end + 20))[3]
    if not (top_a < 8 and 8 < ramp_a < 248 and body_a > 248):
        raise SystemExit(
            f"vertical ramp did not take: alpha at top={top_a}, "
            f"mid-ramp={ramp_a}, below ramp={body_a} (want ~0 / mid / 255)"
        )

    edge_a = out.getpixel((ox + 2, fade_end + 20))[3]
    if edge_a > 24:
        raise SystemExit(f"horizontal feather did not take: alpha at art edge={edge_a}")

    os.makedirs(os.path.dirname(DST), exist_ok=True)
    out.save(DST, optimize=True)

    # Report the sky palette so components/sky-dome.tsx can be kept in step with
    # the art rather than guessed at.
    opaque_top = fade_end
    samples = []
    for frac in (0.45, 0.55, 0.70):
        y = int(ch * frac)
        rs = gs = bs = n = 0
        for x in range(ox, ox + cw, 13):
            r, g, b, al = out.getpixel((x, y))
            if al > 200 and r + g + b > 40:  # sky, not silhouette
                rs, gs, bs, n = rs + r, gs + g, bs + b, n + 1
        if n:
            samples.append((frac, f"#{rs//n:02x}{gs//n:02x}{bs//n:02x}"))

    print(f"wrote {out.size}  {round(os.path.getsize(DST) / 1024)} KB")
    print(f"art occupies {round(100 * cw / TARGET_W)}% of canvas width")
    print(f"vertical ramp: transparent at y=0 -> opaque at y={opaque_top} ({FADE_FRACTION:.0%})")
    print(f"aspect {TARGET_W / ch:.3f}")
    for frac, hexc in samples:
        print(f"  sky at {frac:.0%} down: {hexc}")


if __name__ == "__main__":
    main()
