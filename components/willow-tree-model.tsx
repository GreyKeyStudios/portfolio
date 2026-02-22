"use client"

import { useGLTF } from "@react-three/drei"
import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Box3 } from "three"
import type * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"

const TREE_MODEL_URL = getModelUrl("tree-main.glb")

export function WillowTreeModel({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)
  const hasAligned = useRef(false)
  const { scene } = useGLTF(TREE_MODEL_URL)

  // Auto-ground once on mount only — guard prevents re-firing on parent re-renders
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

  // Gentle swaying animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.02
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <primitive object={scene.clone()} scale={[5, 5, 5]} />
    </group>
  )
}

// Preload the tree model for better performance
useGLTF.preload(TREE_MODEL_URL)
