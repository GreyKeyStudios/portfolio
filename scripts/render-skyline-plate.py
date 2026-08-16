"""
Renders the Meshy city model into the skyline backdrop plate.

Run:  blender --background --factory-startup --python scripts/render-skyline-plate.py -- <model.glb> <out.png>

Replaces the stock photo the plate currently uses. Two reasons that matters:
the photo has a warm sunset baked into it that the sky dome has to be tuned to
meet, and it is not ours. Rendering our own city means the palette is set here
rather than negotiated with someone else's photograph.

WHY THE WINDOWS ARE PROCEDURAL
The Meshy texture was generated under daylight: its window grids are dark, with
no emission anywhere. Rendered at night as-is you get grey massing, which looks
worse than the photo it would replace. So the lit windows are generated here.

They are deliberately NOT a neat grid of rectangles. On the finished plate a
building is a few dozen pixels wide and an individual window is sub-pixel — what
actually reads at that size is a *scatter* of warm light across the vertical
faces. A thresholded noise mask gives exactly that, and it is far more robust
than trying to project a real window grid onto photogrammetry geometry whose
wall normals wander.

TRANSPARENT FILM, ON PURPOSE
Rendering with alpha means the plate arrives already cut out: buildings opaque,
sky transparent, sky dome showing through behind. That removes the need for the
painted vertical alpha ramp in build-skyline-plate.py, which is the single
fiddliest part of that script and the one that silently broke (see its header).
"""

import os
import sys
import math

import bpy
from mathutils import Vector

# --- look ------------------------------------------------------------------
WINDOW_COLOR = (1.0, 0.78, 0.42)   # warm sodium, against the scene's cool navy
EMISSION_STRENGTH = 7.0
BODY_DARKEN = 0.18                 # unlit massing, so silhouette still reads
MOON = 0.60                        # faint top light; keeps roofs from going flat black

# A first pass at 220/0.62 lit ~6.5% of the plate in an even scatter and read as
# television static rather than a city. Two things were wrong: the lights were
# near pixel-sized once the plate is downsampled to screen, and every building
# was equally lit.
#
# So the mask is now TWO noises multiplied. WINDOW_* is the per-window grain;
# CLUSTER_* is a slow field that darkens whole buildings and whole bands of
# floors, which is what actually makes a real skyline read — most of it is off.
# Tuned by measuring the share of warm-lit pixels on the finished plate:
#   noise 220 / 0.62, no cluster  -> 6.52%  television static
#   noise  90 / 0.80, cluster .42 -> 0.11%  looks like a blackout
#   noise  90 / 0.66, cluster .26 -> 3.26%  blobby, like camouflage
#   grid  340 / 0.72, cluster .26 -> 8.43%  right shape, whole city lit up
#   grid  340 / 0.88, cluster .38 -> 3.12%  correct
#
# Read those last two lines together, because they are the whole lesson: 3.26%
# looked like camouflage and 3.12% looks like a city. The lit-pixel share was
# never the thing that mattered — STRUCTURE was. A noise field has no windows
# in it, so no amount of density tuning could produce any; quantising to a grid
# fixed it in one step. The percentage is a useful sanity check for "is the
# whole city on or off", nothing more.
#
# WINDOW_DENSITY is a threshold on uniform white noise, so 0.88 lights ~12% of
# cells; the cluster field then darkens roughly half of those again.
WINDOW_DENSITY = 0.88              # threshold: higher = fewer lit windows
WINDOW_SCALE = 340.0               # grid cells per object-space unit
CLUSTER_SCALE = 11.0
CLUSTER_BIAS = 0.38                # below this the whole region stays dark

# --- output ----------------------------------------------------------------
RES_X = 4096
RES_Y = 1024
SAMPLES = 24


