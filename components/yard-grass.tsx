"use client"

import { GrassPatch, GrassPatchAlt } from "@/components/grass-patch-model"

/**
 * YardGrass — decorative grass patches scattered across the yard.
 * Replaces the procedural sphere-based YardBushes.
 * Positions sourced from old bush placement; bush GLBs will layer on top later.
 */
export function YardGrass() {
  return (
    <group>
      {/* Flanking front-left of house */}
      <GrassPatch    position={[-3.5, 0, -5.5]} scale={1.0}  rotation={[0, 0.8,  0]} />
      <GrassPatchAlt position={[-4.5, 0, -5]}   scale={0.85} rotation={[0, 2.1,  0]} />

      {/* Right mid-yard */}
      <GrassPatchAlt position={[8,  0, -8]}  scale={1.2} rotation={[0, 1.2, 0]} />
      <GrassPatch    position={[10, 0, -10]} scale={0.9} rotation={[0, 0.4, 0]} />

      {/* Along right fence baseline */}
      <GrassPatch    position={[13, 0, -14]} scale={0.75} rotation={[0, 2.6, 0]} />
      <GrassPatchAlt position={[11, 0, -12]} scale={0.85} rotation={[0, 1.8, 0]} />

      {/* Along left fence baseline */}
      <GrassPatchAlt position={[-13, 0, -14]} scale={0.75} rotation={[0, 0.5, 0]} />
      <GrassPatch    position={[-13, 0, -10]} scale={0.9}  rotation={[0, 3.1, 0]} />

      {/* Extra scatter — open mid-yard */}
      <GrassPatch    position={[4,  0, -6]}  scale={0.7} rotation={[0, 1.5, 0]} />
      <GrassPatchAlt position={[-6, 0, -8]}  scale={0.8} rotation={[0, 2.8, 0]} />
      <GrassPatch    position={[6,  0, 2]}   scale={1.0} rotation={[0, 0.2, 0]} />
      <GrassPatchAlt position={[-4, 0, 3]}   scale={0.9} rotation={[0, 1.9, 0]} />
    </group>
  )
}
