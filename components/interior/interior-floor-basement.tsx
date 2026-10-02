"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect } from "react"
import type * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"
import { FLOOR_BASE_Y } from "@/lib/interior-layout"

const MODEL_URL = getModelUrl("interior-basement.glb")

export function InteriorFloorBasement() {
  const { scene } = useGLTF(MODEL_URL)

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  return (
    <group position={[0, FLOOR_BASE_Y.basement, 0]} name="interior-basement">
      <primitive object={scene} />
    </group>
  )
}

// No module-level useGLTF.preload: this legacy shell is only shown with
// ?architecture=legacy, and preloading at import fetched it for every visitor.
