"""Complete the upstairs office around its existing interactive workstation. Run through Blender MCP."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Office Dressing v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing office dressing scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 if emission:b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=emission
 return m
oak=mat('Office smoked oak',(.20,.095,.035),.50);navy=mat('Office deep navy',(.025,.055,.08),.68);steel=mat('Office black steel',(.025,.028,.03),.34,.72);paper=mat('Office warm paper',(.70,.65,.54),.91);brass=mat('Office aged brass',(.34,.20,.065),.34,.68);cream=mat('Office warm painted wood',(.61,.58,.51),.78);screen=mat('Office printer display',(.04,.30,.34),.42,0,.35);green=mat('Office plant green',(.08,.20,.09),.82);terracotta=mat('Office terracotta',(.34,.13,.055),.78)
def box(name,p,s,m,bevel=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(name,p,r,depth,m,verts=24):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
# West-wall reference cabinet, shallow enough to preserve the circulation lane.
box('Reference cabinet carcass',(1.39,.91,3.72),(.38,1.74,1.72),navy,.014)
for y in [.12,.48,.84,1.20,1.56,1.78]:box('Reference shelf',(1.17,y,3.72),(.06,.045,1.58),oak,.004)
colors=[paper,cream,navy,oak]
for row,y in enumerate([.29,.65,1.01,1.37,1.65]):
 for i,z in enumerate([3.14,3.38,3.62,3.86,4.10,4.34]):
  h=.24+(i%3)*.025;box('Office reference '+str(row)+' '+str(i),(1.12,y,z),(.08,h,.15),colors[(row+i)%4],.003)
# Credenza fits exactly between the two north-wall door openings.
box('Printer credenza',(3.70,.39,5.15),(1.86,.70,.38),cream,.014);box('Credenza top',(3.70,.77,5.15),(1.94,.06,.43),oak,.012)
for x in [3.25,4.15]:box('Credenza door',(x,.40,4.94),(.82,.57,.025),navy,.008)
for x in [3.58,3.82]:box('Credenza pull',(x,.45,4.91),(.035,.20,.025),brass,.005)
# Printer/scanner and a practical paper stack establish this as a working office.
box('Office printer body',(3.68,1.00,5.08),(.70,.40,.50),steel,.028);box('Printer scanner lid',(3.68,1.23,5.07),(.64,.055,.44),navy,.018)
box('Printer paper tray',(3.68,.86,4.79),(.46,.10,.12),steel,.012);box('Printer status screen',(3.87,1.07,4.81),(.20,.12,.015),screen,.006)
for i in range(5):box('Printer paper '+str(i),(4.35,.82+i*.012,5.08),(.46,.01,.32),paper,.002)
# Framed process boards make the wall personal without deciding the desktop UI language.
for i,(x,w) in enumerate([(2.92,.58),(3.70,.68),(4.50,.60)]):
 box('Process frame '+str(i),(x,1.88,5.35),(w,.72,.035),steel,.012);box('Process sheet '+str(i),(x,1.88,5.32),(w-.09,.62,.012),paper,.003)
 for j in range(3):box('Process line '+str(i)+' '+str(j),(x,2.08-j*.16,5.305),(w*.55,.025,.008),navy,.001)
# A compact plant softens the hard workstation side of the room.
cyl('Office planter',(5.98,.22,.55),.24,.40,terracotta,28)
for i,(dx,dz,h) in enumerate([(-.12,0,.62),(.10,.04,.72),(0,-.10,.58),(.16,-.07,.50)]):
 box('Office plant leaf '+str(i),(5.98+dx,.53+h/2,.55+dz),(.11,h,.07),green,.035)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/office-dressing-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'office-dressing-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/office-dressing-v002.json').read_bytes()).hexdigest(),'note':'Office completion layer around the existing interactive workstation, with reference storage, printer credenza, process boards and clear three-door circulation.'}
(SRC/'office-dressing-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
