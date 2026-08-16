"use client"

import { placeInRoom } from "@/lib/interior-layout"

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

const ROOM = 'client-room'

/**
 * Positions are 0..1 ACROSS THE ROOM, not world coordinates.
 *
 * They used to be raw world numbers, which meant the floor-plan rebuild moved
 * every wall and left the furniture where it was — the armchair ended up at
 * x=301.01 against a wall at x=300.98, i.e. sticking through it. Fractions
 * survive a replan; absolute coordinates do not.
 *
 * [w, h, d] in metres, at real furniture dimensions — that is the entire point.
 */
const PIECES: {
  size: [number, number, number]
  /** 0..1 across the room: [west→east, south→north]. */
  at: [number, number]
  tone: string
}[] = [
  { size: [2.2, 0.85, 0.9], at: [0.52, 0.18], tone: '#6b5f52' },   // 3-seat sofa
  { size: [0.9, 0.8, 0.9], at: [0.16, 0.45], tone: '#6b5f52' },    // armchair
  { size: [1.2, 0.42, 0.65], at: [0.52, 0.45], tone: '#4a4038' },  // coffee table
  { size: [1.8, 2.0, 0.38], at: [0.80, 0.60], tone: '#514639' },   // bookcase
  { size: [1.4, 0.55, 0.45], at: [0.52, 0.82], tone: '#3f3830' },  // media unit
  { size: [3.2, 0.02, 2.4], at: [0.52, 0.45], tone: '#5a4d44' },   // rug
]

export function ProxyFurniture() {
  return (
    <group name="proxy-furniture">
      {PIECES.map((p, i) => {
        // Clamped against the room's own bounds, so a piece can never end up
        // inside a wall however the plan is rescaled later.
        const [x, y, z] = placeInRoom(ROOM, p.at[0], p.at[1], [p.size[0] / 2, p.size[2] / 2])
        return (
          <mesh key={i} position={[x, y + p.size[1] / 2, z]} castShadow receiveShadow>
            <boxGeometry args={p.size} />
            <meshStandardMaterial color={p.tone} roughness={0.85} />
          </mesh>
        )
      })}
    </group>
  )
}
