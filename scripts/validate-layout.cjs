#!/usr/bin/env node
/**
 * Plan-level invariants for the Stack House interior, run against the live
 * source (lib/interior-layout.ts and the modules that consume it).
 *
 * Everything here is something STATUS.md / the layout-update doc records as
 * hard-won or LOCKED, turned into an assertion so it fails in CI instead of in
 * a walkthrough. It needs no GLBs, no browser and no Blender — geometry and
 * collision are checked by scripts/check-architecture-v001.mjs, and visual /
 * performance behaviour still needs a local browser pass.
 *
 *   node scripts/validate-layout.cjs
 */
const fs = require('node:fs')
const path = require('node:path')
const { ROOT, load } = require('./lib/load-ts.cjs')

const L = load('lib/interior-layout.ts')
const failures = []
const check = (ok, msg) => { if (!ok) failures.push(msg) }
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps
const src = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')

const { ROOMS, STAIRS, X0, HOUSE_W, HOUSE_D, FLOOR_BASE_Y } = L
const FOOT = { minX: X0 - HOUSE_W / 2, maxX: X0 + HOUSE_W / 2, minZ: 0, maxZ: HOUSE_D }
const byId = new Map(ROOMS.map(r => [r.id, r]))
const OPPOSITE = { north: 'south', south: 'north', east: 'west', west: 'east' }

// ── Scale + world-space separation (STATUS: load-bearing constraints) ───────
check(L.PLAN_SCALE === 1.0, `PLAN_SCALE is ${L.PLAN_SCALE}; STATUS.md: do not change it without a deliberate architectural reason`)
check(X0 === 300, `X0 is ${X0}; the interior must stay 300 units off in world space`)
check(L.FLOOR_TO_FLOOR === 3.2 && L.FLOOR_CEILING === 3.0, 'storey height / visible ceiling changed (3.2 / 3.0)')
const floors = ['basement', 'ground', 'second', 'attic']
floors.forEach((f, i) => check(near(FLOOR_BASE_Y[f], (i - 1) * L.FLOOR_TO_FLOOR), `FLOOR_BASE_Y.${f} is not on the 3.2 storey grid`))

const vertical = load('lib/use-player-vertical.ts')
const yard = vertical.getWorldBounds('yard')
const inside = vertical.getWorldBounds('ground')
check(yard.maxX < inside.minX && yard.minX > -inside.maxX, `yard bounds ${JSON.stringify(yard)} overlap the interior backstop ${JSON.stringify(inside)}`)
for (const r of ROOMS) {
  const b = r.bounds
  check(b.minX >= inside.minX && b.maxX <= inside.maxX && b.minZ >= inside.minZ && b.maxZ <= inside.maxZ,
    `${r.id} reaches outside the interior backstop bounds — the backstop would become the containment`)
}
for (const c of load('lib/colliders.ts').COLLIDERS) {
  check(c.minX >= yard.minX - 1 && c.maxX <= yard.maxX + 1, `yard collider ${c.label} sits outside the yard play area`)
}

// ── Rooms: ids, floors, coverage, overlap ───────────────────────────────────
check(byId.size === ROOMS.length, 'duplicate room ids')
const area = (b) => (b.maxX - b.minX) * (b.maxZ - b.minZ)
const overlaps = (a, b) => a.minX < b.maxX - 1e-6 && b.minX < a.maxX - 1e-6 && a.minZ < b.maxZ - 1e-6 && b.minZ < a.maxZ - 1e-6
const inFoot = (b) => b.minX >= FOOT.minX - 1e-6 && b.maxX <= FOOT.maxX + 1e-6 && b.minZ >= FOOT.minZ - 1e-6 && b.maxZ <= FOOT.maxZ + 1e-6
for (const floor of ['basement', 'ground', 'second']) {
  const rooms = ROOMS.filter(r => r.floor === floor && inFoot(r.bounds))
  // STATUS "Floor plate coverage": under-tiling = holes, over-tiling = z-fighting.
  const sum = rooms.reduce((t, r) => t + area(r.bounds), 0)
  check(near(sum, HOUSE_W * HOUSE_D, 1e-4), `${floor}: rooms cover ${sum.toFixed(3)} m² of a ${(HOUSE_W * HOUSE_D).toFixed(3)} m² plate`)
  for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
    check(!overlaps(rooms[i].bounds, rooms[j].bounds), `${floor}: ${rooms[i].id} overlaps ${rooms[j].id}`)
  }
}
for (const r of ROOMS.filter(r => !inFoot(r.bounds))) {
  // Only the basement may extend past the footprint (under the back yard).
  check(r.floor === 'basement', `${r.id} lies outside the footprint on the ${r.floor} floor`)
  for (const o of ROOMS.filter(o => o.floor === r.floor && o !== r)) check(!overlaps(r.bounds, o.bounds), `${r.id} overlaps ${o.id}`)
}

