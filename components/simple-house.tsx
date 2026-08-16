"use client"

import { Box } from "@react-three/drei"

export function SimpleHouse() {
  // Your brand colors
  const colors = {
    background: "#000000",
    foreground: "#f6f6f6",
    accent1: "#becdf6",
    accent2: "#86a4f6",
    accent3: "#4e7cf6",
  }

  return (
    <group name="house" position={[0, 0, 0]}>
      {/* Main house body */}
      <Box args={[8, 4, 6]} position={[0, 2, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Garage */}
      <Box args={[4, 3, 4]} position={[-6, 1.5, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Roof */}
      <Box args={[9, 0.2, 7]} position={[0, 4.2, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Garage roof */}
      <Box args={[5, 0.2, 5]} position={[-6, 3.2, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Front door */}
      <Box args={[1, 2.5, 0.1]} position={[0, 1.25, -2.95]}>
        <meshStandardMaterial color={colors.accent3} />
      </Box>

      {/* Windows with blue frames */}
      <Box args={[1.2, 1.2, 0.1]} position={[-2.5, 2.5, -2.95]}>
        <meshStandardMaterial color={colors.accent2} />
      </Box>
      <Box args={[1.2, 1.2, 0.1]} position={[2.5, 2.5, -2.95]}>
        <meshStandardMaterial color={colors.accent2} />
      </Box>

      {/* Lower windows */}
      <Box args={[1.2, 1.5, 0.1]} position={[-2.5, 1.5, -2.95]}>
        <meshStandardMaterial color={colors.accent2} />
      </Box>
      <Box args={[1.2, 1.5, 0.1]} position={[2.5, 1.5, -2.95]}>
        <meshStandardMaterial color={colors.accent2} />
      </Box>

      {/* Garage door */}
      <Box args={[3, 2.5, 0.1]} position={[-6, 1.25, -1.95]}>
        <meshStandardMaterial color={colors.accent3} />
      </Box>

      {/* Door light */}
      <pointLight position={[0, 2, -2.5]} intensity={1} color="#ffa500" />
    </group>
  )
}
