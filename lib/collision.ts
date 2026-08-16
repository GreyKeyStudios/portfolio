export interface AABB {
  label?: string  // optional debug label
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

// 0.3 left too little room in this house's tighter spots: doorways are cut to
// a fixed width and the radius is subtracted from BOTH sides, so a 0.8 door
// gave only 0.2 of genuinely passable band. 0.22 keeps collision solid while
// making every existing doorway comfortably walkable.
const PLAYER_RADIUS = 0.22

/**
 * Given a player's proposed (x, z) position and a list of AABB colliders,
 * returns a corrected (x, z) that is outside all colliders.
 *
 * Uses axis-of-least-penetration push-out, same approach as Source / Quake.
 * Call this after applying movement, before locking y and clamping world bounds.
 */
/**
 * Moves from (fromX, fromZ) toward (toX, toZ), resolving collisions along the
 * WAY rather than only at the destination.
 *
 * resolveCollision alone is a discrete test — it asks "is this final position
 * inside a box?" and knows nothing about the path taken to get there. Any
 * single frame's movement longer than a wall is thick can therefore land
 * cleanly on the far side without ever testing as "inside" it (classic
 * tunneling). That let a player cross archive's north wall into open void,
 * and thickening walls only raised the speed needed rather than fixing it.
 *
 * Splitting the move into steps no larger than STEP guarantees at least one
 * test lands inside any collider at least STEP thick, so nothing thinner than
 * a frame's travel can be skipped. Cheap in practice: normal movement is a
 * couple of steps, and this only runs for the local player.
 */
const STEP = 0.1

export function moveWithCollision(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  colliders: AABB[]
): { x: number; z: number } {
  const dx = toX - fromX
  const dz = toZ - fromZ
  const dist = Math.hypot(dx, dz)
  if (dist === 0) return resolveCollision(toX, toZ, colliders)

  const steps = Math.max(1, Math.ceil(dist / STEP))
  const stepX = dx / steps
  const stepZ = dz / steps
  let x = fromX
  let z = fromZ

  for (let i = 0; i < steps; i++) {
    // Advance from the last RESOLVED position, not from a point on the
    // original straight line — otherwise a push-out in one step is simply
    // undone by the next step continuing along the initial path, and the
    // player slides through the wall anyway.
    const resolved = resolveCollision(x + stepX, z + stepZ, colliders)
    x = resolved.x
    z = resolved.z
  }

  return { x, z }
}

export function resolveCollision(
  x: number,
  z: number,
  colliders: AABB[]
): { x: number; z: number } {
  for (const box of colliders) {
    const exMinX = box.minX - PLAYER_RADIUS
    const exMaxX = box.maxX + PLAYER_RADIUS
    const exMinZ = box.minZ - PLAYER_RADIUS
    const exMaxZ = box.maxZ + PLAYER_RADIUS

    if (x > exMinX && x < exMaxX && z > exMinZ && z < exMaxZ) {
      // Penetration depths on each face
      const dLeft  = x - exMinX   // how far past left edge
      const dRight = exMaxX - x   // how far past right edge
      const dFront = z - exMinZ   // how far past front edge
      const dBack  = exMaxZ - z   // how far past back edge

      const min = Math.min(dLeft, dRight, dFront, dBack)

      if      (min === dLeft)  x = exMinX
      else if (min === dRight) x = exMaxX
      else if (min === dFront) z = exMinZ
      else                     z = exMaxZ
    }
  }
  return { x, z }
}
