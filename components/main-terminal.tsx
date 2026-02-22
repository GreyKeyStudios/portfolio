"use client"

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { registerInteractable, unregisterInteractable } from '@/lib/use-interaction'
import { usePlayerStore } from '@/lib/player-store'
import { playSound } from '@/lib/audio'

interface MainTerminalProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export function MainTerminal({ position = [-0.65, 0, -4.40], rotation = [0, 0, 0] }: MainTerminalProps) {
  const [isNear, setIsNear] = useState(false)
  const [screenGlow, setScreenGlow] = useState(0.8)
  const { unlockFrontDoor, frontDoorUnlocked, showHud, completedEasterEggs } = usePlayerStore()
  const glowRef = useRef(0.8)
  const dirRef = useRef(1)

  const [px, py, pz] = position
  const [rx, ry, rz] = rotation

  // Idle screen pulse animation
  useFrame((_, delta) => {
    glowRef.current += dirRef.current * delta * 0.4
    if (glowRef.current > 0.6) dirRef.current = -1
    if (glowRef.current < 0.2) dirRef.current = 1
    setScreenGlow(glowRef.current)
  })

  useEffect(() => {
    const pos = new THREE.Vector3(px, py, pz)
    registerInteractable({
      id: 'main-terminal',
      label: 'Terminal',
      position: pos,
      radius: 3.5,
      onNearby: (near) => setIsNear(near),
      onInteract: () => {
        if (frontDoorUnlocked) {
          playSound('interact')
          showHud('Front door is already unlocked. Head inside!', 'info', 3000)
          return
        }
        playSound('unlock')
        unlockFrontDoor()
        showHud('>> FRONT DOOR UNLOCKED <<  Head to the front door to enter.', 'success', 5000)
      },
    })
    return () => unregisterInteractable('main-terminal')
  }, [px, py, pz, frontDoorUnlocked, unlockFrontDoor, showHud, completedEasterEggs])

  return (
    <group position={[px, py, pz]} rotation={[rx, ry, rz]}>
      {/* Base / pedestal */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.6, 8]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Terminal body */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.55, 0.45, 0.12]} />
        <meshStandardMaterial color="#0f0f23" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Screen */}
      <mesh position={[0, 0.88, 0.065]}>
        <boxGeometry args={[0.44, 0.32, 0.01]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={screenGlow}
          roughness={0.1}
        />
      </mesh>

      {/* Screen glow light */}
      <pointLight
        position={[0, 0.88, 0.2]}
        color="#00ff88"
        intensity={isNear ? 0.8 : 0.4}
        distance={3}
        decay={2}
      />

      {/* Keyboard/base pad */}
      <mesh position={[0, 0.63, 0.1]}>
        <boxGeometry args={[0.44, 0.06, 0.18]} />
        <meshStandardMaterial color="#0d0d1f" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Proximity indicator — subtle ring when near */}
      {isNear && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.7, 32]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.6} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  )
}
