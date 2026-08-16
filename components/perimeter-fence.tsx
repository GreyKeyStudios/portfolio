"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useMemo, useRef } from "react"
import { Box3, InstancedMesh, Mesh, Object3D, Vector3 } from "three"
import type * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"

const FENCE_URL = getModelUrl("fence-section.glb")

// ── Openings in the front line ─────────────────────────────────────────────
// Confirmed via leva: walkway centers on X=0.9 (front door), driveway on X=4.0
// (garage). The run between them is the short section separating the two.
export const WALKWAY_GAP: [number, number] = [0.15, 1.65]
export const DRIVEWAY_GAP: [number, number] = [2.5, 5.5]

/**
 * A fenced lot, in world coordinates.
 *
 * Parameterised rather than hard-coded because the secret house needs its own
 * lot and it must be built from the SAME kit as this one. A yard baked into a
 * downloaded model carries its own fence, its own grass and its own lighting,
 * and reads as a prop from a different game the moment you walk up to it — and
 * worse, its fence is a photogrammetry blob you would have to hand-author
 * colliders around, instead of a run whose collision is already solved.
 */
export interface Lot {
  /** Faces the street. */
  frontZ: number
  /** Encloses the back yard. */
  backZ: number
  leftX: number
  rightX: number
  /** Openings cut into the FRONT run only, as [fromX, toX]. */
  frontGaps?: [number, number][]
  /** Skip the back run, for a lot that opens onto an alley or a hill. */
  openBack?: boolean
  /** Overrides TARGET_HEIGHT. */
  height?: number
  /** Overrides the default night-palette iron. */
  color?: number
}

/**
 * The main house's lot. House footprint spans Z=-4.57 to Z=4.64, so backZ
 * leaves ~9 units of back yard.
 */
export const MAIN_LOT: Lot = {
  frontZ: -16,
  backZ: 14,
  leftX: -15,
  rightX: 15,
  frontGaps: [WALKWAY_GAP, DRIVEWAY_GAP],
}

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

/**
 * Cuts the four boundary lines into runs, splitting the front line around its
 * gaps. Gaps are sorted and clamped here so callers can list them in any order
 * without producing a run that doubles back on itself.
 */
function buildRuns(lot: Lot): Run[] {
  const runs: Run[] = []

  const gaps = [...(lot.frontGaps ?? [])]
    .map(([a, b]) => [Math.min(a, b), Math.max(a, b)] as [number, number])
    .filter(([a, b]) => b > lot.leftX && a < lot.rightX)
    .sort((p, q) => p[0] - q[0])

  let cursor = lot.leftX
  for (const [from, to] of gaps) {
    if (from > cursor) runs.push({ axis: "x", at: lot.frontZ, from: cursor, to: from })
    cursor = Math.max(cursor, to)
  }
  if (cursor < lot.rightX) runs.push({ axis: "x", at: lot.frontZ, from: cursor, to: lot.rightX })

  if (!lot.openBack) {
    runs.push({ axis: "x", at: lot.backZ, from: lot.leftX, to: lot.rightX })
  }
  runs.push({ axis: "z", at: lot.leftX, from: lot.frontZ, to: lot.backZ })
  runs.push({ axis: "z", at: lot.rightX, from: lot.frontZ, to: lot.backZ })

  return runs
}

interface Placement {
  x: number
  z: number
  angle: number
  scaleAlong: number
}

export function PerimeterFence({ lot = MAIN_LOT }: { lot?: Lot } = {}) {
  const { scene } = useGLTF(FENCE_URL)
  const meshRef = useRef<InstancedMesh>(null)

  const { geometry, material, sectionW, uniformScale } = useMemo(() => {
    let found: Mesh | null = null
    scene.traverse((c) => {
      if (!found && (c as Mesh).isMesh) found = c as Mesh
    })
    const size = new Box3().setFromObject(scene).getSize(new Vector3())
    const s = (lot.height ?? TARGET_HEIGHT) / (size.y || 1.8)

    let mat = found ? (found.material as THREE.MeshStandardMaterial).clone() : null
    if (mat) {
      // Preview mesh ships untextured; read it as dark painted iron so the fence
      // sits in the night palette as a silhouette.
      mat.color.setHex(lot.color ?? 0x1a2238)
      mat.roughness = 0.65
      mat.metalness = 0.5
    }

    return {
      geometry: found?.geometry ?? null,
      material: mat,
      sectionW: (size.x || 2.188) * s,
      uniformScale: s,
    }
  }, [scene, lot.height, lot.color])

  // Each run is divided into whole sections, then stretched slightly along its
  // own axis so the ends land flush on the run bounds instead of overshooting.
  const placements = useMemo<Placement[]>(() => {
    if (!sectionW) return []
    const out: Placement[] = []
    for (const run of buildRuns(lot)) {
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
  }, [sectionW, lot])

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
