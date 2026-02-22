"use client"

export function YardGround() {
  return (
    <group>
      {/* Grass yard — extended so edge disappears into fog */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#0d1f18" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Street / asphalt — also extended */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, -25]}>
        <planeGeometry args={[80, 40]} />
        <meshStandardMaterial color="#0a0d12" roughness={0.5} metalness={0.15} />
      </mesh>

      {/* Road center-line dashes — yellow, running left-right (along X axis) at road mid-line Z=-25 */}
      {[-30, -22, -14, -6, 2, 10, 18, 26].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.002, -25]}>
          <planeGeometry args={[2.5, 0.25]} />
          <meshStandardMaterial color="#c8a820" roughness={0.8} emissive="#c8a820" emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  )
}
