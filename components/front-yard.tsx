"use client"

import { WeepingWillow } from "./weeping-willow"
import { Mailbox } from "./mailbox"

export function FrontYard() {
  const colors = {
    background: "#000000",
    foreground: "#f6f6f6",
    accent1: "#becdf6",
    accent2: "#86a4f6",
    accent3: "#4e7cf6",
  }

  return (
    <group name="front-yard">
      {/* Main ground plane */}
      <mesh position={[0, 0, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color={colors.accent1} />
      </mesh>

      {/* Walkway */}
      <mesh position={[0, 0.01, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 16]} />
        <meshStandardMaterial color={colors.accent2} />
      </mesh>

      {/* Driveway */}
      <mesh position={[-9, 0.01, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 16]} />
        <meshStandardMaterial color={colors.accent2} />
      </mesh>

      {/* Weeping willow (positioned like in reference) */}
      <WeepingWillow position={[12, 10, -2]} />

      {/* Mailbox */}
      <Mailbox position={[4, 0, -12]} />

      {/* Decorative bushes/landscaping */}
      <group name="landscaping">
        <mesh position={[-15, 0.5, -8]}>
          <sphereGeometry args={[1]} />
          <meshStandardMaterial color={colors.accent3} />
        </mesh>
        <mesh position={[15, 0.5, -8]}>
          <sphereGeometry args={[1]} />
          <meshStandardMaterial color={colors.accent3} />
        </mesh>
      </group>
    </group>
  )
}
