"use client"

import { Box } from "@react-three/drei"

export function DetailedHouse() {
  const colors = {
    background: "#000000",
    foreground: "#f6f6f6",
    accent1: "#becdf6",
    accent2: "#86a4f6",
    accent3: "#4e7cf6",
  }

  return (
    <group name="detailed-house" position={[0, 0, 0]}>
      {/* Foundation */}
      <Box args={[12, 0.3, 8]} position={[0, 0.15, 0]}>
        <meshStandardMaterial color="#2c3e50" />
      </Box>

      {/* Main house - first floor */}
      <Box args={[10, 3, 6]} position={[0, 1.8, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Main house - second floor */}
      <Box args={[10, 2.5, 6]} position={[0, 4.5, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Garage */}
      <Box args={[5, 3.5, 5]} position={[-7.5, 2.05, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Main roof */}
      <Box args={[12, 0.4, 8]} position={[0, 6.2, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Garage roof */}
      <Box args={[7, 0.4, 7]} position={[-7.5, 4.2, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Front entrance area */}
      <Box args={[3, 4, 1.5]} position={[0, 2.3, -3.75]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Front door */}
      <group name="front-door" position={[0, 1.5, -4.4]}>
        {/* Door frame (arched) */}
        <Box args={[2, 3.5, 0.2]} position={[0, 0.25, 0]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        {/* Actual door */}
        <Box args={[1.5, 3, 0.1]} position={[0, 0, 0.1]}>
          <meshStandardMaterial color={colors.background} />
        </Box>

        {/* Door handle */}
        <Box args={[0.05, 0.05, 0.1]} position={[0.6, 0, 0.15]}>
          <meshStandardMaterial color="#ffd700" />
        </Box>

        {/* Warm door lighting */}
        <pointLight position={[0, 0, 0.5]} intensity={3} color="#ffa500" distance={4} />
      </group>

      {/* Front steps */}
      <Box args={[3.5, 0.2, 1]} position={[0, 0.4, -5]}>
        <meshStandardMaterial color={colors.accent2} />
      </Box>
      <Box args={[3.5, 0.2, 1]} position={[0, 0.6, -5.5]}>
        <meshStandardMaterial color={colors.accent2} />
      </Box>

      {/* Upper floor windows */}
      <group name="upper-windows">
        {/* Left upper window */}
        <Box args={[1.8, 1.8, 0.2]} position={[-3, 4.5, -2.9]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[1.4, 1.4, 0.1]} position={[-3, 4.5, -2.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>

        {/* Center upper window */}
        <Box args={[1.8, 1.8, 0.2]} position={[0, 4.5, -2.9]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[1.4, 1.4, 0.1]} position={[0, 4.5, -2.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>

        {/* Right upper window */}
        <Box args={[1.8, 1.8, 0.2]} position={[3, 4.5, -2.9]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[1.4, 1.4, 0.1]} position={[3, 4.5, -2.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>
      </group>

      {/* Lower floor windows */}
      <group name="lower-windows">
        {/* Left lower window */}
        <Box args={[1.8, 2.2, 0.2]} position={[-3.5, 2, -2.9]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[1.4, 1.8, 0.1]} position={[-3.5, 2, -2.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>

        {/* Right lower window */}
        <Box args={[1.8, 2.2, 0.2]} position={[3.5, 2, -2.9]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[1.4, 1.8, 0.1]} position={[3.5, 2, -2.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>
      </group>

      {/* Garage door */}
      <group name="garage-door" position={[-7.5, 1.8, -2.4]}>
        <Box args={[4.2, 3.2, 0.2]} position={[0, 0, 0]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[3.8, 2.8, 0.1]} position={[0, 0, 0.1]}>
          <meshStandardMaterial color={colors.background} />
        </Box>
      </group>

      {/* Window frames/mullions */}
      <group name="window-details">
        {/* Add cross patterns to windows */}
        {/* Upper windows cross bars */}
        <Box args={[1.4, 0.05, 0.05]} position={[-3, 4.5, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[0.05, 1.4, 0.05]} position={[-3, 4.5, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        <Box args={[1.4, 0.05, 0.05]} position={[0, 4.5, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[0.05, 1.4, 0.05]} position={[0, 4.5, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        <Box args={[1.4, 0.05, 0.05]} position={[3, 4.5, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[0.05, 1.4, 0.05]} position={[3, 4.5, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        {/* Lower windows cross bars */}
        <Box args={[1.4, 0.05, 0.05]} position={[-3.5, 2, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[0.05, 1.8, 0.05]} position={[-3.5, 2, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        <Box args={[1.4, 0.05, 0.05]} position={[3.5, 2, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[0.05, 1.8, 0.05]} position={[3.5, 2, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
      </group>

      {/* Roof edge details */}
      <Box args={[12.5, 0.2, 0.3]} position={[0, 6.1, -4.15]}>
        <meshStandardMaterial color={colors.accent3} />
      </Box>
      <Box args={[7.5, 0.2, 0.3]} position={[-7.5, 4.1, -3.65]}>
        <meshStandardMaterial color={colors.accent3} />
      </Box>
    </group>
  )
}