def main():
    argv = sys.argv[sys.argv.index("--") + 1:]
    src, out = argv[0], argv[1]

    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(src))
    meshes = [o for o in sc.objects if o.type == "MESH"]
    if not meshes:
        raise SystemExit("no mesh in " + src)

    mn = Vector((1e18,) * 3)
    mx = Vector((-1e18,) * 3)
    for o in meshes:
        for c in o.bound_box:
            wc = o.matrix_world @ Vector(c)
            mn = Vector((min(mn[i], wc[i]) for i in range(3)))
            mx = Vector((max(mx[i], wc[i]) for i in range(3)))
    size = mx - mn
    ctr = (mn + mx) / 2
    print(f"bounds size {size.x:.3f} x {size.y:.3f} x {size.z:.3f}")

    for o in meshes:
        night_material(o)

    # Look along whichever horizontal axis is SHORTER, so the long face of the
    # city presents to camera.
    along_x = size.x >= size.y
    width = size.x if along_x else size.y
    depth = size.y if along_x else size.x

    cam_d = bpy.data.cameras.new("C")
    cam = bpy.data.objects.new("C", cam_d)
    sc.collection.objects.link(cam)
    sc.camera = cam
    # Orthographic: the plate is a flat quad in the game, so a perspective
    # render would bake in a vanishing point that fights the scene's own camera.
    cam_d.type = "ORTHO"
    cam_d.ortho_scale = width * 1.02

    back = depth * 3.0 + width
    if along_x:
        cam.location = ctr + Vector((0.0, -back, size.z * 0.10))
        cam.rotation_euler = (math.radians(90), 0.0, 0.0)
    else:
        cam.location = ctr + Vector((-back, 0.0, size.z * 0.10))
        cam.rotation_euler = (math.radians(90), 0.0, math.radians(-90))

    sun_d = bpy.data.lights.new("moon", "SUN")
    sun_d.energy = MOON
    sun_d.color = (0.62, 0.72, 1.0)
    sun = bpy.data.objects.new("moon", sun_d)
    sc.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(38), 0.0, math.radians(20))

    items = bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys()
    sc.render.engine = next(
        (e for e in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES") if e in items), "CYCLES"
    )
    sc.render.resolution_x = RES_X
    sc.render.resolution_y = RES_Y
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    try:
        sc.eevee.taa_render_samples = SAMPLES
        sc.eevee.use_bloom = True
    except Exception:
        pass
    try:
        sc.cycles.samples = SAMPLES
        sc.cycles.device = "CPU"
    except Exception:
        pass

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    sc.render.filepath = os.path.abspath(out)
    bpy.ops.render.render(write_still=True)
    print(f"wrote {out}")


def night_material(obj):
    """Darken the daylight albedo and scatter emissive windows over vertical faces."""
    for slot in obj.material_slots:
        mat = slot.material
        if not mat or not mat.use_nodes:
            continue
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if bsdf is None:
            continue

        # Knock the daylight albedo down; it stands in for unlit massing only.
        dark = nt.nodes.new("ShaderNodeMixRGB")
        dark.blend_type = "MULTIPLY"
        dark.inputs[0].default_value = 1.0
        dark.inputs[2].default_value = (BODY_DARKEN,) * 3 + (1.0,)
        src_link = next((l for l in nt.links if l.to_socket is bsdf.inputs["Base Color"]), None)
        if src_link:
            nt.links.new(src_link.from_socket, dark.inputs[1])
            nt.links.new(dark.outputs["Color"], bsdf.inputs["Base Color"])

        # Windows on a GRID, not a noise field.
        #
        # A Noise Texture makes organic blobs: at high frequency it reads as
        # television static, at low frequency as camouflage. Neither looks like
        # a building. Quantising object space to cells and giving each cell one
        # random value produces discrete axis-aligned rectangles that read as
        # windows even when they are only a few pixels across, because the eye
        # picks up the alignment.
        tc = nt.nodes.new("ShaderNodeTexCoord")
        grid = nt.nodes.new("ShaderNodeVectorMath")
        grid.operation = "MULTIPLY"
        grid.inputs[1].default_value = (WINDOW_SCALE, WINDOW_SCALE, WINDOW_SCALE)
        nt.links.new(tc.outputs["Object"], grid.inputs[0])
        cell = nt.nodes.new("ShaderNodeVectorMath")
        cell.operation = "FLOOR"
        nt.links.new(grid.outputs["Vector"], cell.inputs[0])

        wn = nt.nodes.new("ShaderNodeTexWhiteNoise")
        wn.noise_dimensions = "3D"
        nt.links.new(cell.outputs["Vector"], wn.inputs["Vector"])

        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.interpolation = "CONSTANT"
        ramp.color_ramp.elements[0].position = 0.0
        ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
        ramp.color_ramp.elements[1].position = WINDOW_DENSITY
        ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
        nt.links.new(wn.outputs["Value"], ramp.inputs["Fac"])

        # Slow field that switches whole buildings and floor bands off. Without
        # it every tower is lit identically and the plate reads as noise.
        cluster = nt.nodes.new("ShaderNodeTexNoise")
        cluster.inputs["Scale"].default_value = CLUSTER_SCALE
        cluster.inputs["Detail"].default_value = 2.0
        nt.links.new(tc.outputs["Object"], cluster.inputs["Vector"])
        cramp = nt.nodes.new("ShaderNodeValToRGB")
        cramp.color_ramp.elements[0].position = CLUSTER_BIAS
        cramp.color_ramp.elements[0].color = (0, 0, 0, 1)
        cramp.color_ramp.elements[1].position = min(1.0, CLUSTER_BIAS + 0.30)
        cramp.color_ramp.elements[1].color = (1, 1, 1, 1)
        nt.links.new(cluster.outputs["Fac"], cramp.inputs["Fac"])

        clustered = nt.nodes.new("ShaderNodeMath")
        clustered.operation = "MULTIPLY"
        nt.links.new(ramp.outputs["Color"], clustered.inputs[0])
        nt.links.new(cramp.outputs["Color"], clustered.inputs[1])

        # Walls only. A roof full of lit windows reads as a mistake instantly.
        geo = nt.nodes.new("ShaderNodeNewGeometry")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(geo.outputs["Normal"], sep.inputs["Vector"])
        absz = nt.nodes.new("ShaderNodeMath"); absz.operation = "ABSOLUTE"
        nt.links.new(sep.outputs["Z"], absz.inputs[0])
        vert = nt.nodes.new("ShaderNodeMath"); vert.operation = "SUBTRACT"
        vert.inputs[0].default_value = 1.0
        nt.links.new(absz.outputs[0], vert.inputs[1])
        sharp = nt.nodes.new("ShaderNodeMath"); sharp.operation = "POWER"
        sharp.inputs[1].default_value = 3.0
        nt.links.new(vert.outputs[0], sharp.inputs[0])

        gate = nt.nodes.new("ShaderNodeMath"); gate.operation = "MULTIPLY"
        nt.links.new(clustered.outputs[0], gate.inputs[0])
        nt.links.new(sharp.outputs[0], gate.inputs[1])
        amp = nt.nodes.new("ShaderNodeMath"); amp.operation = "MULTIPLY"
        amp.inputs[1].default_value = EMISSION_STRENGTH
        nt.links.new(gate.outputs[0], amp.inputs[0])

        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = WINDOW_COLOR + (1.0,)
            nt.links.new(amp.outputs[0], bsdf.inputs["Emission Strength"])


if __name__ == "__main__":
    main()
