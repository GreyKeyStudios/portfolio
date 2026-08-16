"use client"

import { X0, HOUSE_W, FLOOR_BASE_Y } from "@/lib/interior-layout"

/**
 * Crude box furniture, Client Room only. TEMPORARY.
 *
 * Empty rooms lie about their size — a 5.4 x 5.4 room reads as a corridor when
 * there is nothing in it to measure against, and every judgement about whether
 * the plan "feels right" made in an empty shell is suspect. Sofa-, table- and
 * bookcase-sized boxes at real dimensions give the eye a ruler.
 *
 * Deliberately untextured, uncollidable and ugly. This is a measuring
 * instrument, not a first pass at set dressing — real props replace it wholesale
 * and nothing here should survive that.
 */

const lx = (n: number) => X0 - HOUSE_W / 2 + n

// [w, h, d] in metres, at real furniture dimensions — that is the entire point.
const PIECES: { size: [number, number, number]; at: [number, number]; tone: string }[] = [
  { size: [2.2, 0.85, 0.9], at: [10.5, 1.0], tone: '#6b5f52' },   // 3-seat sofa
  { size: [0.9, 0.8, 0.9], at: [8.6, 2.6], tone: '#6b5f52' },     // armchair
  { size: [1.2, 0.42, 0.65], at: [10.5, 2.6], tone: '#4a4038' },  // coffee table
  { size: [1.8, 2.0, 0.38], at: [12.6, 3.4], tone: '#514639' },   // bookcase
  { size: [1.4, 0.55, 0.45], at: [10.5, 4.9], tone: '#3f3830' },  // media unit
  { size: [3.2, 0.02, 2.4], at: [10.5, 2.6], tone: '#5a4d44' },   // rug
]

export function ProxyFurniture() {
  const y = FLOOR_BASE_Y.ground

  return (
    <group name="proxy-furniture">
      {PIECES.map((p, i) => (
        <mesh
          key={i}
          position={[lx(p.at[0]), y + p.size[1] / 2, p.at[1]]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={p.size} />
          <meshStandardMaterial color={p.tone} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}
