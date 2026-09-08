"""Author the compact upstairs linen closet. Run through Blender MCP."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Linen Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing linen scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;return m
paint=mat('Linen warm built-in',(.57,.54,.47),.76);oak=mat('Linen shelf oak',(.29,.17,.08),.66);white=mat('Linen white towels',(.76,.73,.66),.96);oat=mat('Linen oatmeal towels',(.55,.48,.38),.96);navy=mat('Linen navy towels',(.035,.07,.10),.94);basket=mat('Linen woven basket',(.42,.27,.12),.89);brass=mat('Linen aged brass',(.34,.21,.07),.36,.62);glow=mat('Linen opal light',(.92,.79,.58),.62,0)
def box(name,p,s,m,bevel=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
# Full-height back-wall linen press with two lower cupboards and open shelves above.
for x in [-.82,.82]:box('Back cabinet stile',(x,1.18,10.58),(.055,2.28,.34),paint,.005)
for y in [.08,.72,1.12,1.52,1.92,2.28]:box('Back cabinet shelf',(0,y,10.58),(1.70,.045,.34),oak,.004)
box('Lower cupboard left',(-.42,.39,10.55),(.78,.60,.38),paint,.012);box('Lower cupboard right',(.42,.39,10.55),(.78,.60,.38),paint,.012)
for x in [-.07,.07]:box('Cupboard pull',(x,.43,10.34),(.035,.20,.025),brass,.006)
# Ordered stacks break up the shelves without making this tiny room feel cluttered.
for row,(y,m) in enumerate([(0.86,white),(1.25,oat),(1.65,navy),(2.05,white)]):
 for i,x in enumerate([-.55,-.18,.20,.57]):
  w=.28;box('Folded linen '+str(row)+' '+str(i),(x,y,10.38),(w,.075,.24),m,.018)
  box('Folded linen layer '+str(row)+' '+str(i),(x,y+.075,10.38),(w*.96,.065,.235),m,.018)
# A shallow return shelf uses the east wall and leaves the west-side doorway clear.
for z in [9.55,10.20]:box('East shelf upright',(.96,1.13,z),(.045,2.18,.045),paint,.004)
for y in [.12,.58,1.04,1.50,1.96,2.20]:box('East return shelf',(.91,y,9.88),(.34,.04,.72),oak,.004)
for row,y in enumerate([.34,.80,1.26,1.72]):
 box('East basket '+str(row),(.89,y,9.87),(.28,.30,.46),basket,.025)
# Woven floor hamper and a compact warm ceiling fixture.
box('Linen hamper',(.74,.31,10.43),(.34,.58,.34),basket,.035);box('Hamper lid',(.74,.62,10.43),(.37,.045,.37),oak,.018)
box('Ceiling mount',(0,2.91,10.04),(.42,.08,.42),brass,.025);box('Opal shade',(0,2.83,10.04),(.34,.10,.34),glow,.04)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/linen-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'linen-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/linen-furniture-v002.json').read_bytes()).hexdigest(),'note':'Compact windowless linen closet with built-in press, folded linens, baskets, hamper and clear west-door standing space.'}
(SRC/'linen-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
