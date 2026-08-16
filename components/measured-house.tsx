import { Box } from "@react-three/drei"

export function MeasuredHouse() {
  const colors = {
    // Using more realistic house colors from the reference
    siding: "#f5f5f5", // Light gray siding
    trim: "#2c3e50", // Dark trim
    roof: "#34495e", // Dark roof
    door: "#8b4513", // Brown door
    accent1: "#becdf6",
    accent2: "#86a4f6",
    accent3: "#4e7cf6",
  }

  return (
    <group name="chatgpt-reference-house" position={[0, 0, 0]}>
      {/* Main house body - two story with realistic proportions */}
      <Box args={[10, 6, 8]} position={[1, 3, 0]}>
        <meshStandardMaterial color={colors.siding} />
      </Box>

      {/* Garage - single story, properly attached */}
      <Box args={[6, 4, 8]} position={[-6, 2, 0]}>
        <meshStandardMaterial color={colors.siding} />
      </Box>

      {/* Main house peaked roof */}
      <Box args={[12, 3, 9]} position={[1, 7.5, 0]} rotation={[0, 0, Math.PI / 12]}>
        <meshStandardMaterial color={colors.roof} />
      </Box>
      <Box args={[12, 3, 9]} position={[1, 7.5, 0]} rotation={[0, 0, -Math.PI / 12]}>
        <meshStandardMaterial color={colors.roof} />
      </Box>

      {/* Garage peaked roof */}
      <Box args={[8, 2, 9]} position={[-6, 5.5, 0]} rotation={[0, 0, Math.PI / 12]}>
        <meshStandardMaterial color={colors.roof} />
      </Box>
      <Box args={[8, 2, 9]} position={[-6, 5.5, 0]} rotation={[0, 0, -Math.PI / 12]}>
        <meshStandardMaterial color={colors.roof} />
      </Box>

      {/* Front entrance with columns */}
      <Box args={[4, 5, 2]} position={[1, 2.5, -5]}>
        <meshStandardMaterial color={colors.siding} />
      </Box>

      {/* Entrance columns */}
      <Box args={[0.3, 5, 0.3]} position={[-0.5, 2.5, -5.8]}>
        <meshStandardMaterial color={colors.trim} />
      </Box>
      <Box args={[0.3, 5, 0.3]} position={[2.5, 2.5, -5.8]}>
        <meshStandardMaterial color={colors.trim} />
      </Box>

      {/* Front door - much more prominent */}
      <group name="front-door" position={[1, 1.5, -5.9]}>
        <Box args={[2, 4, 0.2]} position={[0, 0, 0]}>
          <meshStandardMaterial color={colors.door} />
        </Box>

        {/* Door panels */}
        <Box args={[0.8, 1.5, 0.1]} position={[-0.4, 0.8, 0.1]}>
          <meshStandardMaterial color={colors.trim} />
        </Box>
        <Box args={[0.8, 1.5, 0.1]} position={[0.4, 0.8, 0.1]}>
          <meshStandardMaterial color={colors.trim} />
        </Box>
        <Box args={[0.8, 1.5, 0.1]} position={[-0.4, -0.8, 0.1]}>
          <meshStandardMaterial color={colors.trim} />
        </Box>
        <Box args={[0.8, 1.5, 0.1]} position={[0.4, -0.8, 0.1]}>
          <meshStandardMaterial color={colors.trim} />
        </Box>

        {/* Warm door lighting */}
        <pointLight position={[0, 0, 1]} intensity={8} color="#ffa500" distance={10} />
      </group>

      {/* Upper floor windows - much larger and more realistic */}
      <group name="upper-windows">
        <Box args={[2, 2.5, 0.3]} position={[-1, 4.5, -3.9]}>
          <meshStandardMaterial color={colors.trim} />
        </Box>
        <Box args={[1.6, 2.1, 0.2]} position={[-1, 4.5, -3.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>

        <Box args={[2, 2.5, 0.3]} position={[3, 4.5, -3.9]}>
          <meshStandardMaterial color={colors.trim} />
        </Box>
        <Box args={[1.6, 2.1, 0.2]} position={[3, 4.5, -3.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>
      </group>

      {/* Lower floor windows */}
      <group name="lower-windows">
        <Box args={[2, 3, 0.3]} position={[-1, 2, -3.9]}>
          <meshStandardMaterial color={colors.trim} />
        </Box>
        <Box args={[1.6, 2.6, 0.2]} position={[-1, 2, -3.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>

        <Box args={[2, 3, 0.3]} position={[4, 2, -3.9]}>
          <meshStandardMaterial color={colors.trim} />
        </Box>
        <Box args={[1.6, 2.6, 0.2]} position={[4, 2, -3.85]}>
          <meshStandardMaterial color={colors.accent2} />
        </Box>
      </group>

      {/* Large garage door */}
      <group name="garage-door" position={[-6, 2, -3.9]}>
        <Box args={[5, 3.5, 0.3]} position={[0, 0, 0]}>
          <meshStandardMaterial color={colors.trim} />
        </Box>
        <Box args={[4.6, 3.1, 0.2]} position={[0, 0, 0.1]}>
          <meshStandardMaterial color={colors.siding} />
        </Box>

        {/* Garage door panels */}
        {Array.from({ length: 4 }, (_, i) => (
          <Box key={i} args={[4.2, 0.6, 0.1]} position={[0, 1.2 - i * 0.8, 0.15]}>
            <meshStandardMaterial color={colors.trim} />
          </Box>
        ))}
      </group>

      {/* Front steps - more prominent */}
      <Box args={[4.5, 0.3, 1.5]} position={[1, 0.15, -6.5]}>
        <meshStandardMaterial color={colors.trim} />
      </Box>
      <Box args={[4.5, 0.3, 1.5]} position={[1, 0.45, -7]}>
        <meshStandardMaterial color={colors.trim} />
      </Box>
      <Box args={[4.5, 0.3, 1.5]} position={[1, 0.75, -7.5]}>
        <meshStandardMaterial color={colors.trim} />
      </Box>
    </group>
  )
}
