"use client"

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { registerInteractable, unregisterInteractable } from '@/lib/use-interaction'
import { usePlayerStore } from '@/lib/player-store'
import { playSound } from '@/lib/audio'

interface ExitDoorProps {
  position?: [number, number, number]
}

/** Foyer prop — proximity + E teleports back out to the yard. */
export function ExitDoor({ position = [300, 1.0, -3.8] }: ExitDoorProps) {
  const [isNear, setIsNear] = useState(false)
  const { exitToYard } = usePlayerStore()
  const exitToYardRef = useRef(exitToYard)
  useEffect(() => { exitToYardRef.current = exitToYard }, [exitToYard])

  const [px, py, pz] = position

  useEffect(() => {
    const pos = new THREE.Vector3(px, py, pz)
    registerInteractable({
      id: 'exit-door',
      label: 'Exit to Yard',
      position: pos,
      radius: 2.0,
      // Proximity-only — see front-door.tsx for why requireLook was dropped.
      onNearby: (near) => setIsNear(near),
      onInteract: () => {
        playSound('interact')
        exitToYardRef.current()
      },
    })
    return () => unregisterInteractable('exit-door')
  }, [px, py, pz])

  return (
    <group position={[px, py, pz]}>
      {isNear && (
        <pointLight color="#00ff88" intensity={1.2} distance={3} decay={2} />
      )}
    </group>
  )
}
