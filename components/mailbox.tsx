"use client"

import { useState } from "react"
import { Box, Text, Html } from "@react-three/drei"

export function Mailbox({ position }: { position: [number, number, number] }) {
  const [showMessage, setShowMessage] = useState(false)

  const colors = {
    background: "#000000",
    foreground: "#f6f6f6",
    accent1: "#becdf6",
    accent2: "#86a4f6",
    accent3: "#4e7cf6",
  }

  return (
    <group position={position} name="mailbox">
      {/* Mailbox post */}
      <Box args={[0.1, 2, 0.1]} position={[0, 1, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Mailbox body */}
      <Box args={[1.5, 0.8, 0.6]} position={[0, 2.2, 0]} onClick={() => setShowMessage(!showMessage)}>
        <meshStandardMaterial color={colors.background} />
      </Box>

      {/* Mailbox frame */}
      <Box args={[1.6, 0.9, 0.7]} position={[0, 2.2, 0]}>
        <meshStandardMaterial color={colors.accent3} />
      </Box>

      {/* House sign */}
      <Box args={[2, 0.6, 0.1]} position={[0, 1.5, 0]}>
        <meshStandardMaterial color={colors.background} />
      </Box>
      <Box args={[2.1, 0.7, 0.2]} position={[0, 1.5, -0.05]}>
        <meshStandardMaterial color={colors.accent3} />
      </Box>

      <Text
        position={[0, 1.5, 0.1]}
        fontSize={0.15}
        color={colors.foreground}
        anchorX="center"
        anchorY="middle"
        font="/fonts/monospace"
      >
        the-stack-house
      </Text>

      {showMessage && (
        <Html position={[0, 3, 0]} center>
          <div
            className="bg-white p-3 rounded shadow-lg text-sm max-w-48 border-2"
            style={{ borderColor: colors.accent3 }}
          >
            <div className="font-bold mb-2">📬 Welcome!</div>
            <div className="text-gray-600">Ready to explore The Stack House?</div>
            <button
              className="mt-2 px-2 py-1 rounded text-white text-xs"
              style={{ backgroundColor: colors.accent3 }}
              onClick={() => setShowMessage(false)}
            >
              Close
            </button>
          </div>
        </Html>
      )}
    </group>
  )
}
