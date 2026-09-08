"""Author the normal upstairs household storage room. Run through Blender MCP."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Storage Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing storage scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;return m
steel=mat('Storage blackened steel',(.035,.04,.04),.40,.68);wood=mat('Storage utility plywood',(.39,.25,.12),.82);cardboard=mat('Storage cardboard',(.43,.30,.16),.92)
navy=mat('Storage navy bin',(.035,.07,.10),.72);olive=mat('Storage olive bin',(.14,.18,.10),.76);cream=mat('Storage cream bin',(.61,.56,.46),.84);paper=mat('Storage paper label',(.76,.69,.55),.92);brass=mat('Storage aged latch',(.29,.18,.07),.36,.65)
def box(name,p,s,m,bevel=.006):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
layout=json.loads((ROOT/'lib/storage-furniture-v002.json').read_text())
# Deep east-wall rack: steel uprights, plywood shelves, and mixed household bins.
for z in [6.55,8.69]:
 for x in [.77,1.05]:box('East rack upright',(x,1.10,z),(.045,2.18,.045),steel,.004)
for y in [.16,.62,1.08,1.54,2.00]:box('East rack shelf',(.91,y,7.62),(.36,.045,2.38),wood,.004)
for row,y in enumerate([.37,.83,1.29,1.75]):
 for i,z in enumerate([6.82,7.36,7.90,8.44]):
  m=[navy,olive,cream,cardboard][(row+i)%4];box('East storage bin '+str(row)+' '+str(i),(.89,y,z),(.29,.34,.43),m,.018)
  box('East bin label '+str(row)+' '+str(i),(.70,y,z),(.012,.07,.17),paper,.002)
# North rack turns the shelving around the corner while retaining the center aisle.
for x in [-.55,.87]:
 for z in [9.07,9.29]:box('North rack upright',(x,1.10,z),(.045,2.18,.045),steel,.004)
for y in [.16,.62,1.08,1.54,2.00]:box('North rack shelf',(.16,y,9.18),(1.48,.045,.34),wood,.004)
for row,y in enumerate([.38,.84,1.30,1.76]):
 for i,x in enumerate([-.38,.16,.70]):
  m=[cardboard,navy,olive][(row+i)%3];box('North storage box '+str(row)+' '+str(i),(x,y,9.17),(.44,.35,.27),m,.018)
  box('North box label '+str(row)+' '+str(i),(x,y,8.99),(.18,.07,.012),paper,.002)
# Floor stack occupies the dead southeast corner away from the west doorway.
for i,(x,z,w,d,h) in enumerate([(-.76,6.48,.52,.56,.34),(-.60,6.60,.45,.48,.30),(-.72,6.55,.38,.42,.27)]):
 y=sum([.34,.30,.27][:i])+.5*h;box('Seasonal floor box '+str(i),(x,y,z),(w,h,d),cardboard,.018);box('Seasonal label '+str(i),(x,y,z-d/2-.008),(.18,.07,.012),paper,.002)
box('Small lockbox',(-.45,1.77,9.17),(.34,.18,.24),navy,.018);box('Lockbox latch',(-.45,1.77,9.03),(.08,.07,.025),brass,.006)

bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/storage-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'storage-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/storage-furniture-v002.json').read_bytes()).hexdigest(),'note':'Normal household storage with perimeter racks, labeled bins, seasonal boxes and open center floor.'}
(SRC/'storage-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
