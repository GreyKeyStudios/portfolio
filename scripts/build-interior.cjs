/**
 * Generates the interior shell GLBs from lib/interior-layout.ts.
 *
 * Run: npm run build:interior
 *
 * WHY THIS EXISTS
 * The floor plan drives three consumers: collision (lib/interior-colliders.ts),
 * vertical movement (lib/use-player-vertical.ts) and the visible geometry. The
 * first two read the layout directly, but the meshes used to be hand-modelled,
 * so any layout edit silently desynced what you collide with from what you see.
 * This closes that: walls here are cut by the SAME door-gap algorithm the
 * colliders use, so a doorway you can walk through is a doorway you can see.
 *
 * Emits one GLB per floor into public/models/. Geometry is absolute in X/Z
 * (room bounds already carry the X0=300 offset) and relative in Y, floor at
 * y=0 — matching how components/interior/* mount them at [0, FLOOR_BASE_Y, 0].
 *
 * Writes glTF binary by hand rather than going through Blender: no dependency
 * on Blender being open, no MCP round-trips, and `npm run build:interior` is
 * reproducible in CI. Everything here is axis-aligned boxes, which is well
 * inside what's reasonable to emit directly.
 */

const fs = require('fs')
const path = require('path')

const LAYOUT = path.join(__dirname, '..', '.interior-build', 'interior-layout.js')
if (!fs.existsSync(LAYOUT)) {
  console.error('Missing', LAYOUT, '\nRun via `npm run build:interior` (it transpiles the layout first).')
  process.exit(1)
}
const { ROOMS, STAIRS, FLOOR_BASE_Y, FLOOR_CEILING, FLOOR_TO_FLOOR, floorAtY } = require(LAYOUT)

/**
 * Attic roof. A gable running north-south: knee walls at the sides, two sloped
 * planes meeting at a ridge, and a triangular gable end at each end.
 *
 * This is the one room whose character IS its shape — a rectangular box reads
 * as "procedural level" the instant you reach it, however well lit. Everything
 * here is visual; collision stays a box, so headroom under the slope is
 * generous in the collider and tight to the eye, which is the right way round.
 */
const ATTIC_KNEE_H = 1.15    // wall height where the roof meets the floor plate
const ATTIC_RIDGE_H = 3.9    // apex, above the attic floor
const ROOF_T = 0.22          // roof slab thickness, measured vertically
const RAFTER_T = 0.16
const RAFTER_SPACING = 2.4

const OUT_DIR = path.join(__dirname, '..', 'public', 'models')

// Matches WALL_THICKNESS in lib/interior-colliders.ts — walls you see and walls
// you collide with have to be the same thickness or doorways feel wrong.
const WALL = 0.2
const SLAB = 0.12
const RISER_TARGET = 0.18 // aim for ~18cm steps; actual is rounded to fit the rise

// Deliberately high contrast between floor / wall / ceiling.
//
// These started at 0.76 / 0.85 / 0.91 — three near-identical light greys. Under
// soft indoor lighting that made every room read as featureless fog: you could
// not tell where the floor stopped and the wall began, which made the whole
// interior feel like an untextured blockout even where the geometry was right.
// Value separation does more for legibility here than any amount of detail, and
// these are placeholders anyway — real materials replace them.
const MATERIALS = [
  { name: 'floor', color: [0.34, 0.29, 0.25, 1], rough: 0.85 },   // dark boards
  { name: 'wall', color: [0.82, 0.80, 0.76, 1], rough: 0.95 },    // warm off-white
  { name: 'ceiling', color: [0.95, 0.95, 0.96, 1], rough: 1.0 },  // near white
  { name: 'stair', color: [0.60, 0.47, 0.31, 1], rough: 0.8 },    // mid wood
  // Painted trim, deliberately lighter and cooler than the walls. Trim that
  // matches its wall is invisible; the whole point of a baseboard or casing is
  // the line it draws where two surfaces meet.
  { name: 'trim', color: [0.93, 0.92, 0.90, 1], rough: 0.55 },
]
const MAT = { floor: 0, wall: 1, ceiling: 2, stair: 3, trim: 4 }

