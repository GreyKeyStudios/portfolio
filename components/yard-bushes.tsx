"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import type * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"

const BUSH_URL = getModelUrl("bush.glb")

// Meshy's auto_size badly underestimated this one at 0.09 units wide, so the
// per-bush `scale` values below are multiplied up to real yard proportions.
// 18 puts a scale-1.0 bush at ~1.6 units across and ~1.1 tall, matching the
// footprint of the procedural sphere clusters this replaced.
const SCALE_FACTOR = 18

interface BushProps {
  position: [number, number, number]
  scale?: number
  rotation?: number
}

function Bush({ position, scale = 1, rotation = 0 }: BushProps) {
  const { scene } = useGLTF(BUSH_URL)

  // Own object graph per bush; geometry and materials stay shared.
  const model = useMemo(() => scene.clone(), [scene])

  useEffect(() => {
    model.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) mesh.castShadow = true
    })
  }, [model])

  // Origin sits at the base of the model, so it drops straight onto the ground.
  return (
    <primitive
      object={model}
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale * SCALE_FACTOR}
    />
  )
}

export function YardBushes() {
  const { scene } = useGLTF(BUSH_URL)

  // The refined texture is a pale mint green shot in neutral light — far too
  // bright for this night scene. Darken the shared material once.
  useEffect(() => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((mat) => {
        const std = mat as THREE.MeshStandardMaterial
        if (std.color) std.color.multiplyScalar(0.34)
        std.roughness = 0.95
      })
    })
  }, [scene])

  return (
    <group>
      {/* Flanking front door — clear of walkway at X=-1.5 */}
      <Bush position={[-3.5, 0, -5.5]} scale={1.0} rotation={0.4} />
      <Bush position={[-4.5, 0, -5]} scale={0.8} rotation={2.2} />

      {/* Right mid-yard */}
      <Bush position={[8, 0, -8]} scale={1.2} rotation={1.1} />
      <Bush position={[10, 0, -10]} scale={0.9} rotation={3.0} />

      {/* Along right fence baseline (viewer's right = positive X) */}
      <Bush position={[13, 0, -14]} scale={0.7} rotation={0.8} />
      <Bush position={[11, 0, -12]} scale={0.8} rotation={2.6} />

      {/* Along left fence baseline (viewer's left = negative X) */}
      <Bush position={[-13, 0, -14]} scale={0.7} rotation={1.7} />
      <Bush position={[-13, 0, -10]} scale={0.9} rotation={0.2} />
    </group>
  )
}

useGLTF.preload(BUSH_URL)
