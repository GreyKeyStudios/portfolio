"use client"

import { useMemo, useRef, useEffect } from "react"
import { InstancedMesh, Object3D } from "three"

const POST_COLOR = "#1e2a4a"
const RAIL_COLOR = "#1e2a4a"

// Confirmed via leva: walkway X=0.9 (door), driveway X=4.0 (garage)
const WALKWAY_CENTER = 0.9   // gap: X=-0.6 to X=2.4
const WALKWAY_HALF = 1.5

const DRIVEWAY_CENTER = 4.0  // gap: X=1.5 to X=6.5
const DRIVEWAY_HALF = 2.5

// Confirmed via leva: fence front line at Z=-16
const FENCE_Z = -16

interface PostPosition {
  x: number
  z: number
  tall?: boolean
}

interface RailSegment {
  x: number
  z: number
  angle: number
}

function FencePosts({ posts }: { posts: PostPosition[] }) {
  return (
    <>
      {posts.map((p, i) => (
        <mesh key={i} position={[p.x, p.tall ? 0.7 : 0.6, p.z]}>
          <boxGeometry args={p.tall ? [0.15, 1.4, 0.15] : [0.12, 1.2, 0.12]} />
          <meshStandardMaterial color={POST_COLOR} roughness={0.7} />
        </mesh>
      ))}
    </>
  )
}

function FenceRails({ segments }: { segments: RailSegment[] }) {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const count = segments.length * 2

  useEffect(() => {
    if (!meshRef.current) return
    let idx = 0
    for (const seg of segments) {
      dummy.position.set(seg.x, 0.35, seg.z)
      dummy.rotation.set(0, seg.angle, 0)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(idx++, dummy.matrix)

      dummy.position.set(seg.x, 0.85, seg.z)
      dummy.rotation.set(0, seg.angle, 0)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(idx++, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [segments, dummy])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1.5, 0.06, 0.06]} />
      <meshStandardMaterial color={RAIL_COLOR} roughness={0.7} />
    </instancedMesh>
  )
}

export function PerimeterFence() {
  const { posts, rails } = useMemo(() => {
    const posts: PostPosition[] = []
    const rails: RailSegment[] = []
    const SPACING = 1.5

    function inGap(x: number) {
      const inW = x > (WALKWAY_CENTER - WALKWAY_HALF) && x < (WALKWAY_CENTER + WALKWAY_HALF)
      const inD = x > (DRIVEWAY_CENTER - DRIVEWAY_HALF) && x < (DRIVEWAY_CENTER + DRIVEWAY_HALF)
      return inW || inD
    }

    for (let x = -15; x <= 15; x += SPACING) {
      if (inGap(x)) continue
      const nearGate =
        Math.abs(x - (WALKWAY_CENTER - WALKWAY_HALF)) < SPACING ||
        Math.abs(x - (WALKWAY_CENTER + WALKWAY_HALF)) < SPACING ||
        Math.abs(x - (DRIVEWAY_CENTER - DRIVEWAY_HALF)) < SPACING ||
        Math.abs(x - (DRIVEWAY_CENTER + DRIVEWAY_HALF)) < SPACING
      posts.push({ x, z: FENCE_Z, tall: nearGate })
      rails.push({ x, z: FENCE_Z, angle: 0 })
    }

    for (let z = FENCE_Z; z <= -1; z += SPACING) {
      posts.push({ x: -15, z })
      rails.push({ x: -15, z, angle: Math.PI / 2 })
    }

    for (let z = FENCE_Z; z <= -1; z += SPACING) {
      posts.push({ x: 15, z })
      rails.push({ x: 15, z, angle: Math.PI / 2 })
    }

    return { posts, rails }
  }, [])

  return (
    <group>
      <FencePosts posts={posts} />
      <FenceRails segments={rails} />
    </group>
  )
}
