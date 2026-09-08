"""Derive a lightweight gate-only house from the full exterior model."""
import bpy, json, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'public/models/house-main-optimized.glb'
OUT=ROOT/'public/models/house-gate-preview.glb'
ASSETS=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Gate House Preview'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing gate preview scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC'
before_images=set(bpy.data.images)
bpy.ops.import_scene.gltf(filepath=str(SRC))
meshes=[o for o in scene.objects if o.type=='MESH']
source_triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
for ob in meshes:
    bpy.context.view_layer.objects.active=ob;ob.select_set(True)
    mod=ob.modifiers.new('Gate preview reduction','DECIMATE');mod.ratio=.32
    bpy.ops.object.modifier_apply(modifier=mod.name);ob.select_set(False)
for image in set(bpy.data.images)-before_images:
    if image.size[0]>512 or image.size[1]>512:image.scale(min(512,image.size[0]),min(512,image.size[1]))
    image.pack()
bpy.ops.object.select_all(action='DESELECT')
for ob in meshes:ob.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,use_active_scene=True,
    export_animations=False,export_lights=False,export_cameras=False,export_image_format='JPEG',
    export_jpeg_quality=70,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS/'house-gate-preview.blend'))
result={'source_bytes':SRC.stat().st_size,'bytes':OUT.stat().st_size,'source_triangles':source_triangles,
    'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),
    'source_sha256':hashlib.sha256(SRC.read_bytes()).hexdigest()}
(ASSETS/'house-gate-preview.manifest.json').write_text(json.dumps(result,indent=2))
