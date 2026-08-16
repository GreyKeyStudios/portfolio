"use client"

import { Box, Cylinder } from "@react-three/drei"

export function HouseExterior() {
  // Brand colors from your palette
  const colors = {
    background: "#000000",
    foreground: "#f6f6f6",
    accent1: "#becdf6",
    accent2: "#86a4f6",
    accent3: "#4e7cf6",
  }

  return (
    <group name="house-exterior" position={[0, 0, 0]}>
      {/* Main house body */}
      <Box args={[12, 6, 8]} position={[0, 3, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Garage */}
      <Box args={[6, 5, 6]} position={[-9, 2.5, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Main roof */}
      <Box args={[14, 0.3, 10]} position={[0, 6.5, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Garage roof */}
      <Box args={[8, 0.3, 8]} position={[-9, 5.5, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Front door with warm lighting */}
      <group name="front-door" position={[0, 2, -3.9]}>
        <Box args={[1.5, 4, 0.2]}>
          <meshStandardMaterial color={colors.background} />
        </Box>
        {/* Door frame */}
        <Box args={[2, 4.5, 0.3]} position={[0, 0.25, -0.1]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        {/* Door arch */}
        <Cylinder args={[1, 1, 0.3]} position={[0, 2.25, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color={colors.accent3} />
        </Cylinder>
        {/* Warm door light */}
        <pointLight position={[0, 0, -0.5]} intensity={2} color="#ffa500" distance={3} />
      </group>

      {/* Upper floor windows */}
      <group name="upper-windows">
        {/* Left upper window */}
        <Box args={[1.5, 1.5, 0.1]} position={[-3, 4.5, -3.95]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>
        <Box args={[1.7, 1.7, 0.2]} position={[-3, 4.5, -4]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        {/* Center upper window */}
        <Box args={[1.5, 1.5, 0.1]} position={[0, 4.5, -3.95]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>
        <Box args={[1.7, 1.7, 0.2]} position={[0, 4.5, -4]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        {/* Right upper window */}
        <Box args={[1.5, 1.5, 0.1]} position={[3, 4.5, -3.95]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>
        <Box args={[1.7, 1.7, 0.2]} position={[3, 4.5, -4]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
      </group>

      {/* Lower floor windows */}
      <group name="lower-windows">
        {/* Left lower window */}
        <Box args={[1.5, 2, 0.1]} position={[-3, 2, -3.95]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>
        <Box args={[1.7, 2.2, 0.2]} position={[-3, 2, -4]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        {/* Right lower window */}
        <Box args={[1.5, 2, 0.1]} position={[3, 2, -3.95]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>
        <Box args={[1.7, 2.2, 0.2]} position={[3, 2, -4]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
      </group>

      {/* Garage door */}
      <Box args={[4.5, 4, 0.1]} position={[-9, 2, -2.95]}>
        <meshStandardMaterial color={colors.background} />
      </Box>
      <Box args={[5, 4.5, 0.2]} position={[-9, 2.25, -3]}>
        <meshStandardMaterial color={colors.accent3} />
      </Box>

      {/* Front steps */}
      <Box args={[3, 0.3, 1]} position={[0, 0.15, -4.5]}>
        <meshStandardMaterial color={colors.accent1} />
      </Box>
      <Box args={[3, 0.3, 1]} position={[0, 0.45, -5]}>
        <meshStandardMaterial color={colors.accent2} />
      </Box>
    </group>
  )
}
