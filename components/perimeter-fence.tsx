"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useMemo, useRef } from "react"
import { Box3, InstancedMesh, Mesh, Object3D, Vector3 } from "three"
import type * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"

const FENCE_URL = getModelUrl("fence-section.glb")

// ── Yard boundary ──────────────────────────────────────────────────────────
// Front line faces the street; back line encloses the backyard behind the house.
// House footprint spans Z=-4.57 to Z=4.64, so BACK_Z leaves ~9 units of backyard.
export const FENCE_FRONT_Z = -16
export const FENCE_BACK_Z = 14
export const FENCE_LEFT_X = -15
export const FENCE_RIGHT_X = 15

// ── Openings in the front line ─────────────────────────────────────────────
// Confirmed via leva: walkway centers on X=0.9 (front door), driveway on X=4.0
// (garage). The run between them is the short section separating the two.
export const WALKWAY_GAP: [number, number] = [0.15, 1.65]
export const DRIVEWAY_GAP: [number, number] = [2.5, 5.5]

// The generated section is 1.8 units tall, which would sit above the player's
// 1.7 eye height and wall off the house from the street. Scale to a front-yard
// height instead.
const TARGET_HEIGHT = 1.15

interface Run {
  axis: "x" | "z"
  at: number
  from: number
  to: number
}

const RUNS: Run[] = [
  { axis: "x", at: FENCE_FRONT_Z, from: FENCE_LEFT_X, to: WALKWAY_GAP[0] },
  { axis: "x", at: FENCE_FRONT_Z, from: WALKWAY_GAP[1], to: DRIVEWAY_GAP[0] },
  { axis: "x", at: FENCE_FRONT_Z, from: DRIVEWAY_GAP[1], to: FENCE_RIGHT_X },
  { axis: "x", at: FENCE_BACK_Z, from: FENCE_LEFT_X, to: FENCE_RIGHT_X },
  { axis: "z", at: FENCE_LEFT_X, from: FENCE_FRONT_Z, to: FENCE_BACK_Z },
  { axis: "z", at: FENCE_RIGHT_X, from: FENCE_FRONT_Z, to: FENCE_BACK_Z },
]

interface Placement {
  x: number
  z: number
  angle: number
  scaleAlong: number
}

export function PerimeterFence() {
  const { scene } = useGLTF(FENCE_URL)
  const meshRef = useRef<InstancedMesh>(null)

  const { geometry, material, sectionW, uniformScale } = useMemo(() => {
    let found: Mesh | null = null
    scene.traverse((c) => {
      if (!found && (c as Mesh).isMesh) found = c as Mesh
    })
    const size = new Box3().setFromObject(scene).getSize(new Vector3())
    const s = TARGET_HEIGHT / (size.y || 1.8)

    let mat = found ? (found.material as THREE.MeshStandardMaterial).clone() : null
    if (mat) {
      // Preview mesh ships untextured; read it as dark painted iron so the fence
      // sits in the night palette as a silhouette.
      mat.color.setHex(0x1a2238)
      mat.roughness = 0.65
      mat.metalness = 0.5
    }

    return {
      geometry: found?.geometry ?? null,
      material: mat,
      sectionW: (size.x || 2.188) * s,
      uniformScale: s,
    }
  }, [scene])

  // Each run is divided into whole sections, then stretched slightly along its
  // own axis so the ends land flush on the run bounds instead of overshooting.
  const placements = useMemo<Placement[]>(() => {
    if (!sectionW) return []
    const out: Placement[] = []
    for (const run of RUNS) {
      const span = run.to - run.from
      if (span <= 0) continue
      const n = Math.max(1, Math.round(span / sectionW))
      const step = span / n
      for (let i = 0; i < n; i++) {
        const mid = run.from + step * (i + 0.5)
        out.push({
          x: run.axis === "x" ? mid : run.at,
          z: run.axis === "x" ? run.at : mid,
          angle: run.axis === "x" ? 0 : Math.PI / 2,
          scaleAlong: step / sectionW,
        })
      }
    }
    return out
  }, [sectionW])

  useEffect(() => {
    if (!meshRef.current) return
    const dummy = new Object3D()
    placements.forEach((p, i) => {
      dummy.position.set(p.x, 0, p.z)
      dummy.rotation.set(0, p.angle, 0)
      dummy.scale.set(uniformScale * p.scaleAlong, uniformScale, uniformScale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [placements, uniformScale])

  if (!geometry || !material || placements.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, placements.length]}
      castShadow
      receiveShadow
    />
  )
}

useGLTF.preload(FENCE_URL)
