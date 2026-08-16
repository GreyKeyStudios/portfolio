"""
Builds public/textures/skyline.png from the source skyline PHOTO.

THIS IS THE ACTIVE PIPELINE. The Meshy city render (render-skyline-plate.py)
was tried and lost a direct A/B: the photo has architectural detail,
atmospheric depth and lit tower crowns, and the render has chunky procedural
windows. Photogrammetry massing is good; photogrammetry FACADES are not.

The photo's only real flaw was never the buildings — it was the warm sunset
baked into its sky, which clashed with the scene's navy and made the plate read
as a rectangle. So this script now CUTS THE SKY OUT rather than trying to fade
it: everything above the skyline silhouette becomes transparent and the sky
dome shows through, which is the same thing that made the render integrate
cleanly. Best of both.

That also retires the vertical alpha ramp entirely. Good riddance — it was the
fiddliest part of this file and it silently did nothing for months (see the
Pillow note on getchannel/putalpha below).

Run:  python scripts/build-skyline-plate.py
Needs: Pillow, numpy

Asset-build only — nothing in the web build depends on Python. Committed so the
plate can be regenerated if the source art is ever recropped or replaced.

Three things happen here, and the order matters:

1. CROP above the source's own road. Left in, the road floats in mid-air over
   the yard at the plate's base.

2. SKY CUTOUT. For each row the sky is the bright, smooth majority; buildings
   are darker than it. Take a high percentile of each row's luminance as the
   local sky reference, call anything meaningfully darker "building", then for
   each column drop everything above the topmost building pixel.

   Per-column is correct rather than a single horizon line: in the gaps between
   towers you genuinely see sky all the way down to the distant waterfront, and
   that low warm haze is atmosphere worth keeping.

3. COOL SHIFT on what survives. The remaining haze is sunset-warm; a modest
   push toward blue lands it in the scene's navy without flattening it.

No horizontal extension, and no vertical ramp. Both existed to hide edges that
the cutout removes outright: the top edge is now the skyline itself, and past
the left and right ends you simply see sky, which is what the end of a real
skyline looks like.
"""

import os

import numpy as np
from PIL import Image

SRC = os.path.expanduser(r"~\Downloads\skyline.png")
DST = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public", "textures", "skyline.png",
)

ROAD_THRESHOLD = 28     # mean row brightness below which we call it the road
DETAIL_THRESHOLD = 3.2  # local luminance std above which a pixel is 'building'
MIN_RUN = 14            # consecutive building rows needed to trust a silhouette
OPEN_RADIUS = 3         # morphological opening; erases stars and thin antennas
SILHOUETTE_BITE = 2     # px cut INTO the building, so the feather has no sky in it
SIDE_FADE = 0.10        # share of width faded out at each end
BOTTOM_FADE = 0.05      # share of height faded at the waterline - small, because
                        # the dome now supplies a dark horizon for the base to
                        # meet. A wide fade dissolved the city ABOVE that line,
                        # which is what read as floating in mid air.
