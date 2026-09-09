"""Build the replaceable-art Stackhouse Arcade environment through Blender MCP."""
import bpy,json,hashlib,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'portfolio-assets/stack-house/blender'
if bpy.context.object and bpy.context.object.mode!='OBJECT':bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);scene=bpy.context.scene;scene.name='Stackhouse Arcade v002';scene.unit_settings.system='METRIC';parts=[]
def mat(n,c,r=.62,metal=0,emit=0):
 m=bpy.data.materials.get(n) or bpy.data.materials.new(n);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*c,1);b.inputs['Roughness'].default_value=r;b.inputs['Metallic'].default_value=metal
 if emit:b.inputs['Emission Color'].default_value=(*c,1);b.inputs['Emission Strength'].default_value=emit
 return m
black=mat('Arcade black laminate',(.012,.014,.018),.42);steel=mat('Arcade black steel',(.018,.022,.025),.28,.76);oak=mat('Arcade smoked oak',(.16,.062,.022),.48);brass=mat('Arcade aged brass',(.34,.18,.045),.31,.70);felt=mat('Pool navy felt',(.018,.08,.12),.82);ivory=mat('Arcade warm ivory',(.66,.62,.54),.76);red=mat('Arcade oxblood',(.22,.025,.025),.58);green=mat('Arcade bottle green',(.025,.18,.08),.62);blue=mat('Arcade electric blue',(.018,.18,.36),.48);purple=mat('Arcade violet',(.17,.045,.30),.52);orange=mat('Arcade amber',(.48,.15,.025),.55);cyan=mat('Arcade screen cyan',(.015,.30,.40),.30,.1,.55);white=mat('Arcade luminous white',(.72,.68,.56),.36,0,.5)
def box(n,p,s,m,b=.01):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=n;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if b:q=o.modifiers.new('Soft edges','BEVEL');q.width=b;q.segments=2
 parts.append(o);return o
def cyl(n,p,r,d,m,v=20,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=d,location=(p[0],-p[2],p[1]),rotation=rot);o=bpy.context.object;o.name=n;o.data.materials.append(m);parts.append(o);return o
def text(n,label,p,size,m,rot=(math.pi/2,0,0)):
 # Placeholder title plate. The named swap material carries final typography
 # later; keeping this as six faces avoids shipping thousands of font curves.
 return box(n,p,(.012,size*1.15,size*5) if abs(rot[2])>1 else (size*10,size*1.15,.012),m,.003)

swap={i:{'marquee':mat(f'Swap_Arcade_{i:02}_Marquee',c,.40,0,.6),'side':mat(f'Swap_Arcade_{i:02}_SideArt',tuple(v*.60 for v in c),.58)} for i,c in enumerate(((.08,.50,.62),(.62,.08,.22),(.42,.12,.64),(.65,.28,.03),(.06,.50,.24)),1)}
def cabinet(i,x,z,front='east',style='classic'):
 sx=1 if front=='east' else -1; body=swap[i]['side']; fx=x+sx*.25
 # Five silhouettes share only real-world ergonomics, not a cloned shell.
 if style=='classic':
  box(f'Arcade {i:02} lower',(x,.55,z),(.62,1.10,.72),body,.025);box(f'Arcade {i:02} upper',(x,.145+1.28,z),(.62,.72,.58),black,.022)
 elif style=='nineties':
  box(f'Arcade {i:02} lower',(x,.53,z),(.70,1.06,.78),body,.04);box(f'Arcade {i:02} upper',(x,1.43,z),(.76,.76,.66),black,.05)
 elif style=='wide':
  box(f'Arcade {i:02} lower',(x,.52,z),(.76,1.04,.86),body,.018);box(f'Arcade {i:02} upper',(x,1.42,z),(.86,.78,.72),black,.028)
 elif style=='rhythm':
  box(f'Arcade {i:02} lower',(x,.48,z),(.64,.96,.70),body,.018);box(f'Arcade {i:02} tower',(x,1.43,z),(.68,.94,.58),black,.018);box(f'Arcade {i:02} light crown',(x,2.00,z),(.84,.18,.68),swap[i]['marquee'],.06)
 else:
  box(f'Arcade {i:02} lower',(x,.56,z),(.66,1.12,.78),body,.035);box(f'Arcade {i:02} curved head',(x,1.48,z),(.72,.72,.68),black,.11)
 box(f'Arcade {i:02} screen',(fx,1.48,z),(.025,.40,.44),cyan,.012);box(f'Arcade {i:02} controls',(x+sx*.36,1.10,z),(.22,.10,.52),black,.025)
 for dz in (-1.20,.12):cyl(f'Arcade {i:02} button',(x+sx*.46,1.18,z+dz),.032,.025,(red,blue,orange,green,purple)[i-1],16)
 box(f'Arcade {i:02} marquee',(fx,1.89,z),(.028,.22,.54),swap[i]['marquee'],.01);text(f'Arcade {i:02} label',f'ARCADE {i:02}',(x+sx*.285,1.89,z),.105,white,rotation(front))
 box(f'Arcade {i:02} side art A',(x,.94,z-.39),(.42,1.26,.018),swap[i]['side'],.012);box(f'Arcade {i:02} side art B',(x,.94,z+.39),(.42,1.26,.018),swap[i]['side'],.012)
