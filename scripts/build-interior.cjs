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
const revision = process.argv.includes('--candidate-v002') ? 'v002' : 'v001'
const candidate = process.argv.includes('--candidate-v001') || process.argv.includes('--candidate-v002')

const LAYOUT = path.join(__dirname, '..', '.interior-build', 'interior-layout.js')
if (!fs.existsSync(LAYOUT)) {
  console.error('Missing', LAYOUT, '\nRun via `npm run build:interior` (it transpiles the layout first).')
  process.exit(1)
}
const {
  ROOMS, STAIRS, FLOOR_BASE_Y, FLOOR_CEILING, FLOOR_TO_FLOOR, floorAtY,
  X0, HOUSE_W, HOUSE_D, WINDOW_SILL, WINDOW_HEAD,
} = require(LAYOUT)

/**
 * The footprint edges, in world coordinates. A window is only legal on a wall
 * that lies on one of these — see assertExterior.
 */
const FOOT = {
  minX: X0 - HOUSE_W / 2,
  maxX: X0 + HOUSE_W / 2,
  minZ: 0,
  maxZ: HOUSE_D,
}

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
  // Glazing, seen from inside at night.
  //
  // There is nothing outside the interior scene to look at — it lives alone at
  // X0=300 and the yard is 300 units away and hidden. So the glass cannot be
  // transparent: it would show the void, or the inside of the room behind it.
  // It is instead a dark, faintly emissive panel the colour of the yard's fog
  // (#152341), which is what a window actually looks like from a lit room at
  // night. Emissive rather than lit, because a window that needs a light source
  // to read would cost one of the seven pool slots (see SceneLights).
  //
  // The emissive value is deliberately below the Bloom luminance threshold
  // (0.85 in scene-effects.tsx) — these should glow faintly, not flare.
  //
  // Tuned DOWN from a first pass at 0.07/0.11/0.20 with roughness 0.08. That
  // read as daylight: the panes were the brightest surface in every room and
  // the near-mirror roughness put a hard specular blob of the nearest point
  // light in one corner of each. At night a window is DARKER than the lit wall
  // around it, so the value sits below the wall's and the roughness is high
  // enough to smear the reflection into a sheen rather than a highlight.
  { name: 'glass', color: [0.022, 0.036, 0.072, 1], rough: 0.22, emissive: [0.026, 0.046, 0.09] },
]
const MAT = { floor: 0, wall: 1, ceiling: 2, stair: 3, trim: 4, glass: 5 }

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

// Window trim. A bare hole with glass in it reads as a texture, not an opening;
// what makes it read as joinery is the stool standing proud of the wall and the
// muntins breaking the pane up. Both are cheap — a handful of boxes each.
const GLASS_T = 0.02
const STOOL_T = 0.032   // thickness of the interior sill ledge
const STOOL_D = 0.055   // how far it projects into the room past the wall face
const APRON_H = 0.085   // the board under the stool
const MUNTIN_T = 0.035
const LIGHT_W = 0.55    // target width of one pane between muntins

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
  if (candidate && pts.reduce((a, p, i) => {
    const q = pts[(i + 1) % pts.length]
    return a + p[0] * q[1] - q[0] * p[1]
  }, 0) < 0) pts = [...pts].reverse()
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
    if (candidate) group.idx.push(s, s + 2, s + 1, s, s + 3, s + 2)
    else group.idx.push(s, s + 1, s + 2, s, s + 2, s + 3)
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

/**
 * Sutherland-Hodgman clip of a convex polygon against one axis-aligned
 * half-plane. `axis` 0 = x, 1 = y; `sign` +1 keeps the side >= value.
 *
 * Exists for exactly one job: cutting a window out of the attic gable. Every
 * other opening in the house is a rectangle in a rectangular wall, so it is
 * subtracted arithmetically by solidSegments. The gable is a triangle, and a
 * rectangular hole in it leaves four pieces whose shapes depend on where the
 * roof slope crosses the opening — which is a clip, not a subtraction.
 */
function clipHalf(pts, axis, sign, value) {
  const keep = (p) => (sign > 0 ? p[axis] >= value - 1e-9 : p[axis] <= value + 1e-9)
  const out = []
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i]
    const nxt = pts[(i + 1) % pts.length]
    if (keep(cur)) out.push(cur)
    if (keep(cur) !== keep(nxt)) {
      const t = (value - cur[axis]) / (nxt[axis] - cur[axis])
      out.push([cur[0] + (nxt[0] - cur[0]) * t, cur[1] + (nxt[1] - cur[1]) * t])
    }
  }
  return out
}