// Trim dimensions. Doors stop at 2.05 with wall above — a floor-to-ceiling gap
// reads as a missing wall panel, not a doorway, and was a large part of why the
// shell looked procedural.
const DOOR_H = 2.05
const CASING_W = 0.09   // face width of a door casing
const CASING_D = 0.022  // how far trim stands proud of the wall
const BASE_H = 0.12     // baseboard height
const BASE_D = 0.022
const RAIL_H = 0.92     // handrail height above the tread nose
const RAIL_T = 0.06
const NEWEL_T = 0.11
const STRINGER_T = 0.05

/**
 * Thickness of the stair structure below its walking surface — the waist.
 *
 * Flights and landings MUST share this. They were 0.28 and 0.12 respectively,
 * so where the return flight met the half-landing it hung 0.16 lower: a lip
 * jutting into the shaft with nothing under it, right at eye level on the way
 * past. A staircase reads as one object or it reads as debris.
 */
const WAIST = 0.22

// ── geometry accumulation ───────────────────────────────────────────────────

/**
 * How many world units one texture repeat covers. Emitted UVs are WORLD-space
 * box projections, not per-face 0..1 — so a wood floor tiles continuously
 * across a whole room instead of restarting at every box boundary, and two
 * boxes that meet in a corner line their grain up. Nothing here has to be
 * unwrapped, which is the whole reason the geometry is kept axis-aligned.
 */
const UV_SCALE = 1.0

function newMesh() {
  return MATERIALS.map(() => ({ pos: [], nrm: [], idx: [], uv: [] }))
}

/** Axis-aligned box. Six quads, flat normals, no shared verts (keeps edges crisp). */
function addBox(group, x0, x1, y0, y1, z0, z1) {
  if (x1 - x0 <= 1e-6 || y1 - y0 <= 1e-6 || z1 - z0 <= 1e-6) return
  const faces = [
    { n: [0, 0, 1], v: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },
    { n: [0, 0, -1], v: [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]] },
    { n: [1, 0, 0], v: [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]] },
    { n: [-1, 0, 0], v: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]] },
    { n: [0, 1, 0], v: [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]] },
    { n: [0, -1, 0], v: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]] },
  ]
  for (const f of faces) {
    const base = group.pos.length / 3
    for (const v of f.v) {
      group.pos.push(v[0], v[1], v[2])
      group.nrm.push(f.n[0], f.n[1], f.n[2])
      // Project onto the two axes the face does NOT point along.
      const [u, w] = f.n[0] ? [v[2], v[1]] : f.n[1] ? [v[0], v[2]] : [v[0], v[1]]
      group.uv.push(u / UV_SCALE, w / UV_SCALE)
    }
    group.idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
}

/**
 * A prism: an arbitrary convex polygon in the (Z, Y) plane, extruded along X.
 *
 * addBox only makes axis-aligned boxes, which cannot express anything sloped —
 * stair stringers, handrails following a flight, and (next) the attic roofline
 * all need a shape whose top edge climbs. Points must be given counter-clockwise
 * when viewed from +X.
 */
function addPrismX(group, x0, x1, pts) {
  const n = pts.length
  const base = group.pos.length / 3

  // Two end caps, triangle-fanned from the first point.
  for (const [x, nx] of [[x0, -1], [x1, 1]]) {
    const start = group.pos.length / 3
    for (const [z, y] of pts) {
      group.pos.push(x, y, z)
      group.nrm.push(nx, 0, 0)
      group.uv.push(z / UV_SCALE, y / UV_SCALE)
    }
    for (let i = 1; i < n - 1; i++) {
      if (nx > 0) group.idx.push(start, start + i, start + i + 1)
      else group.idx.push(start, start + i + 1, start + i)
    }
  }

  // Side quads, one per polygon edge.
  let arc = 0
  for (let i = 0; i < n; i++) {
    const [z0, y0] = pts[i]
    const [z1, y1] = pts[(i + 1) % n]
    const dz = z1 - z0, dy = y1 - y0
    const len = Math.hypot(dz, dy) || 1
    const nz = dy / len, ny = -dz / len
    const s = group.pos.length / 3
    group.pos.push(x0, y0, z0, x1, y0, z0, x1, y1, z1, x0, y1, z1)
    for (let k = 0; k < 4; k++) group.nrm.push(0, ny, nz)
    // Along the extrusion in U; along the sloped edge (arc length) in V, so a
    // stair stringer's texture runs with the slope instead of stretching.
    group.uv.push(x0 / UV_SCALE, arc / UV_SCALE, x1 / UV_SCALE, arc / UV_SCALE,
                  x1 / UV_SCALE, (arc + len) / UV_SCALE, x0 / UV_SCALE, (arc + len) / UV_SCALE)
    arc += len
    group.idx.push(s, s + 1, s + 2, s, s + 2, s + 3)
  }
  return base
}