// ── Doors: STATUS "Door pairing" ────────────────────────────────────────────
const wallCoord = (b, side) => ({ north: b.maxZ, south: b.minZ, east: b.maxX, west: b.minX })[side]
const spans = (b, side, center, width) => side === 'north' || side === 'south'
  ? center - width / 2 >= b.minX - 1e-6 && center + width / 2 <= b.maxX + 1e-6
  : center - width / 2 >= b.minZ - 1e-6 && center + width / 2 <= b.maxZ + 1e-6
const onFootEdge = (b, side) => near(wallCoord(b, side), wallCoord(FOOT, side))
// The only doors allowed to open outside: front door and the LOCKED back door.
const EXTERIOR_DOORS = new Set(['foyer:south', 'laundry:north'])
const exteriorFound = new Set()
for (const r of ROOMS) for (const d of r.doors) {
  check(spans(r.bounds, d.side, d.center, d.width), `${r.id}: ${d.side} door at ${d.center} runs past the wall ends`)
  const coord = wallCoord(r.bounds, d.side)
  const partner = ROOMS.find(o => o !== r && o.floor === r.floor && near(wallCoord(o.bounds, OPPOSITE[d.side]), coord) &&
    o.doors.some(od => od.side === OPPOSITE[d.side] && near(od.center, d.center) && near(od.width, d.width)))
  if (partner) continue
  if (onFootEdge(r.bounds, d.side) && EXTERIOR_DOORS.has(`${r.id}:${d.side}`)) { exteriorFound.add(`${r.id}:${d.side}`); continue }
  failures.push(`${r.id}: ${d.side} door at ${d.center} has no matching door on the neighbouring room (a locked room / wall across the opening)`)
}
for (const e of EXTERIOR_DOORS) check(exteriorFound.has(e), `expected exterior door ${e} is missing`)

// omitWalls joins two stable ids into one space: both sides must omit.
for (const r of ROOMS) for (const side of r.omitWalls ?? []) {
  const coord = wallCoord(r.bounds, side)
  const twin = ROOMS.find(o => o !== r && o.floor === r.floor && near(wallCoord(o.bounds, OPPOSITE[side]), coord) && (o.omitWalls ?? []).includes(OPPOSITE[side]))
  check(twin, `${r.id} omits its ${side} wall but no neighbour omits the matching ${OPPOSITE[side]} wall`)
}

// Windows: exterior walls only (mirrors assertExterior so it fails without a GLB build).
for (const r of ROOMS) for (const w of r.windows ?? []) {
  if (r.floor === 'attic') { check(w.side === 'north' || w.side === 'south', `${r.id}: attic windows are gable (north/south) only`); continue }
  check(onFootEdge(r.bounds, w.side), `${r.id}: ${w.side} window is on an interior wall`)
  check(spans(r.bounds, w.side, w.center, w.width), `${r.id}: ${w.side} window runs past the wall ends`)
}

// ── Stairs: one continuous shaft ────────────────────────────────────────────
const shaft = (s) => JSON.stringify([s.id.replace(/^[a-z]+-/, ''), s.bounds.minX, s.bounds.maxX, s.bounds.minZ, s.bounds.maxZ])
const perFloor = floors.slice(0, 3).map(f => STAIRS.filter(s => s.floor === f).map(shaft).join('|'))
check(perFloor.every(p => p === perFloor[0]) && perFloor[0].length > 0, 'stair runs differ in plan between floors — the shaft is no longer vertically continuous')
check(STAIRS.length === 9, `expected 3 switchback runs on each of 3 floors, found ${STAIRS.length}`)

// ── LOCKED room program (docs/STACK_HOUSE_LAYOUT_UPDATES_2026-09-08.md) ─────
const label = (id) => byId.get(id)?.label ?? ''
const LOCKED_LABELS = {
  laundry: /Back Entry/, 'secret-room': /Laundry/, 'game-room': /Dining/, 'basement-landing': /Game Room/,
  gallery: /Library.*Writing/, nook: /Master Bedroom/, 'guest-room': /Guest/,
  'upstairs-storage': /Walk-in Closet/, linen: /Walk-in Closet/, 'home-office': /Home Office/, bathroom: /Bathroom/,
}
for (const [id, re] of Object.entries(LOCKED_LABELS)) check(re.test(label(id)), `room ${id} is labelled "${label(id)}"; the locked program expects ${re}`)
const doorBetween = (a, b) => {
  const ra = byId.get(a), rb = byId.get(b)
  return ra && rb && ra.doors.some(d => rb.doors.some(od => od.side === OPPOSITE[d.side] && near(od.center, d.center) && near(wallCoord(ra.bounds, d.side), wallCoord(rb.bounds, od.side))))
}
check(doorBetween('kitchen', 'pantry') && doorBetween('pantry', 'game-room'), 'Kitchen → Pantry → Dining service route is broken (LOCKED)')
check(doorBetween('basement-landing', 'secret-room'), 'the concealed basement opening toward the future secret route is gone — relocate it deliberately, never delete it (LOCKED)')
check(doorBetween('nook', 'upstairs-storage'), 'Master Bedroom no longer opens into the walk-in closet')
check(byId.get('linen').doors.length === 0, 'the redundant second closet doorway has come back')

