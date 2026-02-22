export interface AABB {
  label?: string  // optional debug label
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

const PLAYER_RADIUS = 0.3

/**
 * Given a player's proposed (x, z) position and a list of AABB colliders,
 * returns a corrected (x, z) that is outside all colliders.
 *
 * Uses axis-of-least-penetration push-out, same approach as Source / Quake.
 * Call this after applying movement, before locking y and clamping world bounds.
 */
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