/**
 * As addPrismX, but the polygon lies in the (X, Y) plane and extrudes along Z.
 * Needed for anything whose profile varies across the building's width — the
 * roof slopes and the gable ends both do.
 */
function addPrismZ(group, z0, z1, pts) {
  const n = pts.length
  for (const [z, nz] of [[z0, -1], [z1, 1]]) {
    const start = group.pos.length / 3
    for (const [x, y] of pts) {
      group.pos.push(x, y, z)
      group.nrm.push(0, 0, nz)
      group.uv.push(x / UV_SCALE, y / UV_SCALE)
    }
    for (let i = 1; i < n - 1; i++) {
      if (nz > 0) group.idx.push(start, start + i, start + i + 1)
      else group.idx.push(start, start + i + 1, start + i)
    }
  }
  let arc = 0
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[(i + 1) % n]
    const dx = x1 - x0, dy = y1 - y0
    const len = Math.hypot(dx, dy) || 1
    const nx = dy / len, ny = -dx / len
    const s = group.pos.length / 3
    group.pos.push(x0, y0, z0, x0, y0, z1, x1, y1, z1, x1, y1, z0)
    for (let k = 0; k < 4; k++) group.nrm.push(nx, ny, 0)
    group.uv.push(arc / UV_SCALE, z0 / UV_SCALE, arc / UV_SCALE, z1 / UV_SCALE,
                  (arc + len) / UV_SCALE, z1 / UV_SCALE, (arc + len) / UV_SCALE, z0 / UV_SCALE)
    arc += len
    group.idx.push(s, s + 1, s + 2, s, s + 2, s + 3)
  }
}

/**
 * Rectangle minus rectangles, returned as a cover of up to 4 strips per hole.
 * Used to punch stairwell openings out of floor and ceiling slabs — without it
 * a slab seals the top of every flight.
 */
function subtractRects(rect, holes) {
  let parts = [rect]
  for (const h of holes) {
    const next = []
    for (const p of parts) {
      const ox0 = Math.max(p.minX, h.minX), ox1 = Math.min(p.maxX, h.maxX)
      const oz0 = Math.max(p.minZ, h.minZ), oz1 = Math.min(p.maxZ, h.maxZ)
      if (ox0 >= ox1 || oz0 >= oz1) { next.push(p); continue } // no overlap
      if (p.minZ < oz0) next.push({ minX: p.minX, maxX: p.maxX, minZ: p.minZ, maxZ: oz0 })
      if (oz1 < p.maxZ) next.push({ minX: p.minX, maxX: p.maxX, minZ: oz1, maxZ: p.maxZ })
      if (p.minX < ox0) next.push({ minX: p.minX, maxX: ox0, minZ: oz0, maxZ: oz1 })
      if (ox1 < p.maxX) next.push({ minX: ox1, maxX: p.maxX, minZ: oz0, maxZ: oz1 })
    }
    parts = next
  }
  return parts
}

