import { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePlayerStore } from './player-store'

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

// Hook used once at the Scene level to drive proximity checks each frame
export function useProximitySystem() {
  const { camera } = useThree()
  const prevNear = useRef<string | null>(null)
  const setNearbyLabel = usePlayerStore((s) => s.setNearbyLabel)

  useFrame(() => {
    camera.getWorldPosition(_pos)
    let closest: string | null = null
    let closestDist = Infinity

    interactables.forEach((item, id) => {
      _target.set(item.position.x, item.position.y, item.position.z)
      const dist = _pos.distanceTo(_target)
      if (dist < item.radius && dist < closestDist) {
        closestDist = dist
        closest = id
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

      // Update HUD nearby label for "Press E" hint
      const label = closest ? (interactables.get(closest)?.label ?? null) : null
      setNearbyLabel(label)
    }
  })
}
