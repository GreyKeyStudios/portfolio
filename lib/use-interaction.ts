import { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface Interactable {
  id: string
  label?: string  // Human-readable name shown in "Press E to interact" hint
  position: THREE.Vector3Like
  radius: number // proximity trigger distance
  requireLook?: boolean // if true, player must face the object (default: false)
  onInteract: () => void
  onNearby?: (isNear: boolean) => void // called when player enters/exits radius
}

// Global registry of interactable objects in the scene
const interactables = new Map<string, Interactable>()
let nearestId: string | null = null

export function registerInteractable(item: Interactable) {
  interactables.set(item.id, item)
}

export function unregisterInteractable(id: string) {
  interactables.delete(id)
}

// Call this from the interact button/key handler
export function triggerInteract() {
  if (nearestId) {
    const item = interactables.get(nearestId)
    item?.onInteract()
  }
}

// Returns the id of the nearest interactable within range, or null
export function getNearestInteractable(): string | null {
  return nearestId
}

const _pos = new THREE.Vector3()
const _target = new THREE.Vector3()
const _forward = new THREE.Vector3()
const _toTarget = new THREE.Vector3()
const _flatForward = new THREE.Vector3()

// Minimum dot product between camera forward and direction-to-interactable.
// cos(60°) = 0.5 — player must be looking within a ~60° cone to trigger.
const LOOK_DOT_THRESHOLD = 0.5

// Hook used once at the Scene level to drive proximity checks each frame.
// Requires player to be within radius AND looking at the interactable.
// onNearbyChange is called with the label of the nearest interactable (or null)
export function useProximitySystem(onNearbyChange?: (label: string | null) => void) {
  const { camera } = useThree()
  const prevNear = useRef<string | null>(null)

  useFrame(() => {
    camera.getWorldPosition(_pos)
    camera.getWorldDirection(_forward) // camera's current look direction

    let closest: string | null = null
    let bestScore = -Infinity

    // Flatten camera forward to XZ for look-direction checks
    // Guard: if looking straight up/down, flatForward length ≈ 0 — normalize() gives NaN.
    // In that case we treat flatForward as zero-length and skip look checks entirely.
    const flatLen = Math.sqrt(_forward.x * _forward.x + _forward.z * _forward.z)
    if (flatLen > 0.01) {
      _flatForward.set(_forward.x / flatLen, 0, _forward.z / flatLen)
    } else {
      _flatForward.set(0, 0, 0)
    }

    interactables.forEach((item, id) => {
      // Distance check — must be within this interactable's radius
      _target.set(item.position.x, item.position.y, item.position.z)
      const dist = _pos.distanceTo(_target)
      if (dist >= item.radius) return

      // Objects with requireLook=true need the player to face them.
      // Objects with requireLook=false (default) trigger on proximity alone —
      // score by closeness so the nearest one wins when multiple overlap.
      if (item.requireLook) {
        // Flatten direction to target to XZ — guard against standing directly on top
        const dx = item.position.x - _pos.x
        const dz = item.position.z - _pos.z
        const toLen = Math.sqrt(dx * dx + dz * dz)
        if (toLen < 0.01) return // standing on top — skip angle check, don't trigger
        _toTarget.set(dx / toLen, 0, dz / toLen)

        // If flat forward is degenerate (looking straight up/down), skip this item
        if (_flatForward.lengthSq() < 0.01) return

        const dot = _flatForward.dot(_toTarget)
        if (dot < LOOK_DOT_THRESHOLD) return

        // Score: higher dot = more directly faced
        if (dot > bestScore) {
          bestScore = dot
          closest = id
        }
      } else {
        // Proximity-only: score by inverse distance (closer = higher score)
        // Use offset from max score range so proximity items beat unscored slots
        const score = 100 - dist
        if (score > bestScore) {
          bestScore = score
          closest = id
        }
      }
    })

    // Fire onNearby callbacks for entries/exits
    if (closest !== prevNear.current) {
      if (prevNear.current) {
        interactables.get(prevNear.current)?.onNearby?.(false)
      }
      if (closest) {
        interactables.get(closest)?.onNearby?.(true)
      }
      nearestId = closest
      prevNear.current = closest

      // Notify caller so HUD can show "Press E" hint
      const label = closest ? (interactables.get(closest)?.label ?? null) : null
      onNearbyChange?.(label)
    }
  })
}
