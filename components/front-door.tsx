"use client"

import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { registerInteractable, unregisterInteractable } from '@/lib/use-interaction'
import { usePlayerStore } from '@/lib/player-store'
import { playSound } from '@/lib/audio'

interface FrontDoorProps {
  // Position of the door interaction zone — should match the house front door location
  position?: [number, number, number]
  onEnterHouse?: () => void
}

export function FrontDoor({ position = [0.9, 1.0, -2.8], onEnterHouse }: FrontDoorProps) {
  const [isNear, setIsNear] = useState(false)
  const { frontDoorUnlocked, showHud } = usePlayerStore()

  useEffect(() => {
    const pos = new THREE.Vector3(position[0], 0, position[2])
    registerInteractable({
      id: 'front-door',
      label: 'Front Door',
      position: pos,
      radius: 2.5,
      onNearby: (near) => setIsNear(near),
      onInteract: () => {
        if (!frontDoorUnlocked) {
          playSound('locked')
          showHud('🔒 Locked. Find the terminal in the yard.', 'locked', 3000)
          return
        }
        playSound('interact')
        // Show enter prompt via HUD store — the page.tsx handles the actual prompt UI
        showHud('__ENTER_PROMPT__', 'info', 30000)
      },
    })
    return () => unregisterInteractable('front-door')
  }, [position, frontDoorUnlocked, showHud])

  // Proximity indicator light — red when locked, green when unlocked and near
  return (
    <group position={[position[0], position[1], position[2]]}>
      {isNear && (
        <pointLight
          color={frontDoorUnlocked ? '#00ff88' : '#ff3333'}
          intensity={1.5}
          distance={3}
          decay={2}
        />
      )}
    </group>
  )
}
