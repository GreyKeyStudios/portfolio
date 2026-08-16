"use client"

import { Box } from "@react-three/drei"

export function AccurateHouse() {
  const colors = {
    background: "#000000",
    foreground: "#f6f6f6",
    accent1: "#becdf6",
    accent2: "#86a4f6",
    accent3: "#4e7cf6",
  }

  return (
    <group name="accurate-house" position={[0, 0, 0]}>
      {/* Main house body - two story */}
      <Box args={[8, 5, 6]} position={[1, 2.5, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Garage - single story, attached left */}
      <Box args={[4, 3, 5]} position={[-4, 1.5, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Main house triangular roof */}
      <Box args={[9, 2, 7]} position={[1, 6, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Garage triangular roof */}
      <Box args={[5, 1.5, 6]} position={[-4, 3.75, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Front entrance projection */}
      <Box args={[2.5, 4, 1.5]} position={[1, 2, -3.75]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Front entrance roof */}
      <Box args={[3, 1, 2]} position={[1, 4.5, -3.75]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Front door - arched */}
      <group name="front-door" position={[1, 1.5, -4.4]}>
        {/* Arched door frame */}
        <Box args={[1.8, 3, 0.2]} position={[0, 0, 0]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        {/* Door */}
        <Box args={[1.4, 2.5, 0.1]} position={[0, -0.25, 0.1]}>
          <meshStandardMaterial color={colors.background} />
        </Box>

        {/* Warm door light */}
        <pointLight position={[0, 0, 0.5]} intensity={4} color="#ffa500" distance={6} />
      </group>

      {/* Front steps */}
      <Box args={[3, 0.2, 1]} position={[1, 0.4, -5]}>
        <meshStandardMaterial color={colors.accent2} />
      </Box>
      <Box args={[3, 0.2, 1]} position={[1, 0.6, -5.5]}>
        <meshStandardMaterial color={colors.accent2} />
      </Box>

      {/* Upper floor windows - main house */}
      <group name="upper-windows">
        {/* Left upper window */}
        <Box args={[1.2, 1.2, 0.2]} position={[-1, 4, -2.9]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[1, 1, 0.1]} position={[-1, 4, -2.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>

        {/* Center upper window */}
        <Box args={[1.2, 1.2, 0.2]} position={[2, 4, -2.9]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[1, 1, 0.1]} position={[2, 4, -2.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>

        {/* Right upper window */}
        <Box args={[1.2, 1.2, 0.2]} position={[4, 4, -2.9]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[1, 1, 0.1]} position={[4, 4, -2.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>
      </group>

      {/* Lower floor windows - main house */}
      <group name="lower-windows">
        {/* Left lower window */}
        <Box args={[1.2, 1.5, 0.2]} position={[-1, 2, -2.9]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[1, 1.3, 0.1]} position={[-1, 2, -2.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>

        {/* Right lower window */}
        <Box args={[1.2, 1.5, 0.2]} position={[4, 2, -2.9]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[1, 1.3, 0.1]} position={[4, 2, -2.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>
      </group>

      {/* Garage door */}
      <group name="garage-door" position={[-4, 1.5, -2.4]}>
        <Box args={[3.5, 2.5, 0.2]} position={[0, 0, 0]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[3.2, 2.2, 0.1]} position={[0, 0, 0.1]}>
          <meshStandardMaterial color={colors.background} />
        </Box>
      </group>

      {/* Window cross patterns */}
      <group name="window-crosses">
        {/* Upper window crosses */}
        <Box args={[1, 0.03, 0.03]} position={[-1, 4, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[0.03, 1, 0.03]} position={[-1, 4, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        <Box args={[1, 0.03, 0.03]} position={[2, 4, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[0.03, 1, 0.03]} position={[2, 4, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        <Box args={[1, 0.03, 0.03]} position={[4, 4, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[0.03, 1, 0.03]} position={[4, 4, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        {/* Lower window crosses */}
        <Box args={[1, 0.03, 0.03]} position={[-1, 2, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[0.03, 1.3, 0.03]} position={[-1, 2, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>

        <Box args={[1, 0.03, 0.03]} position={[4, 2, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
        <Box args={[0.03, 1.3, 0.03]} position={[4, 2, -2.8]}>
          <meshStandardMaterial color={colors.accent3} />
        </Box>
      </group>
    </group>
  )
}
