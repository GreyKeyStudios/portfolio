import layout from './bedroom-furniture-v002.json'
import { X0 } from './interior-layout'
import type { AABB } from './collision'

export const BEDROOM_FURNITURE_COLLIDERS: AABB[] = layout.map(piece => {
  const c = Math.abs(Math.cos(piece.yaw)), s = Math.abs(Math.sin(piece.yaw))
  const halfX = (c * piece.width + s * piece.depth) / 2
  const halfZ = (s * piece.width + c * piece.depth) / 2
  return { label: `bedroom-furniture-${piece.id}`, minX: X0 + piece.x - halfX,
    maxX: X0 + piece.x + halfX, minZ: piece.z - halfZ, maxZ: piece.z + halfZ }
})

let mounted = 0
const combined = new WeakMap<AABB[], AABB[]>()
export function registerBedroomFurniture() { mounted += 1; return () => { mounted -= 1 } }
export function withBedroomFurniture(walls: AABB[]) {
  if (!mounted) return walls
  let result = combined.get(walls)
  if (!result) { result = [...walls, ...BEDROOM_FURNITURE_COLLIDERS]; combined.set(walls, result) }
  return result
}