SILHOUETTE_SMOOTH = 9   # median window across columns, kills leftover spikes
BASELINE_WINDOW = 81    # wide median defining the local roofline
MAX_SPIKE = 14          # px a column may rise above that baseline
EDGE_FEATHER = 3        # px of soft edge on the cutout, so it does not alias
# The photo's own dusk brightness is KEPT. Grading it toward navy was the
# wrong direction: it is the better-looking half of this pairing, so the sky
# dome is tuned to IT (see components/sky-dome.tsx) rather than the reverse.
COOL = (1.0, 1.0, 1.0)
EXPOSURE = 1.0
MAX_WIDTH = 1800        # see pack-skyline-render.py for why 2x is enough


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

    # --- 2. sky cutout -----------------------------------------------------
    arr = np.asarray(crop.convert("RGB")).astype(np.float32)
    lum = arr.mean(axis=2)

    # Detect buildings by TEXTURE, not brightness.
    #
    # Brightness alone fails on this photo: the sunset sits on the left, so a
    # per-row reference is dragged bright by it and the darker right-hand sky
    # then reads as "building" — producing a false dark mountain up the right
    # edge. Sky is smooth whatever its colour; buildings have windows, edges
    # and silhouette against it. Local variance separates them cleanly and does
    # not care about the gradient at all.
    def box(a, r):
        """Mean over a (2r+1) square, via separable cumulative sums."""
        pad = np.pad(a, r, mode="edge")
        c = np.cumsum(pad, axis=0)
        c = c[2 * r:, :] - c[:-2 * r, :]
        c = np.cumsum(c, axis=1)
        c = c[:, 2 * r:] - c[:, :-2 * r]
        return c / ((2 * r) ** 2)

    R = 3
    mean = box(lum, R)
    var = np.maximum(box(lum * lum, R) - mean * mean, 0.0)
    detail = np.sqrt(var)
    building = detail > DETAIL_THRESHOLD

    # ERASE THE STARS. The photo's sky is not empty — it has stars in it, and a
    # star is a tiny high-variance dot, which is exactly what "building" means
    # to the detector above. Each one opened its whole column downward and hung
    # a one-pixel streak of photo-sky over the plate. A morphological opening
    # (erode then dilate) deletes anything thinner than the kernel; buildings
    # are vastly larger and come through untouched.
    def erode(m, r):
        return box(m.astype(np.float32), r) > 0.98

    def dilate(m, r):
        return box(m.astype(np.float32), r) > 0.02

    building = dilate(erode(building, OPEN_RADIUS), OPEN_RADIUS)

    # Require a RUN of building rows before believing the silhouette. A single
    # noisy pixel high in a column would otherwise open that entire column and
    # leave a one-pixel vertical streak of sky hanging down the plate.
    runs = np.ones_like(building, dtype=bool)
    for i in range(1, MIN_RUN):
        runs[:-i] &= building[i:]
    runs &= building

    has = runs.any(axis=0)
    first = np.where(has, runs.argmax(axis=0), ch).astype(np.float32)

    # Median-filter the silhouette across columns. Cheap insurance against any
    # spike that survives the run test; the true skyline is locally smooth even
    # where it steps.
    half = SILHOUETTE_SMOOTH // 2
    padded = np.pad(first, half, mode="edge")
    stack = np.stack([padded[i:i + len(first)] for i in range(SILHOUETTE_SMOOTH)])
    first = np.median(stack, axis=0)

    # Clamp spikes against a WIDE local baseline.
    #
    # What is left after the opening is mostly real: antennas, masts, the odd
    # star that survived. But a 1px bright line standing 200px above the
    # roofline does not read as an antenna at plate scale, it reads as a glitch
    # — and the narrow median above cannot remove them because several adjacent
    # columns spike together. A wide median gives the true local roofline, and
    # anything towering over it by more than MAX_SPIKE gets pulled back down.
    bhalf = BASELINE_WINDOW // 2
    bpad = np.pad(first, bhalf, mode="edge")
    baseline = np.median(
        np.stack([bpad[i:i + len(first)] for i in range(BASELINE_WINDOW)]), axis=0
    )
    first = np.maximum(first, baseline - MAX_SPIKE)

    # Bite into the building before feathering. Feathering AT the silhouette
    # blends the bright sky pixel sitting immediately above each roofline, which
    # leaves a pale halo tracing every building — the classic bad-matte look.
    # Starting the ramp a couple of pixels lower means it only ever blends
    # building into transparent.
    first = first + SILHOUETTE_BITE

    yy = np.arange(ch, dtype=np.float32)[:, None]
    # One expression instead of a feather loop: alpha ramps over EDGE_FEATHER
    # rows at the silhouette and is solid below it.
    alpha = np.clip((yy - first[None, :]) / EDGE_FEATHER + 1.0, 0.0, 1.0) * 255.0

    # Border falloff. The sky cutout removes the TOP edge, but the plate still
    # ends abruptly at its sides and along the bottom of the photo's water — and
    # any hard edge on a flat quad standing in a 3D scene reads as a rectangle,
    # which is the whole problem we have been chasing. Fading all three means
    # the plate has no edge left to notice: the city simply thins out, which is
    # what the end of a skyline and the far side of water actually look like.
    xs = np.arange(cw, dtype=np.float32)
    side = np.minimum(xs, cw - 1 - xs) / max(1.0, cw * SIDE_FADE)
    side = np.clip(side, 0.0, 1.0)
    side = side * side * (3 - 2 * side)          # smoothstep

    ys = np.arange(ch, dtype=np.float32)
    bot = (ch - 1 - ys) / max(1.0, ch * BOTTOM_FADE)
    bot = np.clip(bot, 0.0, 1.0)
    bot = bot * bot * (3 - 2 * bot)

    alpha = alpha * side[None, :] * bot[:, None]

    # --- 3. cool shift on what survives ------------------------------------
    graded = arr * np.array(COOL, dtype=np.float32) * EXPOSURE
    graded = np.clip(graded, 0, 255)

    out = np.dstack([graded, alpha]).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")

    # Trim to content, so the quad is not mostly empty.
    box = img.getchannel("A").getbbox()
    if box is None:
        raise SystemExit("cutout removed everything — check BUILDING_DELTA")
    img = img.crop(box)

    if img.width > MAX_WIDTH:
        img = img.resize(
            (MAX_WIDTH, max(1, round(img.height * MAX_WIDTH / img.width))), Image.LANCZOS
        )

    cut = 100.0 * (1.0 - (alpha > 8).mean())
    if cut < 5 or cut > 92:
        raise SystemExit(f"sky cutout looks wrong: removed {cut:.1f}% of the frame")

    os.makedirs(os.path.dirname(DST), exist_ok=True)
    img.save(DST, optimize=True)
    print(f"source {im.size}, cropped above road to {crop.size}")
    print(f"sky cutout removed {cut:.1f}% of the frame")
    # Sky samples, for keeping components/sky-dome.tsx in step with the art.
    # These are read straight off the transparent region, i.e. the colours the
    # dome has to hand over to at each height.
    sky = np.asarray(crop.convert("RGB")).astype(np.float32)
    print("  sky handover colours (match these in components/sky-dome.tsx):")
    for frac in (0.02, 0.18, 0.38, 0.62):
        row = int(ch * frac)
        band = sky[row][alpha[row] < 8]
        if len(band):
            r, g, b = band.mean(axis=0)
            print(f"    {frac:5.0%} down: #{int(r):02x}{int(g):02x}{int(b):02x}")
    print(f"wrote {DST}")
    print(f"  {img.width} x {img.height}  aspect {img.width / img.height:.4f}"
          f"  {round(os.path.getsize(DST) / 1024)} KB")


if __name__ == "__main__":
    main()
