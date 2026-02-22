"use client"

import type React from "react"

import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

interface MobileFPSControlsProps {
  joystickRef: React.MutableRefObject<{ x: number; y: number }>
  cameraRotationRef: React.MutableRefObject<{ x: number; y: number }>
}

export function MobileFPSControls({ joystickRef, cameraRotationRef }: MobileFPSControlsProps) {
  const { camera } = useThree()
  const velocity = useRef(new THREE.Vector3())
  const initialized = useRef(false)

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

    // Keep camera at eye level
    camera.position.y = 1.7
  })

  return null
}
