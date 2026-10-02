import { useEffect } from 'react'
import type { FloorId } from './interior-layout'

/**
 * Lights owned by components (street lamps, proximity glows) that are drawn
 * THROUGH the fixed light pool in app/house/page.tsx instead of mounting their
 * own <pointLight>.
 *
 * They used to mount their own, inside the yard group and the per-floor groups.
 * A light under a `visible={false}` group drops out of three's light count, so
 * the count went 14 in the yard, 11 indoors, 10 in the basement, and every
 * change recompiled every material — measured 2026-10-01 at 1.9 s frozen on
 * first reaching the basement and 0.2-0.4 s on every yard/house crossing.
 * Mounting them permanently fixed the stalls but made the interior shade 12
 * point lights instead of 8 (~15-20% slower frames on an Intel UHD 620).
 * As pool candidates they cost a slot only when they are among the nearest.
 */
export interface PoolLight {
  where: FloorId
  position: [number, number, number]
  color: string
  intensity: number
  distance: number
  decay: number
}

const lights = new Map<string, PoolLight>()

export function getPoolLights(): Iterable<PoolLight> {
  return lights.values()
}

/**
 * Registers a pool candidate while mounted. An intensity of 0 keeps it out of
 * the pool entirely, so an idle proximity glow never takes a slot.
 */
export function usePoolLight(id: string, light: PoolLight) {
  const { where, color, intensity, distance, decay } = light
  const [x, y, z] = light.position
  useEffect(() => {
    lights.set(id, { where, position: [x, y, z], color, intensity, distance, decay })
    return () => { lights.delete(id) }
  }, [id, where, x, y, z, color, intensity, distance, decay])
}
