import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { Box3, Raycaster, Vector3, PerspectiveCamera, Texture } from 'three'
import { createRequire } from 'node:module'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const load = async (name) => {
  const bytes = fs.readFileSync(`public/models/${name}.glb`)
  // Geometry regression runs in Node without browser image decoding. Texture
  // appearance is checked in-browser; preserve material maps with placeholders.
  const loader = new GLTFLoader().register(() => ({ name: 'geometry-only-textures', loadTexture: () => Promise.resolve(new Texture()) }))
  return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
}
const layout = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/layout-v001.json'))
const manifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/staircase-v002.manifest.json'))
const hash = (path) => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')
assert.equal(hash('lib/interior-layout.ts'), manifest.layout_sha256, 'Stair layout is stale')
assert.equal(hash('portfolio-assets/stack-house/blender/staircase-v002.blend'), manifest.source_sha256, 'Source hash differs')
assert.equal(hash('portfolio-assets/stack-house/blender/oak-grain-v002.png'),manifest.texture_sha256,'Stair oak source texture is stale')
const { scene } = await load('staircase-v002')
scene.updateMatrixWorld(true)
const bounds = new Box3().setFromObject(scene)
assert.ok(Math.abs(bounds.min.x + 1.15) < .01 && Math.abs(bounds.max.x - 1.15) < .01, 'Flight width/origin mismatch')
const ray = new Raycaster()
// Sample each added baluster above its tread and the short landing return.
for (const s of layout.stairs.filter(s => s.floor === 'ground' && s.topY > s.bottomY)) {
  const west = s.bounds.maxX < layout.X0
  for (let i = 0; i < 9; i++) for (const offset of [.25,.75]) {
    const z = s.bottomCoord + (s.topCoord-s.bottomCoord)*(i+offset)/9
    const seat = s.bottomY + (s.topY-s.bottomY)*(i+1)/9
    ray.set(new Vector3(west ? -.4 : .4,seat+.3,z),new Vector3(west ? 1 : -1,0,0))
    const hit = ray.intersectObject(scene,true)[0]
    assert.ok(hit && hit.object.material.name.includes('Blackened steel'), 'Missing seated stair baluster')
  }
}
ray.set(new Vector3(0,2.9,4.9),new Vector3(0,-1,0))
assert.ok(Math.abs(ray.intersectObject(scene,true)[0]?.point.y-2.5775)<.02, 'Disconnected half-landing handrail')
// The centre gap between flights belongs to the shaft, not to the floor slab.
// Cutting each flight separately used to leave a 20 cm floor/ceiling beam here.
for (const floor of ['basement', 'ground', 'second', 'attic']) {
  const shell = (await load(`interior-${floor}-v002`)).scene
  shell.updateMatrixWorld(true)
  for (const z of [2.8, 3.8, 4.7]) {
    if (floor !== 'basement') {
      ray.set(new Vector3(layout.X0, .2, z), new Vector3(0, -1, 0))
      assert.ok(!ray.intersectObject(shell, true).some(hit => hit.distance < .4), `${floor}: floor strip in stair gap at ${z}`)
    }
    if (floor !== 'attic') {
      ray.set(new Vector3(layout.X0, 2.8, z), new Vector3(0, 1, 0))
      assert.ok(!ray.intersectObject(shell, true).some(hit => hit.distance < .4), `${floor}: ceiling strip in stair gap at ${z}`)
    }
  }
}
let samples = 0
const finishManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/floor-finishes-v002.manifest.json'))
assert.equal(hash('lib/interior-layout.ts'), finishManifest.layout_sha256, 'Floor finishes use a stale plan')
const finishPlan = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/floor-finishes-layout-v002.json'))
for (const floor of ['ground','second']) {
  const finish = (await load(`floor-finishes-${floor}-v002`)).scene
  finish.updateMatrixWorld(true)
  ray.set(new Vector3(0,1,3.8),new Vector3(0,-1,0))
  assert.equal(ray.intersectObject(finish,true).length,0,'Floor finish covers the stair opening')
  for (const room of finishPlan.rooms.filter(r=>r.floor===floor && !['foyer','client-room'].includes(r.id))) {
    const b=room.bounds
    ray.set(new Vector3((b.minX+b.maxX)/2-finishPlan.X0+.037,1,b.minZ+.71),new Vector3(0,-1,0))
    const hit=ray.intersectObject(finish,true)[0]
    const expected=['kitchen','half-bath','bathroom'].includes(room.id)?'tile':floor==='ground'?'oak':'carpet'
    assert.ok(hit && hit.object.material.name.toLowerCase().includes(expected),`${room.id}: wrong or missing floor finish`)
    assert.ok(Math.abs(hit.point.y-.014)<.0005,`${room.id}: floor finish must clear 12mm thresholds`)
  }
}
for (const s of layout.stairs.filter(s => s.floor === 'ground')) {
  const x = (s.bounds.minX + s.bounds.maxX) / 2 - layout.X0
  const rise = s.topY - s.bottomY
  const count = rise ? Math.round(rise / .18) : 1
  for (let i = 0; i < count; i++) {
    const z = s.bottomCoord + (s.topCoord - s.bottomCoord) * (i + .5) / count
    const expected = s.bottomY + rise * (i + 1) / count
    ray.set(new Vector3(x, expected + .3, z), new Vector3(0, -1, 0))
    const hit = ray.intersectObject(scene, true)[0]
    assert.ok(hit && Math.abs(hit.point.y - expected) < .005, `Tread/landing mismatch ${s.id} ${i}`)
    samples++
  }
}
const basement = (await load('interior-basement-v001')).scene
basement.updateMatrixWorld(true)
ray.set(new Vector3(layout.X0 - .625, .1, 3.5), new Vector3(0, -1, 0))
assert.ok(Math.abs(ray.intersectObject(basement, true)[0]?.point.y ?? Infinity) < .001, 'Basement shaft bottom is open')
let opposed = 0
const attic = (await load('interior-attic-v001')).scene
attic.traverse(ob => {
  if (!ob.isMesh) return
  const p = ob.geometry.attributes.position, n = ob.geometry.attributes.normal, ix = ob.geometry.index
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), normal = new Vector3()
  for (let i = 0; i < ix.count; i += 3) {
    const ia = ix.getX(i), ib = ix.getX(i + 1), ic = ix.getX(i + 2)
    a.fromBufferAttribute(p, ia); b.fromBufferAttribute(p, ib); c.fromBufferAttribute(p, ic)
    normal.fromBufferAttribute(n, ia)
    if (b.sub(a).cross(c.sub(a)).dot(normal) < -1e-8) opposed++
  }
})
assert.equal(opposed, 0, 'Attic has inward-wound faces')
// Exercise the same movement function used by desktop and touch controls.
const require = createRequire(import.meta.url)
const ts = require('typescript')
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename)
}
const { stepPlayer } = require('../lib/player-movement.ts')
const { YARD_EXIT_POINT } = require('../lib/interior-layout.ts')
const exitCamera = new PerspectiveCamera()
exitCamera.position.fromArray(YARD_EXIT_POINT)
stepPlayer(exitCamera,'yard',{forward:0,strafe:0,speed:0},1/60,false)
assert.ok(exitCamera.position.distanceTo(new Vector3(...YARD_EXIT_POINT)) < .001,'Yard exit is pushed out by collision')
const { INTERIOR_EYE_HEIGHT } = require('../lib/player-camera.ts')
const { ROOMS, WINDOW_SILL, WINDOW_HEAD } = require('../lib/interior-layout.ts')
let windowSamples = 0
for (const floor of ['basement','ground','second','attic']) {
  const shell = (await load(`interior-${floor}-v002`)).scene
  shell.updateMatrixWorld(true)
  if (floor !== 'attic') shell.traverse(ob => {
    if (!ob.isMesh || ob.material.name !== 'wall') return
    ob.geometry.computeBoundingBox()
    assert.ok(ob.geometry.boundingBox.max.y < 3.19, `${floor}: wall tops coincide with next floor surface`)
    assert.ok(ob.geometry.boundingBox.max.y > 3.08, `${floor}: wall must overlap slab underside`)
  })
  for (const room of ROOMS.filter(r => r.floor === floor)) for (const w of room.windows ?? []) {
    const y = (w.sill ?? WINDOW_SILL) + ((w.head ?? WINDOW_HEAD)-(w.sill ?? WINDOW_SILL))*.3
    const b = room.bounds
    for (const [along,expected] of [[w.center+w.width*.24,'glass'],[w.center-w.width/2+.025,'trim']]) {
      const origin = w.side === 'south' ? new Vector3(along,y,b.minZ+.6)
        : w.side === 'north' ? new Vector3(along,y,b.maxZ-.6)
        : w.side === 'east' ? new Vector3(b.maxX-.6,y,along) : new Vector3(b.minX+.6,y,along)
      const direction = w.side === 'south' ? new Vector3(0,0,-1) : w.side === 'north' ? new Vector3(0,0,1)
        : w.side === 'east' ? new Vector3(1,0,0) : new Vector3(-1,0,0)
      ray.set(origin,direction)
      assert.equal(ray.intersectObject(shell,true)[0]?.object.material.name,expected,`${room.id} ${w.side}: window ${expected}`)
    }
    windowSamples++
  }
}
assert.ok(windowSamples >= 28,'Missing window coverage')
const { ENTRY_DOOR } = require('../lib/architecture-details.ts')
const doorCamera = new PerspectiveCamera()
doorCamera.position.set(ENTRY_DOOR.centerX, INTERIOR_EYE_HEIGHT, 1.0)
doorCamera.lookAt(ENTRY_DOOR.centerX, INTERIOR_EYE_HEIGHT, -1)
for (let i = 0; i < 120; i++) stepPlayer(doorCamera, 'ground', {forward:1,strafe:0,speed:2}, 1/60, false)
assert.ok(doorCamera.position.z > ENTRY_DOOR.centerZ + ENTRY_DOOR.thickness/2 + .21, 'Walked through closed entrance')
assert.ok(doorCamera.position.distanceTo(new Vector3(ENTRY_DOOR.centerX,1,.8)) < 1.3, 'Door blocks exit interaction reach')
const doorArt = (await load('entry-door-v002')).scene
doorArt.updateMatrixWorld(true)
ray.set(new Vector3(0,1,1), new Vector3(0,0,-1))
const doorHit = ray.intersectObject(doorArt,true)[0]
for (const x of [-.15,.15]) {
  ray.set(new Vector3(x,1.5,1),new Vector3(0,0,-1))
  const hit = ray.intersectObject(doorArt,true)[0]
  assert.ok(hit && hit.object.material.name.includes('night glazing'), 'Entrance must have two tall glazed panes')
}
assert.ok(doorHit && Math.abs(doorHit.point.z - ENTRY_DOOR.centerZ - ENTRY_DOOR.thickness/2) < .025, 'Door art/collision mismatch')
const { getInteriorColliders } = require('../lib/interior-colliders.ts')
const { moveWithCollision } = require('../lib/collision.ts')
const { registerLivingFurniture, LIVING_FURNITURE_COLLIDERS } = require('../lib/living-furniture.ts')
const { registerDiningFurniture, DINING_FURNITURE_COLLIDERS } = require('../lib/dining-furniture.ts')
const { registerKitchenFurniture, KITCHEN_FURNITURE_COLLIDERS } = require('../lib/kitchen-furniture.ts')
const { registerPantryFurniture, PANTRY_FURNITURE_COLLIDERS } = require('../lib/pantry-furniture.ts')
const { registerLaundryFurniture, LAUNDRY_FURNITURE_COLLIDERS } = require('../lib/laundry-furniture.ts')
const { registerMudroomFurniture, MUDROOM_FURNITURE_COLLIDERS } = require('../lib/mudroom-furniture.ts')
const { registerHalfBathFurniture, HALF_BATH_FURNITURE_COLLIDERS } = require('../lib/half-bath-furniture.ts')
const { registerBathroomFurniture, BATHROOM_FURNITURE_COLLIDERS } = require('../lib/bathroom-furniture.ts')
const { registerStorageFurniture, STORAGE_FURNITURE_COLLIDERS } = require('../lib/storage-furniture.ts')
const { registerLinenFurniture, LINEN_FURNITURE_COLLIDERS } = require('../lib/linen-furniture.ts')
const { registerOfficeDressing, OFFICE_DRESSING_COLLIDERS } = require('../lib/office-dressing.ts')
const { registerBedroomFurniture, BEDROOM_FURNITURE_COLLIDERS } = require('../lib/bedroom-furniture.ts')
const { getActiveColliders } = require('../lib/use-player-vertical.ts')
assert.ok(!getActiveColliders('ground').some(c => c.label?.startsWith('living-')), 'Legacy has invisible furniture')
const removeFurniture = registerLivingFurniture()
const removeDining = registerDiningFurniture()
const removeKitchen = registerKitchenFurniture()
const removePantry = registerPantryFurniture()
const removeLaundry = registerLaundryFurniture()
const removeMudroom = registerMudroomFurniture()
const removeHalfBath = registerHalfBathFurniture()
const furnished = getActiveColliders('ground')
assert.equal(furnished.filter(c => c.label?.startsWith('living-')).length, 5)
assert.equal(furnished.filter(c => c.label?.startsWith('dining-')).length, 8)
assert.equal(furnished.filter(c => c.label?.startsWith('kitchen-furniture-')).length, 6)
assert.equal(furnished.filter(c => c.label?.startsWith('pantry-furniture-')).length, 2)
assert.equal(furnished.filter(c => c.label?.startsWith('laundry-furniture-')).length, 3)
assert.equal(furnished.filter(c => c.label?.startsWith('mudroom-furniture-')).length, 2)
assert.equal(furnished.filter(c => c.label?.startsWith('half-bath-furniture-')).length, 2)
// The approved dining plan depends on this service route being a real opening
// in both faces of the shared wall, not just a visual gap in one room.
const serviceRoute = [[298,7.1],[300,7.1],[302,7.1]]
for (let i=1;i<serviceRoute.length;i++) {
  const [x,z]=serviceRoute[i], [px,pz]=serviceRoute[i-1]
  const reached=moveWithCollision(px,pz,x,z,furnished)
  assert.ok(Math.hypot(reached.x-x,reached.z-z)<.01, `Kitchen-pantry-dining route is blocked at ${x},${z}`)
}
// Walk from the mudroom around the relocated refrigerator to the clear east service lane.
const kitchenRoute = [[297.3,3.35],[297.3,4.0],[298.35,4.0],[298.35,7.1]]
for (let i=1;i<kitchenRoute.length;i++) {
  const [x,z]=kitchenRoute[i], [px,pz]=kitchenRoute[i-1]
  const reached=moveWithCollision(px,pz,x,z,furnished)
  assert.ok(Math.hypot(reached.x-x,reached.z-z)<.01, `Kitchen circulation is blocked at ${x},${z}`)
}
const kitchenManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/kitchen-furniture-v002.manifest.json'))
assert.equal(hash('lib/kitchen-furniture-v002.json'), kitchenManifest.layout_sha256, 'Kitchen export layout is stale')
const pantryManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/pantry-furniture-v002.manifest.json'))
assert.equal(hash('lib/pantry-furniture-v002.json'), pantryManifest.layout_sha256, 'Pantry export layout is stale')
const laundryManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/laundry-furniture-v002.manifest.json'))
assert.equal(hash('lib/laundry-furniture-v002.json'), laundryManifest.layout_sha256, 'Laundry export layout is stale')
const mudroomManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/mudroom-furniture-v002.manifest.json'))
assert.equal(hash('lib/mudroom-furniture-v002.json'), mudroomManifest.layout_sha256, 'Mudroom export layout is stale')
const halfBathManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/half-bath-furniture-v002.manifest.json'))
assert.equal(hash('lib/half-bath-furniture-v002.json'), halfBathManifest.layout_sha256, 'Half-bath export layout is stale')
const bathroomManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/bathroom-furniture-v002.manifest.json'))
assert.equal(hash('lib/bathroom-furniture-v002.json'), bathroomManifest.layout_sha256, 'Bathroom export layout is stale')
const storageManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/storage-furniture-v002.manifest.json'))
assert.equal(hash('lib/storage-furniture-v002.json'), storageManifest.layout_sha256, 'Storage export layout is stale')
const linenManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/linen-furniture-v002.manifest.json'))
assert.equal(hash('lib/linen-furniture-v002.json'), linenManifest.layout_sha256, 'Linen export layout is stale')
const officeManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/office-dressing-v002.manifest.json'))
assert.equal(hash('lib/office-dressing-v002.json'), officeManifest.layout_sha256, 'Office dressing export layout is stale')
const bedroomManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/bedroom-furniture-v002.manifest.json'))
assert.equal(hash('lib/bedroom-furniture-v002.json'), bedroomManifest.layout_sha256, 'Bedroom export layout is stale')
assert.equal(hash('lib/bedroom-merch-surfaces-v002.json'), bedroomManifest.merch_sha256, 'Bedroom merch surface map is stale')
const furnitureManifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/living-furniture-v002.manifest.json'))
assert.equal(hash('lib/living-furniture-v002.json'), furnitureManifest.layout_sha256, 'Furniture export layout is stale')
// Walk from foyer into the room, around the seating group, and out the north door.
const route = [[300,1.4],[302,1.4],[302.8,1.85],[302.8,4.9],[303.9,4.9],[303.9,5.8]]
for (let i=1;i<route.length;i++) {
  const [x,z]=route[i], [px,pz]=route[i-1]
  const reached=moveWithCollision(px,pz,x,z,furnished)
  assert.ok(Math.hypot(reached.x-x,reached.z-z)<.01, `Furniture blocks room route at ${x},${z}`)
}
for (const piece of LIVING_FURNITURE_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.minX-.5,z,x,z,[piece])
  assert.ok(stopped.x < piece.minX, `${piece.label} does not block the player`)
}
for (const piece of DINING_FURNITURE_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.minX-.5,z,x,z,[piece])
  assert.ok(stopped.x < piece.minX, `${piece.label} does not block the player`)
}
for (const piece of KITCHEN_FURNITURE_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.minX-.5,z,x,z,[piece])
  assert.ok(stopped.x < piece.minX, `${piece.label} does not block the player`)
}
for (const piece of PANTRY_FURNITURE_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.minX-.5,z,x,z,[piece])
  assert.ok(stopped.x < piece.minX, `${piece.label} does not block the player`)
}
for (const piece of LAUNDRY_FURNITURE_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.minX-.5,z,x,z,[piece])
  assert.ok(stopped.x < piece.minX, `${piece.label} does not block the player`)
}
// Enter from the Kitchen and reach the clear working aisle in front of both machines.
const laundryRoute = [[297.9,9.4],[298.35,9.4],[299.3,9.4],[299.3,8.75]]
for (let i=1;i<laundryRoute.length;i++) {
  const [x,z]=laundryRoute[i], [px,pz]=laundryRoute[i-1]
  const reached=moveWithCollision(px,pz,x,z,furnished)
  assert.ok(Math.hypot(reached.x-x,reached.z-z)<.01, `Laundry working aisle is blocked at ${x},${z}`)
}
for (const piece of MUDROOM_FURNITURE_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.minX-.5,z,x,z,[piece])
  assert.ok(stopped.x < piece.minX, `${piece.label} does not block the player`)
}
// Foyer -> Mudroom -> Half Bath and Mudroom -> Kitchen remain distinct, open routes.
for (const mudroomRoute of [
  [[299.25,1.4],[298.45,1.4],[297.2,1.45],[295.55,1.5],[294.8,1.5]],
  [[297.3,1.45],[297.3,2.45],[297.3,3.35]],
]) for (let i=1;i<mudroomRoute.length;i++) {
  const [x,z]=mudroomRoute[i], [px,pz]=mudroomRoute[i-1]
  const reached=moveWithCollision(px,pz,x,z,furnished)
  assert.ok(Math.hypot(reached.x-x,reached.z-z)<.01, `Mudroom circulation is blocked at ${x},${z}`)
}
for (const piece of HALF_BATH_FURNITURE_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.maxX+.5,z,x,z,[piece])
  assert.ok(stopped.x > piece.maxX, `${piece.label} does not block the player`)
}
// Enter from the Mudroom, stand at the basin, then turn toward the toilet.
const halfBathRoute = [[295.55,1.5],[294.72,1.5],[294.25,1.5],[294.25,.92],[294.25,1.5],[294.25,1.85]]
for (let i=1;i<halfBathRoute.length;i++) {
  const [x,z]=halfBathRoute[i], [px,pz]=halfBathRoute[i-1]
  const reached=moveWithCollision(px,pz,x,z,furnished)
  assert.ok(Math.hypot(reached.x-x,reached.z-z)<.01, `Half-bath aisle is blocked at ${x},${z}`)
}
removeHalfBath()
removeMudroom()
removeLaundry()
removePantry()
removeKitchen()
removeDining()
removeFurniture()
assert.ok(!getActiveColliders('ground').some(c => c.label?.startsWith('living-')), 'Unmount leaves furniture collisions')
assert.ok(!getActiveColliders('second').some(c => c.label?.startsWith('bathroom-furniture-')), 'Legacy second floor has invisible bathroom furniture')
const removeBathroom = registerBathroomFurniture()
const removeStorage = registerStorageFurniture()
const removeLinen = registerLinenFurniture()
const removeOffice = registerOfficeDressing()
const removeBedroom = registerBedroomFurniture()
const secondFurnished = getActiveColliders('second')
assert.equal(secondFurnished.filter(c => c.label?.startsWith('bathroom-furniture-')).length, 3)
assert.equal(secondFurnished.filter(c => c.label?.startsWith('storage-furniture-')).length, 3)
assert.equal(secondFurnished.filter(c => c.label?.startsWith('linen-furniture-')).length, 3)
assert.equal(secondFurnished.filter(c => c.label?.startsWith('office-dressing-')).length, 2)
assert.equal(secondFurnished.filter(c => c.label?.startsWith('bedroom-furniture-')).length, 3)
for (const piece of BATHROOM_FURNITURE_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.minX-.5,z,x,z,[piece])
  assert.ok(stopped.x < piece.minX, `${piece.label} does not block the player`)
}
const bathroomRoute = [[302.1,4.95],[302.1,5.75],[302.05,7.40],[301.85,7.55],[301.85,9.55]]
for (let i=1;i<bathroomRoute.length;i++) {
  const [x,z]=bathroomRoute[i], [px,pz]=bathroomRoute[i-1]
  const reached=moveWithCollision(px,pz,x,z,secondFurnished)
  assert.ok(Math.hypot(reached.x-x,reached.z-z)<.01, `Upstairs bathroom aisle is blocked at ${x},${z}`)
}
for (const piece of STORAGE_FURNITURE_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.minX-.5,z,x,z,[piece])
  assert.ok(stopped.x < piece.minX, `${piece.label} does not block the player`)
}
const storageRoute = [[298.45,8.5],[299.35,8.5],[299.72,8.5],[299.72,7.35]]
for (let i=1;i<storageRoute.length;i++) {
  const [x,z]=storageRoute[i], [px,pz]=storageRoute[i-1]
  const reached=moveWithCollision(px,pz,x,z,secondFurnished)
  assert.ok(Math.hypot(reached.x-x,reached.z-z)<.01, `Storage room aisle is blocked at ${x},${z}`)
}
for (const piece of LINEN_FURNITURE_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.minX-.5,z,x,z,[piece])
  assert.ok(stopped.x < piece.minX, `${piece.label} does not block the player`)
}
for (const piece of OFFICE_DRESSING_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.maxX+.5,z,x,z,[piece])
  assert.ok(stopped.x > piece.maxX, `${piece.label} does not block the player`)
}
for (const piece of BEDROOM_FURNITURE_COLLIDERS) {
  const x=(piece.minX+piece.maxX)/2,z=(piece.minZ+piece.maxZ)/2
  const stopped=moveWithCollision(piece.maxX+.5,z,x,z,[piece])
  assert.ok(stopped.x > piece.maxX, `${piece.label} does not block the player`)
}
const bedroomRoute = [[305.30,4.95],[305.30,5.90],[305.88,6.35],[305.88,9.55]]
for (let i=1;i<bedroomRoute.length;i++) {
  const [x,z]=bedroomRoute[i], [px,pz]=bedroomRoute[i-1]
  const reached=moveWithCollision(px,pz,x,z,secondFurnished)
  assert.ok(Math.hypot(reached.x-x,reached.z-z)<.01, `Master-bedroom route is blocked at ${x},${z}`)
}
// The office remains the circulation room between the hall and both north rooms.
for (const officeRoute of [
  [[300.75,1.4],[301.95,1.4],[302.10,3.8],[302.10,5.75]],
  [[301.95,1.4],[303.10,2.2],[304.85,3.9],[305.30,5.75]],
]) for (let i=1;i<officeRoute.length;i++) {
  const [x,z]=officeRoute[i], [px,pz]=officeRoute[i-1]
  const reached=moveWithCollision(px,pz,x,z,secondFurnished)
  assert.ok(Math.hypot(reached.x-x,reached.z-z)<.01, `Home-office circulation is blocked at ${x},${z}`)
}
const linenRoute = [[298.45,10.1],[299.08,10.1],[299.55,10.1]]
for (let i=1;i<linenRoute.length;i++) {
  const [x,z]=linenRoute[i], [px,pz]=linenRoute[i-1]
  const reached=moveWithCollision(px,pz,x,z,secondFurnished)
  assert.ok(Math.hypot(reached.x-x,reached.z-z)<.01, `Linen closet standing space is blocked at ${x},${z}`)
}
removeLinen()
removeOffice()
removeBedroom()
removeStorage()
removeBathroom()
assert.ok(!getActiveColliders('second').some(c => c.label?.startsWith('bathroom-furniture-')), 'Unmount leaves bathroom collisions')
assert.ok(!getActiveColliders('second').some(c => c.label?.startsWith('storage-furniture-')), 'Unmount leaves storage collisions')
assert.ok(!getActiveColliders('second').some(c => c.label?.startsWith('linen-furniture-')), 'Unmount leaves linen collisions')
assert.ok(!getActiveColliders('second').some(c => c.label?.startsWith('office-dressing-')), 'Unmount leaves office dressing collisions')
assert.ok(!getActiveColliders('second').some(c => c.label?.startsWith('bedroom-furniture-')), 'Unmount leaves bedroom collisions')
const topGuards = getInteriorColliders('attic', 8.1).filter(c => c.label.startsWith('attic-guard-'))
assert.equal(topGuards.length, 4)
assert.equal(getInteriorColliders('attic', 6.7).filter(c => c.label.startsWith('attic-guard-')).length, 0)
for (const g of topGuards) {
  const x = (g.minX + g.maxX) / 2, z = (g.minZ + g.maxZ) / 2
  const alongX = g.maxX - g.minX < g.maxZ - g.minZ
  const sign = g.label.endsWith('east') || g.label.endsWith('north') ? -1 : 1
  const fromX = x - (alongX ? sign * .5 : 0), fromZ = z - (alongX ? 0 : sign * .5)
  const toX = x + (alongX ? sign * .5 : 0), toZ = z + (alongX ? 0 : sign * .5)
  const hit = moveWithCollision(fromX, fromZ, toX, toZ, [g])
  assert.ok(Math.hypot(hit.x - toX, hit.z - toZ) > .5, `Guard did not block ${g.label}`)
}
let traversals = 0
for (const [lower, upper] of [['basement', 'ground'], ['ground', 'second'], ['second', 'attic']]) {
  for (const descending of [false, true]) {
    const points = [[299.375, 2.2], [299.375, 5.45], [300.625, 5.45], [300.625, 2.2]]
    if (descending) points.reverse()
    let floor = descending ? upper : lower
    const camera = new PerspectiveCamera()
    camera.position.set(points[0][0], layout.bases[floor] + INTERIOR_EYE_HEIGHT, points[0][1])
    for (const [x, z] of points.slice(1)) {
      let frames = 0
      while (Math.hypot(camera.position.x - x, camera.position.z - z) > .005 && frames++ < 600) {
        const distance = Math.hypot(camera.position.x - x, camera.position.z - z)
        camera.lookAt(x, camera.position.y, z)
        const r = stepPlayer(camera, floor, {forward:1,strafe:0,speed:Math.min(2,distance*60)}, 1/60, false)
        if (r.crossedTo) floor = r.crossedTo
        assert.equal(r.refused, false, `Refused ${lower} ${descending ? 'down' : 'up'}`)
      }
      assert.ok(frames < 600, `Stuck at ${x},${z}`)
    }
    assert.equal(floor, descending ? lower : upper)
    assert.ok(Math.abs(camera.position.y - layout.bases[floor] - INTERIOR_EYE_HEIGHT) < .01)
    traversals++
  }
}
console.log(JSON.stringify({treadAndLandingSamples:samples, stairTraversals:traversals, basementFloor:'closed', atticOpposedFaces:opposed, stairBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}}, null, 2))
