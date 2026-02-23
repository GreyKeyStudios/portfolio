import { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface Interactable {
  id: string
  label?: string  // Human-readable name shown in "Press E to interact" hint
  position: THREE.Vector3Like
  radius: number // proximity trigger distance
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

// Minimum dot product between camera forward and direction-to-interactable.
// cos(50°) ≈ 0.64 — player must be looking within a ~50° cone to trigger.
const LOOK_DOT_THRESHOLD = 0.64

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
    let closestDist = Infinity

    interactables.forEach((item, id) => {
      _target.set(item.position.x, item.position.y, item.position.z)
      const dist = _pos.distanceTo(_target)

      // Must be within proximity radius
      if (dist >= item.radius || dist >= closestDist) return

      // Must be looking at it — dot product of forward vs direction-to-target
      _toTarget.subVectors(_target, _pos).normalize()
      const dot = _forward.dot(_toTarget)
      if (dot < LOOK_DOT_THRESHOLD) return

      closestDist = dist
      closest = id
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
