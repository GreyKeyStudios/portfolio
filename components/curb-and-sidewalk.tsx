"use client"

export function CurbAndSidewalk() {
  return (
    <group>
      {/* Walkway + Driveway — merged into one continuous slab to avoid gap */}
      {/* Spans X=-0.2 (walkway left edge) to X=5.95 (driveway right edge) → width=6.15, center=2.875 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.875, 0.01, -9]}>
        <planeGeometry args={[6.15, 14]} />
        <meshStandardMaterial color="#151a28" roughness={0.9} />
      </mesh>

      {/* Sidewalk strip — near edge flush with fence at Z=-16, depth=2.5 → center Z=-17.25, runs Z=-16 to Z=-18.5 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -17.25]}>
        <planeGeometry args={[40, 2.5]} />
        <meshStandardMaterial color="#1a2035" roughness={0.9} />
      </mesh>

      {/* Curb — at street-side edge of sidewalk Z=-18.5 */}
      <mesh position={[0, 0.1, -18.5]}>
        <boxGeometry args={[40, 0.2, 0.3]} />
        <meshStandardMaterial color="#222840" roughness={0.85} />
      </mesh>
    </group>
  )
}
