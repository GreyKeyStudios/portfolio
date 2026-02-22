"use client"

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

export function NeighborStreet() {
  return (
    <group>
      {/* Opposing sidewalk — matches our side at Z=-17.25 but mirrored across road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -32]}>
        <planeGeometry args={[80, 2.5]} />
        <meshStandardMaterial color="#1a2035" roughness={0.9} />
      </mesh>

      {/* Opposing curb */}
      <mesh position={[0, 0.1, -33.3]}>
        <boxGeometry args={[80, 0.2, 0.3]} />
        <meshStandardMaterial color="#222840" roughness={0.85} />
      </mesh>

      {/* Grass strip between opposing sidewalk and houses */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -36]}>
        <planeGeometry args={[80, 5]} />
        <meshStandardMaterial color="#0a1810" roughness={0.8} />
      </mesh>

      {/* 3 neighbor houses */}
      {HOUSES.map((h) => (
        <NeighborHouseMesh key={h.x} h={h} />
      ))}
    </group>
  )
}
