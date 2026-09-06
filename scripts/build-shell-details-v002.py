"""Blender authoring: run with __file__ set to this script's absolute path."""
import bpy, json, math, hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'portfolio-assets/stack-house/blender'
data=json.loads((SRC/'rooms-v002.json').read_text())
name='Stackhouse Shell Details v002'
if name in bpy.data.scenes: raise RuntimeError('Inspect existing v002 scene before replacing it')
scene=bpy.data.scenes.new(name)
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
parts=[]

def mat(name,color,rough=.6,metal=0,emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=rough
    bs.inputs['Metallic'].default_value=metal
    if emission:
        bs.inputs['Emission Color'].default_value=(*color,1)
        bs.inputs['Emission Strength'].default_value=emission
    return m

oak=mat('V002 Satin smoked oak',(.22,.115,.06),.47)
paint=mat('V002 Ivory joinery',(.68,.65,.59),.58)
navy=mat('V002 Ink blue panelling',(.042,.068,.10),.64)
steel=mat('V002 Blackened steel',(.022,.028,.034),.4,.65)
brass=mat('V002 Aged brass',(.27,.18,.07),.35,.72)
linen=mat('V002 Warm opal diffuser',(.95,.75,.46),.7,0,1.5)

# A small authored tile: lengthwise grain with quiet variation, stored as an
# ordinary PNG so glTF has no dependency on Blender procedural shader nodes.
u,v=np.meshgrid(np.linspace(0,1,256),np.linspace(0,1,1024))
warp=u+.010*np.sin(v*16+u*8)+.004*np.sin(v*39-u*12)
grain=.96+.045*np.sin(warp*490)+.028*np.sin(warp*1110+v*4)+.025*np.sin(warp*85)
grain+=np.random.default_rng(73).normal(0,.006,grain.shape)
rgba=np.ones((1024,256,4),dtype=np.float32)
for i,c in enumerate([.50,.34,.22]): rgba[:,:,i]=np.clip(c*grain,0,1)
tex=bpy.data.images.new('V002 oak grain',width=256,height=1024)
tex.pixels.foreach_set(rgba.ravel());tex.filepath_raw=str(SRC/'oak-grain-v002.png');tex.file_format='PNG';tex.save();tex.pack()
node=oak.node_tree.nodes.new('ShaderNodeTexImage');node.image=tex
oak.node_tree.links.new(node.outputs['Color'],oak.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])

def xyz(p): return Vector((p[0],-p[2],p[1]))
def finish(ob,name,material,bevel):
    ob.name=name;ob.data.materials.append(material)
    if bevel:
        mod=ob.modifiers.new('Soft architectural edge','BEVEL');mod.width=bevel;mod.segments=2
        ob.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    parts.append(ob);return ob
def box(name,center,size,material,bevel=.002):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(center));ob=bpy.context.object
    ob.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if material==oak:
        uv=ob.data.uv_layers.active
        for poly in ob.data.polygons:
            for li in poly.loop_indices:
                co=ob.data.vertices[ob.data.loops[li].vertex_index].co
                uv.data[li].uv=(co.x/max(size[0],.001)+.5,-co.y/max(size[2],.001)+.5)
    return finish(ob,name,material,bevel)
def beam(name,a,b,width,depth,material):
    av,bv=xyz(a),xyz(b)
    bpy.ops.mesh.primitive_cube_add(size=1,location=(av+bv)/2);ob=bpy.context.object
    ob.scale=(width,depth,(bv-av).length);ob.rotation_euler=(bv-av).to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(ob,name,material,.003)
exports=[]
def export(filename):
    bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
    for src in parts:
        mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps))
        ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy()
        scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
    bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object
    corners=[ob.matrix_world@Vector(c) for c in ob.bound_box]
    bounds={'min':[min((c.x,c.z,-c.y)[i] for c in corners) for i in range(3)],'max':[max((c.x,c.z,-c.y)[i] for c in corners) for i in range(3)]}
    path=ROOT/'public/models'/filename
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
    exports.append({'asset':filename,'triangles':sum(len(p.vertices)-2 for p in ob.data.polygons),'bounds':bounds,'bytes':path.stat().st_size})
    mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
    if not mesh.users:bpy.data.meshes.remove(mesh)
    parts.clear()

# Attic guards, locally placed at X0 / attic floor in the browser.
for g in data['ATTIC_GUARDS']:
    a=(g['a'][0]-data['X0'],g['a'][1]);b=(g['b'][0]-data['X0'],g['b'][1])
    length=math.hypot(b[0]-a[0],b[1]-a[1]);n=math.ceil(length/.105)
    for i in range(n+1):
        t=i/n;x=a[0]+(b[0]-a[0])*t;z=a[1]+(b[1]-a[1])*t
        box('Guard '+g['id']+' baluster',(x,.51,z),(.018,1.02,.018),steel,.001)
    for x,z in [a,b]:box('Guard '+g['id']+' newel',(x,.52,z),(.065,1.04,.065),oak,.004)
    beam('Guard '+g['id']+' handrail',(a[0],1.025,a[1]),(b[0],1.025,b[1]),.06,.055,oak)
export('attic-guards-v002.glb')

