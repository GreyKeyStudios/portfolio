"""Author the long, narrow second-floor full bathroom. Run through Blender MCP."""
import bpy,json,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Bathroom Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing bathroom scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0,alpha=1):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,alpha);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 if alpha<1:b.inputs['Alpha'].default_value=alpha;b.inputs['Transmission Weight'].default_value=.18;m.surface_render_method='DITHERED'
 return m
navy=mat('Bathroom navy vanity',(.035,.07,.10),.62);oak=mat('Bathroom smoked oak',(.25,.13,.06),.48);stone=mat('Bathroom warm stone',(.50,.47,.41),.38)
porcelain=mat('Bathroom porcelain',(.82,.80,.75),.25);brass=mat('Bathroom aged brass',(.30,.19,.07),.30,.76);mirror=mat('Bathroom mirror',(.19,.27,.29),.10,.48)
glass=mat('Bathroom shower glass',(.40,.58,.62),.10,.05,.24);linen=mat('Bathroom oatmeal textile',(.57,.50,.40),.94);white=mat('Bathroom white textile',(.79,.76,.70),.94)
def box(name,p,s,m,bevel=.006):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(name,p,r,d,m,verts=32,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d,location=(p[0],-p[2],p[1]),rotation=rot);o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
def sphere(name,p,s,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 for poly in o.data.polygons:poly.use_smooth=True
 parts.append(o);return o
def oval_ring(name,p,s,m):
 bpy.ops.mesh.primitive_torus_add(major_radius=.24,minor_radius=.035,major_segments=40,minor_segments=8,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 for poly in o.data.polygons:poly.use_smooth=True
 parts.append(o);return o
layout=json.loads((ROOT/'lib/bathroom-furniture-v002.json').read_text())
# Vanity runs along the east wall near the entrance and faces west into the aisle.
box('Bathroom vanity case',(2.72,.45,6.55),(.48,.82,1.18),navy,.018);box('Bathroom vanity top',(2.69,.89,6.55),(.55,.06,1.24),stone,.016)
for z in [6.20,6.55,6.90]:box('Bathroom vanity drawer',(2.43,.50,z),(.025,.22,.29),navy,.004);box('Bathroom drawer pull',(2.40,.50,z),(.018,.025,.14),brass,.008)
cyl('Bathroom sink',(2.64,.94,6.55),.24,.09,porcelain,40);cyl('Bathroom faucet',(2.76,1.10,6.55),.018,.30,brass,20)
box('Bathroom mirror',(2.965,1.75,6.55),(.025,.88,.98),mirror,.018);box('Bathroom mirror top rail',(2.94,2.20,6.55),(.035,.035,1.04),brass,.006);box('Bathroom mirror bottom rail',(2.94,1.30,6.55),(.035,.035,1.04),brass,.006)
# Toilet faces west, leaving its tank against the east wall.
box('Bathroom toilet cistern',(2.77,.69,8.18),(.28,.68,.53),porcelain,.055);box('Bathroom toilet tank lid',(2.77,1.06,8.18),(.31,.055,.57),porcelain,.022)
sphere('Bathroom toilet bowl',(2.43,.38,8.18),(.37,.25,.29),porcelain);oval_ring('Bathroom toilet seat',(2.34,.55,8.18),(1.45,.58,1.0),porcelain);box('Bathroom bowl neck',(2.61,.39,8.18),(.34,.26,.48),porcelain,.10)
cyl('Bathroom flush button',(2.62,1.095,8.18),.035,.018,brass,18)
# Alcove tub spans the north end beneath the privacy window.
box('Bathroom tub body',(2.08,.31,10.34),(1.58,.60,.76),porcelain,.075);box('Bathroom tub hollow',(2.08,.58,10.30),(1.28,.08,.48),stone,.09)
box('Bathroom tub rim',(2.08,.63,10.34),(1.62,.065,.80),porcelain,.045);box('Bathroom tub basin opening',(2.08,.67,10.29),(1.30,.025,.50),glass,.11)
cyl('Bathroom tub spout',(1.38,.82,10.04),.025,.24,brass,20,rot=(0,math.pi/2,0));cyl('Bathroom shower riser',(1.29,1.63,10.12),.018,1.65,brass,20)
cyl('Bathroom shower head',(1.43,2.39,10.12),.105,.05,brass,28,rot=(0,math.pi/2,0))
box('Bathroom shower screen',(2.63,1.50,9.94),(.58,1.68,.025),glass,.008);box('Shower screen post',(2.94,1.50,9.94),(.025,1.72,.035),brass,.004)
# Soft pieces add scale but stay outside the collision path.
box('Bathroom runner',(1.66,.025,7.55),(.72,.025,2.55),linen,.025)
for i in range(3):box('Bathroom folded towel '+str(i),(1.40,.76+i*.09,9.36),(.38,.075,.26),white,.018)
box('Bathroom towel rail',(1.22,1.35,7.20),(.035,.035,.72),brass,.006);box('Bathroom hanging towel',(1.25,1.08,7.20),(.05,.48,.58),linen,.025)

bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/bathroom-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'bathroom-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/bathroom-furniture-v002.json').read_bytes()).hexdigest(),'note':'Long residential full bath with vanity, toilet, alcove tub/shower and clear hall-to-tub aisle.'}
(SRC/'bathroom-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
