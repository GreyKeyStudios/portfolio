"use client"

import { useRef, useEffect, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

export function MobileTouchControls() {
  const { camera } = useThree()
  const [joystickActive, setJoystickActive] = useState(false)
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 })
  const [lookActive, setLookActive] = useState(false)

  const velocity = useRef(new THREE.Vector3())
  const rotation = useRef(new THREE.Euler())
  const joystickStart = useRef({ x: 0, y: 0 })
  const lookStart = useRef({ x: 0, y: 0 })
  const lookDelta = useRef({ x: 0, y: 0 })
  const joystickDelta = useRef({ x: 0, y: 0 })

  useEffect(() => {
    rotation.current.x = 0
    rotation.current.y = 0
    rotation.current.order = "YXZ"
  }, [])

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]

        // Left side for joystick (movement)
        if (touch.clientX < window.innerWidth / 2) {
          e.preventDefault()
          setJoystickActive(true)
          joystickStart.current = { x: touch.clientX, y: touch.clientY }
        }
        // Right side for camera look
        else {
          e.preventDefault()
          setLookActive(true)
          lookStart.current = { x: touch.clientX, y: touch.clientY }
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]

        // Joystick movement
        if (touch.clientX < window.innerWidth / 2 && joystickActive) {
          e.preventDefault()
          const deltaX = touch.clientX - joystickStart.current.x
          const deltaY = touch.clientY - joystickStart.current.y
          const maxDistance = 50
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

          if (distance > maxDistance) {
            const angle = Math.atan2(deltaY, deltaX)
            setJoystickPosition({
              x: Math.cos(angle) * maxDistance,
              y: Math.sin(angle) * maxDistance,
            })
          } else {
            setJoystickPosition({ x: deltaX, y: deltaY })
          }
        }
        // Camera look
        else if (lookActive) {
          e.preventDefault()
          const deltaX = touch.clientX - lookStart.current.x
          const deltaY = touch.clientY - lookStart.current.y

          lookDelta.current.x = deltaX * 0.002
          lookDelta.current.y = deltaY * 0.002

          lookStart.current = { x: touch.clientX, y: touch.clientY }
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]

        if (touch.clientX < window.innerWidth / 2) {
          setJoystickActive(false)
          setJoystickPosition({ x: 0, y: 0 })
        } else {
          setLookActive(false)
        }
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: false })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [joystickActive, lookActive])

  useFrame((state, delta) => {
    const speed = 2
    const dampingFactor = 3.0

    // Apply camera rotation from touch look
    rotation.current.y -= lookDelta.current.x
    rotation.current.x -= lookDelta.current.y
    rotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.current.x))

    camera.rotation.copy(rotation.current)

    // Dampen look delta
    lookDelta.current.x *= 0.9
    lookDelta.current.y *= 0.9

    // Apply joystick movement
    velocity.current.x *= 1 - dampingFactor * delta
    velocity.current.z *= 1 - dampingFactor * delta

    const normalizedX = joystickPosition.x / 50
    const normalizedY = joystickPosition.y / 50

    velocity.current.x = normalizedX * speed
    velocity.current.z = normalizedY * speed

    // Move camera
    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()

    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    camera.position.addScaledVector(forward, velocity.current.z * delta)
    camera.position.addScaledVector(right, velocity.current.x * delta)

    camera.position.y = 1.7

    // Boundaries
    camera.position.x = Math.max(-25, Math.min(25, camera.position.x))
    camera.position.z = Math.max(-35, Math.min(15, camera.position.z))
  })

  return null
}