/** The part of a convex polygon inside an axis-aligned box. May be empty. */
function clipRect(pts, x0, x1, y0, y1) {
  let p = pts
  for (const [axis, sign, v] of [[0, 1, x0], [0, -1, x1], [1, 1, y0], [1, -1, y1]]) {
    p = clipHalf(p, axis, sign, v)
    if (p.length < 3) return []
  }
  return p
}

/**
 * A window may only be cut into a wall that faces outdoors.
 *
 * Doors on a shared boundary have to be declared on BOTH rooms or the
 * neighbour's wall renders solid across the opening — a bug this project has
 * shipped more than once. Windows sidestep that entirely by being illegal on
 * interior walls, and this is what makes that a build failure rather than
 * something you find by walking into it.
 */
function assertExterior(room, w) {
  const b = room.bounds
  const on = {
    north: Math.abs(b.maxZ - FOOT.maxZ) < 1e-6,
    south: Math.abs(b.minZ - FOOT.minZ) < 1e-6,
    east: Math.abs(b.maxX - FOOT.maxX) < 1e-6,
    west: Math.abs(b.minX - FOOT.minX) < 1e-6,
  }
  if (!on[w.side]) {
    throw new Error(
      `${room.id}: ${w.side} window is not on an exterior wall. ` +
      `That side sits at ${JSON.stringify(b)}, footprint is ${JSON.stringify(FOOT)}.`
    )
  }
}

/**
 * A window must fit its wall with its casing on, and must not collide with any
 * other opening on the same side.
 *
 * The casing is included in the extent on purpose. Cutting the hole is the easy
 * part; the failure this catches is an opening placed with just enough room for
 * the glass and none for the trim around it, which is exactly what happened
 * when the Foyer was considered for sidelights — a 2.3 wall with a 1.2 door and
 * its casings in the middle of it has no honest room either side.
 *
 * Doors are not checked against each other here. They are existing, working
 * data, and a window pass has no business introducing a new way for them to
 * fail the build.
 */
function assertWindowsFit(room, s) {
  for (const w of s.windows) {
    const lo = w.center - w.width / 2 - CASING_W
    const hi = w.center + w.width / 2 + CASING_W
    if (lo < s.lo - 1e-9 || hi > s.hi + 1e-9) {
      throw new Error(
        `${room.id}: ${w.side} window at ${w.center.toFixed(2)} needs ` +
        `${lo.toFixed(2)}..${hi.toFixed(2)} with casing, but the wall runs ` +
        `${s.lo.toFixed(2)}..${s.hi.toFixed(2)}.`
      )
    }
    for (const o of [...s.doors, ...s.windows]) {
      if (o === w) continue
      if (o.center - o.width / 2 < hi - 1e-9 && lo < o.center + o.width / 2 - 1e-9) {
        throw new Error(
          `${room.id}: ${w.side} window at ${w.center.toFixed(2)} overlaps the ` +
          `opening at ${o.center.toFixed(2)}.`
        )
      }
    }
  }
}

/**
 * Everything inside a window opening: the pane, its muntins, the casing round
 * it, and the stool and apron below.
 *
 * Shared between ordinary walls and the attic gable, which is why it takes a
 * `box` mapper rather than working in world axes — the gable is built in the
 * X/Y plane extruded along Z, and every other wall is not.
 *
 * `slab` is the wall's two depth faces, `inner` the room-facing one, `dir` the
 * sign that points from it into the room.
 */
