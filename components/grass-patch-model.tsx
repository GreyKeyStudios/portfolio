"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useRef } from "react"
import { Box3 } from "three"
import type * as THREE from "three"

const GRASS_URL = "https://raw.githubusercontent.com/GreyKeyStudios/portfolio/main/public/models/Grass%20Patch.glb"
const GRASS_ALT_URL = "https://raw.githubusercontent.com/GreyKeyStudios/portfolio/main/public/models/grass-1.glb"

interface GrassPatchProps {
  position: [number, number, number]
  scale?: number | [number, number, number]
  rotation?: [number, number, number]
}

function GrassPatchBase({
  url,
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: GrassPatchProps & { url: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const hasAligned = useRef(false)
  const { scene } = useGLTF(url)

  // Auto-ground: drop the model so its lowest point sits on y=position[1]
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

/** Primary grass patch — Grass Patch.glb (Danni Bittman / Poly Pizza CC-BY) */
export function GrassPatch(props: GrassPatchProps) {
  return <GrassPatchBase url={GRASS_URL} {...props} />
}

/** Alternate grass patch — grass-1.glb */
export function GrassPatchAlt(props: GrassPatchProps) {
  return <GrassPatchBase url={GRASS_ALT_URL} {...props} />
}

// Preload both for faster initial render
useGLTF.preload(GRASS_URL)
useGLTF.preload(GRASS_ALT_URL)
