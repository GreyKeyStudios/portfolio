"""Author a modest living-room seating group. Run through Blender MCP."""
import bpy, json, math, hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'portfolio-assets/stack-house/blender'
name='Stackhouse Living Furniture v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing furniture scene before replacing')
scene=bpy.data.scenes.new(name); bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
parts=[]
def mat(name,color,rough=.7,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    return m
linen=mat('Oatmeal upholstery',(.48,.405,.31),.92)
leather=mat('Tobacco upholstery',(.13,.075,.039),.78)
navy=mat('Navy cushion',(.035,.055,.075),.94)
oak=mat('Smoked oak furniture',(.3,.16,.08),.47)
tex=bpy.data.images.load(str(SRC/'oak-grain-v002.png'),check_existing=True);tex.pack()
node=oak.node_tree.nodes.new('ShaderNodeTexImage');node.image=tex
oak.node_tree.links.new(node.outputs['Color'],oak.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
black=mat('Charcoal screen and feet',(.009,.012,.016),.38)
rug=mat('Muted woven flax',(.22,.18,.125),1)
metal=mat('Laptop graphite',(.075,.085,.10),.4,.55)
brass=mat('Reading lamp aged brass',(.24,.16,.075),.4,.7)
shade=mat('Warm linen lampshade',(.7,.56,.37),.85)
bs=shade.node_tree.nodes.get('Principled BSDF')
bs.inputs['Emission Color'].default_value=(.8,.54,.27,1)
bs.inputs['Emission Strength'].default_value=.3
ceramic=mat('Ivory stoneware',(.55,.50,.41),.38)
paper=mat('Book page edges',(.56,.49,.37),.95)
def image_material(material,name,pixels):
    h,w,_=pixels.shape
    image=bpy.data.images.new(name,width=w,height=h)
    image.pixels.foreach_set(pixels.astype(np.float32).ravel())
    image.filepath_raw=str(SRC/(name+'.png'));image.file_format='PNG';image.save();image.pack()
    node=material.node_tree.nodes.new('ShaderNodeTexImage');node.image=image
    material.node_tree.links.new(node.outputs['Color'],material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
# Quiet woven variation, authored and embedded rather than runtime shader noise.
yy,xx=np.mgrid[0:256,0:256]
weave=1+.045*np.sin(xx*np.pi/2)+.035*np.sin(yy*np.pi/2)+np.random.default_rng(14).normal(0,.012,(256,256))
fabric=np.ones((256,256,4))
for i,c in enumerate([.69,.63,.53]):fabric[:,:,i]=c*weave
image_material(linen,'living-linen-v002',fabric)
yy,xx=np.mgrid[0:512,0:512];u=xx/511;v=yy/511
edge=np.minimum.reduce([u,1-u,v,1-v])
border=((edge>.035)&(edge<.05))|((edge>.10)&(edge<.115))
motif=(np.abs(((u*10+v*10)%2)-1)<.07)&(edge>.13)
variation=1+.04*np.sin(xx*np.pi)+.035*np.sin(yy*np.pi/2)+np.random.default_rng(23).normal(0,.02,(512,512))
pixels=np.ones((512,512,4))
for i,c in enumerate([.46,.40,.30]):pixels[:,:,i]=(c-border*.14-motif*.035)*variation
image_material(rug,'living-rug-v002',pixels)
def box(name,p,s,m,bevel=.008):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object
    o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(m)
    uv=o.data.uv_layers.active
    for face in o.data.polygons:
        axis=max(range(3),key=lambda i:abs(face.normal[i]));axes=[i for i in range(3) if i!=axis]
        dims=(s[0],s[2],s[1])
        for li in face.loop_indices:
            co=o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv=tuple(co[a]/dims[a]+.5 for a in axes)
    if bevel:
        mod=o.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=3
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    parts.append(o);return o
def cylinder(name,p,radius,depth,material,top=None):
    bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=radius,radius2=radius if top is None else top,depth=depth,location=(p[0],-p[2],p[1]))
    o=bpy.context.object;o.name=name;o.data.materials.append(material)
    for face in o.data.polygons:face.use_smooth=len(face.vertices)==4
    parts.append(o);return o
layout=json.loads((ROOT/'lib/living-furniture-v002.json').read_text())
for f in layout:
    start=len(parts);w=f['width'];d=f['depth'];id=f['id']
    if id in ['sofa','chair']:
        fabric=linen if id=='sofa' else leather
        box(id+' deck',(0,.28,0),(w-.06,.20,d-.04),fabric,.035)
        box(id+' back',(0,.66,-d/2+.105),(w,.57,.21),fabric,.055)
        for x in [-w/2+.10,w/2-.10]:box(id+' arm',(x,.52,.035),(.20,.43,d-.08),fabric,.055)
        n=3 if id=='sofa' else 1
        for i in range(n):
            x=-(w-.42)/2+(i+.5)*(w-.42)/n
            box(id+' seat cushion',(x,.43,.075),((w-.44)/n-.018,.17,d-.30),fabric,.055)
            cushion=box(id+' back cushion',(x,.72,-d/2+.235),((w-.44)/n-.02,.40,.16),fabric,.055)
            cushion.rotation_euler.x=math.radians(-7)
        for x in [-w/2+.16,w/2-.16]:
            for z in [-d/2+.14,d/2-.14]:box(id+' foot',(x,.105,z),(.065,.18,.065),oak)
        if id=='sofa':
            pillow=box('Navy throw pillow',(-.63,.68,.06),(.38,.38,.16),navy,.07)
            pillow.rotation_euler.y=.14
    elif id=='table':
        box('Coffee table top',(0,.405,0),(w,.055,d),oak,.016)
        box('Coffee table lower shelf',(0,.14,0),(w-.10,.035,d-.10),oak)
        for x in [-w/2+.07,w/2-.07]:
            for z in [-d/2+.07,d/2-.07]:box('Coffee table leg',(x,.22,z),(.055,.36,.055),oak)
        box('Closed client laptop',(.01,.445,-.17),(.31,.018,.22),metal,.006)
        box('Notebook cover',(-.02,.44,.28),(.22,.015,.29),navy,.002)
        box('Notebook pages',(-.02,.449,.28),(.21,.008,.28),paper,.001)
        cylinder('Stoneware cup',(.18,.483,.19),.038,.09,ceramic)
        cylinder('Coffee surface',(.18,.530,.19),.032,.002,leather)
    elif id=='media':
        box('Media cabinet',(0,.30,0),(w,.40,d),oak,.012)
        for x in [-.54,0,.54]:box('Cabinet front',(x,.31,d/2+.004),(.52,.34,.018),oak,.005)
        for x in [-.55,.55]:box('Cabinet foot',(x,.065,0),(.06,.13,.28),black)
        box('TV foot',(0,.515,0),(.45,.025,.21),black)
        box('TV stem',(0,.57,-.06),(.055,.12,.045),black)
        box('TV bezel',(0,.96,-.06),(1.16,.68,.045),black,.012)
        box('TV dark glass',(0,.96,-.034),(1.12,.64,.008),black,.004)
    elif id=='lamp':
        cylinder('Reading lamp base',(0,.025,0),.17,.05,brass)
        cylinder('Reading lamp stem',(0,.70,0),.012,1.35,brass)
        cylinder('Reading lamp shade',(0,1.46,0),.23,.32,shade,.17)
    # Piece-local +Z faces forward, transformed to the shared plan coordinates.
    for o in parts[start:]:
        x,y,z=o.location;c=math.cos(f['yaw']);s=math.sin(f['yaw'])
        o.location=(f['x']+c*x-s*y,-f['z']+s*x+c*y,z)
        o.rotation_euler.z+=f['yaw']
box('Seating rug',(4.0,.025,3.25),(3.45,.018,3.25),rug,.007)
# Consolidate evaluated copies for a small number of material draw calls.
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT')
copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
    mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh)
    ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object
triangles=sum(len(p.vertices)-2 for p in ob.data.polygons)
path=ROOT/'public/models/living-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'living-furniture-v002.blend'))
manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256((ROOT/'lib/living-furniture-v002.json').read_bytes()).hexdigest(),'note':'Woven upholstery and bordered rug, reading lamp and tabletop objects. TV and closed laptop remain visual props pending interactions.'}
(SRC/'living-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2))
result=manifest
