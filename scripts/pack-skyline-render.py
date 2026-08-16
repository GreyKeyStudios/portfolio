"""
Packages a render from render-skyline-plate.py into the plate texture.

Run:  python scripts/pack-skyline-render.py <render.png>
Needs: Pillow

This is the second half of a two-step asset build:
  1. blender --background --python scripts/render-skyline-plate.py -- <city.glb> <render.png>
  2. python scripts/pack-skyline-render.py <render.png>

It is deliberately much simpler than build-skyline-plate.py, which packages the
old stock PHOTO. That script had to crop away a road, paint a vertical alpha
ramp so the plate's own sky could dissolve into the sky dome, and feather the
left and right edges — three hand-tuned passes, and the alpha ramp silently did
nothing for months because of a Pillow gotcha (see that file's header).

None of that is needed here. The render already arrives on transparent film, so
the cutout is exact by construction rather than painted on afterwards, and
there is no painted sky to blend away. All that is left is to trim the empty
margin so the quad is not mostly nothing.
"""

import os
import sys

from PIL import Image

DST = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public", "textures", "skyline.png",
)

# Breathing room kept around the silhouette, as a fraction of its size. Without
# it the topmost spire lands exactly on the texture edge, where bilinear
# filtering has nothing to sample on one side and clips it.
PAD_FRAC = 0.01

# The plate is ~72 world units wide seen from ~90 away, so it covers roughly
# 900px of a 1080p screen. Rendering at 4096 and shipping the full crop meant
# about 4x oversampling — and this texture is on the critical load path, where
# the whole model budget is only 22MB.
#
# Downsampling is also the only antialiasing the window grid gets: at full res
# each lit window is a hard-edged rectangle that shimmers as you walk. 2x is
# kept rather than 1x so the plate still holds up if the yard is ever widened
# or the FOV changes.
MAX_WIDTH = 1800


def main():
    src = sys.argv[1]
    im = Image.open(src).convert("RGBA")
    alpha = im.getchannel("A")
    box = alpha.getbbox()
    if box is None:
        raise SystemExit("render is fully transparent — did the city import?")

    x0, y0, x1, y1 = box
    padx = max(1, int((x1 - x0) * PAD_FRAC))
    pady = max(1, int((y1 - y0) * PAD_FRAC))
    x0 = max(0, x0 - padx)
    y0 = max(0, y0 - pady)
    x1 = min(im.width, x1 + padx)
    y1 = min(im.height, y1 + pady)

    out = im.crop((x0, y0, x1, y1))
    full = out.size
    if out.width > MAX_WIDTH:
        out = out.resize(
            (MAX_WIDTH, max(1, round(out.height * MAX_WIDTH / out.width))),
            Image.LANCZOS,
        )

    os.makedirs(os.path.dirname(DST), exist_ok=True)
    out.save(DST, optimize=True)

    w, h = out.size
    print(f"source {im.size}, content {box}, cropped {full} -> {out.size}")
    print(f"wrote {DST}")
    print(f"  {w} x {h}  aspect {w / h:.4f}  {round(os.path.getsize(DST) / 1024)} KB")
    print("  components/skyline-plate.tsx reads this aspect off the texture at")
    print("  runtime, so nothing needs updating there.")


if __name__ == "__main__":
    main()
