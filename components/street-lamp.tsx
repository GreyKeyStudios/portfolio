"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import type * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"

const LAMP_URL = getModelUrl("lamppost.glb")

// Model is 4.0 units tall with its origin at the base, so it drops straight onto
// the ground with no bbox alignment. Lantern head sits just under the top.
const LANTERN_Y = 3.7

const GLOW_COLOR = "#becdf6"

interface StreetLampProps {
  position: [number, number, number]
  rotation?: [number, number, number]
}

export function StreetLamp({ position, rotation = [0, 0, 0] }: StreetLampProps) {
  const { scene } = useGLTF(LAMP_URL)

  // Each lamp needs its own object graph, but geometry/materials stay shared.
  const model = useMemo(() => scene.clone(), [scene])

  useEffect(() => {
    model.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((mat) => {
        const std = mat as THREE.MeshStandardMaterial
        // Meshy bakes an emission map for the lantern glass; lift it so the
        // lantern reads as lit against the night scene.
        if (std.emissiveMap) {
          std.emissive.set(GLOW_COLOR)
          std.emissiveIntensity = 2.2
        }
      })
    })
  }, [model])

  return (
    <group position={position} rotation={rotation}>
      <primitive object={model} />

      {/* Cast light from the lantern head — matches the scene's cool palette */}
      <pointLight
        position={[0, LANTERN_Y, 0]}
        color={GLOW_COLOR}
        intensity={1.5}
        distance={12}
        decay={2}
      />
    </group>
  )
}

useGLTF.preload(LAMP_URL)
