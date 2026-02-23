"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useRef } from "react"
import type * as THREE from "three"
import { Box3 } from "three"
import { getModelUrl } from "@/lib/model-url"

const HOUSE_MODEL_URL = getModelUrl("house-main.glb")
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
  const houseRef = useRef<THREE.Group>(null)
  const hasAligned = useRef(false)
  const { scene } = useGLTF(HOUSE_MODEL_URL)

  useEffect(() => {
    if (!houseRef.current || hasAligned.current) return

    // Try to align + measure. Retries with increasing delay until geometry is ready.
    let timer: ReturnType<typeof setTimeout>

    function tryAlign(attempt: number) {
      if (!houseRef.current) return
      const box = new Box3().setFromObject(houseRef.current)

      if (box.min.y === Infinity || box.min.y === box.max.y) {
        // Geometry not ready yet — retry up to 10 times
        if (attempt < 10) {
          timer = setTimeout(() => tryAlign(attempt + 1), 200)
        } else {
          console.warn('[house] bbox never resolved after 10 attempts')
        }
        return
      }

      houseRef.current.position.y = position[1] + (-box.min.y)
      hasAligned.current = true

      // ── COLLIDER CALIBRATION LOG — paste these into lib/colliders.ts ──────
      const worldBox = new Box3().setFromObject(houseRef.current)
      console.log('%c[house] COLLIDER BOUNDS — paste into lib/colliders.ts:', 'color:#00ff88;font-weight:bold')
      console.log(`  minX: ${worldBox.min.x.toFixed(3)},  maxX: ${worldBox.max.x.toFixed(3)}`)
      console.log(`  minZ: ${worldBox.min.z.toFixed(3)},  maxZ: ${worldBox.max.z.toFixed(3)}`)
      console.log(`  minY: ${worldBox.min.y.toFixed(3)},  maxY: ${worldBox.max.y.toFixed(3)}`)
      console.log('  Full object:', {
        minX: worldBox.min.x.toFixed(3),
        maxX: worldBox.max.x.toFixed(3),
        minZ: worldBox.min.z.toFixed(3),
        maxZ: worldBox.max.z.toFixed(3),
      })
      // ─────────────────────────────────────────────────────────────────────
    }

    // Start after 2 rAFs (original approach) then fall back to polling
    let f1: number, f2: number
    f1 = requestAnimationFrame(() => {
      f2 = requestAnimationFrame(() => tryAlign(0))
    })

    return () => {
      cancelAnimationFrame(f1)
      cancelAnimationFrame(f2)
      clearTimeout(timer)
    }
  }, [scene]) // position intentionally excluded — only align once on mount

  if (USE_PLACEHOLDER) {
    return <PlaceholderHouse position={position} />
  }

  return (
    <group
      ref={houseRef}
      position={[position[0], position[1], position[2]]}
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
