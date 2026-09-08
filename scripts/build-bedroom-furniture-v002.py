"""Author the Master Bedroom with replaceable Grey Key merch surfaces. Run through Blender MCP."""
import bpy,json,hashlib,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender';TEX=ROOT/'public/textures/merch-placeholders';TEX.mkdir(parents=True,exist_ok=True)
name='Stackhouse Bedroom Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing bedroom scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def placeholder(filename,variant):
 p=TEX/filename
 if p.exists():return p
 n=256;im=bpy.data.images.new('Replaceable '+filename,width=n,height=n,alpha=True);pixels=[]
 for y in range(n):
  for x in range(n):
   u=x/(n-1);v=y/(n-1);border=u<.035 or u>.965 or v<.035 or v>.965
   if variant==0: band=abs((u+v)-1)<.075; c=(.62,.42,.12,1) if border or band else (.025,.055,.08,1)
   elif variant==1: c=(.68,.55,.30,1) if border or (abs(u-.5)<.055 and .25<v<.75) else (.045,.075,.095,1)
   else: c=(.72,.65,.52,1) if border or ((u-.5)**2+(v-.5)**2<.10) else (.035,.065,.09,1)
   pixels.extend(c)
 im.pixels=list(pixels);im.filepath_raw=str(p);im.file_format='PNG';im.save();bpy.data.images.remove(im);return p
surfaces=json.loads((ROOT/'lib/bedroom-merch-surfaces-v002.json').read_text())
paths={s['surface']:placeholder(s['file'],i) for i,s in enumerate(surfaces)}
def mat(name,color,rough=.7,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;return m
def image_mat(name,path,rough=.82):
 m=mat(name,(1,1,1),rough);nodes=m.node_tree.nodes;tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(path),check_existing=True);m.node_tree.links.new(tex.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color']);return m
oak=mat('Bedroom smoked oak',(.22,.11,.045),.52);navy=mat('Bedroom navy paint',(.025,.055,.08),.70);cream=mat('Bedroom warm painted wood',(.61,.58,.51),.78);linen=mat('Bedroom oatmeal linen',(.55,.48,.39),.94);white=mat('Bedroom warm white linen',(.76,.73,.67),.96);brass=mat('Bedroom aged brass',(.35,.21,.07),.34,.68);glass=mat('Bedroom mirror',(.32,.40,.43),.16,.18);dark=mat('Bedroom dark textile',(.055,.045,.04),.94)
comfort=image_mat('MERCH_SWAP comforter-panel',paths['comforter-panel']);printmat=image_mat('MERCH_SWAP framed-print',paths['framed-print']);shirtmat=image_mat('MERCH_SWAP folded-shirt',paths['folded-shirt'])
def box(name,p,s,m,bevel=.008,rot=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]),rotation=(0,0,rot));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(name,p,r,depth,m,verts=28):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
# Bed projects from west wall; the room remains open from its south door to both sides.
box('Bed frame',(4.22,.29,8.05),(2.18,.38,1.76),oak,.035);box('Mattress',(4.30,.55,8.05),(2.02,.28,1.66),white,.07)
box('Upholstered headboard',(3.16,1.13,8.05),(.16,1.35,1.86),navy,.05)
box('Replaceable merch comforter',(4.52,.79,8.05),(1.45,.10,1.62),comfort,.045)
for z in [7.61,8.49]:box('Bed pillow',(3.52,.82,z),(.58,.18,.68),linen,.07)
# Nightstands flank the headboard without expanding the bed collision footprint.
for z in [6.91,9.19]:
 box('Bedroom nightstand',(3.34,.36,z),(.52,.64,.46),cream,.025);box('Nightstand top',(3.34,.70,z),(.56,.055,.50),oak,.015);box('Nightstand pull',(3.62,.44,z),(.025,.06,.18),brass,.006)
 cyl('Bedside lamp base',(3.34,.79,z),.12,.12,brass);box('Bedside lamp shade',(3.34,1.05,z),(.31,.35,.31),linen,.05)
# Wardrobe occupies the solid north-wall bay to the right of the window. Its right
# half stays open so the merch reads as clothing in a bedroom rather than inventory.
box('Wardrobe back',(5.98,1.18,10.70),(1.08,2.28,.05),navy,.008)
for x in [5.46,6.50]:box('Wardrobe side',(x,1.18,10.50),(.055,2.28,.42),navy,.008)
box('Wardrobe top',(5.98,2.29,10.50),(1.08,.07,.42),navy,.008);box('Wardrobe divider',(5.98,1.18,10.50),(.045,2.18,.42),navy,.006)
box('Wardrobe left door',(5.73,1.23,10.27),(.46,2.08,.035),cream,.012);box('Wardrobe handle',(5.91,1.23,10.23),(.035,.48,.025),brass,.008)
for y in [.18,.72,1.12]:box('Open wardrobe shelf',(6.23,y,10.49),(.46,.04,.38),oak,.004)
# Folded placeholder merch is a separate named, textured surface ready for replacement.
for i,y in enumerate([.30,.44,.58]):box('Folded merch shirt '+str(i),(6.23,y,10.26),(.38,.09,.29),shirtmat if i==2 else dark,.025)
box('Wardrobe hanging rail',(6.23,1.91,10.47),(.40,.035,.035),brass,.004)
for i,x in enumerate([6.10,6.23,6.36]):
 box('Hanging merch '+str(i),(x,1.48,10.27),(.11,.62,.06),[navy,dark,linen][i],.025)
# Dresser sits safely left of the south doorway.
box('Bedroom dresser',(3.80,.48,5.68),(1.34,.86,.42),cream,.024);box('Dresser top',(3.80,.94,5.68),(1.42,.06,.47),oak,.015)
for row,y in enumerate([.26,.52,.78]):
 for x in [3.48,4.12]:box('Dresser drawer '+str(row),(x,y,5.44),(.58,.20,.025),navy,.006);box('Dresser pull '+str(row),(x,y,5.41),(.18,.025,.025),brass,.005)
# Framed merch art and a full-length mirror use the remaining solid wall areas.
box('Merch print frame',(3.18,1.72,6.05),(.055,1.16,.86),oak,.012);box('Replaceable framed merch print',(3.145,1.72,6.05),(.018,1.04,.74),printmat,.002)
box('Full length mirror frame',(6.46,1.25,6.37),(.08,1.95,.78),oak,.015);box('Full length mirror',(6.41,1.25,6.37),(.018,1.82,.66),glass,.003)
# Hat and weekender suggest merch naturally, without a retail display.
cyl('Dresser hat brim',(3.75,1.02,5.66),.23,.035,navy,36);cyl('Dresser hat crown',(3.75,1.10,5.66),.14,.14,navy,36)
box('Canvas weekender',(5.95,.28,9.82),(.72,.48,.36),linen,.06);box('Weekender strap',(5.95,.58,9.82),(.46,.12,.06),oak,.025)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/bedroom-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'bedroom-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/bedroom-furniture-v002.json').read_bytes()).hexdigest(),'merch_sha256':hashlib.sha256((ROOT/'lib/bedroom-merch-surfaces-v002.json').read_bytes()).hexdigest(),'note':'Master bedroom first, with replaceable merch image surfaces on bedding, framed art and folded apparel.'}
(SRC/'bedroom-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
