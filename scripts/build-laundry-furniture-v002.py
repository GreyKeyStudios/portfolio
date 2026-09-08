"""Author the compact ground-floor laundry. Run through Blender MCP."""
import bpy,json,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Laundry Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing laundry scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 if emit:b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=emit
 return m
ivory=mat('Laundry warm ivory',(.69,.67,.61),.58);oak=mat('Laundry smoked oak',(.25,.13,.06),.48);stone=mat('Laundry warm stone',(.46,.43,.38),.44)
steel=mat('Laundry brushed steel',(.31,.33,.34),.34,.62);black=mat('Laundry appliance glass',(.012,.018,.021),.18,.08);brass=mat('Laundry aged brass',(.29,.18,.07),.34,.7)
linen=mat('Laundry linen',(.49,.42,.33),.95);blue=mat('Laundry detergent blue',(.10,.20,.30),.62);amber=mat('Laundry detergent amber',(.42,.20,.055),.58);glow=mat('Laundry opal light',(.88,.75,.55),.62,0,.35)
def box(name,p,s,m,bevel=.006):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(name,p,r,d,m,verts=24,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d,location=(p[0],-p[2],p[1]),rotation=rot);o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
def place_group(objs,cx,cz,yaw):
 c=math.cos(yaw);s=math.sin(yaw)
 for o in objs:
  x,y,z=o.location;o.location=(cx+c*x-s*y,-cz+s*x+c*y,z);o.rotation_euler.z+=yaw
layout=json.loads((ROOT/'lib/laundry-furniture-v002.json').read_text())
for f in layout:
 start=len(parts);fid=f['id'];w=f['width'];d=f['depth']
 if fid in ['washer','dryer']:
  box(fid+' case',(0,.51,0),(w,1.02,d),ivory,.025);box(fid+' control band',(0,.84,d/2+.012),(w-.08,.20,.025),steel,.008)
  # Front-loading appliance window faces the room after the group rotation.
  cyl(fid+' glass door',(0,.47,d/2+.035),.235,.045,black,40,rot=(math.pi/2,0,0));cyl(fid+' steel rim',(0,.47,d/2+.058),.275,.025,steel,40,rot=(math.pi/2,0,0))
  for x in [-.17,.17]:cyl(fid+' control',(x,.86,d/2+.035),.032,.025,brass,20,rot=(math.pi/2,0,0))
 elif fid=='utility-counter':
  box('Utility cabinet',(0,.43,0),(w,.84,d),ivory,.015);box('Utility counter',(0,.88,0),(w+.05,.06,d+.06),stone,.012)
  box('Utility sink',(0,.915,0),(.52,.025,.31),steel,.03);cyl('Utility faucet',(0,1.09,-.12),.018,.34,brass,20)
  for x in [-.50,.50]:box('Utility shaker door',(x,.45,d/2+.012),(.42,.66,.022),ivory,.005)
  # Upper shelf and practical laundry supplies give the narrow room vertical detail.
  box('Laundry upper shelf',(0,1.66,.06),(w,.055,d-.02),oak,.006)
  for i,(x,m) in enumerate([(-.48,blue),(-.16,amber),(.18,blue),(.48,linen)]):
   box('Laundry supply '+str(i),(x,1.82,.05),(.20,.27,.19),m,.025)
 for o in parts[start:]: pass
 place_group(parts[start:],f['x'],f['z'],f['yaw'])

# A narrow wall shelf above the machines and a folded-towel stack use otherwise empty height.
box('Machine wall shelf',(.77,1.42,9.05),(.58,.055,1.55),oak,.006)
for i in range(3):box('Folded towel '+str(i),(.77,1.50+i*.085,8.72),(.42,.075,.27),linen,.018)
cyl('Laundry ceiling light',(0,2.75,9.45),.24,.10,glow,32)

bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/laundry-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'laundry-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/laundry-furniture-v002.json').read_bytes()).hexdigest(),'note':'Compact washer/dryer wall, utility sink, storage and clear working aisle.'}
(SRC/'laundry-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
