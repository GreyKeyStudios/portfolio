"""Author the first-floor dining room. Run through Blender MCP."""
import bpy, json, math, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Dining Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing dining scene before replacing')
scene=bpy.data.scenes.new(name); bpy.context.window.scene=scene; scene.unit_settings.system='METRIC'
parts=[]
def mat(name,color,rough=.7,metal=0,emit=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    if emit: bs.inputs['Emission Color'].default_value=(*color,1);bs.inputs['Emission Strength'].default_value=emit
    return m
oak=mat('Dining smoked oak',(.25,.12,.055),.46); linen=mat('Dining warm linen',(.54,.46,.35),.93)
navy=mat('Dining ink blue',(.035,.055,.075),.72); brass=mat('Dining aged brass',(.28,.18,.07),.34,.72)
ivory=mat('Dining ivory ceramic',(.72,.68,.59),.38); glass=mat('Dining glass',(.36,.47,.48),.15,.05)
rug=mat('Dining muted wool',(.23,.20,.16),.98); glow=mat('Dining opal glass',(.86,.70,.46),.6,0,.55)
paper=mat('Dining art paper',(.58,.53,.44),.85)
tex=bpy.data.images.load(str(SRC/'oak-grain-v002.png'),check_existing=True);tex.pack();n=oak.node_tree.nodes.new('ShaderNodeTexImage');n.image=tex;oak.node_tree.links.new(n.outputs['Color'],oak.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
def box(name,p,s,m,bevel=.008):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
    if bevel:o.modifiers.new('Soft edges','BEVEL').width=bevel;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    parts.append(o);return o
def cylinder(name,p,r,d,m,vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.data.materials.append(m);parts.append(o);return o
layout=json.loads((ROOT/'lib/dining-furniture-v002.json').read_text())
for f in layout:
    start=len(parts);w=f['width'];d=f['depth'];fid=f['id']
    if fid=='table':
        box('Dining table top',(0,.77,0),(w,.075,d),oak,.018)
        for x in [-w/2+.16,w/2-.16]:
            for z in [-d/2+.14,d/2-.14]:box('Dining table leg',(x,.385,z),(.09,.77,.09),oak,.01)
        # A restrained set table gives scale without turning the room into a prop pile.
        for x in [-.72,0,.72]:
            for z in [-.31,.31]:cylinder('Stoneware place setting',(x,.817,z),.115,.012,ivory,32)
        cylinder('Dining vase',(0,.94,0),.075,.25,glass,32)
    elif fid.startswith('chair'):
        box(fid+' seat',(0,.48,0),(w,.08,d),linen,.025)
        box(fid+' back',(0,.82,-d/2+.045),(w,.62,.075),oak,.022)
        for x in [-w/2+.055,w/2-.055]:
            for z in [-d/2+.055,d/2-.055]:box(fid+' leg',(x,.24,z),(.045,.48,.045),oak,.004)
    elif fid=='sideboard':
        box('Dining sideboard case',(0,.48,0),(w,.78,d),oak,.015)
        for x in [-w/3,0,w/3]:box('Dining sideboard door',(x,.49,d/2+.008),(w/3-.025,.67,.018),navy,.005)
        for x in [-w/2+.12,w/2-.12]:box('Dining sideboard foot',(x,.07,0),(.06,.14,.22),brass,.004)
    for o in parts[start:]:
        x,y,z=o.location;c=math.cos(f['yaw']);s=math.sin(f['yaw']);o.location=(f['x']+c*x-s*y,-f['z']+s*x+c*y,z);o.rotation_euler.z+=f['yaw']

box('Dining rug',(4.05,.022,8.55),(3.25,.018,2.35),rug,.008)
# Compact five-light chandelier centered on the table and generic room light.
cylinder('Chandelier ceiling rose',(4.05,2.92,8.55),.12,.05,brass,32)
cylinder('Chandelier drop',(4.05,2.53,8.55),.012,.75,brass,16)
cylinder('Chandelier hub',(4.05,2.18,8.55),.06,.08,brass,24)
for i in range(5):
    a=2*math.pi*i/5;x=4.05+math.cos(a)*.38;z=8.55+math.sin(a)*.38
    arm=cylinder('Chandelier arm',(x,2.18,z),.012,.38,brass,12);arm.rotation_euler.y=math.pi/2;arm.rotation_euler.z=a
    cylinder('Chandelier shade',(x,2.08,z),.095,.18,glow,24)
# One landscape opposite the sideboard; furniture can later personalize this wall.
box('Dining artwork frame',(1.375,1.72,9.15),(.035,.82,1.15),oak,.012)
box('Dining artwork mat',(1.352,1.72,9.15),(.008,.68,1.01),paper,.002)

bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
    mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object
triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/dining-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'dining-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/dining-furniture-v002.json').read_bytes()).hexdigest(),'note':'Six-seat dining room with clear living and pantry approaches, sideboard, rug, table setting, art and chandelier.'}
(SRC/'dining-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