/** Identical to solidSegments in lib/interior-colliders.ts — deliberately so. */
function solidSegments(lo, hi, gaps) {
  const sorted = [...gaps].sort((a, b) => a.center - b.center)
  const out = []
  let cursor = lo
  for (const g of sorted) {
    const gs = g.center - g.width / 2
    const ge = g.center + g.width / 2
    if (gs > cursor) out.push([cursor, gs])
    cursor = Math.max(cursor, ge)
  }
  if (cursor < hi) out.push([cursor, hi])
  return out
}

// ── per-floor build ─────────────────────────────────────────────────────────

function buildFloor(floor) {
  const mesh = newMesh()
  const rooms = ROOMS.filter((r) => r.floor === floor)
  const base = FLOOR_BASE_Y[floor]

  // A stair opens the WHOLE shaft in both slabs it passes between, not just the
  // footprint of the individual run that touches this floor.
  //
  // Filtering on the touching run alone worked everywhere except the attic, and
  // only by accident: every other floor also has its own switchback climbing
  // out of it, and that contributed the full shaft. The attic has no stair
  // going up, so its floor opening was cut to just the arriving flight — a
  // 1.05-wide band — leaving solid slab over the lower flight and half-landing.
  // Climbing it, your head reaches 6.5 while the attic floor sits at 6.28, so
  // you pass straight through it.
  //
  // A switchback needs headroom over its ENTIRE run, so if any part of a
  // staircase meets this floor, all of that staircase opens the slab.
  const arrivingFrom = new Set(
    STAIRS.filter((s) => floorAtY(s.bottomY) === floor || floorAtY(s.topY) === floor).map((s) => s.floor)
  )
  const holes = STAIRS
    .filter((s) => s.floor === floor || arrivingFrom.has(s.floor))
    .map((s) => s.bounds)

  for (const room of rooms) {
    const { minX, maxX, minZ, maxZ } = room.bounds

    for (const p of subtractRects(room.bounds, holes)) {
      addBox(mesh[MAT.floor], p.minX, p.maxX, -SLAB, 0, p.minZ, p.maxZ)
      // The attic has a roof instead of a ceiling slab — see buildRoof.
      if (room.floor !== 'attic') {
        // Clamped so it never intersects the floor slab of the storey above.
        addBox(mesh[MAT.ceiling], p.minX, p.maxX, FLOOR_CEILING, Math.min(FLOOR_CEILING + SLAB, FLOOR_TO_FLOOR - SLAB), p.minZ, p.maxZ)
      }
    }

    if (room.noWalls) continue

    const bySide = { north: [], south: [], east: [], west: [] }
    for (const d of room.doors) bySide[d.side].push(d)

    // Each side is described once, then walls / headers / casings / baseboards
    // are all driven off the same description. `along` maps a coordinate on the
    // wall's own axis plus a depth offset into a world box, so the four sides
    // don't need four near-identical copies of every piece of trim.
    const sides = [
      { doors: bySide.north, lo: minX, hi: maxX, slab: [maxZ - WALL, maxZ], inner: maxZ - WALL, dir: -1, axis: 'x' },
      { doors: bySide.south, lo: minX, hi: maxX, slab: [minZ, minZ + WALL], inner: minZ + WALL, dir: 1, axis: 'x' },
      { doors: bySide.east, lo: minZ, hi: maxZ, slab: [maxX - WALL, maxX], inner: maxX - WALL, dir: -1, axis: 'z' },
      { doors: bySide.west, lo: minZ, hi: maxZ, slab: [minX, minX + WALL], inner: minX + WALL, dir: 1, axis: 'z' },
    ]

    // Walls run the FULL floor-to-floor height, not just to the ceiling. At
    // 0..FLOOR_CEILING they stopped 0.4 short of the storey above, leaving an
    // open joist cavity around every room that you looked straight through --
    // the navy bands in the walkthroughs, and what you pass through on every
    // floor change, since the eye travels 1.7 -> 4.9 across a storey.
    for (const s of sides) {
      // box(from, to, y0, y1, d0, d1) — `from`/`to` run along the wall,
      // `d0`/`d1` are depths measured perpendicular to it.
      const box = (g, a, b, y0, y1, d0, d1) =>
        s.axis === 'x'
          ? addBox(g, a, b, y0, y1, Math.min(d0, d1), Math.max(d0, d1))
          : addBox(g, Math.min(d0, d1), Math.max(d0, d1), y0, y1, a, b)

      // Under a gable the wall stops at the knee and the roof takes over.
      const wallTop = room.floor === 'attic' ? ATTIC_KNEE_H : FLOOR_TO_FLOOR

      for (const [a, b] of solidSegments(s.lo, s.hi, s.doors)) {
        box(mesh[MAT.wall], a, b, 0, wallTop, s.slab[0], s.slab[1])
        // Baseboard, on the room-facing side only.
        box(mesh[MAT.trim], a, b, 0, BASE_H, s.inner, s.inner + s.dir * BASE_D)
      }

      for (const d of s.doors) {
        const a = d.center - d.width / 2
        const b = d.center + d.width / 2

        // Header: wall above the opening. Collision is 2D so this changes
        // nothing about walking through — it only stops the gap reading as a
        // missing panel.
        box(mesh[MAT.wall], a, b, DOOR_H, wallTop, s.slab[0], s.slab[1])

        // Casing: two jambs and a head, standing proud of the wall face.
        const c0 = s.inner
        const c1 = s.inner + s.dir * CASING_D
        box(mesh[MAT.trim], a - CASING_W, a, 0, DOOR_H + CASING_W, c0, c1)
        box(mesh[MAT.trim], b, b + CASING_W, 0, DOOR_H + CASING_W, c0, c1)
        box(mesh[MAT.trim], a - CASING_W, b + CASING_W, DOOR_H, DOOR_H + CASING_W, c0, c1)

        // Threshold across the opening, flush with the floor.
        box(mesh[MAT.trim], a, b, -0.012, 0.012, s.slab[0], s.slab[1])
      }
    }
  }

  // ── Attic roof ──────────────────────────────────────────────────────────
  for (const room of rooms.filter((r) => r.floor === 'attic')) {
    const { minX, maxX, minZ, maxZ } = room.bounds
    const ridgeX = (minX + maxX) / 2
    const kneeY = ATTIC_KNEE_H
    const ridgeY = ATTIC_RIDGE_H

    // Two sloped slabs, knee to ridge, mirrored about the centre line.
    for (const [xa, xb] of [[minX, ridgeX], [ridgeX, maxX]]) {
      const rising = xa === minX
      const yA = rising ? kneeY : ridgeY
      const yB = rising ? ridgeY : kneeY
      addPrismZ(mesh[MAT.wall], minZ, maxZ, [
        [xa, yA], [xb, yB], [xb, yB + ROOF_T], [xa, yA + ROOF_T],
      ])
    }

    // Gable end at each end of the run: the triangle between the knee walls
    // and the ridge, closing the roof off.
    for (const [za, zb] of [[minZ, minZ + WALL], [maxZ - WALL, maxZ]]) {
      addPrismZ(mesh[MAT.wall], za, zb, [
        [minX, kneeY], [ridgeX, ridgeY], [maxX, kneeY],
      ])
    }

    // Exposed rafters. The Archive is meant to read as structure you can see —
    // these do more for that than any amount of surface detail.
    const span = maxZ - minZ
    const count = Math.max(2, Math.floor(span / RAFTER_SPACING))
    for (let i = 1; i < count; i++) {
      const z = minZ + (span * i) / count
      for (const [xa, xb] of [[minX, ridgeX], [ridgeX, maxX]]) {
        const rising = xa === minX
        const yA = (rising ? kneeY : ridgeY) - RAFTER_T
        const yB = (rising ? ridgeY : kneeY) - RAFTER_T
        addPrismZ(mesh[MAT.stair], z - RAFTER_T / 2, z + RAFTER_T / 2, [
          [xa, yA], [xb, yB], [xb, yB + RAFTER_T], [xa, yA + RAFTER_T],
        ])
      }
      // Collar tie across the span, at the height a real one would sit.
      addBox(mesh[MAT.stair], minX, maxX, kneeY + 1.25, kneeY + 1.25 + RAFTER_T, z - RAFTER_T / 2, z + RAFTER_T / 2)
    }
  }

  // Each run is emitted into the GLB of the floor that owns it, with heights
  // made relative to that floor's base (the component mounts at FLOOR_BASE_Y).
  for (const s of STAIRS.filter((x) => x.floor === floor)) {
    const y0 = s.bottomY - base
    const y1 = s.topY - base
    const rise = y1 - y0
    const { minX, maxX, minZ, maxZ } = s.bounds
    const c0 = s.bottomCoord
    const c1 = s.topCoord
    const run = c1 - c0
    const along = (v) => (s.axis === 'z' ? [minX, maxX, v] : [v, v, 0])

    // A flat run (a switchback's half-landing) is one slab, not a flight.
    if (Math.abs(rise) < 1e-6) {
      addBox(mesh[MAT.stair], minX, maxX, y0 - WAIST, y0, minZ, maxZ)
      continue
    }

    const steps = Math.max(2, Math.round(Math.abs(rise) / RISER_TARGET))

    // Flat landing on any inset portion of the bounds, level with the near end.
    if (Math.min(c0, c1) > minZ) addBox(mesh[MAT.stair], minX, maxX, Math.min(y0, y1) - WAIST, Math.min(y0, y1), minZ, Math.min(c0, c1))
    if (Math.max(c0, c1) < maxZ) addBox(mesh[MAT.stair], minX, maxX, Math.max(y0, y1) - WAIST, Math.max(y0, y1), Math.max(c0, c1), maxZ)

    // Treads, each a slab of constant thickness FOLLOWING the slope.
    //
    // These used to run from the flight low end all the way up to each tread
    // height, which made the whole flight one solid wedge rather than a
    // staircase. On a switchback that is badly wrong: the return leg became a
    // slab of material hanging from its lower end upward, sitting at eye level
    // in the band right beside the climb and blocking the view straight across
    // the shaft. A real switchback is open between its flights, and you see
    // through the well.
    //
    // Bottom now tracks the slope one step behind the top, so the underside is
    // a stepped soffit instead of a flat wall, and the well is open.
    for (let i = 0; i < steps; i++) {
      const tA = i / steps
      const tB = (i + 1) / steps
      const zA = c0 + run * tA
      const zB = c0 + run * tB
      const treadTop = y0 + rise * tB
      const soffit = y0 + rise * tA - WAIST
      addBox(mesh[MAT.stair], minX, maxX,
        Math.min(soffit, treadTop), Math.max(soffit, treadTop),
        Math.min(zA, zB), Math.max(zA, zB))
    }

    // ── No stringers, handrails or newels. Deliberately. ────────────────────
    //
    // The staircase is a COLLISION PROXY, not artwork. It defines the socket —
    // run, rise, width, landing, world origin — that a modeled staircase drops
    // into. A box generator will not stumble into the concept art's carved
    // staircase no matter how much trim is bolted on, and the treads below are
    // already everything the player needs to stand on and move across.
    //
    // Generated trim here used to include a sloped stringer, a handrail and
    // newel posts. They shipped a real bug (ends paired by Z-sort-order rather
    // than by bottom/top, so a switchback's return leg built its boards
    // backwards and crossed them through the treads) and were never going to
    // reach the target look anyway. Removed rather than fixed — see
    // docs/stair-socket.md for the dimensions the art asset must match.
    //
    // When that asset exists, hide these treads too; nothing else changes,
    // because collision never read them.
  }

  return mesh
}

