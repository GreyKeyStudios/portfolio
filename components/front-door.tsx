"use client"

import { useEffect, useRef, useState } from 'react'
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

  // Stable refs — same pattern as MainTerminal — so onInteract never goes stale
  // and re-registration doesn't happen when frontDoorUnlocked changes (which
  // was causing the door to briefly vanish from the registry and fall back to terminal).
  const frontDoorUnlockedRef = useRef(frontDoorUnlocked)
  const showHudRef = useRef(showHud)
  useEffect(() => { frontDoorUnlockedRef.current = frontDoorUnlocked }, [frontDoorUnlocked])
  useEffect(() => { showHudRef.current = showHud }, [showHud])

  const [px, py, pz] = position

  useEffect(() => {
    const pos = new THREE.Vector3(px, py, pz)
    registerInteractable({
      id: 'front-door',
      label: 'Front Door',
      position: pos,
      // Was requireLook:true — meant the "Press E" hint and the proximity
      // light both stayed invisible until aimed within a 60° cone, so a
      // player standing right next to the door with no feedback had no way
      // to discover that. Proximity-only, matching every other interactable.
      // Also shrunk from 2.0 — see main-terminal.tsx's radius comment, the
      // two zones almost fully overlapped at 2.0 each.
      radius: 0.9,
      onNearby: (near) => setIsNear(near),
      onInteract: () => {
        if (!frontDoorUnlockedRef.current) {
          playSound('locked')
          showHudRef.current('🔒 Locked. Find the terminal in the yard.', 'locked', 3000)
          return
        }
        playSound('interact')
        // TEMP: skip the "Enter the house?" confirmation modal and go straight
        // in. The modal + pointer-lock-release combination was the actual
        // point of failure across several rounds of debugging — bypassing it
        // isolates whether the interior itself works before re-adding the
        // confirmation UX. Re-enable by restoring the __ENTER_PROMPT__ hud
        // message here once that's sorted out.
        usePlayerStore.getState().enterInterior()
      },
    })
    return () => unregisterInteractable('front-door')
  }, [px, py, pz])  // only re-register if position changes

  // Proximity indicator light — red when locked, green when unlocked and near.
  //
  // ALWAYS mounted, dimmed to zero when away. It used to be `{isNear && ...}`,
  // but adding or removing a light changes three.js's lights-state hash, which
  // invalidates the shader program of EVERY material in the scene — all of them
  // recompile on the frame you step into range. Measured at 666ms of frozen
  // frames on the first approach (6 new programs), which is the "lag before the
  // green shows up and E responds". Cost scales with the scene's material count,
  // so it was invisible before the interior existed and awful afterwards.
  //
  // Intensity is a plain uniform — changing it recompiles nothing.
  return (
    <group position={[position[0], position[1], position[2]]}>
      <pointLight
        color={frontDoorUnlocked ? '#00ff88' : '#ff3333'}
        intensity={isNear ? 1.5 : 0}
        distance={3}
        decay={2}
      />
    </group>
  )
}
