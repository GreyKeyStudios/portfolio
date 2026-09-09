"""Author the merged upstairs walk-in closet / dressing room. Run through Blender MCP."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender';TEX=ROOT/'public/textures/merch-placeholders'
name='Stackhouse Master Closet v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing master closet scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;return m
def image_mat(name,path):
 m=mat(name,(1,1,1),.86);n=m.node_tree.nodes;t=n.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(path),check_existing=True);m.node_tree.links.new(t.outputs['Color'],n.get('Principled BSDF').inputs['Base Color']);return m
oak=mat('Closet smoked oak',(.21,.105,.04),.52);cream=mat('Closet warm ivory',(.66,.62,.54),.76);navy=mat('Closet navy textile',(.025,.055,.08),.90);linen=mat('Closet oatmeal textile',(.50,.42,.32),.94);brass=mat('Closet aged brass',(.34,.20,.06),.34,.68);glass=mat('Closet mirror',(.31,.39,.42),.14,.20);dark=mat('Closet dark textile',(.045,.04,.038),.94);shirt=image_mat('MERCH_SWAP folded-shirt',TEX/'bedroom-folded-shirt.png')
def box(n,p,s,m,b=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=n;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if b:o.modifiers.new('Soft edges','BEVEL').width=b;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(n,p,r,d,m,v=20,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=d,location=(p[0],-p[2],p[1]),rotation=rot);o=bpy.context.object;o.name=n;o.data.materials.append(m);parts.append(o);return o
# Full east-wall wardrobe run: drawers below, shelves and two hanging zones above.
box('Closet east back',(1.05,1.18,8.55),(.08,2.30,3.82),cream,.008)
for z in [6.66,8.02,9.38,10.44]:box('Closet east stile',(.83,1.18,z),(.055,2.26,.055),oak,.005)
for y in [.12,.72,1.46,2.26]:box('Closet east shelf',(.86,y,8.55),(.42,.045,3.76),oak,.004)
for z in [7.35,8.72,10.02]:cyl('Closet hanging rail',(.64,1.92,z),.016,1.10,brass,18,rot=(1.5708,0,0))
for i,z in enumerate([6.92,7.18,7.48,7.76,8.28,8.58,8.88,9.14,9.66,9.94,10.22]):
 box('Hanging garment '+str(i),(.60,1.56,z),(.10,.62,.20),[navy,dark,linen,shirt][i%4],.025)
for i,z in enumerate([6.88,7.38,7.88,8.38,8.88,9.38,9.88,10.24]):box('Closet drawer '+str(i),(.61,.39,z),(.055,.48,.40),cream,.006);box('Closet drawer pull '+str(i),(.575,.42,z),(.025,.035,.16),brass,.004)
# North shoe wall and south accessory drawers make the former Linen segment part of one room.
for y in [.12,.42,.72,1.02,1.32,1.62,1.92,2.22]:box('Closet north shoe shelf',(0,y,10.58),(1.72,.04,.34),oak,.004)
for row,y in enumerate([.25,.55,.85,1.15,1.45,1.75,2.05]):
 for x in [-.58,-.19,.20,.59]:box('Closet shoe '+str(row)+' '+str(x),(x,y,10.36),(.28,.11,.25),[navy,dark,linen][(row+int((x+.6)*10))%3],.035)
box('Closet south drawer bank',(0,.52,6.48),(1.72,.96,.34),cream,.018);box('Closet south top',(0,1.03,6.48),(1.78,.055,.39),oak,.012)
for x in [-.57,0,.57]:
 for y in [.28,.58,.86]:box('Closet accessory drawer',(x,y,6.28),(.48,.22,.025),cream,.006);box('Closet accessory pull',(x,y,6.25),(.16,.025,.025),brass,.004)
# Mirror occupies the west wall north of the single bedroom entry; a small rug remains walkable.
box('Closet mirror frame',(-1.04,1.28,9.90),(.06,2.05,.78),oak,.015);box('Closet full mirror',(-1.00,1.28,9.90),(.018,1.91,.66),glass,.003)
box('Closet runner',(0,.02,8.55),(.72,.025,2.48),navy,.02)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/master-closet-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'master-closet-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/master-closet-furniture-v002.json').read_bytes()).hexdigest(),'merch_sha256':hashlib.sha256((ROOT/'lib/bedroom-merch-surfaces-v002.json').read_bytes()).hexdigest(),'note':'Merged Storage and Linen dressing room with one bedroom entrance, clear center aisle and replaceable merch apparel.'}
(SRC/'master-closet-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
