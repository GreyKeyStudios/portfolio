"use client"

interface StreetLampProps {
  position: [number, number, number]
  rotation?: [number, number, number]
}

export function StreetLamp({ position, rotation = [0, 0, 0] }: StreetLampProps) {
  const ironColor = "#1e2a4a"
  const lampColor = "#0d1530"
  const glowColor = "#becdf6"

  return (
    <group position={position} rotation={rotation}>
      {/* Base plate */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.4, 0.1, 0.4]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
      </mesh>

      {/* Pole — tapered cylinder */}
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 4, 8]} />
        <meshStandardMaterial color={ironColor} roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Horizontal arm extending toward street */}
      <mesh position={[0, 4.2, -0.4]}>
        <boxGeometry args={[0.06, 0.06, 0.8]} />
        <meshStandardMaterial color={ironColor} roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Lamp housing */}
      <mesh position={[0, 4.05, -0.8]}>
        <boxGeometry args={[0.35, 0.2, 0.35]} />
        <meshStandardMaterial color={lampColor} roughness={0.5} />
      </mesh>

      {/* Lamp glass — emissive glow */}
      <mesh position={[0, 3.95, -0.8]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={1.5}
          roughness={0.1}
        />
      </mesh>

      {/* Point light from lamp — cool blue periwinkle */}
      <pointLight
        position={[0, 3.9, -0.8]}
        color={glowColor}
        intensity={1.5}
        distance={12}
        decay={2}
      />
    </group>
  )
}