def rotation(front):return (math.pi/2,0,-math.pi/2 if front=='east' else math.pi/2)

cabinet(1,-6.22,3.35,'east','classic');cabinet(2,-6.22,4.40,'east','nineties');cabinet(3,-6.20,5.52,'east','wide');cabinet(4,-1.55,5.08,'west','rhythm');cabinet(5,-1.55,6.30,'west','unique')

# Pinball gets its own silhouette and swappable backglass.
pin=mat('Swap_Pinball_Backglass',(.45,.06,.28),.36,0,.65);box('Pinball cabinet',(-6.00,.66,6.72),(1.05,.28,.68),black,.035);box('Pinball playfield',(-5.80,.86,6.72),(.90,.055,.58),pin,.018)
for x in (-6.27,-5.50):box('Pinball leg',(x,.34,6.50),(.045,.68,.045),steel,.008);box('Pinball leg',(x,.34,6.94),(.045,.68,.045),steel,.008)
box('Pinball backbox',(-6.30,1.45,6.72),(.22,.72,.72),black,.03);box('Pinball backglass',(-6.275,1.50,6.72),(.018,.58,.60),pin,.012);text('Pinball label','PINBALL',(-6.16,1.50,6.72),.11,white,rotation('east'))

# Modern console lounge at the south end.
tv=mat('Swap_Console_TV',(.015,.23,.30),.24,.18,.38);box('Media console',(-4.15,.34,.30),(2.30,.62,.38),oak,.028);box('Console television',(-4.15,1.38,.15),(1.72,.98,.07),black,.035);box('Console television art',(-4.15,1.38,.105),(1.58,.84,.015),tv,.014)
box('Game console',(-4.52,.69,.30),(.38,.10,.28),ivory,.018);box('Controller',(-3.90,.71,.30),(.30,.07,.16),steel,.04)
box('Lounge sofa',(-4.15,.52,2.25),(2.20,.55,.82),red,.11);box('Sofa back',(-4.15,1.00,2.58),(2.20,.75,.20),red,.10)
for x in (-5.50,-4.15,-3.42):box('Sofa cushion',(x,.78,2.16),(.64,.18,.58),red,.07)
box('Lounge rug',(-4.15,.018,1.65),(2.75,.025,2.22),felt,.035)

# Seven-foot table with credible cue zone around it.
box('Pool table body',(-3.75,.72,8.65),(1.18,.36,2.12),oak,.045);box('Pool playing bed',(-3.75,.93,8.65),(1.02,.055,1.96),felt,.035)
for x in (-4.26,-3.24):
 for z in (7.75,9.55):box('Pool table leg',(x,.34,z),(.16,.68,.16),oak,.025)
for x in (-4.17,-3.75,-3.33):
 for z,c in ((8.35,ivory),(8.65,red),(8.95,orange)):cyl('Pool ball',(x,.985,z),.045,.05,c,18)
box('Cue rack',(-6.39,1.25,8.78),(.08,1.75,.88),oak,.018)
for z in (8.48,8.68,8.88,9.08):cyl('Pool cue',(-6.28,1.20,z),.014,1.75,brass,12)

