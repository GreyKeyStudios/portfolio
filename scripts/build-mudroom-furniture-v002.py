"""Author the three-way ground-floor mudroom. Run through Blender MCP."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Mudroom Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing mudroom scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;return m
oak=mat('Mudroom smoked oak',(.25,.13,.06),.48);navy=mat('Mudroom navy',(.035,.07,.10),.69);linen=mat('Mudroom oatmeal cushion',(.55,.49,.40),.91)
steel=mat('Mudroom blackened steel',(.025,.028,.028),.38,.72);leather=mat('Mudroom tobacco leather',(.31,.12,.045),.77);olive=mat('Mudroom olive coat',(.13,.17,.10),.9);cream=mat('Mudroom cream coat',(.58,.53,.43),.92)
rubber=mat('Mudroom boot tray',(.035,.038,.036),.88);brass=mat('Mudroom aged brass',(.30,.19,.07),.34,.7)
def box(name,p,s,m,bevel=.006):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(name,p,r,d,m,verts=20):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
layout=json.loads((ROOT/'lib/mudroom-furniture-v002.json').read_text())
bench=layout[0];x=bench['x'];z=bench['z'];w=bench['width'];d=bench['depth']
# Built-in stays west of the Kitchen opening, leaving the doorway's full approach visible.
box('Mudroom bench carcass',(x,.28,z),(w,.50,d),navy,.016);box('Mudroom bench seat',(x,.57,z-.015),(w+.06,.075,d+.04),oak,.014);box('Mudroom cushion',(x,.63,z-.04),(w-.12,.07,d-.11),linen,.025)
for dx in [-.43,0,.43]:box('Mudroom shoe cubby divider',(x+dx,.25,z-d/2-.012),(.025,.38,.025),oak,.003)
for dx in [-.43,0,.43]:
 box('Mudroom shoe '+str(dx),(x+dx,.13,z-.05),(.28,.09,.22),leather,.035)
# A paneled back, upper cubbies and rail make this read as permanent millwork.
box('Mudroom paneled back',(x,1.43,z+d/2-.018),(w,1.52,.035),navy,.006)
box('Mudroom upper cabinet',(x,2.34,z),(w,.52,d-.03),navy,.015)
for dx in [-.42,.42]:box('Mudroom upper door',(x+dx,2.34,z-d/2-.012),(.58,.42,.022),navy,.005)
box('Mudroom coat rail',(x,1.83,z-d/2-.045),(w-.18,.035,.035),brass,.004)
for i,(dx,m) in enumerate([(-.38,olive),(0,cream),(.38,leather)]):
 cyl('Mudroom hook '+str(i),(x+dx,1.78,z-d/2-.075),.025,.07,brass,16)
 # Simple tapered hanging-coat silhouettes, dense enough to read without closing the narrow room.
 box('Mudroom coat body '+str(i),(x+dx,1.35,z-d/2-.09),(.30,.70,.10),m,.045)
 box('Mudroom coat shoulder '+str(i),(x+dx,1.66,z-d/2-.09),(.42,.16,.11),m,.055)
# Boot tray and umbrella stand use dead corners, away from every doorway.
box('Mudroom boot tray',(x,.035,z-.43),(w-.12,.035,.34),rubber,.018)
ux=layout[1]['x'];uz=layout[1]['z'];cyl('Umbrella stand',(ux,.30,uz),.15,.60,steel,24)
for i,dx in enumerate([-.055,.04]):
 cyl('Umbrella shaft '+str(i),(ux+dx,.73,uz),.014,.92,brass,14)
 box('Umbrella handle '+str(i),(ux+dx+.035,1.17,uz),(.07,.035,.025),brass,.012)

bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/mudroom-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'mudroom-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/mudroom-furniture-v002.json').read_bytes()).hexdigest(),'note':'Built-in coat and shoe storage with all Foyer, Half Bath and Kitchen routes clear.'}
(SRC/'mudroom-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
