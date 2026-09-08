"""Author the basement mechanical service room. Run through Blender MCP."""
import bpy,json,hashlib,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Mechanical Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing mechanical scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 if emission:b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=emission
 return m
steel=mat('Mechanical galvanized steel',(.31,.34,.34),.42,.72);dark=mat('Mechanical black steel',(.025,.03,.032),.35,.76);cream=mat('Mechanical appliance enamel',(.57,.57,.53),.50,.18);copper=mat('Mechanical copper pipe',(.42,.16,.055),.32,.70);brass=mat('Mechanical brass valve',(.38,.22,.06),.30,.72);red=mat('Mechanical hot marker',(.45,.035,.02),.55);blue=mat('Mechanical cold marker',(.025,.14,.34),.55);paper=mat('Mechanical service label',(.72,.68,.56),.88);green=mat('Mechanical status green',(.02,.55,.18),.35,0,.7);amber=mat('Mechanical status amber',(.75,.25,.015),.35,0,.5)
def box(name,p,s,m,bevel=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(name,p,r,depth,m,verts=28,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=(p[0],-p[2],p[1]),rotation=rot);o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
# Furnace and return plenum line the east wall.
box('High efficiency furnace',(.78,.72,7.28),(.62,1.38,1.28),cream,.025);box('Furnace access panel',(.44,.77,7.28),(.025,.88,.78),steel,.008)
for y in [.47,.74,.99]:box('Furnace vent slot',(.425,y,7.28),(.012,.035,.50),dark,.002)
box('Furnace status',(.41,1.12,7.02),(.018,.10,.16),green,.004);box('Return plenum',(.78,1.78,7.28),(.56,.72,1.08),steel,.018)
box('Supply trunk',(.42,2.38,7.28),(1.42,.32,.58),steel,.015)
# Water heater and top connections.
cyl('Water heater tank',(.78,.72,9.15),.33,1.42,cream,40);cyl('Water heater cap',(.78,1.45,9.15),.30,.06,steel,40)
for x,m in [(.66,blue),(.90,red)]:cyl('Water connection',(x,1.72,9.15),.035,.54,m,20)
box('Water heater control',(.78,.67,8.81),(.28,.26,.035),dark,.012);box('Water heater warning',(.78,.98,8.80),(.24,.18,.015),paper,.003)
# Softener and brine tank use the north-west corner, away from the entrance.
cyl('Water softener',(-.86,.64,10.04),.24,1.28,blue,36);box('Softener head',(-.86,1.34,10.04),(.42,.20,.34),dark,.025)
cyl('Brine tank',(-.48,.43,9.92),.25,.84,cream,36);cyl('Brine lid',(-.48,.87,9.92),.26,.06,dark,36)
# Electrical panel and future diagnostic surface stay wall-mounted and readable.
box('Breaker panel',(-1.05,1.48,7.02),(.10,1.12,.72),steel,.018);box('Breaker panel door',(-.985,1.48,7.02),(.018,1.00,.62),cream,.006)
for row in range(6):
 for col in range(2):box('Breaker '+str(row)+' '+str(col),(-.965,1.18+row*.105,6.82+col*.40),(.02,.065,.25),dark,.003)
box('Panel service card',(-.95,2.17,7.02),(.018,.28,.48),paper,.004)
# Pressure manifold and color-coded shutoffs establish later puzzle affordances.
for y,x0,x1,m in [(2.34,-.88,.88,copper),(2.08,-.88,.34,blue),(1.88,-.88,.34,red)]:box('Service pipe',(x0+(x1-x0)/2,y,10.58),(x1-x0,.045,.045),m,.006)
for i,x in enumerate([-.62,-.18,.26]):
 cyl('Shutoff valve '+str(i),(x,2.08,10.54),.10,.035,brass,20,rot=(math.pi/2,0,0));box('Valve handle '+str(i),(x,2.08,10.48),(.26,.035,.05),red if i==0 else blue,.006)
box('Pressure control plate',(.72,2.12,10.54),(.52,.56,.04),dark,.012)
for i,m in enumerate([green,amber,green]):cyl('Control lamp '+str(i),(.58+i*.14,2.22,10.48),.035,.025,m,20,rot=(math.pi/2,0,0))
box('Pressure label',(.72,1.94,10.48),(.30,.08,.018),paper,.003)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/mechanical-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'mechanical-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/mechanical-furniture-v002.json').read_bytes()).hexdigest(),'note':'Believable basement mechanical plant with furnace/HVAC, water heater, softener, breaker panel, pressure manifold and clear west-door service aisle.'}
(SRC/'mechanical-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
