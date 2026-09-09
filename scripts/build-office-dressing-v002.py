"""Build the complete v002 home office through Blender MCP."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
if bpy.context.object and bpy.context.object.mode!='OBJECT':bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);scene=bpy.context.scene;scene.name='Stackhouse Home Office v002';scene.unit_settings.system='METRIC';parts=[]
def mat(n,c,r=.65,metal=0,emit=0):
 m=bpy.data.materials.get(n) or bpy.data.materials.new(n);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*c,1);b.inputs['Roughness'].default_value=r;b.inputs['Metallic'].default_value=metal
 if emit:b.inputs['Emission Color'].default_value=(*c,1);b.inputs['Emission Strength'].default_value=emit
 return m
oak=mat('Office smoked walnut',(.16,.065,.022),.46);navy=mat('Office deep navy',(.018,.045,.07),.68);steel=mat('Office blackened steel',(.018,.022,.025),.30,.78);paper=mat('Office warm paper',(.74,.69,.58),.9);brass=mat('Office aged brass',(.33,.18,.05),.32,.72);cream=mat('Office warm painted wood',(.63,.60,.53),.76);screen=mat('Office display glass',(.018,.19,.23),.28,.18,.42);leather=mat('Office oxblood leather',(.16,.035,.025),.58);green=mat('Office plant green',(.055,.17,.07),.82);clay=mat('Office planter clay',(.30,.105,.045),.8)
def box(n,p,s,m,b=.012):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=n;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if b:q=o.modifiers.new('Soft edges','BEVEL');q.width=b;q.segments=2
 parts.append(o);return o
def cyl(n,p,r,d,m,v=24):
 bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=d,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=n;o.data.materials.append(m);parts.append(o);return o
# Executive desk faces the entry and leaves all three door paths open.
box('Executive desk top',(4.72,.77,2.25),(1.88,.075,.86),oak,.025)
for x in (3.91,5.53):
 box('Desk pedestal',(x,.37,2.25),(.34,.72,.72),navy,.018)
 for y in (.22,.43,.62):box('Desk drawer',(x,y,2.38),(.27,.15,.025),cream,.007);box('Drawer pull',(x,y,2.345),(.11,.025,.02),brass,.005)
box('Desk modesty panel',(4.72,.43,2.64),(1.42,.48,.055),navy,.012)
for x in (4.42,5.02):
 box('Office monitor',(x,1.20,2.47),(.52,.33,.045),steel,.018);box('Monitor glass',(x,1.20,2.438),(.46,.27,.012),screen,.008);box('Monitor stem',(x,.96,2.50),(.045,.20,.045),steel,.006);box('Monitor foot',(x,.84,2.50),(.28,.025,.16),steel,.01)
box('Keyboard',(4.68,.84,2.03),(.60,.035,.20),steel,.01);box('Trackpad',(5.15,.84,2.02),(.18,.025,.18),steel,.01);box('Computer dock',(3.98,.87,2.04),(.22,.10,.28),steel,.012)
cyl('Task lamp base',(5.43,.85,1.99),.13,.025,brass,28);cyl('Task lamp stem',(5.43,1.14,1.99),.018,.58,brass,18);box('Task lamp shade',(5.43,1.43,1.99),(.28,.12,.20),brass,.035)
cyl('Desk chair base',(4.72,.12,1.37),.29,.05,steel,28);cyl('Desk chair post',(4.72,.37,1.37),.045,.48,steel,18);box('Desk chair seat',(4.72,.52,1.37),(.56,.13,.54),leather,.06);box('Desk chair back',(4.72,.91,1.61),(.56,.65,.13),leather,.07)
# Approved printer and fitted credenza.
box('Printer credenza',(3.70,.39,5.15),(1.86,.70,.38),cream,.014);box('Credenza top',(3.70,.77,5.15),(1.94,.06,.43),oak,.012)
for x in (3.25,4.15):box('Credenza door',(x,.40,4.94),(.82,.57,.025),navy,.008)
box('Office printer body',(3.68,1.00,5.08),(.70,.40,.50),steel,.028);box('Printer scanner lid',(3.68,1.23,5.07),(.64,.055,.44),navy,.018);box('Printer paper tray',(3.68,.86,4.79),(.46,.10,.12),steel,.012);box('Printer status screen',(3.87,1.07,4.81),(.20,.12,.015),screen,.006)
for i in range(5):box('Printer paper '+str(i),(4.35,.82+i*.012,5.08),(.46,.01,.32),paper,.002)
# Low console replaces the full-height placeholder block.
box('Low reference console',(1.40,.42,3.74),(.34,.76,1.48),navy,.018);box('Console cap',(1.40,.84,3.74),(.38,.065,1.54),oak,.014)
for z in (3.28,3.74,4.20):box('Reference file',(1.18,.46,z),(.055,.46,.30),paper,.005)
for i,(x,w) in enumerate(((2.95,.58),(3.70,.68),(4.48,.58))):
 box('Process frame '+str(i),(x,1.88,5.35),(w,.72,.035),steel,.012);box('Process sheet '+str(i),(x,1.88,5.32),(w-.09,.62,.012),paper,.003)
 for j in range(3):box('Process line '+str(i)+' '+str(j),(x,2.08-j*.16,5.305),(w*.55,.025,.008),navy,.001)
box('Office rug',(4.63,.018,2.09),(2.48,.025,2.02),navy,.035);cyl('Office planter',(5.98,.22,.55),.24,.40,clay,28)
for i,(dx,dz,h) in enumerate(((-.12,0,.62),(.10,.04,.72),(0,-.10,.58),(.16,-.07,.50))):box('Office plant leaf '+str(i),(5.98+dx,.53+h/2,.55+dz),(.11,h,.07),green,.035)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/office-dressing-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False);mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'office-dressing-v002.blend'));manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/office-dressing-v002.json').read_bytes()).hexdigest(),'note':'Complete v002 office with rebuilt workstation, approved printer wall, low reference console, and clear three-door circulation.'};(SRC/'office-dressing-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
