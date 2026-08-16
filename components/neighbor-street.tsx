"use client"

import { useGroundTexture } from "@/lib/use-ground-texture"

// Neighborhood across the street — opposing sidewalk, curb, and 3 simple houses

interface NeighborHouse {
  x: number
  z: number
  width: number
  height: number
  depth: number
  roofColor: string
  wallColor: string
  windowColor: string
  hasDriveway?: boolean
}

/** Placeholder houses across the street, off until real ones replace them. */
const SHOW_NEIGHBOUR_HOUSES = false

const HOUSES: NeighborHouse[] = [
  // House 1 — left side, slightly closer
  {
    x: -13, z: -38,
    width: 7, height: 4, depth: 6,
    wallColor: "#0c1020", roofColor: "#080c18",
    windowColor: "#86a4f6",
    hasDriveway: true,
  },
  // House 2 — center, set back a bit
  {
    x: 1, z: -41,
    width: 8, height: 3.5, depth: 6,
    wallColor: "#0d1124", roofColor: "#090d1a",
    windowColor: "#becdf6",
  },
  // House 3 — right side
  {
    x: 15, z: -38,
    width: 6, height: 4.5, depth: 6,
    wallColor: "#0b0f1e", roofColor: "#080b16",
    windowColor: "#4e7cf6",
    hasDriveway: true,
  },
]

function NeighborHouseMesh({ h }: { h: NeighborHouse }) {
  const roofPeakY = h.height + 1.8
  return (
    <group position={[h.x, 0, h.z]}>
      {/* Main house body */}
      <mesh position={[0, h.height / 2, 0]}>
        <boxGeometry args={[h.width, h.height, h.depth]} />
        <meshStandardMaterial color={h.wallColor} roughness={0.9} />
      </mesh>

      {/* Roof — two angled planes forming a gable */}
      <mesh
        position={[0, h.height + 0.9, -h.depth * 0.25]}
        rotation={[Math.PI / 5, 0, 0]}
      >
        <boxGeometry args={[h.width + 0.4, 0.12, h.depth * 0.7]} />
        <meshStandardMaterial color={h.roofColor} roughness={0.95} />
      </mesh>
      <mesh
        position={[0, h.height + 0.9, h.depth * 0.25]}
        rotation={[-Math.PI / 5, 0, 0]}
      >
        <boxGeometry args={[h.width + 0.4, 0.12, h.depth * 0.7]} />
        <meshStandardMaterial color={h.roofColor} roughness={0.95} />
      </mesh>

      {/* Front windows — glowing blue */}
      <mesh position={[-h.width * 0.22, h.height * 0.55, h.depth / 2 + 0.02]}>
        <planeGeometry args={[1.0, 0.8]} />
        <meshStandardMaterial
          color={h.windowColor}
          emissive={h.windowColor}
          emissiveIntensity={0.5}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[h.width * 0.22, h.height * 0.55, h.depth / 2 + 0.02]}>
        <planeGeometry args={[1.0, 0.8]} />
        <meshStandardMaterial
          color={h.windowColor}
          emissive={h.windowColor}
          emissiveIntensity={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* Front door */}
      <mesh position={[0, h.height * 0.28, h.depth / 2 + 0.02]}>
        <planeGeometry args={[0.7, 1.2]} />
        <meshStandardMaterial color="#060a14" roughness={0.9} />
      </mesh>

      {/* Driveway */}
      {h.hasDriveway && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[h.width * 0.3, 0.005, 2]}>
          <planeGeometry args={[2.5, 6]} />
          <meshStandardMaterial color="#090c14" roughness={0.8} />
        </mesh>
      )}

      {/* point light removed — ambient + moonlight sufficient, saves 3 lights */}
    </group>
  )
}

function OpposingSidewalk() {
  // Same concrete texture and density as our side, so both sides of the street
  // read as one material rather than two different greys.
  const { map, normalMap } = useGroundTexture("concrete", 0.55, 80, 2.5)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -32]} receiveShadow>
      <planeGeometry args={[80, 2.5]} />
      <meshStandardMaterial map={map} normalMap={normalMap} color="#4a5268" roughness={0.9} />
    </mesh>
  )
}

export function NeighborStreet() {
  return (
    <group>
      <OpposingSidewalk />

      {/* Opposing curb — matches the near-side curb profile */}
      <mesh position={[0, 0.07, -33.3]} receiveShadow castShadow>
        <boxGeometry args={[80, 0.14, 0.3]} />
        <meshStandardMaterial color="#535c73" roughness={0.85} />
      </mesh>

      {/* No grass strip here — the textured lawn in yard-ground.tsx already
          covers Z -50..50, and a flat-colour plane on top of it just created a
          visible mismatched patch. */}

      {/* Neighbour houses are hidden pending replacement. The street, curb and
          opposing sidewalk stay — only the buildings are gated, so the road
          still reads as a street rather than the yard ending in nothing.
          Flip SHOW_NEIGHBOUR_HOUSES to bring the placeholders back. */}
      {SHOW_NEIGHBOUR_HOUSES &&
        HOUSES.map((h) => <NeighborHouseMesh key={h.x} h={h} />)}
    </group>
  )
}
