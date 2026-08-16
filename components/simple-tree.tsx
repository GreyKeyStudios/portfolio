"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Cylinder } from "@react-three/drei"
import type * as THREE from "three"

export function SimpleTree({ position }: { position: [number, number, number] }) {
  const leavesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group position={position}>
      {/* Trunk */}
      <Cylinder args={[0.3, 0.5, 3]} position={[0, 1.5, 0]}>
        <meshStandardMaterial color="#4a3728" />
      </Cylinder>

      {/* Main foliage */}
      <group ref={leavesRef} position={[0, 3, 0]}>
        <mesh>
          <sphereGeometry args={[2]} />
          <meshStandardMaterial color="#4e7cf6" />
        </mesh>

        {/* Drooping branches */}
        {Array.from({ length: 6 }, (_, i) => {
          const angle = (i / 6) * Math.PI * 2
          const x = Math.cos(angle) * 1.5
          const z = Math.sin(angle) * 1.5

          return (
            <group key={i} position={[x, 0, z]}>
              <Cylinder args={[0.05, 0.1, 2]} position={[0, -1, 0]}>
                <meshStandardMaterial color="#86a4f6" />
              </Cylinder>
              <mesh position={[0, -2, 0]}>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="#becdf6" />
              </mesh>
            </group>
          )
        })}
      </group>
    </group>
  )
}
