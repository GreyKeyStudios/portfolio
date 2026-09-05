"""Run through Blender MCP. Metres; Three (x,y,z) -> Blender (x,-z,y).
Source objects remain editable. Exports use temporary copies joined by material.
"""
import bpy, json, math, hashlib
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'portfolio-assets/stack-house/blender'
layout = json.loads((SOURCE / 'layout-v001.json').read_text())
scene_name = 'Stackhouse Stair v001'
if scene_name in bpy.data.scenes:
    raise RuntimeError('Candidate scene already exists; inspect before rebuilding.')
scene = bpy.data.scenes.new(scene_name)
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1

def material(name, color, roughness, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Metallic'].default_value = metallic
    return m

oak = material('V001 Smoked oak', (0.22, 0.105, 0.045), .4)
plaster = material('V001 Warm painted joinery', (.64, .61, .55), .75)
iron = material('V001 Blackened steel', (.022, .028, .035), .34, .65)
parts = []

def xyz(p):
    return Vector((p[0], -p[2], p[1]))

def finish(obj, name, mat, bevel=0):
    obj.name = name
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Crafted edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        mod = obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
        mod.keep_sharp = True
    parts.append(obj)
    return obj

def box(name, center, size, mat, bevel=.003):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(center))
    obj = bpy.context.object
    obj.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, bevel)

def beam(name, a, b, width, depth, mat, bevel=.004):
    av, bv = xyz(a), xyz(b)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(av+bv)/2)
    obj = bpy.context.object
    obj.scale = (width, depth, (bv-av).length)
    obj.rotation_euler = (bv-av).to_track_quat('Z', 'Y').to_euler()
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, bevel)

def profile(name, xmin, xmax, yz, mat):
    verts = [xyz((x,y,z)) for x in (xmin,xmax) for y,z in yz]
    n = len(yz)
    faces = [tuple(reversed(range(n))), tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)
    return finish(obj, name, mat, .003)

runs = [s for s in layout['stairs'] if s['floor'] == 'ground']
for k,s in enumerate(runs):
    b=s['bounds']; xmin=b['minX']-layout['X0']; xmax=b['maxX']-layout['X0']
    za=s['bottomCoord']; zb=s['topCoord']; ya=s['bottomY']; yb=s['topY']
    if abs(yb-ya)<.001:
        box('Half landing painted fascia', ((xmin+xmax)/2,ya-.13,(za+zb)/2), (xmax-xmin,.20,abs(zb-za)),plaster)
        box('Half landing oak surface', ((xmin+xmax)/2,ya-.02,(za+zb)/2), (xmax-xmin,.04,abs(zb-za)),oak)
        continue
    count=round((yb-ya)/.18); rise=(yb-ya)/count; run=(zb-za)/count; direction=1 if run>0 else -1
    # A sawtooth top and continuous sloped underside form a closed stair carriage.
    yz=[(ya-.20,za),(ya,za)]
    for i in range(count):
        z0=za+run*i; z1=z0+run; top=ya+rise*(i+1)
        yz.extend([(top-.035,z0),(top-.035,z1)])
        box(f'Flight {k} oak tread {i+1:02}',((xmin+xmax)/2,top-.0175,(z0+z1)/2-direction*.012),(xmax-xmin,.035,abs(run)+.024),oak,.004)
    yz.append((yb-.20,zb))
    profile(f'Flight {k} closed risers and smooth soffit',xmin,xmax,yz,plaster)
    # Rail stays in the existing centre-newel collision strip; outer edge is wall-backed.
    rail_x = xmax+.045 if k==0 else xmin-.045
    for i in range(count+1):
        z=za+run*i; h=ya+rise*i
        beam(f'Flight {k} steel baluster {i}',(rail_x,h,z),(rail_x,h+.91,z),.018,.018,iron,.002)
    for z,h in [(za,ya),(zb,yb)]:
        box(f'Flight {k} oak newel',(rail_x,h+.49,z),(.075,.98,.075),oak,.005)
    beam(f'Flight {k} continuous oak handrail',(rail_x,ya+.95,za),(rail_x,yb+.95,zb),.055,.065,oak,.009)
    # Painted skirt at each side finishes the exposed tread edges.
    for x in [xmin+.02,xmax-.02]:
        beam(f'Flight {k} painted skirt',(x,ya-.07,za),(x,yb-.07,zb),.035,.15,plaster,.003)

# Temporary export copies consolidate to three material primitives.
bpy.ops.object.select_all(action='DESELECT')
copies=[]
deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
    mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps))
    ob=bpy.data.objects.new('Export '+src.name,mesh)
    ob.matrix_world=src.matrix_world.copy()
    scene.collection.objects.link(ob)
    copies.append(ob)
    ob.select_set(True)
bpy.context.view_layer.objects.active=copies[0]
bpy.ops.object.join()
export_obj=bpy.context.object
world_corners=[export_obj.matrix_world @ Vector(c) for c in export_obj.bound_box]
runtime_corners=[(v.x,v.z,-v.y) for v in world_corners]
bounds={'min':[min(v[i] for v in runtime_corners) for i in range(3)],'max':[max(v[i] for v in runtime_corners) for i in range(3)]}
export_path=ROOT/'public/models/staircase-v001.glb'
bpy.ops.export_scene.gltf(filepath=str(export_path),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
mesh=export_obj.data
triangles=sum(len(p.vertices)-2 for p in mesh.polygons)
bpy.data.objects.remove(export_obj,do_unlink=True)
if mesh.users==0: bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'staircase-v001.blend'))
manifest={'version':'v001','source':'staircase-v001.blend','asset':'public/models/staircase-v001.glb','units':'metres','source_axes':'Z up, -Y forward','runtime_axes':'Y up, +Z forward','runtime_placement':[layout['X0'],'FLOOR_BASE_Y',0],'layout_sha256':hashlib.sha256((ROOT/'lib/interior-layout.ts').read_bytes()).hexdigest(),'source_sha256':hashlib.sha256((SOURCE/'staircase-v001.blend').read_bytes()).hexdigest(),'triangles':triangles,'materials':[oak.name,plaster.name,iron.name],'textures':[],'note':'Architectural geometry candidate; plain PBR swatches, no baked lighting or wood textures yet.'}
manifest['bounds']=bounds
(SOURCE/'staircase-v001.manifest.json').write_text(json.dumps(manifest,indent=2))
result={'asset':str(export_path),'triangles':triangles,'editable_objects':len(parts)}
