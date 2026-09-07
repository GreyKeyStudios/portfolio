"""Wood downstairs, warm carpet upstairs, tile in kitchen and bathrooms."""
import bpy, json, math, hashlib
import numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'portfolio-assets/stack-house/blender'
data=json.loads((SRC/'floor-finishes-layout-v002.json').read_text())
name='Stackhouse Floor Finishes v002'
if name in bpy.data.scenes:raise RuntimeError('Inspect existing finish scene before replacing')
scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
def material(name,texture,roughness):
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=roughness
    image=bpy.data.images.load(str(SRC/texture),check_existing=True);image.pack()
    node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=image
    m.node_tree.links.new(node.outputs['Color'],bs.inputs['Base Color']);return m
def save_texture(name,rgb):
    h,w,_=rgb.shape;im=bpy.data.images.new(name,width=w,height=h)
    pixels=np.ones((h,w,4),dtype=np.float32);pixels[:,:,:3]=rgb
    im.pixels.foreach_set(pixels.ravel());im.filepath_raw=str(SRC/name);im.file_format='PNG';im.save()
y,x=np.mgrid[0:256,0:256]
rng=np.random.default_rng(207)
noise=rng.normal(0,.027,(256,256))+.013*np.sin(x*math.pi/2)*np.cos(y*math.pi/2)
save_texture('warm-carpet-v002.png',np.stack([np.clip(c+noise,0,1) for c in [.57,.53,.46]],axis=-1))
joint=(x<2)|(y<2)|(x>253)|(y>253)
noise=rng.normal(0,.004,(256,256))+.006*np.sin(x/21)*np.cos(y/29)
save_texture('warm-tile-v002.png',np.stack([np.where(joint,c-.12,c+noise) for c in [.64,.625,.59]],axis=-1))
oak=material('V002 Smoked oak flooring','oak-grain-v002.png',.47)
carpet=material('V002 Warm low-pile carpet','warm-carpet-v002.png',1)
tile=material('V002 Warm porcelain tile','warm-tile-v002.png',.7)
def subtract(b,h):
    a=max(b['minX'],h['minX']);c=min(b['maxX'],h['maxX']);d=max(b['minZ'],h['minZ']);e=min(b['maxZ'],h['maxZ'])
    if a>=c or d>=e:return [b]
    rects=[(b['minX'],a,b['minZ'],b['maxZ']),(c,b['maxX'],b['minZ'],b['maxZ']),(a,c,b['minZ'],d),(a,c,e,b['maxZ'])]
    return [dict(zip(['minX','maxX','minZ','maxZ'],r)) for r in rects if r[1]-r[0]>.0001 and r[3]-r[2]>.0001]
parts=[]
def surface(label,a,b,c,d,mat,uv):
    # Clear the original 12mm doorway thresholds by 2mm to prevent coplanar flicker.
    vertices=[(a-data['X0'],-c,.014),(a-data['X0'],-d,.014),(b-data['X0'],-d,.014),(b-data['X0'],-c,.014)]
    mesh=bpy.data.meshes.new(label);mesh.from_pydata(vertices,[],[(0,1,2,3)]);mesh.materials.append(mat)
    layer=mesh.uv_layers.new()
    for i,value in enumerate(uv):layer.data[i].uv=value
    ob=bpy.data.objects.new(label,mesh);scene.collection.objects.link(ob);parts.append(ob)
finishes={};exports=[]
for floor in ['ground','second']:
    parts=[]
    for room in [r for r in data['rooms'] if r['floor']==floor]:
        kind='tile' if room['id'] in ['kitchen','half-bath','bathroom'] else 'wood' if floor=='ground' else 'carpet'
        finishes[room['id']]=kind
        # These two rooms already have individually authored oak boards.
        if room['id'] in ['foyer','client-room']:continue
        for r in subtract(room['bounds'],data['shaft']):
            a,b,c,d=[r[k] for k in ['minX','maxX','minZ','maxZ']]
            if kind=='wood':
                # Same 165mm boards, staggered joins and grain as the foyer.
                columns=math.ceil((b-a)/.165);w=(b-a)/columns
                for i in range(columns):
                    z=c;j=0
                    while z<d-.001:
                        length=min([.65,1.15,1.8][i%3] if j==0 else 1.8,d-z)
                        surface(room['id']+' oak',a+i*w+.00075,a+(i+1)*w-.00075,z+.00075,z+length-.00075,oak,[(0,0),(0,1),(1,1),(1,0)])
                        z+=length;j+=1
            else:
                scale=.6 if kind=='tile' else .45
                surface(room['id']+' '+kind,a,b,c,d,tile if kind=='tile' else carpet,[(a/scale,c/scale),(a/scale,d/scale),(b/scale,d/scale),(b/scale,c/scale)])
    bpy.ops.object.select_all(action='DESELECT')
    for ob in parts:ob.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();ob=bpy.context.object
    ob.name=floor+' floor finishes'
    path=ROOT/'public/models'/('floor-finishes-'+floor+'-v002.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False)
    exports.append({'floor':floor,'triangles':len(ob.data.polygons)*2,'bytes':path.stat().st_size})
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'floor-finishes-v002.blend'))
manifest={'finishes':finishes,'exports':exports,'layout_sha256':hashlib.sha256((ROOT/'lib/interior-layout.ts').read_bytes()).hexdigest()}
(SRC/'floor-finishes-v002.manifest.json').write_text(json.dumps(manifest,indent=2))
result=manifest
