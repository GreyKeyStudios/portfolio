"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { getModelUrl } from "@/lib/model-url"
import { registerInteractable, unregisterInteractable } from "@/lib/use-interaction"
import { usePlayerStore } from "@/lib/player-store"
import { playSound } from "@/lib/audio"

const MODEL_URL = getModelUrl("home-office-furniture.glb")

interface HomeOfficeRoomProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

// Desk faces -X locally (built facing the chair at local +Z, rotated -90° here
// so that direction points toward the room's west wall) — position/rotation
// default to roughly centered against Home Office's west wall (room spans
// X0-9..X0-1.2, Z6..14; door is on the east side, so the desk faces away from it).
export function HomeOfficeRoom({ position = [293.5, 3.2, 10], rotation = [0, -Math.PI / 2, 0] }: HomeOfficeRoomProps) {
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
