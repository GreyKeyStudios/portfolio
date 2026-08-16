"use client"

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { registerInteractable, unregisterInteractable } from '@/lib/use-interaction'
import { usePlayerStore } from '@/lib/player-store'
import { playSound } from '@/lib/audio'

interface DoorPlaceholderProps {
  id: string
  label: string
  position: [number, number, number]
}

/** A small glowing marker for a room that isn't built out yet — proximity + E shows a "still being built" HUD message. */
export function DoorPlaceholder({ id, label, position }: DoorPlaceholderProps) {
  const [isNear, setIsNear] = useState(false)
  const { showHud } = usePlayerStore()
  const showHudRef = useRef(showHud)
  useEffect(() => { showHudRef.current = showHud }, [showHud])

  const [px, py, pz] = position

  useEffect(() => {
    const pos = new THREE.Vector3(px, py, pz)
    registerInteractable({
      id: `door-placeholder-${id}`,
      label,
      position: pos,
      radius: 2.0,
      // Proximity-only — see front-door.tsx for why requireLook was dropped.
      onNearby: (near) => setIsNear(near),
      onInteract: () => {
        playSound('locked')
        showHudRef.current(`🚧 ${label} — still being built.`, 'locked', 3000)
      },
    })
    return () => unregisterInteractable(`door-placeholder-${id}`)
  }, [id, label, px, py, pz])

  return (
    <group position={[px, py, pz]}>
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color="#ff6666"
          emissive="#ff6666"
          emissiveIntensity={isNear ? 1.2 : 0.6}
          roughness={0.3}
        />
      </mesh>
      <pointLight color="#ff6666" intensity={isNear ? 1.0 : 0.4} distance={3} decay={2} />
    </group>
  )
}
