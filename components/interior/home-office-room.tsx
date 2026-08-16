"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"
import { registerInteractable, unregisterInteractable } from "@/lib/use-interaction"
import { usePlayerStore } from "@/lib/player-store"
import { playSound } from "@/lib/audio"
import { placeInRoom } from "@/lib/interior-layout"

const MODEL_URL = getModelUrl("home-office-furniture.glb")

interface HomeOfficeRoomProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

/**
 * Placed FROM THE LAYOUT, not from a literal.
 *
 * The previous default was [293.5, 3.2, 10], with a comment describing the room
 * as spanning "X0-9..X0-1.2, Z6..14". That was true of the old floor plan. The
 * rebuild moved Home Office to the opposite side of the house — it now spans
 * X0+0.98..X0+7.59, Z 0..6.21 — and the furniture stayed where it was, which
 * put it in a different room entirely, through the walls.
 *
 * u=0.78 sets it near the east wall. The room's door is on the WEST side now
 * (it was east before), so the desk sits opposite the door rather than beside
 * it, and the chair still has room behind it.
 */
const DESK_FOOTPRINT: [number, number] = [1.1, 0.9]

export function HomeOfficeRoom({
  position = placeInRoom('home-office', 0.78, 0.5, DESK_FOOTPRINT),
  rotation = [0, -Math.PI / 2, 0],
}: HomeOfficeRoomProps) {
  const { scene } = useGLTF(MODEL_URL)
  const [isNear, setIsNear] = useState(false)
  const { openHomeOffice } = usePlayerStore()
  const openHomeOfficeRef = useRef(openHomeOffice)
  useEffect(() => { openHomeOfficeRef.current = openHomeOffice }, [openHomeOffice])

  const [px, py, pz] = position

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  useEffect(() => {
    const pos = new THREE.Vector3(px, py, pz)
    registerInteractable({
      id: 'home-office-desk',
      label: 'Home Office',
      position: pos,
      radius: 2.2,
      // Proximity-only — see front-door.tsx for why requireLook was dropped.
      onNearby: (near) => setIsNear(near),
      onInteract: () => {
        playSound('interact')
        openHomeOfficeRef.current()
      },
    })
    return () => unregisterInteractable('home-office-desk')
  }, [px, py, pz])

  return (
    <group position={position} rotation={rotation} name="home-office-furniture">
      <primitive object={scene} />
      {/* Always mounted, dimmed to zero when away — see front-door.tsx for why
          conditionally mounting a light costs a full scene-wide shader recompile. */}
      <pointLight color="#00ff88" intensity={isNear ? 1.0 : 0} distance={3} decay={2} />
    </group>
  )
}

useGLTF.preload(MODEL_URL)