// ── Furniture collision: mounted on the floor its geometry lives on ──────────
const vSrc = src('lib/use-player-vertical.ts')
const cSrc = src('components/interior/architecture-candidate.tsx')
// One line per floor in use-player-vertical; one if-block per floor in the candidate.
const lineOf = (text, start) => { const i = text.indexOf(start); return i < 0 ? '' : text.slice(i, text.indexOf('\n', i)) }
const blockOf = (text, start) => { const i = text.indexOf(start); return i < 0 ? '' : text.slice(i, text.indexOf('\n    }', i)) }
for (const file of fs.readdirSync(path.join(ROOT, 'lib')).filter(f => /-(furniture|dressing)\.ts$/.test(f))) {
  const mod = load(`lib/${file}`)
  const colliders = Object.entries(mod).find(([k, v]) => /_COLLIDERS$/.test(k) && Array.isArray(v))?.[1]
  const withName = Object.keys(mod).find(k => /^with[A-Z]/.test(k))
  const registerName = Object.keys(mod).find(k => /^register[A-Z]/.test(k))
  if (!colliders || !withName || !registerName) continue
  const mountedOn = floors.filter(f => new RegExp(`\\b${withName}\\(`).test(lineOf(vSrc, `location === '${f}'`)))
  const registeredOn = floors.filter(f => new RegExp(`\\b${registerName}\\(`).test(blockOf(cSrc, `floor === '${f}' && version === 'v002'`)))
  if (!mountedOn.length && !registeredOn.length) continue // dead module: not mounted anywhere
  check(mountedOn.length === 1, `${file}: ${withName} is applied on ${mountedOn.length} floors in use-player-vertical.ts (expected exactly one)`)
  check(JSON.stringify(mountedOn) === JSON.stringify(registeredOn), `${file}: collision applied on [${mountedOn}] but registered with the v002 [${registeredOn}] floor — geometry and collision would live on different storeys`)
  const floor = mountedOn[0]
  for (const c of colliders) {
    const cx = (c.minX + c.maxX) / 2, cz = (c.minZ + c.maxZ) / 2
    const room = ROOMS.find(r => r.floor === floor && cx >= r.bounds.minX && cx <= r.bounds.maxX && cz >= r.bounds.minZ && cz <= r.bounds.maxZ)
    if (!room) { failures.push(`${file}: collider ${c.label} is not inside any ${floor} room`); continue }
    // Rooms joined by omitWalls are one space for the containment test.
    const group = [room, ...ROOMS.filter(o => o.floor === floor && (room.omitWalls ?? []).some(s => near(wallCoord(o.bounds, OPPOSITE[s]), wallCoord(room.bounds, s))))]
    const g = group.reduce((a, r) => ({ minX: Math.min(a.minX, r.bounds.minX), maxX: Math.max(a.maxX, r.bounds.maxX), minZ: Math.min(a.minZ, r.bounds.minZ), maxZ: Math.max(a.maxZ, r.bounds.maxZ) }), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity })
    const T = 0.25 // wall-thickness allowance: a door leaf sits in its own opening
    check(c.minX >= g.minX - T && c.maxX <= g.maxX + T && c.minZ >= g.minZ - T && c.maxZ <= g.maxZ + T, `${file}: collider ${c.label} pokes through the walls of ${room.id}`)
  }
}

// ── Derived camera constants (STATUS: camera proportion review) ─────────────
const cam = load('lib/player-camera.ts')
check(cam.INTERIOR_EYE_HEIGHT === 1.62 && cam.INTERIOR_FOV === 65, 'interior camera changed from the approved 1.62 m / 65° baseline')

if (failures.length) {
  console.error(`validate-layout: ${failures.length} problem(s)\n` + failures.map(f => `  ✗ ${f}`).join('\n'))
  process.exit(1)
}
console.log(`validate-layout: ok — ${ROOMS.length} rooms, ${ROOMS.reduce((t, r) => t + r.doors.length, 0)} doors, ${STAIRS.length} stair runs`)
