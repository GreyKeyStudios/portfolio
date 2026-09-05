import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { Box3, Raycaster, Vector3, PerspectiveCamera } from 'three'
import { createRequire } from 'node:module'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const load = async (name) => {
  const bytes = fs.readFileSync(`public/models/${name}.glb`)
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
}
const layout = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/layout-v001.json'))
const manifest = JSON.parse(fs.readFileSync('portfolio-assets/stack-house/blender/staircase-v001.manifest.json'))
const hash = (path) => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')
assert.equal(hash('lib/interior-layout.ts'), manifest.layout_sha256, 'Stair layout is stale')
assert.equal(hash('portfolio-assets/stack-house/blender/staircase-v001.blend'), manifest.source_sha256, 'Source hash differs')
const { scene } = await load('staircase-v001')
scene.updateMatrixWorld(true)
const bounds = new Box3().setFromObject(scene)
assert.ok(Math.abs(bounds.min.x + 1.15) < .01 && Math.abs(bounds.max.x - 1.15) < .01, 'Flight width/origin mismatch')
const ray = new Raycaster()
let samples = 0
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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename)
}
const { stepPlayer } = require('../lib/player-movement.ts')
let traversals = 0
for (const [lower, upper] of [['basement', 'ground'], ['ground', 'second'], ['second', 'attic']]) {
  for (const descending of [false, true]) {
    const points = [[299.375, 2.2], [299.375, 5.45], [300.625, 5.45], [300.625, 2.2]]
    if (descending) points.reverse()
    let floor = descending ? upper : lower
    const camera = new PerspectiveCamera()
    camera.position.set(points[0][0], layout.bases[floor] + 1.7, points[0][1])
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
    assert.ok(Math.abs(camera.position.y - layout.bases[floor] - 1.7) < .01)
    traversals++
  }
}
console.log(JSON.stringify({treadAndLandingSamples:samples, stairTraversals:traversals, basementFloor:'closed', atticOpposedFaces:opposed, stairBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}}, null, 2))
