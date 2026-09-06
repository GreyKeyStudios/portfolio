"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import { Mesh, MeshStandardMaterial } from "three"
import { FLOOR_BASE_Y, X0, type FloorId } from "@/lib/interior-layout"
import { ENTRY_DOOR } from "@/lib/architecture-details"

type InteriorFloor = Exclude<FloorId, "yard">

function CandidateAsset({ url, refined = false }: { url: string; refined?: boolean }) {
  const { scene } = useGLTF(url)
  const copy = useMemo(() => {
    const result = scene.clone(true)
    const ownedMaterials: MeshStandardMaterial[] = []
    result.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (refined && child.material instanceof MeshStandardMaterial) {
          child.material = child.material.clone()
          ownedMaterials.push(child.material)
          if (child.material.name === 'wall') child.material.color.setRGB(.58, .57, .54)
          if (child.material.name === 'trim') child.material.color.setRGB(.68, .65, .59)
        }
      }
    })
    return { scene: result, ownedMaterials }
  }, [scene, refined])
  useEffect(() => () => copy.ownedMaterials.forEach(material => material.dispose()), [copy])
  return <primitive object={copy.scene} />
}

/** Opt-in architecture review. Asset URLs stay paired with this checkout. */
export function ArchitectureCandidate({ floor, version = 'v001' }: { floor: InteriorFloor; version?: string }) {
  return (
    <group position={[0, FLOOR_BASE_Y[floor], 0]} name={`architecture-${version}-${floor}`}>
      <CandidateAsset url={`/models/interior-${floor}-${version}.glb`} refined={version === 'v002'} />
      {floor === 'ground' && version === 'v002' && (
        <group position={[X0, 0, 0]}><CandidateAsset url="/models/foyer-client-details-v002.glb" /></group>
      )}
      {floor !== "attic" && (
        <group position={[X0, 0, 0]}>
          <CandidateAsset url="/models/staircase-v001.glb" />
        </group>
      )}
    </group>
  )
}

export function AtticGuards() {
  return <group position={[X0, FLOOR_BASE_Y.attic, 0]}><CandidateAsset url="/models/attic-guards-v002.glb" /></group>
}

export function EntryDoorModel() {
  return <group position={[ENTRY_DOOR.centerX, FLOOR_BASE_Y.ground, 0]}><CandidateAsset url="/models/entry-door-v002.glb" /></group>
}
