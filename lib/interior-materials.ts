import type { Material } from 'three'

/**
 * Removes glTF transmission (KHR_materials_transmission) from an interior
 * material, keeping its authored blend opacity.
 *
 * Any visible material with transmission > 0 makes three.js render every
 * opaque object in the scene a SECOND time into a mip-mapped render target, so
 * the glass can refract it. One 0.18-transmission shower screen in the upstairs
 * bathroom did exactly that: measured 2026-10-01 on an Intel UHD 620 at
 * 1280x720, the foyer went 162ms -> 79ms per frame and the second-floor landing
 * 138ms -> 73ms once it was removed. The screen sits in the frustum from most of
 * the ground and second floors, because neighbour floors stay rendered, so the
 * whole house was paying for it.
 *
 * Alpha-blended glass at its authored opacity reads the same at this distance
 * and costs nothing extra. Applied at load rather than in Blender, so a future
 * export that ticks Transmission again cannot bring the second pass back.
 *
 * Returns true if the material was changed. Idempotent; mutating the cached
 * glTF material in place is deliberate so every clone shares the fix.
 */
export function stripTransmission(material: Material): boolean {
  const m = material as Material & { transmission?: number }
  if (!m.transmission) return false
  m.transmission = 0
  m.transparent = true
  m.depthWrite = false
  m.needsUpdate = true
  return true
}
