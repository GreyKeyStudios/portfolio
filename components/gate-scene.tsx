"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { Suspense, useMemo, useRef } from "react"
import * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"

const MODEL_URL = getModelUrl("house-main-optimized.glb")

function GateHouse() {
  const group = useRef<THREE.Group>(null)
  const { scene } = useGLTF(MODEL_URL)
  const { viewport } = useThree()

  const model = useMemo(() => {
    const clone = scene.clone(true)
    const bounds = new THREE.Box3().setFromObject(clone)
    const size = bounds.getSize(new THREE.Vector3())
    const scale = 4.5 / Math.max(size.x, size.y, size.z)
    clone.scale.setScalar(scale)
    const scaledBounds = new THREE.Box3().setFromObject(clone)
    const center = scaledBounds.getCenter(new THREE.Vector3())
    clone.position.set(-center.x, -scaledBounds.min.y - 1.85, -center.z)
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true
    })
    return clone
  }, [scene])

  useFrame(({ pointer }, delta) => {
    if (!group.current) return
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, -0.28 + pointer.x * 0.035, 2.2, delta)
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, pointer.y * 0.018, 2.2, delta)
  })

  const mobile = viewport.width < 7
  return (
    <group ref={group} position={[mobile ? 0.4 : 0.1, mobile ? -0.12 : 0.18, 0]} rotation={[0, -0.28, 0]} scale={mobile ? 0.9 : 1.08}>
      <primitive object={model} />
      <pointLight position={[-0.6, 0.12, 2.2]} color="#285eff" intensity={11} distance={4} decay={2.2} />
      <pointLight position={[0.35, -0.25, 2.35]} color="#d4aa63" intensity={1.5} distance={2.1} decay={2} />
    </group>
  )
}

export function GateScene() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.15, 5.4], fov: 39 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} shadows>
      <ambientLight color="#0c1630" intensity={0.19} />
      <directionalLight position={[-4, 5, 5]} color="#3154a8" intensity={0.58} castShadow />
      <directionalLight position={[4, 2, -2]} color="#10182b" intensity={0.8} />
      <Suspense fallback={null}><GateHouse /></Suspense>
    </Canvas>
  )
}

if (typeof window !== "undefined") useGLTF.preload(MODEL_URL)
