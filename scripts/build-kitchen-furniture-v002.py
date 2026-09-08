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
screen=mat('Kitchen smart display',(.025,.09,.12),.16,.12,.24);blue=mat('Kitchen display accent',(.10,.42,.62),.30,0,.38)
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
 elif fid.startswith('west-cabinets'):
  box(fid+' base',(0,.45,0),(w,.86,d),paint,.012);box(fid+' stone counter',(0,.91,0),(w+.05,.055,d+.07),stone,.012)
  for x in [-w/2+.28,0,w/2-.28]:box(fid+' shaker front',(x,.48,d/2+.012),(.48,.68,.02),paint,.004)
 elif fid=='range':
  box('Statement range body',(0,.46,0),(w,.90,d),steel,.018);box('Statement range face',(0,.50,d/2+.018),(w-.06,.72,.035),black,.008)
  box('Range top',(0,.93,0),(w+.04,.055,d+.05),black,.010)
  for x in [-.38,-.13,.13,.38]:cyl('Range burner '+str(x),(x,.97,0),.12,.018,steel,28)
  for x in [-.40,-.20,0,.20,.40]:cyl('Range knob '+str(x),(x,.73,d/2+.052),.035,.028,brass,18)
  box('Range hood chimney',(0,2.24,-.04),(.42,1.08,.30),black,.012);box('Range hood canopy',(0,1.75,.02),(w+.16,.24,.58),black,.025)
 elif fid=='island':
  box('Island case',(0,.44,0),(w,.84,d),oak,.012);box('Island warm ivory face',(0,.46,d/2+.008),(w-.10,.66,.018),paint,.004);box('Island stone top',(0,.90,0),(w+.18,.075,d+.16),stone,.018)
  # Waterfall ends and deep counter overhang give the center island the weight expected in this house.
  for x in [-w/2-.045,w/2+.045]:box('Island waterfall end',(x,.45,0),(.07,.90,d+.14),stone,.010)
  # The locked in-progress cookbook is visible from the breakfast side.
  cover=box('Active cookbook cover',(-.62,1.08,-.02),(.48,.025,.34),red,.004);cover.rotation_euler.x=math.radians(-22)
  pages=box('Active cookbook pages',(-.62,1.10,-.01),(.45,.018,.31),paper,.003);pages.rotation_euler.x=math.radians(-22)
 elif fid=='fridge':
  # Wide four-door smart refrigerator: large enough to carry the locked lore surface and terminal display.
  box('Double refrigerator',(0,1.08,0),(w,2.16,d),steel,.030);box('Refrigerator dark reveal',(0,1.08,d/2+.010),(w-.07,.018,.014),black,.002)
  box('Refrigerator cabinet bridge',(0,2.46,-.02),(w+.18,.42,d+.02),paint,.014)
  box('Fridge center seam',(0,1.46,d/2+.026),(.018,1.25,.025),black,.002);box('Freezer division',(0,.63,d/2+.026),(w-.08,.020,.025),black,.002)
  for x in [-.13,.13]:box('Fridge upper handle '+str(x),(x,1.48,d/2+.060),(.025,.68,.028),brass,.006)
  for x in [-.38,.38]:box('Fridge lower handle '+str(x),(x,.42,d/2+.060),(.025,.36,.028),brass,.006)
  # Screen is authored as geometry now; the interactive terminal/lore UI mounts here later.
  box('Fridge terminal bezel',(.43,1.52,d/2+.052),(.48,.58,.035),black,.025);box('Fridge terminal screen',(.43,1.52,d/2+.074),(.42,.50,.012),screen,.012)
  for i in range(3):box('Fridge terminal line '+str(i),(.43,1.65-i*.11,d/2+.084),(.27-i*.035,.018,.006),blue,.004)
  # A few accumulated paper artifacts preserve the refrigerator's locked personal/lore role.
  for i,(x,y) in enumerate([(-.48,1.63),(-.30,1.28),(-.52,.92)]):box('Fridge note '+str(i),(x,y,d/2+.072),(.20,.25,.010),paper,.004);cyl('Fridge magnet '+str(i),(x,y+.10,d/2+.086),.025,.010,red,16)
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
for x in [-4.28,-3.48]:
 cyl('Island pendant cord',(x,2.63,6.90),.008,.62,black,12);cyl('Island pendant shade',(x,2.27,6.90),.15,.22,glow,32)

bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/kitchen-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'kitchen-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/kitchen-furniture-v002.json').read_bytes()).hexdigest(),'note':'High-end fitted kitchen with connected perimeter cabinetry, statement range, centered island and smart double refrigerator. Dining happens in the adjoining Dining Room; all service routes stay clear.'}
(SRC/'kitchen-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
