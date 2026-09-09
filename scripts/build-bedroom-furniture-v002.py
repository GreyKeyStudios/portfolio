"""Author the west-wing Master Bedroom with replaceable merch surfaces. Run through Blender MCP."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender';TEX=ROOT/'public/textures/merch-placeholders'
name='Stackhouse Bedroom Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing bedroom scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;return m
def image_mat(name,path):
 m=mat(name,(1,1,1),.82);n=m.node_tree.nodes;t=n.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(path),check_existing=True);m.node_tree.links.new(t.outputs['Color'],n.get('Principled BSDF').inputs['Base Color']);return m
surfaces=json.loads((ROOT/'lib/bedroom-merch-surfaces-v002.json').read_text());paths={s['surface']:TEX/s['file'] for s in surfaces}
oak=mat('Bedroom smoked oak',(.20,.095,.035),.48);navy=mat('Bedroom ink navy',(.022,.048,.072),.70);cream=mat('Bedroom warm ivory',(.67,.63,.55),.78);linen=mat('Bedroom oatmeal linen',(.53,.45,.35),.94);white=mat('Bedroom warm white linen',(.78,.75,.68),.96);brass=mat('Bedroom aged brass',(.34,.20,.065),.34,.70);glass=mat('Bedroom mirror',(.30,.37,.40),.14,.20);green=mat('Bedroom foliage',(.055,.16,.075),.88);terra=mat('Bedroom planter',(.35,.15,.07),.83)
comfort=image_mat('MERCH_SWAP comforter-panel',paths['comforter-panel']);printmat=image_mat('MERCH_SWAP framed-print',paths['framed-print'])
def box(n,p,s,m,b=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=n;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if b:o.modifiers.new('Soft edges','BEVEL').width=b;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(n,p,r,d,m,v=28):
 bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=d,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=n;o.data.materials.append(m);parts.append(o);return o
# Bed runs east from the west wall, leaving the south entry and east closet door open.
box('Master bed frame',(-5.28,.28,7.15),(2.25,.38,1.90),oak,.035);box('Master mattress',(-5.22,.55,7.15),(2.13,.27,1.80),white,.07)
box('Master upholstered headboard',(-6.43,1.18,7.15),(.15,1.46,2.02),navy,.055);box('Replaceable master comforter',(-5.05,.79,7.15),(1.50,.10,1.75),comfort,.045)
for z in [6.69,7.61]:box('Master pillow',(-6.02,.84,z),(.58,.18,.72),linen,.07)
for z in [5.99,8.31]:
 box('Master nightstand',(-6.12,.37,z),(.50,.66,.48),cream,.025);box('Master nightstand top',(-6.12,.72,z),(.54,.055,.52),oak,.015);box('Master nightstand pull',(-5.85,.46,z),(.025,.06,.17),brass,.006);cyl('Master lamp base',(-6.12,.82,z),.12,.12,brass);box('Master lamp shade',(-6.12,1.10,z),(.32,.38,.32),linen,.055)
# Dresser and chaise occupy solid bays around the two windows.
box('Master dresser',(-5.45,.49,10.45),(1.48,.88,.46),cream,.025);box('Master dresser top',(-5.45,.96,10.45),(1.56,.06,.51),oak,.016)
for y in [.27,.55,.81]:
 for x in [-5.78,-5.12]:box('Master drawer',(x,y,10.18),(.58,.20,.025),navy,.006);box('Master drawer pull',(x,y,10.15),(.18,.025,.025),brass,.005)
box('Window chaise base',(-6.16,.30,8.82),(.66,.42,1.30),oak,.035);box('Window chaise cushion',(-6.12,.56,8.82),(.72,.18,1.26),linen,.07);box('Window chaise back',(-6.38,.88,9.31),(.16,.70,.54),navy,.055)
cyl('Chaise side table',(-5.42,.48,9.18),.25,.06,oak,32);cyl('Chaise table stem',(-5.42,.25,9.18),.055,.42,brass,20)
# Replaceable art, mirror and soft furnishings complete the bedroom without retail staging.
box('Master merch frame',(-1.31,1.72,6.72),(.055,1.22,.92),oak,.012);box('Replaceable master merch print',(-1.275,1.72,6.72),(.018,1.09,.79),printmat,.002)
box('Master full mirror frame',(-2.02,1.30,10.63),(.82,2.02,.08),oak,.016);box('Master full mirror',(-2.02,1.30,10.58),(.70,1.88,.018),glass,.003)
box('Master rug',(-4.10,.025,8.25),(2.55,.035,2.35),linen,.025);box('Master foot bench',(-3.82,.35,7.15),(.48,.46,1.42),navy,.045)
cyl('Master planter',(-2.00,.30,5.82),.25,.52,terra,28)
for i,(x,z,h) in enumerate([(-2.00,5.82,1.05),(-2.18,5.88,.82),(-1.84,5.72,.88)]):box('Master plant leaf '+str(i),(x,.65+h/2,z),(.09,h,.30),green,.06)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/bedroom-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'bedroom-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/bedroom-furniture-v002.json').read_bytes()).hexdigest(),'merch_sha256':hashlib.sha256((ROOT/'lib/bedroom-merch-surfaces-v002.json').read_bytes()).hexdigest(),'note':'West-wing master bedroom with clear south entry/east dressing-room route and replaceable merch surfaces.'}
(SRC/'bedroom-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
