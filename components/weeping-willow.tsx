"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, Cylinder } from "@react-three/drei"
import type { Group } from "three"

export function WeepingWillow({ position }: { position: [number, number, number] }) {
  const leavesRef = useRef<Group>(null)

  useFrame((state) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
    }
  })

  return (
    <group position={position} name="weeping-willow">
      {/* Tree trunk */}
      <Cylinder args={[0.5, 0.8, 4]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#2c3e50" />
      </Cylinder>

      {/* Main foliage mass */}
      <group ref={leavesRef}>
        <Sphere args={[3]} position={[0, 5, 0]}>
          <meshStandardMaterial color="#4e7cf6" />
        </Sphere>

        {/* Drooping willow branches */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const x = Math.cos(angle) * 2
          const z = Math.sin(angle) * 2

          return (
            <group key={i} position={[x, 5, z]}>
              <Cylinder args={[0.1, 0.15, 3]} position={[0, -1.5, 0]}>
                <meshStandardMaterial color="#86a4f6" />
              </Cylinder>
              <Cylinder args={[0.05, 0.1, 2]} position={[0, -3.5, 0]}>
                <meshStandardMaterial color="#becdf6" />
              </Cylinder>
              <Sphere args={[0.3]} position={[0, -4.5, 0]}>
                <meshStandardMaterial color="#4e7cf6" />
              </Sphere>
            </group>
          )
        })}
      </group>
    </group>
  )
}
