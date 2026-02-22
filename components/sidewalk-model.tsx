"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useRef } from "react"
import { useControls } from "leva"
import { Box3 } from "three"
import type * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"

const SIDEWALK_URL = getModelUrl("sidewalk-1.glb")

export function SidewalkModel() {
  const groupRef = useRef<THREE.Group>(null)
  const hasAligned = useRef(false)
  const { scene } = useGLTF(SIDEWALK_URL)

  // Leva controls for live tuning — lock in final values then remove
  const { posX, posY, posZ, scaleX, scaleY, scaleZ, rotY } = useControls('Sidewalk', {
    posX:  { value: 2.875, min: -20, max: 20,  step: 0.05, label: 'X' },
    posY:  { value: 0.01,  min: -2,  max: 5,   step: 0.01, label: 'Y' },
    posZ:  { value: -9,    min: -30, max: 10,  step: 0.05, label: 'Z' },
    scaleX:{ value: 1,     min: 0.1, max: 20,  step: 0.1,  label: 'Scale X' },
    scaleY:{ value: 1,     min: 0.1, max: 20,  step: 0.1,  label: 'Scale Y' },
    scaleZ:{ value: 1,     min: 0.1, max: 20,  step: 0.1,  label: 'Scale Z' },
    rotY:  { value: 0,     min: -Math.PI, max: Math.PI, step: 0.05, label: 'Rot Y' },
  })

  // Auto-ground the model on first render
  useEffect(() => {
    if (!groupRef.current || hasAligned.current) return
    const frame = requestAnimationFrame(() => {
      if (!groupRef.current) return
      const box = new Box3().setFromObject(groupRef.current)
      if (box.min.y === Infinity) return
      groupRef.current.position.y = posY - box.min.y
      hasAligned.current = true
    })
    return () => cancelAnimationFrame(frame)
  }, [scene])

  return (
    <group
      ref={groupRef}
      position={[posX, posY, posZ]}
      rotation={[0, rotY, 0]}
    >
      <primitive object={scene.clone()} scale={[scaleX, scaleY, scaleZ]} />
    </group>
  )
}

useGLTF.preload(SIDEWALK_URL)
