"""Author the Kitchen-to-Dining walk-through pantry. Run through Blender MCP."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Pantry Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing pantry scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;return m
oak=mat('Pantry smoked oak',(.25,.13,.06),.48);ivory=mat('Pantry warm ivory',(.72,.69,.62),.66);brass=mat('Pantry aged brass',(.28,.18,.07),.34,.7)
glass=mat('Pantry glass',(.28,.34,.35),.2);paper=mat('Pantry paper labels',(.74,.67,.53),.9);green=mat('Pantry olive jars',(.16,.21,.10),.7);red=mat('Pantry preserves',(.35,.06,.035),.65)
def box(name,p,s,m,bevel=.006):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(name,p,r,d,m,verts=16):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
layout=json.loads((ROOT/'lib/pantry-furniture-v002.json').read_text())
for unit in layout:
 x=unit['x'];z=unit['z'];w=unit['width'];d=unit['depth'];north='north' in unit['id'];face=-1 if north else 1
 box(unit['id']+' plinth',(x,.05,z),(w,.10,d),oak,.01)
 for px in [x-w/2+.035,x+w/2-.035]:box(unit['id']+' upright',(px,1.12,z),(.07,2.18,d),oak,.008)
 for y in [.18,.62,1.06,1.50,1.94]:box(unit['id']+' shelf',(x,y,z),(w,.055,d),oak,.005)
 # Tall lower bins, labeled dry-goods canisters, preserves and baskets build density without narrowing the passage.
 for i,px in enumerate([x-.72,x-.24,x+.24,x+.72]):
  box(unit['id']+' lower bin '+str(i),(px,.36,z+face*.015),(.40,.30,d-.055),ivory,.018)
  box(unit['id']+' bin label '+str(i),(px,.39,z+face*(d/2+.006)),(.15,.07,.012),paper,.002)
 for row,y in enumerate([.78,1.22,1.66]):
  for i,px in enumerate([x-.76,x-.38,x,x+.38,x+.76]):
   material=[green,red,glass][(i+row)%3];cyl(unit['id']+' jar '+str(row)+' '+str(i),(px,y,z+face*.035),.09,.23,material,20)
   cyl(unit['id']+' lid '+str(row)+' '+str(i),(px,y+.125,z+face*.035),.094,.025,brass,20)
 # Woven-looking top baskets read as household storage from either doorway.
 for i,px in enumerate([x-.62,x+.62]):box(unit['id']+' top basket '+str(i),(px,2.15,z),(.62,.28,d-.045),ivory,.025)

bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/pantry-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'pantry-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/pantry-furniture-v002.json').read_bytes()).hexdigest(),'note':'Two-sided walk-through pantry storage with a clear Kitchen-to-Dining center aisle.'}
(SRC/'pantry-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
