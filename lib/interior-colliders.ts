import type { AABB } from './collision'
import { ATTIC_GUARDS, ENTRY_DOOR } from './architecture-details'
import {
  ROOMS, FLOOR_BASE_Y,
  CORE_MIN_X, CORE_MAX_X, CORE_Z0, CORE_Z1, TURN_Z, FLIGHT_W_MAX, FLIGHT_E_MIN,
  type DoorDef, type DoorSide, type FloorId, type RoomDef,
} from './interior-layout'

// Briefly raised to 0.6 to stop players tunneling through walls, but that was
// treating the symptom: it ate the clearance in tight spaces (the basement
// stairwell is only 2 units wide, and a 0.6 wall plus a rail plus the player
// radius left barely 0.8 to squeeze through, which read as "can't get down
// the stairs"). moveWithCollision in lib/collision.ts now substeps the whole
// movement path, so a wall can't be skipped regardless of thickness — the
// actual fix. Back to 0.2, matching the visual walls built in Blender.
const WALL_THICKNESS = 0.2
const RAIL_THICKNESS = 0.15

/**
 * Splits a wall's full span [lo, hi] into solid sub-segments around zero or
 * more door gaps on that side. A room can have multiple doors on the same
 * side (e.g. Hallway has two doors on its east wall), so this can't assume
 * a single gap — it sorts gaps by position and walks the span left to right,
 * emitting a solid segment for every interval between/around them.
 */
function solidSegments(lo: number, hi: number, gaps: DoorDef[]): Array<[number, number]> {
  const sorted = [...gaps].sort((a, b) => a.center - b.center)
  const segments: Array<[number, number]> = []
  let cursor = lo
  for (const g of sorted) {
    const gStart = g.center - g.width / 2
    const gEnd = g.center + g.width / 2
    if (gStart > cursor) segments.push([cursor, gStart])
    cursor = Math.max(cursor, gEnd)
  }
  if (cursor < hi) segments.push([cursor, hi])
  return segments
}

/** Builds the 4 wall runs for a room, cutting every doorway gap declared for each side. */
function wallsForRoom(room: RoomDef): AABB[] {
  if (room.noWalls) return []
  const { minX, maxX, minZ, maxZ } = room.bounds
  const walls: AABB[] = []
  const bySide: Record<DoorSide, DoorDef[]> = { north: [], south: [], east: [], west: [] }
  for (const d of room.doors) bySide[d.side].push(d)

  let i = 0
  for (const [x0, x1] of solidSegments(minX, maxX, bySide.north)) {
    walls.push({ label: `${room.id}-N-${i++}`, minX: x0, maxX: x1, minZ: maxZ - WALL_THICKNESS, maxZ })
  }
  i = 0
  for (const [x0, x1] of solidSegments(minX, maxX, bySide.south)) {
    walls.push({ label: `${room.id}-S-${i++}`, minX: x0, maxX: x1, minZ, maxZ: minZ + WALL_THICKNESS })
  }
  i = 0
  for (const [z0, z1] of solidSegments(minZ, maxZ, bySide.east)) {
    walls.push({ label: `${room.id}-E-${i++}`, minX: maxX - WALL_THICKNESS, maxX, minZ: z0, maxZ: z1 })
  }
  i = 0
  for (const [z0, z1] of solidSegments(minZ, maxZ, bySide.west)) {
    walls.push({ label: `${room.id}-W-${i++}`, minX, maxX: minX + WALL_THICKNESS, minZ: z0, maxZ: z1 })
  }

  return walls
}

const COLLIDERS_BY_FLOOR: Record<Exclude<FloorId, 'yard'>, AABB[]> = {
  basement: [],
  ground: [],
  second: [],
  attic: [],
}

for (const room of ROOMS) {
  COLLIDERS_BY_FLOOR[room.floor].push(...wallsForRoom(room))

  // Eave barriers — see RoomDef.eaveInset. Full-height colliders standing
  // inside the room, holding the player clear of the low roof. Nothing is
  // emitted into the GLB for these; the strip stays fully visible.
  if (room.eaveInset) {
    const { minX, maxX, minZ, maxZ } = room.bounds
    COLLIDERS_BY_FLOOR[room.floor].push(
      { label: `${room.id}-eave-W`, minX: minX + room.eaveInset - RAIL_THICKNESS, maxX: minX + room.eaveInset, minZ, maxZ },
      { label: `${room.id}-eave-E`, minX: maxX - room.eaveInset, maxX: maxX - room.eaveInset + RAIL_THICKNESS, minZ, maxZ },
    )
  }
}

// Stairwell guarding.
//
// The core is a hole in every floor's slab (the shaft is vertically continuous),
// so each floor needs the shaft's open edges railed or you walk into the void.
// Its west edge coincides with the Foyer's own west wall and needs nothing; its
// south edge is the way in and out and must stay clear. That leaves the east
// and north edges, plus the newel between the two flights.
for (const floor of Object.keys(COLLIDERS_BY_FLOOR) as Exclude<FloorId, 'yard'>[]) {
  COLLIDERS_BY_FLOOR[floor].push(
    { label: `${floor}-shaft-E`, minX: CORE_MAX_X - RAIL_THICKNESS, maxX: CORE_MAX_X, minZ: CORE_Z0, maxZ: CORE_Z1 },
    { label: `${floor}-shaft-N`, minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: CORE_Z1 - RAIL_THICKNESS, maxZ: CORE_Z1 },
    { label: `${floor}-newel`, minX: FLIGHT_W_MAX, maxX: FLIGHT_E_MIN, minZ: CORE_Z0, maxZ: TURN_Z },
  )
}

/** Returns the AABB collider set active for a given floor. Empty for 'yard' — that floor uses lib/colliders.ts instead. */
const atticGuardColliders: AABB[] = ATTIC_GUARDS.map(g => ({
  label: `attic-guard-${g.id}`,
  minX: Math.min(g.a[0], g.b[0]) - .035, maxX: Math.max(g.a[0], g.b[0]) + .035,
  minZ: Math.min(g.a[1], g.b[1]) - .035, maxZ: Math.max(g.a[1], g.b[1]) + .035,
}))
const atticWithGuards = [...COLLIDERS_BY_FLOOR.attic, ...atticGuardColliders]
COLLIDERS_BY_FLOOR.ground.push({
  label: 'foyer-closed-entry-door',
  minX: ENTRY_DOOR.centerX - ENTRY_DOOR.openingWidth / 2,
  maxX: ENTRY_DOOR.centerX + ENTRY_DOOR.openingWidth / 2,
  minZ: ENTRY_DOOR.centerZ - ENTRY_DOOR.thickness / 2,
  maxZ: ENTRY_DOOR.centerZ + ENTRY_DOOR.thickness / 2,
})

export function getInteriorColliders(floor: Exclude<FloorId, 'yard'>, eyeY = Infinity): AABB[] {
  // Floor identity stays "attic" while descending both flights. The guards
  // must stop applying once the player has walked below the attic slab.
  return floor === 'attic' && eyeY >= FLOOR_BASE_Y.attic + 1.5 ? atticWithGuards : COLLIDERS_BY_FLOOR[floor]
}
