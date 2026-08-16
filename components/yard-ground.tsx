"use client"

import { useGroundTexture } from "@/lib/use-ground-texture"

// Tiles per world unit. Shared densities keep grass/asphalt reading at a
// consistent scale rather than each surface having its own arbitrary zoom.
const GRASS_TILES_PER_UNIT = 0.12
const ASPHALT_TILES_PER_UNIT = 0.09

// Lawn is the base layer for the whole world and must cover the full player
// range (clamped to Z -40..15, X ±25 in fps-controls) or the ground shows a void.
const LAWN_W = 100
const LAWN_D = 100

// Street sits ON TOP of the lawn and spans exactly curb-to-curb: our curb at
// Z=-18.5 to the opposing curb at Z=-33.3 (see neighbor-street.tsx). Previously
// the street plane was *below* the lawn and 25 units of it were hidden
// underneath, so the road the player stood on was actually dark grass.
const CURB_Z = -18.5
const OPPOSING_CURB_Z = -33.3
const STREET_D = CURB_Z - OPPOSING_CURB_Z
const STREET_CENTER_Z = (CURB_Z + OPPOSING_CURB_Z) / 2

function Lawn() {
  const { map, normalMap } = useGroundTexture("grass", GRASS_TILES_PER_UNIT, LAWN_W, LAWN_D)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[LAWN_W, LAWN_D]} />
      {/* color multiplies the map — pulls the daylight-baked green into the night palette */}
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        color="#26382f"
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  )
}

function Street() {
  const { map, normalMap } = useGroundTexture("asphalt", ASPHALT_TILES_PER_UNIT, LAWN_W, STREET_D)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, STREET_CENTER_Z]} receiveShadow>
      <planeGeometry args={[LAWN_W, STREET_D]} />
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        color="#4c566f"
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  )
}

export function YardGround() {
  return (
    <group>
      <Lawn />
      <Street />

      {/* Center-line dashes down the middle of the road surface */}
      {[-38, -30, -22, -14, -6, 2, 10, 18, 26, 34].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.004, STREET_CENTER_Z]}>
          <planeGeometry args={[2.5, 0.25]} />
          {/* Worn paint, not a light source — it was reading as glowing bars and
              pulling the eye off the house. Let scene lighting do the work. */}
          <meshStandardMaterial color="#6f6130" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}
