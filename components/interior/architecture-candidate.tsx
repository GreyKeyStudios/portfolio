"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import { Mesh, MeshStandardMaterial } from "three"
import { FLOOR_BASE_Y, X0, type FloorId } from "@/lib/interior-layout"
import { ENTRY_DOOR } from "@/lib/architecture-details"
import { registerLivingFurniture } from "@/lib/living-furniture"
import { registerDiningFurniture } from "@/lib/dining-furniture"
import { registerKitchenFurniture } from "@/lib/kitchen-furniture"
import { registerPantryFurniture } from "@/lib/pantry-furniture"
import { registerLaundryFurniture } from "@/lib/laundry-furniture"
import { registerMudroomFurniture } from "@/lib/mudroom-furniture"
import { registerHalfBathFurniture } from "@/lib/half-bath-furniture"
import { registerBathroomFurniture } from "@/lib/bathroom-furniture"
import { registerMasterClosetFurniture } from "@/lib/master-closet-furniture"
import { registerOfficeDressing } from "@/lib/office-dressing"
import { registerGuestBedroomFurniture } from "@/lib/guest-bedroom-furniture"
import { registerBedroomFurniture } from "@/lib/bedroom-furniture"
import { registerMechanicalFurniture } from "@/lib/mechanical-furniture"
import { registerBackEntryFurniture } from "@/lib/back-entry-furniture"
import { registerGameRoomFurniture } from "@/lib/game-room-furniture"
import { GameRoomInteractions } from "@/components/interior/game-room-interactions"

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
  useEffect(() => {
    if (floor === 'basement' && version === 'v002') {
      const removeMechanical = registerMechanicalFurniture()
      const removeLaundry = registerLaundryFurniture()
      const removeGameRoom = registerGameRoomFurniture()
      return () => { removeGameRoom(); removeLaundry(); removeMechanical() }
    }
    if (floor === 'ground' && version === 'v002') {
      const removeLiving = registerLivingFurniture()
      const removeDining = registerDiningFurniture()
      const removeKitchen = registerKitchenFurniture()
      const removePantry = registerPantryFurniture()
      const removeMudroom = registerMudroomFurniture()
      const removeBackEntry = registerBackEntryFurniture()
      const removeHalfBath = registerHalfBathFurniture()
      return () => { removeHalfBath(); removeBackEntry(); removeMudroom(); removePantry(); removeKitchen(); removeDining(); removeLiving() }
    }
    if (floor === 'second' && version === 'v002') {
      const removeBathroom = registerBathroomFurniture()
      const removeMasterCloset = registerMasterClosetFurniture()
      const removeOffice = registerOfficeDressing()
      const removeBedroom = registerBedroomFurniture()
      const removeGuestBedroom = registerGuestBedroomFurniture()
      return () => { removeGuestBedroom(); removeBedroom(); removeOffice(); removeMasterCloset(); removeBathroom() }
    }
  }, [floor, version])
  return (
    <group position={[0, FLOOR_BASE_Y[floor], 0]} name={`architecture-${version}-${floor}`}>
      <CandidateAsset url={`/models/interior-${floor}-${version}.glb`} refined={version === 'v002'} />
      {version === 'v002' && (floor === 'ground' || floor === 'second') && (
        <group position={[X0, 0, 0]}><CandidateAsset url={`/models/floor-finishes-${floor}-v002.glb`} /></group>
      )}
      {floor === 'ground' && version === 'v002' && (
        <group position={[X0, 0, 0]}>
          <CandidateAsset url="/models/foyer-client-details-v002.glb" />
          <CandidateAsset url="/models/living-furniture-v002.glb" />
          <CandidateAsset url="/models/dining-furniture-v002.glb" />
          <CandidateAsset url="/models/kitchen-furniture-v002.glb" />
          <CandidateAsset url="/models/pantry-furniture-v002.glb" />
          <CandidateAsset url="/models/back-entry-furniture-v002.glb" />
          <CandidateAsset url="/models/mudroom-furniture-v002.glb" />
          <CandidateAsset url="/models/half-bath-furniture-v002.glb" />
        </group>
      )}
      {floor === 'second' && version === 'v002' && (
        <group position={[X0, 0, 0]}>
          <CandidateAsset url="/models/bathroom-furniture-v002.glb" />
          <CandidateAsset url="/models/master-closet-furniture-v002.glb" />
          <CandidateAsset url="/models/office-dressing-v002.glb" />
          <CandidateAsset url="/models/bedroom-furniture-v002.glb" />
          <CandidateAsset url="/models/guest-bedroom-furniture-v002.glb" />
        </group>
      )}
      {floor === 'basement' && version === 'v002' && (
        <group position={[X0, 0, 0]}>
          <CandidateAsset url="/models/mechanical-furniture-v002.glb" />
          <CandidateAsset url="/models/laundry-furniture-v002.glb" />
          <CandidateAsset url="/models/game-room-furniture-v002.glb" />
          <GameRoomInteractions />
        </group>
      )}
      {floor !== "attic" && (
        <group position={[X0, 0, 0]}>
          <CandidateAsset url={`/models/staircase-${version === 'v002' ? 'v002' : 'v001'}.glb`} />
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