def segments(lo,hi,doors):
    cursor=lo
    for d in sorted(doors,key=lambda d:d['center']):
        a=max(lo,d['center']-d['width']/2);b=min(hi,d['center']+d['width']/2)
        if a>cursor:yield cursor,a
        cursor=max(cursor,b)
    if cursor<hi:yield cursor,hi

for room in data['rooms']:
    b=room['bounds'];xmin=b['minX']-data['X0'];xmax=b['maxX']-data['X0'];zmin=b['minZ'];zmax=b['maxZ']
    # The foyer boards stop before the shaft. Keep slab openings unaltered.
    floor_zmax=min(zmax,2.58) if room['id']=='foyer' else zmax-.2
    start=xmin+.2;end=xmax-.2;columns=math.ceil((end-start)/.165);width=(end-start)/columns
    for i in range(columns):
        z=zmin+.2;offset=[.65,1.15,1.8][i%3];j=0
        while z<floor_zmax-.002:
            length=min(offset if j==0 else 1.8,floor_zmax-z)
            box(room['id']+f' oak board {i}-{j}',(start+width*(i+.5),.006,z+length/2),(width-.0015,.012,max(.001,length-.0015)),oak,.0008)
            z+=length;j+=1
    for side in ['north','south','east','west']:
        axis='x' if side in ['north','south'] else 'z'
        lo,hi=(xmin,xmax) if axis=='x' else (zmin,zmax)
        inner={'north':zmax-.2,'south':zmin+.2,'east':xmax-.2,'west':xmin+.2}[side]
        direction=-1 if side in ['north','east'] else 1
        doors=[dict(d,center=d['center']-data['X0'] if axis=='x' else d['center']) for d in room['doors'] if d['side']==side]
        def strip(label,a,b,y,h,depth,material,recess=False):
            c=(a+b)/2;perp=inner+direction*depth/2*(-1 if recess else 1)
            return box(label,(c,y,perp) if axis=='x' else (perp,y,c),(b-a,h,depth) if axis=='x' else (depth,h,b-a),material)
        if room['id']=='client-room':
            strip('Ceiling cornice lower step',lo+.2,hi-.2,2.945,.06,.04,paint)
            strip('Ceiling cornice upper step',lo+.2,hi-.2,2.985,.03,.07,paint)
        for a,b in segments(lo+.2,hi-.2,doors):
            strip('Skirting cap',a,b,.13,.025,.032,paint)
            if room['id']=='client-room' and side in ['north','east']:
                strip('Ink blue panel field',a,b,.46,.61,.012,navy)
                strip('Panel lower rail',a,b,.19,.065,.028,navy)
                strip('Panel top rail',a,b,.745,.065,.028,navy)
                strip('Chair rail cap',a,b,.80,.035,.043,paint)
                count=max(1,round((b-a)/.9))
                for i in range(count+1):
                    x=a+(b-a)*i/count
                    strip('Panel stile',max(a,x-.027),min(b,x+.027),.465,.49,.026,navy)
        for d in doors:
            # The entry-door asset owns the arched front casing and jambs.
            if room['id']=='foyer' and side=='south': continue
            a=d['center']-d['width']/2;b=d['center']+d['width']/2
            for x in [a-.075,b+.075]:
                strip('Door plinth block',x-.075,x+.075,.105,.21,.05,paint)
            strip('Door header crown',a-.12,b+.12,2.175,.035,.045,paint)
            for x in [a-.102,b+.102]:strip('Architrave outer bead',x-.012,x+.012,1.15,1.88,.035,paint)
            # Actual painted jamb lining gives the opening depth and continuity.
            for x in [a+.006,b-.006]:strip('Door jamb lining',x-.006,x+.006,1.025,2.05,.205,paint,True)

for p in data['SHELL_PRACTICALS']:
    x,y,z=p['position'];x-=data['X0'];south=p['id']!='client-north';wall_z=.223 if south else 5.177
    box(p['id']+' brass backplate',(x,y,wall_z),(.11,.39,.026),brass,.008)
    box(p['id']+' mounting arm',(x,y,(wall_z+z)/2),(.035,.035,abs(z-wall_z)),brass,.003)
    box(p['id']+' opal wall light',(x,y,z),(.20,.30,.115),linen,.016)
    for dy in [-.163,.163]:box(p['id']+' brass cap',(x,y+dy,z),(.215,.025,.13),brass,.005)
export('foyer-client-details-v002.glb')

bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'shell-details-v002.blend'))
manifest={'version':'v002','source':'shell-details-v002.blend','units':'metres','axes':'Blender Z up to glTF Y up','placement':'X0 plus owning floor base Y','exports':exports,'layout_sha256':hashlib.sha256((ROOT/'lib/interior-layout.ts').read_bytes()).hexdigest(),'source_sha256':hashlib.sha256((SRC/'shell-details-v002.blend').read_bytes()).hexdigest(),'textures':['oak-grain-v002.png'],'note':'Authored fixtures use separately pooled runtime lights; no glTF lights.'}
(SRC/'shell-details-v002.manifest.json').write_text(json.dumps(manifest,indent=2))
result=manifest['exports']
