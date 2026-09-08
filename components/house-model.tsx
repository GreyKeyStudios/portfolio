"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import type * as THREE from "three"
import { Box3 } from "three"
import { getModelUrl } from "@/lib/model-url"

const HOUSE_MODEL_URL = getModelUrl("house-main-optimized.glb")
const USE_PLACEHOLDER = false

function PlaceholderHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={[position[0], position[1] + 2, position[2]]}>
      {/* Main house body */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[8, 4, 6]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 5, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[6, 2, 4]} />
        <meshStandardMaterial color="#a0522d" />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1, 3.1]}>
        <boxGeometry args={[1.5, 2.5, 0.2]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      {/* Windows */}
      <mesh position={[-2, 2, 3.1]}>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshStandardMaterial color="#87ceeb" />
      </mesh>
      <mesh position={[2, 2, 3.1]}>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshStandardMaterial color="#87ceeb" />
      </mesh>
    </group>
  )
}

export function HouseModel({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const { scene } = useGLTF(HOUSE_MODEL_URL)

  // The model is scaled by eight below. Derive its ground offset directly from
  // the loaded GLTF instead of measuring the mounted group a few frames later.
  // The old two-frame measurement could race with mounting/HMR and leave the
  // house missing or below grade until a refresh.
  const groundY = useMemo(() => {
    // Measure a detached clone so a previous React mount cannot leak a parent
    // transform into the result during Strict Mode or hot reload.
    const measurement = scene.clone(true)
    measurement.updateMatrixWorld(true)
    const bounds = new Box3().setFromObject(measurement)
    return bounds.min.y === Infinity ? position[1] : position[1] - bounds.min.y * 8
  }, [scene, position[1]])

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  if (USE_PLACEHOLDER) {
    return <PlaceholderHouse position={position} />
  }

  return (
    <group
      position={[position[0], groundY, position[2]]}
      name="stack-house-model"
      scale={[8, 8, 8]}
      rotation={[0, Math.PI, 0]}
    >
      <primitive object={scene} />
    </group>
  )
}

if (!USE_PLACEHOLDER && typeof window !== "undefined") {
  useGLTF.preload(HOUSE_MODEL_URL)
}