function addGlazing(mesh, box, a, b, sill, head, slab, inner, dir) {
  const mid = (slab[0] + slab[1]) / 2

  // The pane sits at the middle of the wall depth, not flush with a face, so
  // there is a reveal on both sides of it.
  box(mesh[MAT.glass], a, b, sill, head, mid - GLASS_T / 2, mid + GLASS_T / 2)

  // Muntins. One undivided pane at this size reads as a hole with a colour in
  // it; the bars are what make it parse as a window at a glance, and they cost
  // a handful of boxes.
  const lights = Math.max(2, Math.round((b - a) / LIGHT_W))
  for (let i = 1; i < lights; i++) {
    const c = a + ((b - a) * i) / lights
    box(mesh[MAT.trim], c - MUNTIN_T / 2, c + MUNTIN_T / 2, sill, head, mid - MUNTIN_T / 2, mid + MUNTIN_T / 2)
  }
  const my = (sill + head) / 2
  box(mesh[MAT.trim], a, b, my - MUNTIN_T / 2, my + MUNTIN_T / 2, mid - MUNTIN_T / 2, mid + MUNTIN_T / 2)

  // Casing — the same profile as the door casings, so the two read as trim from
  // one house rather than two separate systems.
  const c0 = inner
  const c1 = inner + dir * CASING_D
  box(mesh[MAT.trim], a - CASING_W, a, sill, head + CASING_W, c0, c1)
  box(mesh[MAT.trim], b, b + CASING_W, sill, head + CASING_W, c0, c1)
  box(mesh[MAT.trim], a - CASING_W, b + CASING_W, head, head + CASING_W, c0, c1)

  // Stool and apron. The stool is the only part of a window that projects into
  // the room, and it does most of the work of making the opening read as depth
  // rather than as a panel painted on the wall.
  box(mesh[MAT.trim], a - CASING_W, b + CASING_W, sill - STOOL_T, sill, mid, inner + dir * STOOL_D)
  box(mesh[MAT.trim], a, b, sill - STOOL_T - APRON_H, sill - STOOL_T, c0, c1)
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
  const crossingStairs = STAIRS
    .filter((s) => s.floor === floor || arrivingFrom.has(s.floor))
  // The whole switchback is one opening, including the central newel gap.
  // Separate flight cuts leave a thin slab cantilever between the flights.
  const holes = candidate
    ? [...new Set(crossingStairs.map(s => s.floor))].map(owner => {
      const bounds = crossingStairs.filter(s => s.floor === owner).map(s => s.bounds)
      return {
        minX: Math.min(...bounds.map(b => b.minX)), maxX: Math.max(...bounds.map(b => b.maxX)),
        minZ: Math.min(...bounds.map(b => b.minZ)), maxZ: Math.max(...bounds.map(b => b.maxZ)),
      }
    })
    : crossingStairs.map(s => s.bounds)

  for (const room of rooms) {
    const { minX, maxX, minZ, maxZ } = room.bounds

    for (const p of subtractRects(room.bounds, candidate && floor === 'basement' ? [] : holes)) {
      addBox(mesh[MAT.floor], p.minX, p.maxX, -SLAB, 0, p.minZ, p.maxZ)
    }
    for (const p of subtractRects(room.bounds, holes)) {
      // The attic has a roof instead of a ceiling slab — see buildRoof.
      if (room.floor !== 'attic') {
        // Clamped so it never intersects the floor slab of the storey above.
        addBox(mesh[MAT.ceiling], p.minX, p.maxX, FLOOR_CEILING, Math.min(FLOOR_CEILING + SLAB, FLOOR_TO_FLOOR - SLAB), p.minZ, p.maxZ)
      }
    }

    if (room.noWalls) continue

    const bySide = { north: [], south: [], east: [], west: [] }
    for (const d of room.doors) bySide[d.side].push(d)

    // Windows are validated on the way in, so an illegal one fails the build
    // rather than quietly cutting a hole into the neighbouring room.
    //
    // The attic's north and south openings are GABLE windows: its room bounds
    // are inset to the knee walls, so they are neither on the footprint edge
    // nor in a wall tall enough to hold them (the knee is 1.15). They are
    // handled with the roof instead, and skipped here.
    const winBySide = { north: [], south: [], east: [], west: [] }
    for (const w of room.windows ?? []) {
      if (room.floor === 'attic') {
        if (w.side === 'east' || w.side === 'west') {
          throw new Error(`${room.id}: ${w.side} window sits in a ${ATTIC_KNEE_H} knee wall — gable ends only.`)
        }
        continue // built with the roof, below
      }
      assertExterior(room, w)
      winBySide[w.side].push(w)
    }

    // Each side is described once, then walls / headers / casings / baseboards
    // are all driven off the same description. `along` maps a coordinate on the
    // wall's own axis plus a depth offset into a world box, so the four sides
    // don't need four near-identical copies of every piece of trim.
    const sides = [
      { doors: bySide.north, windows: winBySide.north, lo: minX, hi: maxX, slab: [maxZ - WALL, maxZ], inner: maxZ - WALL, dir: -1, axis: 'x' },
      { doors: bySide.south, windows: winBySide.south, lo: minX, hi: maxX, slab: [minZ, minZ + WALL], inner: minZ + WALL, dir: 1, axis: 'x' },
      { doors: bySide.east, windows: winBySide.east, lo: minZ, hi: maxZ, slab: [maxX - WALL, maxX], inner: maxX - WALL, dir: -1, axis: 'z' },
      { doors: bySide.west, windows: winBySide.west, lo: minZ, hi: maxZ, slab: [minX, minX + WALL], inner: minX + WALL, dir: 1, axis: 'z' },
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

      // Both doors and windows cut the wall; each then puts back the parts of
      // its own opening that are solid (a door's header, a window's sill and
      // head panels). Cutting first and refilling keeps the jamb reveals
      // correct for free — the faces of the neighbouring wall segments ARE the
      // reveal, so a window is a real hole through 0.2 of wall rather than a
      // decal on a flat surface.
      const openings = [...s.doors, ...s.windows]
      assertWindowsFit(room, s)

      for (const [a, b] of solidSegments(s.lo, s.hi, openings)) {
        box(mesh[MAT.wall], a, b, 0, wallTop, s.slab[0], s.slab[1])
      }

      // Baseboard, on the room-facing side only. Cut by DOORS ONLY — a base
      // runs underneath a window, and stopping it either side of one is the
      // kind of detail that reads as wrong without being obvious why.
      for (const [a, b] of solidSegments(s.lo, s.hi, s.doors)) {
        box(mesh[MAT.trim], a, b, 0, BASE_H, s.inner, s.inner + s.dir * BASE_D)
      }

      for (const w of s.windows) {
        const a = w.center - w.width / 2
        const b = w.center + w.width / 2
        const sill = w.sill ?? WINDOW_SILL
        const head = w.head ?? WINDOW_HEAD
        if (sill >= head) throw new Error(`${room.id}: window sill ${sill} is not below head ${head}.`)
        if (head + CASING_W > wallTop) {
          throw new Error(`${room.id}: window head ${head} + casing does not fit under a ${wallTop} wall.`)
        }

        // Put back the wall under the sill and above the head.
        box(mesh[MAT.wall], a, b, 0, sill, s.slab[0], s.slab[1])
        box(mesh[MAT.wall], a, b, head, wallTop, s.slab[0], s.slab[1])

        addGlazing(mesh, box, a, b, sill, head, s.slab, s.inner, s.dir)
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
    //
    // This is also the only place in the attic a window can go. The knee walls
    // are 1.15 and the roof takes over above them, so the gable is the one
    // surface with the height for an opening — which is why real attics are
    // lit this way too.
    const BIG = 1e4
    for (const [za, zb, side] of [[minZ, minZ + WALL, 'south'], [maxZ - WALL, maxZ, 'north']]) {
      const tri = [[minX, kneeY], [ridgeX, ridgeY], [maxX, kneeY]]
      const wins = (room.windows ?? []).filter((w) => w.side === side)
      if (wins.length > 1) {
        throw new Error(`${room.id}: ${side} gable carries ${wins.length} windows; the clip below subtracts one.`)
      }
      const w = wins[0]

      if (!w) {
        addPrismZ(mesh[MAT.wall], za, zb, tri)
      } else {
        const a = w.center - w.width / 2
        const b = w.center + w.width / 2
        const sill = w.sill ?? WINDOW_SILL
        const head = w.head ?? WINDOW_HEAD

        // The triangle minus the opening, as four clipped pieces. The two outer
        // ones keep the sloping roof line; the top piece is whatever triangle
        // is left between the head and the rafters, and vanishes on its own if
        // the opening reaches the ridge.
        for (const piece of [
          clipRect(tri, -BIG, a, -BIG, BIG),
          clipRect(tri, b, BIG, -BIG, BIG),
          clipRect(tri, a, b, -BIG, sill),
          clipRect(tri, a, b, head, BIG),
        ]) {
          if (piece.length >= 3) addPrismZ(mesh[MAT.wall], za, zb, piece)
        }

        // Depth here runs along Z, so the box mapper is the identity on X/Y.
        const dir = side === 'south' ? 1 : -1
        const inner = side === 'south' ? zb : za
        addGlazing(
          mesh,
          (g, x0, x1, y0, y1, d0, d1) => addBox(g, x0, x1, y0, y1, Math.min(d0, d1), Math.max(d0, d1)),
          a, b, sill, head, [za, zb], inner, dir
        )
      }
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
  for (const s of STAIRS.filter((x) => !candidate && x.floor === floor)) {
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
      ...(m.emissive ? { emissiveFactor: m.emissive } : {}),
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
  const out = path.join(OUT_DIR, `interior-${floor}${candidate ? `-${revision}` : ''}.glb`)
  const { bytes, primitives } = writeGLB(mesh, out)
  totalTris += tris
  console.log(
    path.basename(out).padEnd(32) +
    `${String(tris).padStart(6)} tris  ` +
    `${String(primitives)} prims  ` +
    `${(bytes / 1024).toFixed(1)} KB`
  )
}

console.log(`\n${totalTris} triangles total across ${Object.keys(FLOOR_BASE_Y).length} floors.`)
