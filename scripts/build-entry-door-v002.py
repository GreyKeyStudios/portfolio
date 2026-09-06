"""Run through Blender MCP with __file__; metres, local X at doorway centre."""
import bpy, bmesh, json, math, hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'portfolio-assets/stack-house/blender'
d=json.loads((SRC/'entry-door-v002.json').read_text())
name='Stackhouse Entry Door v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect the existing door scene before replacing it')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
parts=[]
def mat(name,color,rough=.5,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    return m
blue=mat('Entry deep blue paint',(.026,.049,.077),.48)
panel=mat('Entry inset blue panels',(.019,.035,.055),.56)
ivory=mat('Entry ivory frame',(.68,.65,.59),.58)
brass=mat('Entry aged brass',(.30,.20,.075),.32,.75)
def xyz(p):return (p[0],-p[2],p[1])
def finish(ob,name,m,bevel):
    ob.name=name;ob.data.materials.append(m)
    if bevel:
        mod=ob.modifiers.new('Joinery bevel','BEVEL');mod.width=bevel;mod.segments=3
        ob.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    parts.append(ob)
def box(name,c,size,m,bevel=.002):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(c));ob=bpy.context.object
    ob.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    finish(ob,name,m,bevel)
def disc(name,x,y,z,r,depth):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=depth,location=xyz((x,y,z)),rotation=(math.pi/2,0,0))
    finish(bpy.context.object,name,brass,.001)
w=d['leafWidth'];h=d['height'];bottom=d['bottomY'];z=d['centerZ'];face=z+d['thickness']/2
glass=mat('Entry night glazing',(.018,.031,.045),.18,.15)
plaster=mat('Entry plaster spandrels',(.58,.57,.54),.82)
def profile(name,points,z0,z1,m,bevel=.001):
    n=len(points);verts=[xyz((x,y,zz)) for zz in [z0,z1] for x,y in points]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    ob=bpy.data.objects.new(name,mesh);scene.collection.objects.link(ob);finish(ob,name,m,bevel)
def arc(r):return [(r*math.cos(i*math.pi/48),spring+r*math.sin(i*math.pi/48)) for i in range(49)]
def ring(name,outer,inner,z0,z1,m):profile(name,arc(outer)+list(reversed(arc(inner))),z0,z1,m)
r=w/2;spring=bottom+h-r;ri=r-.105;gb=.91
box('Lower solid leaf',(0,(bottom+gb)/2,z),(w,gb-bottom,d['thickness']),blue,.003)
for x in [-r+.0525,r-.0525]:box('Glazing stile',(x,(gb+spring)/2,z),(.105,spring-gb,d['thickness']),blue)
ring('Arched blue leaf',r,ri,z-d['thickness']/2,face,blue)
profile('Two pane night glass',[(-ri,gb),(ri,gb)]+arc(ri),z-.006,z+.006,glass,0)
box('Central glazing mullion',(0,(gb+spring+ri)/2,z),(.028,spring+ri-gb,d['thickness']),blue)
box('Glazing bottom rail',(0,gb,z),(w,.04,d['thickness']),blue)
outer=r+.078;inner=r+.008
ring('Arched ivory casing',outer,inner,.065,.224,ivory)
for x in [-(inner+outer)/2,(inner+outer)/2]:box('Ivory jamb',(x,spring/2,.145),(outer-inner,spring,.158),ivory)
half=d['openingWidth']/2
for sign in [-1,1]:
    box('Side plaster infill',(sign*(half+inner)/2,spring/2,.10),(half-inner,spring,.20),plaster,0)
    pts=[(sign*inner,spring),(sign*half,spring),(sign*half,2.05),(0,2.05),(0,spring+inner)]
    pts += [(sign*inner*math.cos(t*math.pi/96),spring+inner*math.sin(t*math.pi/96)) for t in range(47,-1,-1)]
    profile('Arched plaster corner',pts,0,.20,plaster,0)
box('Brass threshold',(0,.012,.12),(2*inner,.024,.16),brass)
pw=(w-.105*2-.065)/2
for x in [-pw/2-.0325,pw/2+.0325]:
    for lo,hi in [(.17,.77)]:
        box('Recessed panel field',(x,(lo+hi)/2,face+.001),(pw,hi-lo,.004),panel,.001)
        for xx in [x-pw/2,x+pw/2]:box('Panel vertical bead',(xx,(lo+hi)/2,face+.007),(.016,hi-lo+.016,.014),blue,.003)
        for yy in [lo,hi]:box('Panel horizontal bead',(x,yy,face+.007),(pw+.016,.016,.014),blue,.003)
hx=w/2-.10
box('Handle escutcheon',(hx,1.01,face+.012),(.045,.18,.019),brass,.006)
box('Lever spindle',(hx,1.01,face+.049),(.021,.021,.064),brass,.005)
box('Brass lever',(hx-.052,1.01,face+.080),(.13,.021,.022),brass,.007)
disc('Deadbolt',hx,1.25,face+.012,.025,.018)
box('Deadbolt thumb turn',(hx,1.25,face+.028),(.034,.011,.014),brass,.003)
for y in [.27,1.0,1.75]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=.012,depth=.10,location=xyz((-w/2+.012,y,face+.013)))
    finish(bpy.context.object,'Brass hinge knuckle',brass,.001)

bpy.ops.object.select_all(action='DESELECT');deps=bpy.context.evaluated_depsgraph_get();copies=[]
for src in parts:
    mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh)
    ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object
corners=[ob.matrix_world@Vector(c) for c in ob.bound_box]
bounds={'min':[min((c.x,c.z,-c.y)[i] for c in corners) for i in range(3)],'max':[max((c.x,c.z,-c.y)[i] for c in corners) for i in range(3)]}
asset=ROOT/'public/models/entry-door-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(asset),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_cameras=False,export_lights=False)
triangles=sum(len(p.vertices)-2 for p in ob.data.polygons)
mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'entry-door-v002.blend'))
manifest={'source':'entry-door-v002.blend','asset':asset.name,'units':'metres','placement':[d['centerX'],0,0],'bounds':bounds,'triangles':triangles,'bytes':asset.stat().st_size,'source_sha256':hashlib.sha256((SRC/'entry-door-v002.blend').read_bytes()).hexdigest(),'input_sha256':hashlib.sha256((SRC/'entry-door-v002.json').read_bytes()).hexdigest(),'textures':[]}
(SRC/'entry-door-v002.manifest.json').write_text(json.dumps(manifest,indent=2))
result=manifest

