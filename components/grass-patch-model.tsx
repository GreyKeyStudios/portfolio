"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useRef } from "react"
import { Box3 } from "three"
import type * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"

const GRASS_URL = getModelUrl("grass-1.glb")

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
