"""Author the ground-floor residential powder room. Run through Blender MCP."""
import bpy,json,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Half Bath Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing half-bath scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';parts=[]
def mat(name,color,rough=.7,metal=0,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 if emit:b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=emit
 return m
navy=mat('Half bath navy vanity',(.035,.07,.10),.62);stone=mat('Half bath warm stone',(.50,.47,.41),.38);porcelain=mat('Half bath porcelain',(.80,.78,.72),.28)
brass=mat('Half bath aged brass',(.30,.19,.07),.30,.76);mirror=mat('Half bath mirror',(.20,.27,.29),.12,.45);glass=mat('Half bath dark glass',(.07,.11,.12),.18,.12)
linen=mat('Half bath hand towel',(.57,.50,.40),.94);paper=mat('Half bath paper',(.78,.75,.68),.88);glow=mat('Half bath opal sconce',(.92,.78,.56),.58,0,.45)
def box(name,p,s,m,bevel=.006):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 parts.append(o);return o
def cyl(name,p,r,d,m,verts=32,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d,location=(p[0],-p[2],p[1]),rotation=rot);o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
def torus(name,p,major,minor,m,rot=(0,0,0)):
 bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=48,minor_segments=8,location=(p[0],-p[2],p[1]),rotation=rot);o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
layout=json.loads((ROOT/'lib/half-bath-furniture-v002.json').read_text());vanity=layout[0];toilet=layout[1]
vx=vanity['x'];vz=vanity['z'];vw=vanity['width'];vd=vanity['depth']
# Compact furniture-style vanity on the south wall.
box('Powder vanity case',(vx,.47,vz),(vw,.82,vd),navy,.018);box('Powder vanity top',(vx,.91,vz+.015),(vw+.06,.06,vd+.06),stone,.016)
for dx in [-.25,.25]:box('Vanity shaker door',(vx+dx,.48,vz+vd/2+.014),(.43,.64,.024),navy,.005)
cyl('Vanity knob left',(vx-.19,.49,vz+vd/2+.045),.025,.035,brass,18,rot=(math.pi/2,0,0));cyl('Vanity knob right',(vx+.19,.49,vz+vd/2+.045),.025,.035,brass,18,rot=(math.pi/2,0,0))
cyl('Round vessel sink',(vx,.96,vz+.035),.235,.10,porcelain,40);cyl('Sink drain',(vx,.995,vz+.035),.035,.008,brass,20)
cyl('Faucet riser',(vx,1.13,vz-.12),.018,.31,brass,20);box('Faucet spout',(vx,1.25,vz-.035),(.035,.035,.18),brass,.012)
# Framed mirror and paired opal sconces add residential scale.
cyl('Round mirror',(vx,1.78,.065),.43,.035,mirror,48,rot=(math.pi/2,0,0));torus('Mirror brass frame',(vx,1.78,.09),.445,.022,brass,rot=(math.pi/2,0,0))
for dx in [-.58,.58]:
 box('Sconce backplate',(vx+dx,1.82,.055),(.11,.24,.035),brass,.018);cyl('Sconce globe',(vx+dx,1.82,.10),.10,.18,glow,28,rot=(math.pi/2,0,0))
# Toilet sits under the high privacy window on the north end.
tx=toilet['x'];tz=toilet['z']
box('Toilet cistern',(tx,.69,tz+.22),(.52,.68,.26),porcelain,.055);box('Toilet tank lid',(tx,1.06,tz+.22),(.56,.055,.29),porcelain,.022)
cyl('Toilet bowl base',(tx,.30,tz-.08),.27,.40,porcelain,40);cyl('Toilet seat',(tx,.49,tz-.12),.34,.07,porcelain,48)
box('Toilet bowl extension',(tx,.43,tz-.20),(.56,.18,.44),porcelain,.10);cyl('Flush button',(tx+.15,1.095,tz+.22),.035,.018,brass,18)
# Small wall details remain shallow and do not affect the doorway aisle.
cyl('Towel ring',(-6.42,1.34,1.02),.19,.018,brass,32,rot=(0,math.pi/2,0));box('Hand towel',(-6.38,1.06,1.02),(.035,.45,.30),linen,.025)
box('Paper holder back',(-6.42,.76,2.00),(.035,.12,.32),brass,.015);cyl('Paper roll',(-6.36,.76,2.00),.095,.27,paper,28,rot=(0,math.pi/2,0))

bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/half-bath-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'half-bath-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/half-bath-furniture-v002.json').read_bytes()).hexdigest(),'note':'Compact residential powder room with vanity, mirror, toilet and clear center aisle.'}
(SRC/'half-bath-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
