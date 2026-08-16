"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { resolveCollision } from "@/lib/collision"
import { getActiveColliders, getWorldBounds, resolveEyeY } from "@/lib/use-player-vertical"
import { usePlayerStore } from "@/lib/player-store"

interface MobileFPSControlsProps {
  joystickRef: React.MutableRefObject<{ x: number; y: number }>
  cameraRotationRef: React.MutableRefObject<{ x: number; y: number }>
}

export function MobileFPSControls({ joystickRef, cameraRotationRef }: MobileFPSControlsProps) {
  const { camera } = useThree()
  const velocity = useRef(new THREE.Vector3())
  const initialized = useRef(false)

  // Terminal / Home Office / enter-house-prompt overlays — this control scheme
  // previously never checked terminalOpen at all, so opening the terminal on
  // mobile didn't pause movement. See fps-controls.tsx for the enterPromptOpen note.
  const terminalOpen = usePlayerStore((s) => s.terminalOpen)
  const homeOfficeOpen = usePlayerStore((s) => s.homeOfficeOpen)
  const enterPromptOpen = usePlayerStore((s) => s.enterPromptOpen)
  const pausedRef = useRef(false)
  useEffect(() => { pausedRef.current = terminalOpen || homeOfficeOpen || enterPromptOpen }, [terminalOpen, homeOfficeOpen, enterPromptOpen])

  // Teleport handling — same pattern as fps-controls.tsx
  useEffect(() => {
    return usePlayerStore.subscribe((state, prevState) => {
      const req = state.teleportRequest
      if (!req || req === prevState.teleportRequest) return
      camera.position.set(req.position[0], req.position[1], req.position[2])
      if (req.yaw !== undefined) {
        cameraRotationRef.current.y = req.yaw
        cameraRotationRef.current.x = 0
      }
      velocity.current.set(0, 0, 0)
      usePlayerStore.getState().clearTeleportRequest()
    })
  }, [camera, cameraRotationRef])

  useFrame((state, delta) => {
    if (!initialized.current) {
      camera.position.set(0, 1.7, -25)
      camera.rotation.order = "YXZ"
      // Initialize rotation to match the ref values (Y = Math.PI to look forward, X = 0 for level view)
      camera.rotation.set(cameraRotationRef.current.x, cameraRotationRef.current.y, 0)
      initialized.current = true
    }

    camera.rotation.order = "YXZ"
    camera.rotation.y = cameraRotationRef.current.y
    camera.rotation.x = cameraRotationRef.current.x

    if (pausedRef.current) return   // paused while terminal/home-office overlay is open

    // Calculate movement direction based on camera
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(camera.up, forward).normalize()

    const speed = 2
    const direction = new THREE.Vector3(0, 0, 0)

    if (joystickRef.current.y !== 0) {
      direction.addScaledVector(forward, -joystickRef.current.y * speed)
    }
    if (joystickRef.current.x !== 0) {
      direction.addScaledVector(right, -joystickRef.current.x * speed)
    }

    // Smooth movement with damping
    velocity.current.lerp(direction, 0.15)
    camera.position.addScaledVector(velocity.current, delta)

    const location = usePlayerStore.getState().currentLocation

    // Collision resolution — push player out of any AABB colliders on the active floor
    const resolved = resolveCollision(camera.position.x, camera.position.z, getActiveColliders(location))
    camera.position.x = resolved.x
    camera.position.z = resolved.z

    // Eye height follows the active floor, same stair interpolation as desktop controls
    const { y, crossedTo } = resolveEyeY(location, camera.position.x, camera.position.z)
    camera.position.y = y
    if (crossedTo && crossedTo !== location) {
      usePlayerStore.getState().setCurrentLocation(crossedTo)
    }

    const bounds = getWorldBounds(location)
    camera.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, camera.position.x))
    camera.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, camera.position.z))
  })

  return null
}
