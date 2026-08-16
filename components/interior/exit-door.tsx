"use client"

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { registerInteractable, unregisterInteractable } from '@/lib/use-interaction'
import { usePlayerStore } from '@/lib/player-store'
import { playSound } from '@/lib/audio'
import { FOYER_EXIT_POINT } from '@/lib/interior-layout'

interface ExitDoorProps {
  position?: [number, number, number]
}

/**
 * Foyer prop — proximity + E teleports back out to the yard.
 *
 * The default comes from the layout, NOT a literal. It used to be [300, 1, -3.8],
 * which the floor-plan rebuild left stranded outside the building and made the
 * house impossible to leave. See FOYER_EXIT_POINT.
 */
export function ExitDoor({ position = FOYER_EXIT_POINT }: ExitDoorProps) {
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
      // 1.3, not 2.0: the trigger sits at the front door and the spawn is 1.6
      // units behind it, so a wider radius would greet you with "Exit to Yard"
      // the instant you walked in.
      radius: 1.3,
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