// ── glTF binary output ──────────────────────────────────────────────────────

function alignTo4(n) { return (n + 3) & ~3 }

function writeGLB(mesh, outPath) {
  const bufferViews = []
  const accessors = []
  const primitives = []
  const chunks = []
  let offset = 0

  const pushView = (buf, target) => {
    const padded = Buffer.alloc(alignTo4(buf.length))
    buf.copy(padded)
    chunks.push(padded)
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, ...(target ? { target } : {}) })
    offset += padded.length
    return bufferViews.length - 1
  }

  mesh.forEach((g, matIndex) => {
    if (!g.idx.length) return

    const pos = Float32Array.from(g.pos)
    const nrm = Float32Array.from(g.nrm)
    const uv = Float32Array.from(g.uv)
    const idx = Uint32Array.from(g.idx)

    const min = [Infinity, Infinity, Infinity]
    const max = [-Infinity, -Infinity, -Infinity]
    for (let i = 0; i < pos.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        if (pos[i + k] < min[k]) min[k] = pos[i + k]
        if (pos[i + k] > max[k]) max[k] = pos[i + k]
      }
    }

    const vPos = pushView(Buffer.from(pos.buffer, pos.byteOffset, pos.byteLength), 34962)
    const vNrm = pushView(Buffer.from(nrm.buffer, nrm.byteOffset, nrm.byteLength), 34962)
    const vUv = pushView(Buffer.from(uv.buffer, uv.byteOffset, uv.byteLength), 34962)
    const vIdx = pushView(Buffer.from(idx.buffer, idx.byteOffset, idx.byteLength), 34963)

    accessors.push({ bufferView: vPos, componentType: 5126, count: pos.length / 3, type: 'VEC3', min, max })
    const aPos = accessors.length - 1
    accessors.push({ bufferView: vNrm, componentType: 5126, count: nrm.length / 3, type: 'VEC3' })
    const aNrm = accessors.length - 1
    accessors.push({ bufferView: vUv, componentType: 5126, count: uv.length / 2, type: 'VEC2' })
    const aUv = accessors.length - 1
    accessors.push({ bufferView: vIdx, componentType: 5125, count: idx.length, type: 'SCALAR' })
    const aIdx = accessors.length - 1

    primitives.push({ attributes: { POSITION: aPos, NORMAL: aNrm, TEXCOORD_0: aUv }, indices: aIdx, material: matIndex, mode: 4 })
  })

  const gltf = {
    asset: { version: '2.0', generator: 'stackhouse build-interior' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: path.basename(outPath, '.glb') }],
    meshes: [{ primitives }],
    materials: MATERIALS.map((m) => ({
      name: m.name,
      pbrMetallicRoughness: { baseColorFactor: m.color, metallicFactor: 0, roughnessFactor: m.rough },
      doubleSided: true,
    })),
    accessors,
    bufferViews,
    buffers: [{ byteLength: offset }],
  }

  const bin = Buffer.concat(chunks)
  let json = Buffer.from(JSON.stringify(gltf), 'utf8')
  if (json.length % 4) json = Buffer.concat([json, Buffer.alloc(4 - (json.length % 4), 0x20)])

  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546c67, 0)                 // 'glTF'
  header.writeUInt32LE(2, 4)                          // version
  header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8)

  const jsonHeader = Buffer.alloc(8)
  jsonHeader.writeUInt32LE(json.length, 0)
  jsonHeader.writeUInt32LE(0x4e4f534a, 4)             // 'JSON'

  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(bin.length, 0)
  binHeader.writeUInt32LE(0x004e4942, 4)              // 'BIN'

  fs.writeFileSync(outPath, Buffer.concat([header, jsonHeader, json, binHeader, bin]))
  return { bytes: 12 + 8 + json.length + 8 + bin.length, primitives: primitives.length }
}

// ── main ────────────────────────────────────────────────────────────────────

fs.mkdirSync(OUT_DIR, { recursive: true })
let totalTris = 0

for (const floor of Object.keys(FLOOR_BASE_Y)) {
  const mesh = buildFloor(floor)
  const tris = mesh.reduce((n, g) => n + g.idx.length / 3, 0)
  const out = path.join(OUT_DIR, `interior-${floor}.glb`)
  const { bytes, primitives } = writeGLB(mesh, out)
  totalTris += tris
  console.log(
    `interior-${floor}.glb`.padEnd(26) +
    `${String(tris).padStart(6)} tris  ` +
    `${String(primitives)} prims  ` +
    `${(bytes / 1024).toFixed(1)} KB`
  )
}

console.log(`\n${totalTris} triangles total across ${Object.keys(FLOOR_BASE_Y).length} floors.`)
