import * as THREE from 'three'
import { moveWithCollision } from './collision'
import { getActiveColliders, getWorldBounds, resolveEyeY } from './use-player-vertical'
import type { FloorId } from './interior-layout'

/**
 * The single per-frame movement step, shared by every control scheme.
 *
 * This exists because there were TWO copies of it — desktop and mobile — and
 * the mobile one silently rotted. It still used a discrete point collision test
 * (so you tunnelled through walls at speed), had no step-height guard (so the
 * storey-teleport warp was still live), and called resolveEyeY without the
 * current height (so on a switchback it picked whichever stacked flight came
 * first in the array). Every bug fixed on desktop was still present on phones.
 *
 * A control scheme's only job is to turn input into an INTENT — which way, how
 * fast, and whether a teleport just happened. Everything after that is physics
 * and belongs here, once.
 */

/** Movement intent for one frame, in the camera's local frame of reference. */
export interface MoveIntent {
  /** -1..1, positive = forward. */
  forward: number
  /** -1..1, positive = right. */
  strafe: number
  /** Metres per second. */
  speed: number
}

export interface StepResult {
  /** True if the move was refused by the step-height limit. */
  refused: boolean
  /** Set when the player crossed onto a different floor this frame. */
  crossedTo: FloorId | null
}

/**
 * Walking a stair changes Y by only a few centimetres per frame, so anything
 * larger means the move would teleport the player vertically — stepping off the
 * middle of a flight onto flat floor, or in off a doorway onto a tread well
 * above where they stand. Refusing the horizontal move is what a solid surface
 * would do anyway, and it lets doorways stay comfortably wide rather than being
 * narrowed just to geometrically forbid those spots.
 */
const MAX_STEP = 0.35

const _forward = new THREE.Vector3()
const _right = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)

/**
 * Advances `object` by one frame of `intent`, resolving collision, stair height
 * and floor transitions. Mutates the object's position in place.
 *
 * `justTeleported` bypasses the step limit for exactly one frame: a teleport is
 * a legitimate discontinuity, and without this the guard compares the
 * destination's eye height against the departure's, sees the storey difference,
 * and silently puts the player back where they came from.
 */
export function stepPlayer(
  object: THREE.Object3D,
  location: FloorId,
  intent: MoveIntent,
  delta: number,
  justTeleported: boolean
): StepResult {
  object.getWorldDirection(_forward)
  _forward.y = 0
  _forward.normalize()
  _right.crossVectors(_forward, _up).normalize()

  // Where we started. moveWithCollision needs the actual path (from -> to), not
  // just the destination, so it can catch walls crossed mid-frame rather than
  // only ones we happen to land inside.
  const prevX = object.position.x
  const prevZ = object.position.z
  const prevY = object.position.y

  const dist = intent.speed * delta
  const toX = prevX + (_forward.x * intent.forward + _right.x * intent.strafe) * dist
  const toZ = prevZ + (_forward.z * intent.forward + _right.z * intent.strafe) * dist

  const resolved = moveWithCollision(prevX, prevZ, toX, toZ, getActiveColliders(location, prevY))

  const step = resolveEyeY(location, resolved.x, resolved.z, prevY)
  let crossedTo = step.crossedTo
  let refused = false

  if (!justTeleported && prevY !== 0 && Math.abs(step.y - prevY) > MAX_STEP) {
    // Refuse the ENTIRE transition, not just its horizontal half. Reverting
    // x/z alone while still applying step.y and crossedTo is the original
    // "warping" bug: the move is judged illegal, yet the player drops a whole
    // storey and has the active collider set swapped under them mid-frame.
    object.position.x = prevX
    object.position.z = prevZ
    object.position.y = prevY
    crossedTo = null
    refused = true
  } else {
    object.position.x = resolved.x
    object.position.z = resolved.z
    object.position.y = step.y
  }

  // Backstop only — room walls do the real containment.
  const b = getWorldBounds(location)
  object.position.x = Math.max(b.minX, Math.min(b.maxX, object.position.x))
  object.position.z = Math.max(b.minZ, Math.min(b.maxZ, object.position.z))

  return { refused, crossedTo }
}
