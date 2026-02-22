"use client"

import { GrassPatch } from "@/components/grass-patch-model"

/**
 * YardGrass — decorative grass patches in the front yard area.
 * Kept to 6 instances near the player for performance.
 * Far fence-line patches removed — they're rarely visible and costly.
 * Bush GLBs will layer on top once sourced.
 */
export function YardGrass() {
  return (
    <group>
      {/* Flanking front-left of house — most visible to player */}
      <GrassPatch position={[-3.5, 0, -5.5]} scale={1.0}  rotation={[0, 0.8, 0]} />
      <GrassPatch position={[-4.5, 0, -5]}   scale={0.85} rotation={[0, 2.1, 0]} />

      {/* Right mid-yard */}
      <GrassPatch position={[8,  0, -8]}  scale={1.2} rotation={[0, 1.2, 0]} />
      <GrassPatch position={[10, 0, -10]} scale={0.9} rotation={[0, 0.4, 0]} />

      {/* Open mid-yard scatter — near player start */}
      <GrassPatch position={[4,  0, -6]}  scale={0.7} rotation={[0, 1.5, 0]} />
      <GrassPatch position={[-6, 0, -8]}  scale={0.8} rotation={[0, 2.8, 0]} />
    </group>
  )
}
