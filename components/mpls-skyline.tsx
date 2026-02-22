"use client"

// Minneapolis skyline silhouette — procedural, tinted with Grey Key Studios palette
// Landmarks roughly based on real Mpls skyline (IDS Center, Capella, Wells Fargo, etc.)
// All buildings at Z=-65, spread X=-22 to X=+24

const PALETTE = ["#becdf6", "#86a4f6", "#4e7cf6"]

interface Building {
  x: number
  width: number
  height: number
  depth: number
  windowColor: string
  // Optional crown/antenna
  crownHeight?: number
  crownWidth?: number
  // Stepped top offset
  stepX?: number
  stepWidth?: number
  stepHeight?: number
}

const BUILDINGS: Building[] = [
  // Far left fillers
  { x: -22, width: 3,   height: 5,  depth: 2,   windowColor: PALETTE[2] },
  { x: -18, width: 2,   height: 8,  depth: 2,   windowColor: PALETTE[1] },
  { x: -15, width: 3.5, height: 6,  depth: 2,   windowColor: PALETTE[2] },

  // Wells Fargo Center (stepped top)
  { x: -11, width: 3,   height: 13, depth: 2, windowColor: PALETTE[1], stepX: -10, stepWidth: 1.5, stepHeight: 3 },

  // 225 S 6th / mid-rise cluster
  { x: -7,  width: 2.5, height: 11, depth: 2,   windowColor: PALETTE[0] },
  { x: -4,  width: 2,   height: 7,  depth: 2,   windowColor: PALETTE[2] },

  // IDS Center — tallest, center landmark, with antenna
  { x: -0.5, width: 3.5, height: 18, depth: 2.5, windowColor: PALETTE[0], crownHeight: 3, crownWidth: 0.4 },

  // Capella Tower — pointed crown
  { x: 5,   width: 2.5, height: 14, depth: 2, windowColor: PALETTE[1], crownHeight: 2.5, crownWidth: 0.3 },

  // Right side fillers
  { x: 9,   width: 3,   height: 9,  depth: 2,   windowColor: PALETTE[2] },
  { x: 13,  width: 2,   height: 11, depth: 2,   windowColor: PALETTE[0] },
  { x: 17,  width: 3,   height: 6,  depth: 2,   windowColor: PALETTE[1] },
  { x: 21,  width: 2.5, height: 8,  depth: 2,   windowColor: PALETTE[2] },
]

// Generate window positions for a building face
function buildingWindows(b: Building, z: number) {
  const windows: { x: number; y: number; z: number; color: string }[] = []
  const cols = Math.floor(b.width / 0.7)
  const rows = Math.floor(b.height / 0.9)
  for (let r = 1; r < rows - 0.5; r++) {
    for (let c = 0; c < cols; c++) {
      // Random-ish window lighting — skip some for variety (deterministic based on position)
      const seed = (b.x * 7 + r * 13 + c * 5) % 10
      if (seed > 3) continue // ~60% of windows lit
      windows.push({
        x: b.x - b.width / 2 + 0.4 + c * 0.7,
        y: 0.6 + r * 0.9,
        z: z + b.depth / 2 + 0.01,
        color: b.windowColor,
      })
    }
  }
  return windows
}

export function MplsSkyline() {
  const Z = -65

  return (
    <group>
      {/* Backlight — single blue glow behind the skyline (reduced from 3 for perf) */}
      <pointLight position={[0, 10, Z + 5]} color="#4e7cf6" intensity={3} distance={60} decay={1.5} />

      {BUILDINGS.map((b) => {
        const windows = buildingWindows(b, Z)
        return (
          <group key={b.x}>
            {/* Main building body */}
            <mesh position={[b.x, b.height / 2, Z]}>
              <boxGeometry args={[b.width, b.height, b.depth]} />
              <meshStandardMaterial
                color="#060c1a"
                emissive="#0d1530"
                emissiveIntensity={0.3}
                roughness={0.8}
                metalness={0.3}
              />
            </mesh>

            {/* Stepped top (e.g. Wells Fargo) */}
            {b.stepWidth && b.stepHeight && (
              <mesh position={[b.stepX ?? b.x, b.height + b.stepHeight / 2, Z]}>
                <boxGeometry args={[b.stepWidth, b.stepHeight, b.depth * 0.8]} />
                <meshStandardMaterial color="#060c1a" emissive="#0d1530" emissiveIntensity={0.3} roughness={0.8} />
              </mesh>
            )}

            {/* Crown / antenna (IDS, Capella) */}
            {b.crownHeight && b.crownWidth && (
              <mesh position={[b.x, b.height + b.crownHeight / 2, Z]}>
                <boxGeometry args={[b.crownWidth, b.crownHeight, b.crownWidth]} />
                <meshStandardMaterial
                  color="#0d1530"
                  emissive={b.windowColor}
                  emissiveIntensity={0.6}
                  roughness={0.5}
                />
              </mesh>
            )}

            {/* Windows — emissive planes on the near face */}
            {windows.map((w, i) => (
              <mesh key={i} position={[w.x, w.y, w.z]}>
                <planeGeometry args={[0.25, 0.35]} />
                <meshStandardMaterial
                  color={w.color}
                  emissive={w.color}
                  emissiveIntensity={1.2}
                  roughness={0.2}
                />
              </mesh>
            ))}
          </group>
        )
      })}

      {/* Ground-level base strip — dark rectangle connecting buildings to ground */}
      <mesh position={[0, 0.5, Z]} rotation={[0, 0, 0]}>
        <boxGeometry args={[60, 1, 2]} />
        <meshStandardMaterial color="#060c1a" roughness={0.9} />
      </mesh>
    </group>
  )
}
