"use client"

interface BushClusterProps {
  position: [number, number, number]
  scale?: number
}

function BushCluster({ position, scale = 1 }: BushClusterProps) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5 * scale, 0]}>
        <sphereGeometry args={[0.8 * scale, 8, 8]} />
        <meshStandardMaterial color="#0d2b22" roughness={0.95} />
      </mesh>
      <mesh position={[0.4 * scale, 0.7 * scale, 0.2 * scale]}>
        <sphereGeometry args={[0.6 * scale, 8, 8]} />
        <meshStandardMaterial color="#112e26" roughness={0.95} />
      </mesh>
      <mesh position={[-0.3 * scale, 0.6 * scale, -0.1 * scale]}>
        <sphereGeometry args={[0.5 * scale, 8, 8]} />
        <meshStandardMaterial color="#0d2b22" roughness={0.95} />
      </mesh>
    </group>
  )
}

export function YardBushes() {
  return (
    <group>
      {/* Flanking front door — clear of walkway at X=-1.5 */}
      <BushCluster position={[-3.5, 0, -5.5]} scale={1.0} />
      <BushCluster position={[-4.5, 0, -5]} scale={0.8} />

      {/* Right mid-yard */}
      <BushCluster position={[8, 0, -8]} scale={1.2} />
      <BushCluster position={[10, 0, -10]} scale={0.9} />

      {/* Along right fence baseline (viewer's right = positive X) */}
      <BushCluster position={[13, 0, -14]} scale={0.7} />
      <BushCluster position={[11, 0, -12]} scale={0.8} />

      {/* Along left fence baseline (viewer's left = negative X) */}
      <BushCluster position={[-13, 0, -14]} scale={0.7} />
      <BushCluster position={[-13, 0, -10]} scale={0.9} />
    </group>
  )
}
