"use client"

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { PointerLockControls } from "@react-three/drei"
import * as THREE from "three"

interface FPSControllerProps {
  onMove?: (position: THREE.Vector3) => void
}

export function FPSController({ onMove }: FPSControllerProps) {
  const { camera, gl } = useThree()
  const controlsRef = useRef<any>()
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          keys.current.w = true
          break
        case "KeyA":
          keys.current.a = true
          break
        case "KeyS":
          keys.current.s = true
          break
        case "KeyD":
          keys.current.d = true
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          keys.current.w = false
          break
        case "KeyA":
          keys.current.a = false
          break
        case "KeyS":
          keys.current.s = false
          break
        case "KeyD":
          keys.current.d = false
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    if (!controlsRef.current) return

    const speed = 32
    velocity.current.x -= velocity.current.x * 10.0 * delta
    velocity.current.z -= velocity.current.z * 10.0 * delta

    direction.current.z = Number(keys.current.w) - Number(keys.current.s)
    direction.current.x = Number(keys.current.d) - Number(keys.current.a)
    direction.current.normalize()

    if (keys.current.w || keys.current.s) {
      velocity.current.z -= direction.current.z * speed * delta
    }
    if (keys.current.a || keys.current.d) {
      velocity.current.x -= direction.current.x * speed * delta
    }

    controlsRef.current.moveRight(-velocity.current.x * delta)
    controlsRef.current.moveForward(-velocity.current.z * delta)

    // Keep camera at eye level
    camera.position.y = 1.7

    // Collision detection (basic bounds)
    camera.position.x = Math.max(-15, Math.min(15, camera.position.x))
    camera.position.z = Math.max(-15, Math.min(15, camera.position.z))

    onMove?.(camera.position)
  })

  return <PointerLockControls ref={controlsRef} args={[camera, gl.domElement]} makeDefault />
}
