"use client"

import { Box, Text } from "@react-three/drei"

export function SimpleMailbox({ position }: { position: [number, number, number] }) {
  const colors = {
    background: "#000000",
    foreground: "#f6f6f6",
    accent3: "#4e7cf6",
  }

  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* Post */}
      <Box args={[0.1, 1.5, 0.1]} position={[0, 0.75, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Mailbox */}
      <Box args={[1, 0.5, 0.4]} position={[0, 1.7, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Sign */}
      <Box args={[1.5, 0.4, 0.05]} position={[0, 1.2, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      <Text position={[0, 1.2, 0.03]} fontSize={0.1} color={colors.foreground} anchorX="center" anchorY="middle">
        the-stack-house
      </Text>
    </group>
  )
}
