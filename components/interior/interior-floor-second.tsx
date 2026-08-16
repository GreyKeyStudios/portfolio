"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect } from "react"
import type * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"
import { FLOOR_BASE_Y } from "@/lib/interior-layout"

const MODEL_URL = getModelUrl("interior-second.glb")

export function InteriorFloorSecond() {
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
    <group position={[0, FLOOR_BASE_Y.second, 0]} name="interior-second">
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(MODEL_URL)
