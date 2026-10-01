// Every interior doorway must be walkable through the shared movement code with
// all furniture colliders mounted, in both directions. Specific routes are
// asserted in check-architecture-v001.mjs; this sweeps every door in the plan
// so a new piece of furniture cannot quietly block one.
//
//   node scripts/check-circulation.mjs
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { PerspectiveCamera } from 'three'

const require = createRequire(import.meta.url)
const ts = require('typescript')
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename)
}
const { ROOMS, FLOOR_BASE_Y } = require('../lib/interior-layout.ts')
const { INTERIOR_EYE_HEIGHT } = require('../lib/player-camera.ts')
const { stepPlayer } = require('../lib/player-movement.ts')
// Mount every v002 furniture collider set, exactly as ArchitectureCandidate does.
for (const file of fs.readdirSync('lib').filter(f => /-furniture\.ts$|^office-dressing\.ts$/.test(f))) {
  const mod = require(`../lib/${file}`)
  for (const [name, fn] of Object.entries(mod)) if (/^register/.test(name) && typeof fn === 'function') fn()
}

const DEPTH = 0.55 // how far either side of the wall the walk starts and ends
const wallOf = (r, side) => ({ north: r.bounds.maxZ, south: r.bounds.minZ, east: r.bounds.maxX, west: r.bounds.minX })[side]
const failures = []
let crossings = 0
for (const room of ROOMS) {
  for (const door of room.doors) {
    const alongX = door.side === 'east' || door.side === 'west'
    const out = door.side === 'north' || door.side === 'east' ? 1 : -1
    const wall = wallOf(room, door.side)
    const point = (d) => alongX ? [wall + out * d, door.center] : [door.center, wall + out * d]
    const [ix, iz] = point(-DEPTH), [ox, oz] = point(DEPTH)
    // Exterior doors (front, back) lead outside the plan; only check the inside approach.
    const exterior = !ROOMS.some(o => o !== room && o.floor === room.floor &&
      ox > o.bounds.minX && ox < o.bounds.maxX && oz > o.bounds.minZ && oz < o.bounds.maxZ)
    for (const [fx, fz, tx, tz] of exterior ? [] : [[ix, iz, ox, oz]]) {
      const camera = new PerspectiveCamera()
      camera.rotation.order = 'YXZ'
      camera.position.set(fx, FLOOR_BASE_Y[room.floor] + INTERIOR_EYE_HEIGHT, fz)
      camera.rotation.set(0, Math.atan2(fx - tx, fz - tz), 0)
      let floor = room.floor
      for (let f = 0; f < 120 && Math.hypot(camera.position.x - tx, camera.position.z - tz) > 0.05; f++) {
        const r = stepPlayer(camera, floor, { forward: 1, strafe: 0, speed: Math.min(2, Math.hypot(camera.position.x - tx, camera.position.z - tz) * 30) }, 1 / 30, false)
        if (r.crossedTo) floor = r.crossedTo
      }
      const miss = Math.hypot(camera.position.x - tx, camera.position.z - tz)
      if (miss > 0.05) failures.push(`${room.id} ${door.side} door @${door.center.toFixed(2)}: stopped at ${camera.position.x.toFixed(2)},${camera.position.z.toFixed(2)} (${miss.toFixed(2)} m short)`)
      crossings++
    }
  }
}
assert.ok(!failures.length, `Blocked doorways:\n  ${failures.join('\n  ')}`)
console.log(`check-circulation: ok — ${crossings} doorway crossings with all furniture colliders mounted`)
