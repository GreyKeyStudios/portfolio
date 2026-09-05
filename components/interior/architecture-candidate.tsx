"use client"

import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import { Mesh } from "three"
import { FLOOR_BASE_Y, X0, type FloorId } from "@/lib/interior-layout"

type InteriorFloor = Exclude<FloorId, "yard">

function CandidateAsset({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const copy = useMemo(() => {
    const result = scene.clone(true)
    result.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return result
  }, [scene])
  return <primitive object={copy} />
}

/** Opt-in architecture review. Asset URLs stay paired with this checkout. */
export function ArchitectureCandidate({ floor }: { floor: InteriorFloor }) {
  return (
    <group position={[0, FLOOR_BASE_Y[floor], 0]} name={`architecture-v001-${floor}`}>
      <CandidateAsset url={`/models/interior-${floor}-v001.glb`} />
      {floor !== "attic" && (
        <group position={[X0, 0, 0]}>
          <CandidateAsset url="/models/staircase-v001.glb" />
        </group>
      )}
    </group>
  )
}
