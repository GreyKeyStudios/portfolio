import layout from './office-dressing-v002.json'
import { FLOOR_BASE_Y, X0 } from './interior-layout'
import type { AABB } from './collision'

export const OFFICE_DRESSING_COLLIDERS: AABB[] = layout.map(piece => {
  const c = Math.abs(Math.cos(piece.yaw)), s = Math.abs(Math.sin(piece.yaw))
  const halfX = (c * piece.width + s * piece.depth) / 2
  const halfZ = (s * piece.width + c * piece.depth) / 2
  return { label: `office-dressing-${piece.id}`, minX: X0 + piece.x - halfX,
    maxX: X0 + piece.x + halfX, minZ: piece.z - halfZ, maxZ: piece.z + halfZ }
})

let mounted = 0
const combined = new WeakMap<AABB[], AABB[]>()
export function registerOfficeDressing() { mounted += 1; return () => { mounted -= 1 } }
export function withOfficeDressing(walls: AABB[]) {
  if (!mounted) return walls
  let result = combined.get(walls)
  if (!result) { result = [...walls, ...OFFICE_DRESSING_COLLIDERS]; combined.set(walls, result) }
  return result
}

/**
 * Where the Home Office interaction lives in v002: the executive desk itself,
 * from the same placement entry as its geometry and collider, at desk height.
 * It used to stay on the legacy desk spot at floor level, where its 2.2 m
 * radius reached only ~1.5 m at eye height — not far enough to be triggered
 * from the front of the new desk, the side a player walks up to.
 */
const desk = layout.find(piece => piece.id === 'executive-desk')!
export const OFFICE_WORKSTATION: [number, number, number] = [X0 + desk.x, FLOOR_BASE_Y.second + 1.0, desk.z]
