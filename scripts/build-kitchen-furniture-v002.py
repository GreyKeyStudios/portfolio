"""Author the working kitchen and breakfast corner. Run through Blender MCP."""
import bpy,json,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Kitchen Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing kitchen scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 if emit:b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=emit
 return m
paint=mat('Kitchen warm ivory',(.69,.66,.59),.56);oak=mat('Kitchen smoked oak',(.27,.14,.065),.46);stone=mat('Kitchen honed warm stone',(.46,.43,.37),.42)
steel=mat('Kitchen brushed steel',(.28,.30,.31),.32,.68);black=mat('Kitchen black glass',(.012,.016,.019),.22,.08);brass=mat('Kitchen aged brass',(.27,.17,.065),.35,.72)
linen=mat('Breakfast linen',(.52,.44,.34),.92);paper=mat('Cookbook pages',(.72,.65,.52),.9);red=mat('Cookbook faded red',(.25,.055,.035),.78);glow=mat('Kitchen opal pendant',(.86,.72,.50),.65,0,.45)
tex=bpy.data.images.load(str(SRC/'oak-grain-v002.png'),check_existing=True);tex.pack();n=oak.node_tree.nodes.new('ShaderNodeTexImage');n.image=tex;oak.node_tree.links.new(n.outputs['Color'],oak.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
def box(name,p,s,m,bevel=.006):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(name,p,r,d,m,verts=24):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
layout=json.loads((ROOT/'lib/kitchen-furniture-v002.json').read_text())
for f in layout:
 start=len(parts);w=f['width'];d=f['depth'];fid=f['id']
 if fid=='north-cabinets':
  box('North base cabinets',(0,.45,0),(w,.86,d),paint,.012);box('North stone counter',(0,.91,-.01),(w+.05,.055,d+.08),stone,.012)
  for x in [-1.85,-1.25,-.65,.65,1.25,1.85]:box('Shaker base front',(x,.48,d/2+.008),(.52,.68,.018),paint,.004)
  # Sink stays beneath the large north window; upper cabinets flank it.
  box('Sink basin',(0,.927,-.02),(.70,.035,.36),steel,.025);cyl('Sink faucet riser',(0,1.12,-.18),.018,.38,brass,20)
  for x in [-1.75,1.75]:
   box('Upper cabinet',(x,2.02,.055),(1.08,1.05,.37),paint,.012)
   for dx in [-.27,.27]:box('Upper shaker door',(x+dx,2.02,d/2+.052),(.49,.93,.018),paint,.004)
 elif fid=='island':
  box('Island case',(0,.44,0),(w,.84,d),paint,.012);box('Island oak back',(0,.46,-d/2-.008),(w-.10,.66,.018),oak,.004);box('Island stone top',(0,.90,0),(w+.12,.065,d+.12),stone,.014)
  box('Induction hob',(.42,.937,0),(.72,.018,.48),black,.012)
  for i in range(4):cyl('Hob control '+str(i),(.20+i*.14,.956,.19),.014,.008,steel,16)
  # The locked in-progress cookbook is visible from the breakfast side.
  cover=box('Active cookbook cover',(-.62,1.08,-.02),(.48,.025,.34),red,.004);cover.rotation_euler.x=math.radians(-22)
  pages=box('Active cookbook pages',(-.62,1.10,-.01),(.45,.018,.31),paper,.003);pages.rotation_euler.x=math.radians(-22)
 elif fid=='fridge':
  box('Refrigerator',(0,1.02,0),(w,2.04,d),steel,.025);box('Refrigerator dark reveal',(0,1.03,d/2+.009),(w-.06,.018,.012),black,.002)
  box('Freezer division',(0,.70,d/2+.016),(w-.08,.018,.02),black,.001);box('Fridge handle',(w/2-.10,1.36,d/2+.045),(.025,.62,.025),brass,.005)
 elif fid=='breakfast-table':
  cyl('Breakfast pedestal',(0,.38,0),.075,.70,oak,32);cyl('Breakfast foot',(0,.06,0),.32,.06,oak,32);cyl('Breakfast round top',(0,.76,0),w/2,.07,oak,48)
  cyl('Breakfast fruit bowl',(0,.825,0),.16,.08,stone,32)
 elif fid.startswith('breakfast-'):
  box(fid+' seat',(0,.47,0),(w,.075,d),linen,.025);box(fid+' back',(0,.80,-d/2+.04),(w,.57,.07),oak,.022)
  for x in [-w/2+.055,w/2-.055]:
   for z in [-d/2+.055,d/2-.055]:box(fid+' leg',(x,.235,z),(.042,.47,.042),oak,.004)
 for o in parts[start:]:
  x,y,z=o.location;c=math.cos(f['yaw']);s=math.sin(f['yaw']);o.location=(f['x']+c*x-s*y,-f['z']+s*x+c*y,z);o.rotation_euler.z+=f['yaw']

# Two compact pendants make the island the working center without adding a new runtime light count.
for x in [-4.55,-3.55]:
 cyl('Island pendant cord',(x,2.63,9.25),.008,.62,black,12);cyl('Island pendant shade',(x,2.27,9.25),.13,.20,glow,32)

bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/kitchen-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'kitchen-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/kitchen-furniture-v002.json').read_bytes()).hexdigest(),'note':'Working north kitchen, central island and four-seat breakfast corner. Mudroom, pantry, laundry and dining circulation stays clear.'}
(SRC/'kitchen-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
