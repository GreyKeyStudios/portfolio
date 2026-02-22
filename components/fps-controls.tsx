"use client"

import { useRef, useEffect, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { PointerLockControls } from "@react-three/drei"
import * as THREE from "three"
import { resolveCollision } from "@/lib/collision"
import { COLLIDERS } from "@/lib/colliders"

export function FPSControls() {
  const { camera, gl } = useThree()
  const controlsRef = useRef<any>()
  const [isLocked, setIsLocked] = useState(false)
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

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!controlsRef.current) return

    const controls = controlsRef.current

    const onLock = () => setIsLocked(true)
    const onUnlock = () => setIsLocked(false)

    try {
      controls.addEventListener("lock", onLock)
      controls.addEventListener("unlock", onUnlock)
      controls.pointerSpeed = 0.8
    } catch (error) {
      console.error("Pointer lock not available:", error)
    }

    return () => {
      try {
        controls.removeEventListener("lock", onLock)
        controls.removeEventListener("unlock", onUnlock)
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }, [])

  useFrame((state, delta) => {
    if (!controlsRef.current) return

    const speed = 2
    const dampingFactor = 3.0

    velocity.current.x *= 1 - dampingFactor * delta
    velocity.current.z *= 1 - dampingFactor * delta

    direction.current.z = Number(keys.current.w) - Number(keys.current.s)
    direction.current.x = Number(keys.current.d) - Number(keys.current.a)
    direction.current.normalize()

    velocity.current.z = direction.current.z * speed
    velocity.current.x = direction.current.x * speed

    const controlsObject = controlsRef.current.getObject()

    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()

    controlsObject.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    controlsObject.position.addScaledVector(forward, velocity.current.z * delta)
    controlsObject.position.addScaledVector(right, velocity.current.x * delta)

    // Collision resolution — push player out of any AABB colliders
    const resolved = resolveCollision(
      controlsObject.position.x,
      controlsObject.position.z,
      COLLIDERS
    )
    controlsObject.position.x = resolved.x
    controlsObject.position.z = resolved.z

    controlsObject.position.y = 1.7

    controlsObject.position.x = Math.max(-25, Math.min(25, controlsObject.position.x))
    controlsObject.position.z = Math.max(-40, Math.min(15, controlsObject.position.z))
  })

  return (
    <>
      <PointerLockControls ref={controlsRef} args={[camera, gl.domElement]} selector={null} />
      {!isLocked && (
        <mesh position={[0, 1.7, -5]} onClick={() => controlsRef.current?.lock()}>
          <planeGeometry args={[0.1, 0.1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </>
  )
}
