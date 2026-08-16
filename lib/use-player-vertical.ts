import type { AABB } from './collision'
import { COLLIDERS } from './colliders'
import { getInteriorColliders } from './interior-colliders'
import { FLOOR_BASE_Y, STAIRS, X0, floorAtY, type FloorId } from './interior-layout'

const EYE_HEIGHT = 1.7

export function getActiveColliders(location: FloorId): AABB[] {
  if (location === 'yard') return COLLIDERS
  return getInteriorColliders(location)
}

export function getWorldBounds(location: FloorId): { minX: number; maxX: number; minZ: number; maxZ: number } {
  if (location === 'yard') {
    return { minX: -25, maxX: 25, minZ: -40, maxZ: 15 }
  }
  // Generous interior play area around X0 — individual room walls (interior-colliders.ts)
  // do the real containment; this is just a backstop against falling through the world.
  //
  // maxZ must stay clear of the northernmost geometry or it silently becomes the
  // containment instead of the backstop: at 20 it clamped the player mid-climb on
  // stair-attic (Z19..21) with no collider involved, which reads as an invisible
  // wall two thirds of the way up the flight. Archive now reaches Z22.
  return { minX: X0 - 12, maxX: X0 + 12, minZ: -8, maxZ: 26 }
}

/**
 * Resolves the player's eye Y for the current (x, z), walking any stair on
 * the active floor. Linearly interpolates height across the stair's rise
 * axis, and reports `crossedTo` once the player passes fully onto the far
 * floor so the caller can flip `currentLocation`.
 */
export function resolveEyeY(
  location: FloorId,
  x: number,
  z: number,
  /**
   * The player's current eye Y. Disambiguates stacked runs in a continuous
   * stair shaft — see the comment at `reachable` below. Defaults to the floor's
   * own eye height, which is correct for any caller that isn't mid-climb.
   */
  currentY: number = FLOOR_BASE_Y[location === 'yard' ? 'ground' : location] + EYE_HEIGHT
): { y: number; crossedTo: FloorId | null } {
  if (location === 'yard') {
    return { y: EYE_HEIGHT, crossedTo: null }
  }

  const baseY = FLOOR_BASE_Y[location]

  // Small deliberately. This was 0.3, sized for a stair standing in open floor
  // with nothing adjacent. Every run now sits inside an enclosed shaft whose
  // wall is 0.15 thick, so 0.3 reached straight through it: a player in the
  // Kitchen at X297.98 tested as being on the stair's flight A and got yanked
  // to mid-flight height. Runs are contiguous (flight → landing → flight all
  // touch), so exact containment already covers the handoffs.
  const TOL = 0.05

  // Exact containment first, TOL-padded only as a fallback.
  //
  // Deliberately NOT gating on `location` matching one of the stair's ends:
  // ordinary movement covers more ground per frame than the single exact Z
  // where a handoff occurs (z=15 between stair-main and stair-attic), so
  // `location` is routinely the stale prior floor at that moment.
  //
  // The TOL fallback exists because a stair with nothing adjacent
  // (stair-basement's bottom) needs a zone wide enough to survive one
  // frame's movement, or the player leaves every stair's bounds in a single
  // step and crossedTo never fires. But TOL makes ADJACENT stairs overlap,
  // and whichever came first in the array would win — at z=15.2 that gave
  // stair-main's clamped top (y=4.90) instead of stair-attic's actual
  // interpolation (y=5.22), a jump big enough for the step-height limit to
  // refuse, wedging the player at the junction. Exact-first removes the
  // ambiguity wherever the point genuinely lies inside one stair.
  const inBounds = (s: typeof STAIRS[number], pad: number) => {
    const { minX, maxX, minZ, maxZ } = s.bounds
    return x >= minX - pad && x <= maxX + pad && z >= minZ - pad && z <= maxZ + pad
  }
  // A vertically-continuous switchback shaft means several runs share the SAME
  // plan footprint at different heights — the basement→ground flight sits
  // directly under the ground→second one. Plan position alone cannot tell them
  // apart, so pick the run whose surface is nearest the height we are already
  // at. Deliberately NOT filtered by floor: descending keeps `location` on the
  // upper floor for the whole climb down, so the runs underneath you belong to
  // a floor that matches neither end, and filtering drops the very run you are
  // standing on.
  const reachable = STAIRS
  const surfaceY = (s: typeof STAIRS[number]) => {
    const c = s.axis === 'z' ? z : x
    const span = s.topCoord - s.bottomCoord
    const t = span === 0 ? 0 : Math.max(0, Math.min(1, (c - s.bottomCoord) / span))
    return s.bottomY + (s.topY - s.bottomY) * t
  }
  const nearest = (list: typeof STAIRS) =>
    list.length <= 1
      ? list[0]
      : list.reduce((a, b) =>
          Math.abs(surfaceY(a) + EYE_HEIGHT - currentY) <= Math.abs(surfaceY(b) + EYE_HEIGHT - currentY) ? a : b
        )

  const stair =
    nearest(reachable.filter((s) => inBounds(s, 0))) ?? nearest(reachable.filter((s) => inBounds(s, TOL)))

  if (stair) {
    const coord = stair.axis === 'z' ? z : x
    // bottomCoord/topCoord are raw axis values, not guaranteed min<max, so
    // normalize direction rather than assuming which one is numerically smaller.
    // A switchback's return leg genuinely runs toward -Z.
    const span = stair.topCoord - stair.bottomCoord
    const t = span === 0 ? 0 : Math.max(0, Math.min(1, (coord - stair.bottomCoord) / span))

    // Heights are explicit, so a flat half-landing (bottomY === topY) needs no
    // special case — it interpolates to a constant.
    const y = stair.bottomY + (stair.topY - stair.bottomY) * t + EYE_HEIGHT

    // A floor change is emergent: it happens where a run's end coincides with a
    // floor's base height. Mid-flight ends (a switchback's half-landing) return
    // null and correctly leave `location` alone for the whole climb — you stay
    // on the ground floor's collider set until the final run tops out.
    const endBottom = floorAtY(stair.bottomY)
    const endTop = floorAtY(stair.topY)

    let crossedTo: FloorId | null = null
    if (t >= 1 && endTop && endTop !== location) {
      crossedTo = endTop
    } else if (t <= 0 && endBottom && endBottom !== location) {
      crossedTo = endBottom
    } else if (endBottom && endTop && location !== endBottom && location !== endTop) {
      // `location` matches NEITHER end of a run whose ends are BOTH real floors —
      // we arrived mid-span (the skip this function guards against), so there is
      // no exact t=0/1 edge left to wait for. Snap to whichever end is closer.
      //
      // Requiring both ends to be floors matters: on a switchback's upper flight
      // the lower end is a half-landing (null), and `location` legitimately
      // matches neither end for the entire climb. Without that guard this would
      // fire every frame and teleport the player a storey early.
      crossedTo = t >= 0.5 ? endTop : endBottom
    }

    return { y, crossedTo }
  }

  return { y: baseY + EYE_HEIGHT, crossedTo: null }
}