# Darts occupy the east side of the south wall with an unobstructed throwing strip.
box('Dart backboard',(-1.65,1.62,.16),(.92,.92,.045),oak,.03);cyl('Dartboard',(-1.65,1.62,.11),.31,.035,black,32,(math.pi/2,0,0));cyl('Dart bull',(-1.65,1.62,.085),.055,.04,red,24,(math.pi/2,0,0))
box('Dart throw line',(-1.65,.012,2.53),(.78,.018,.045),ivory,.005)

# A compact dedicated chess table fills the open recreation nook without
# borrowing cue clearance from the pool table.
box('Chess table top',(-4.40,.72,4.40),(.76,.07,.76),oak,.025);cyl('Chess table pedestal',(-4.40,.36,4.40),.10,.68,steel,20);cyl('Chess table foot',(-4.40,.08,4.40),.31,.055,steel,24)
for row in range(8):
 for col in range(8):box('Chess square '+str(row)+' '+str(col),(-4.40+(col-3.5)*.075,.77,4.40+(row-3.5)*.075),(.074,.012,.074),ivory if (row+col)%2 else black,.001)
for side,z in ((0,4.20),(1,4.60)):
 for col in range(8):cyl('Chess piece '+str(side)+' '+str(col),(-4.40+(col-3.5)*.075,.81,z),.018+.004*(col in (0,7)),.08,ivory if side else black,12)
for z,face in ((3.74,1),(5.06,-1)):
 box('Chess chair seat',(-4.40,.48,z),(.48,.12,.46),red,.05);box('Chess chair back',(-4.40,.82,z-.24*face),(.48,.58,.10),red,.05)

# Replaceable poster and box-art system.
poster=mat('Swap_Poster_Wall',(.34,.08,.50),.48);boxart=mat('Swap_Box_Art',(.58,.18,.025),.55);sign=mat('Swap_Arcade_Sign',(.02,.45,.55),.34,0,.7)
for i,(z,c) in enumerate(((3.20,poster),(4.05,boxart),(7.25,poster))):box('Replaceable wall frame '+str(i),(-1.20,1.62,z),(.035,.82,.62),steel,.018);box('Replaceable wall art '+str(i),(-1.225,1.62,z),(.012,.70,.50),c,.008)
box('Game box shelf',(-1.24,.92,3.85),(.28,1.10,1.60),oak,.018)
for row,y in enumerate((.58,.92,1.26)):
 for i,z in enumerate((3.32,3.64,3.96,4.28)):box('Replaceable game box '+str(row)+' '+str(i),(-1.44,y,z),(.12,.24,.22),boxart if (row+i)%2 else poster,.006)
box('Stackhouse Arcade sign',(-3.90,2.52,10.59),(2.60,.34,.045),sign,.03);text('Stackhouse Arcade letters','STACKHOUSE ARCADE',(-3.90,2.52,10.55),.16,white,(math.pi/2,0,0))

bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');copies=[];deps=bpy.context.evaluated_depsgraph_get()
for src in parts:
 mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps));ob=bpy.data.objects.new('Export '+src.name,mesh);ob.matrix_world=src.matrix_world.copy();scene.collection.objects.link(ob);ob.select_set(True);copies.append(ob)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();ob=bpy.context.object;triangles=sum(len(p.vertices)-2 for p in ob.data.polygons);path=ROOT/'public/models/game-room-furniture-v002.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_lights=False,export_cameras=False);mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
if not mesh.users:bpy.data.meshes.remove(mesh)
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'game-room-furniture-v002.blend'));layout=ROOT/'lib/game-room-furniture-v002.json';manifest={'triangles':triangles,'bytes':path.stat().st_size,'pieces':len(parts),'layout_sha256':hashlib.sha256(layout.read_bytes()).hexdigest(),'replaceable_surfaces':len(json.loads(layout.read_text())['replaceableSurfaces']),'note':'Stackhouse Arcade spatial pass with five distinct cabinets, pinball, console lounge, pool, darts and replaceable art slots.'};(SRC/'game-room-furniture-v002.manifest.json').write_text(json.dumps(manifest,indent=2));result=manifest
