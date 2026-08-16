"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useRef } from "react"
import { Box3 } from "three"
import type * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"

// Stylized low-poly patch (8.5k tris) — the photoreal grass-1.glb was 130MB and
// bottomed out at ~137k tris per patch under decimation, too heavy for scatter.
const GRASS_URL = getModelUrl("grass-patch.glb")

interface GrassPatchProps {
  position: [number, number, number]
  scale?: number | [number, number, number]
  rotation?: [number, number, number]
}

export function GrassPatch({
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: GrassPatchProps) {
  const groupRef = useRef<THREE.Group>(null)
  const hasAligned = useRef(false)
  const { scene } = useGLTF(GRASS_URL)

  // The GLB ships flat daylight greens (no texture map, so color IS the shade).
  // Darken toward the scene's night palette once — materials are shared across
  // every cloned patch, so this runs on the source and applies to all of them.
  useEffect(() => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m) => {
        const std = m as THREE.MeshStandardMaterial
        if (!std.color) return
        std.color.multiplyScalar(0.28)
        std.roughness = 0.95
      })
    })
  }, [scene])

  // Auto-ground: drop the model so its lowest point sits flush on the ground
  useEffect(() => {
    if (!groupRef.current || hasAligned.current) return
    const frame = requestAnimationFrame(() => {
      if (!groupRef.current) return
      const box = new Box3().setFromObject(groupRef.current)
      if (box.min.y === Infinity) return
      groupRef.current.position.y = position[1] - box.min.y
      hasAligned.current = true
    })
    return () => cancelAnimationFrame(frame)
  }, [scene]) // position intentionally excluded — only align once on mount

  const scaleArr: [number, number, number] = Array.isArray(scale)
    ? (scale as [number, number, number])
    : [scale, scale, scale]

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]} rotation={rotation}>
      <primitive object={scene.clone()} scale={scaleArr} />
    </group>
  )
}

useGLTF.preload(GRASS_URL)
