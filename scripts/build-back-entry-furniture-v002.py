"""Author the rear-entry mudroom and its real exterior door."""
import bpy,json,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender';parts=[]
scene=bpy.context.scene;scene.name='Stackhouse Back Entry v002';scene.unit_settings.system='METRIC'
def mat(name,color,rough=.7,metal=0,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 if emit:b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=emit
 return m
navy=mat('Back entry navy',(.025,.055,.08),.68);oak=mat('Back entry smoked oak',(.20,.095,.035),.5);linen=mat('Back entry oatmeal',(.56,.50,.41),.92)
brass=mat('Back entry aged brass',(.34,.20,.065),.34,.68);rubber=mat('Back entry boot tray',(.025,.03,.03),.9);glass=mat('Back door glass',(.12,.20,.24),.2,.05);paper=mat('Back entry labels',(.70,.65,.54),.9)
def box(name,p,s,m,bevel=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(name,p,r,d,m,verts=24,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d,location=(p[0],-p[2],p[1]),rotation=rot);o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
# East-wall built-in: a compact landing place rather than a second full coat room.
box('Back entry bench',(0.86,.35,9.10),(.46,.58,1.50),navy,.014);box('Back entry seat',(0.83,.68,9.10),(.54,.08,1.58),oak,.016);box('Bench cushion',(0.79,.75,9.10),(.42,.07,1.36),linen,.025)
box('Coat panel',(1.04,1.55,9.10),(.035,1.50,1.50),navy,.005);box('Upper cubbies',(0.88,2.33,9.10),(.36,.48,1.50),navy,.012)
for z in [8.64,9.10,9.56]:
 cyl('Coat hook',(0.99,1.72,z),.025,.07,brass,18,rot=(0,math.pi/2,0))
box('Boot tray',(0.73,.035,9.10),(.56,.035,1.28),rubber,.015)
# Small south-wall household cabinet leaves the Kitchen and exterior-door turn open.
box('Utility cabinet',(0.62,.47,8.42),(.72,.88,.42),navy,.012);box('Utility top',(0.62,.94,8.42),(.78,.06,.46),oak,.012)
for x in [.38,.86]:box('Utility door',(x,.50,8.19),(.40,.66,.025),navy,.006)
box('Bag basket',(0.62,1.12,8.42),(.54,.28,.32),linen,.025)
# Actual rear door centered in the generated north-wall opening.
box('Back door slab',(0,1.05,10.73),(.94,2.10,.07),oak,.018);box('Back door glass',(0,1.47,10.685),(.56,.78,.018),glass,.01)
for x in [-.35,.35]:box('Back door stile',(x,1.47,10.66),(.08,.92,.04),oak,.006)
for y in [1.06,1.88]:box('Back door rail',(0,y,10.66),(.76,.08,.04),oak,.006)
cyl('Back door handle',(-.34,1.00,10.62),.035,.08,brass,20,rot=(math.pi/2,0,0))
box('Interior entry mat',(0,.025,10.20),(.90,.03,.48),rubber,.018)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/back-entry-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'back-entry-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/back-entry-furniture-v002.json').read_bytes()).hexdigest(),'note':'Rear-entry bench, cubbies, hooks, boot storage, utility landing and glazed exterior back door.'}
(SRC/'back-entry-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
