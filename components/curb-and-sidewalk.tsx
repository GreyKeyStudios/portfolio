"use client"

import { useGroundTexture } from "@/lib/use-ground-texture"

/**
 * All hardscape (walkway, driveway, public sidewalk, curb) shares one baked
 * concrete texture at a single density, so paving joints line up in scale
 * across every surface.
 *
 * This replaced a tiled photogrammetry slab GLB. That asset had a ragged,
 * torn outline and its texture was a UV atlas of scattered fragments, so it
 * could tile neither as geometry nor as an image — the repeats read as ruins.
 */
const CONCRETE_TILES_PER_UNIT = 0.55

// Walkway + driveway merged into one continuous slab to avoid a seam.
// Spans X=-0.2 (walkway left edge) to X=5.95 (driveway right edge).
const WALK_W = 6.15
const WALK_D = 14
const WALK_X = 2.875
const WALK_Z = -9

// Public sidewalk strip — near edge flush with the fence line at Z=-16.
const STRIP_W = 40
const STRIP_D = 2.5
const STRIP_Z = -17.25

const CURB_Z = -18.5

function Walkway() {
  const { map, normalMap } = useGroundTexture("concrete", CONCRETE_TILES_PER_UNIT, WALK_W, WALK_D)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[WALK_X, 0.012, WALK_Z]} receiveShadow>
      <planeGeometry args={[WALK_W, WALK_D]} />
      <meshStandardMaterial map={map} normalMap={normalMap} color="#4a5268" roughness={0.9} />
    </mesh>
  )
}

function SidewalkStrip() {
  const { map, normalMap } = useGroundTexture("concrete", CONCRETE_TILES_PER_UNIT, STRIP_W, STRIP_D)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, STRIP_Z]} receiveShadow>
      <planeGeometry args={[STRIP_W, STRIP_D]} />
      <meshStandardMaterial map={map} normalMap={normalMap} color="#4a5268" roughness={0.9} />
    </mesh>
  )
}

export function CurbAndSidewalk() {
  return (
    <group>
      <Walkway />
      <SidewalkStrip />

      {/* Curb — raised lip between sidewalk and road */}
      <mesh position={[0, 0.07, CURB_Z]} receiveShadow castShadow>
        <boxGeometry args={[STRIP_W, 0.14, 0.3]} />
        <meshStandardMaterial color="#535c73" roughness={0.85} />
      </mesh>
    </group>
  )
}
