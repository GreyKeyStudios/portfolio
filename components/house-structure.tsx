"use client"
import { Box, Plane } from "@react-three/drei"

export function HouseStructure() {
  return (
    <group>
      {/* Floor */}
      <Plane args={[30, 30]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#8B7355" />
      </Plane>

      {/* Exterior walls */}
      <group name="exterior-walls">
        {/* Front wall */}
        <Box args={[30, 8, 0.5]} position={[0, 4, -15]}>
          <meshStandardMaterial color="#2C3E50" />
        </Box>

        {/* Back wall */}
        <Box args={[30, 8, 0.5]} position={[0, 4, 15]}>
          <meshStandardMaterial color="#2C3E50" />
        </Box>

        {/* Left wall */}
        <Box args={[0.5, 8, 30]} position={[-15, 4, 0]}>
          <meshStandardMaterial color="#2C3E50" />
        </Box>

        {/* Right wall */}
        <Box args={[0.5, 8, 30]} position={[15, 4, 0]}>
          <meshStandardMaterial color="#2C3E50" />
        </Box>
      </group>

      {/* Interior walls */}
      <group name="interior-walls">
        {/* Kitchen divider */}
        <Box args={[8, 8, 0.3]} position={[-8, 4, -5]}>
          <meshStandardMaterial color="#34495E" />
        </Box>

        {/* Office divider */}
        <Box args={[8, 8, 0.3]} position={[8, 4, -5]}>
          <meshStandardMaterial color="#34495E" />
        </Box>

        {/* Hallway divider */}
        <Box args={[0.3, 8, 15]} position={[0, 4, 5]}>
          <meshStandardMaterial color="#34495E" />
        </Box>
      </group>

      {/* Ceiling */}
      <Plane args={[30, 30]} rotation={[Math.PI / 2, 0, 0]} position={[0, 8, 0]}>
        <meshStandardMaterial color="#ECF0F1" />
      </Plane>
    </group>
  )
}
