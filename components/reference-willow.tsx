"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Cylinder } from "@react-three/drei"
import type * as THREE from "three"

export function ReferenceWillow({ position }: { position: [number, number, number] }) {
  const leavesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.02
    }
  })

  return (
    <group position={position}>
      {/* Main trunk */}
      <Cylinder args={[0.3, 0.5, 5]} position={[0, 2.5, 0]}>
        <meshStandardMaterial color="#2c3e50" />
      </Cylinder>

      {/* Drooping willow foliage */}
      <group ref={leavesRef} position={[0, 5, 0]}>
        {/* Main canopy */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2]} />
          <meshStandardMaterial color="#4e7cf6" />
        </mesh>

        {/* Many drooping branches for realistic willow look */}
        {Array.from({ length: 20 }, (_, i) => {
          const angle = (i / 20) * Math.PI * 2
          const radius = 1.5 + Math.random() * 0.5
          const x = Math.cos(angle) * radius
          const z = Math.sin(angle) * radius
          const length = 4 + Math.random() * 2

          return (
            <group key={i} position={[x, 0, z]}>
              {/* Long drooping branch */}
              <Cylinder args={[0.02, 0.04, length]} position={[0, -length / 2, 0]}>
                <meshStandardMaterial color="#86a4f6" />
              </Cylinder>

              {/* Leaf clusters along the branch */}
              {Array.from({ length: 4 }, (_, j) => (
                <mesh key={j} position={[0, -j * (length / 4), 0]}>
                  <sphereGeometry args={[0.1]} />
                  <meshStandardMaterial color="#becdf6" />
                </mesh>
              ))}

              {/* End leaf cluster */}
              <mesh position={[0, -length, 0]}>
                <sphereGeometry args={[0.15]} />
                <meshStandardMaterial color="#4e7cf6" />
              </mesh>
            </group>
          )
        })}
      </group>
    </group>
  )
}
