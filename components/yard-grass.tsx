"use client"

import { GrassPatch } from "@/components/grass-patch-model"

/**
 * YardGrass — decorative grass clumps in the front yard area.
 * Kept to 6 instances near the player for performance (~51k tris total).
 *
 * Scales are ~0.35 of the old values: grass-patch.glb is 2.78 units wide and
 * 0.90 tall, vs the retired grass-1.glb at 1.43 × 0.24. Without the reduction
 * the clumps would stand waist-high against a 1.7 eye level.
 */
export function YardGrass() {
  return (
    <group>
      {/* Flanking front-left of house — most visible to player */}
      <GrassPatch position={[-3.5, 0, -5.5]} scale={0.35} rotation={[0, 0.8, 0]} />
      <GrassPatch position={[-4.5, 0, -5]}   scale={0.30} rotation={[0, 2.1, 0]} />

      {/* Right mid-yard */}
      <GrassPatch position={[8,  0, -8]}  scale={0.42} rotation={[0, 1.2, 0]} />
      <GrassPatch position={[10, 0, -10]} scale={0.32} rotation={[0, 0.4, 0]} />

      {/* Open mid-yard scatter — near player start */}
      <GrassPatch position={[4,  0, -6]}  scale={0.25} rotation={[0, 1.5, 0]} />
      <GrassPatch position={[-6, 0, -8]}  scale={0.28} rotation={[0, 2.8, 0]} />
    </group>
  )
}
