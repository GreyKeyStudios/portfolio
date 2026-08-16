"use client"

import { useEffect, useRef, useState } from 'react'
import type { Mesh, MeshStandardMaterial } from 'three'
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
  const { openTerminal } = usePlayerStore()
  const glowRef = useRef(0.8)
  const dirRef = useRef(1)
  // Ref to drive screen glow imperatively — avoids 60fps React re-renders
  const screenRef = useRef<Mesh>(null)

  const [px, py, pz] = position
  const [rx, ry, rz] = rotation

  // Stable ref so onInteract closure never goes stale
  const openTerminalRef = useRef(openTerminal)
  useEffect(() => { openTerminalRef.current = openTerminal }, [openTerminal])

  // Idle screen pulse — update material directly, no React state → no re-renders
  useFrame((_, delta) => {
    glowRef.current += dirRef.current * delta * 0.4
    if (glowRef.current > 0.6) dirRef.current = -1
    if (glowRef.current < 0.2) dirRef.current = 1
    if (screenRef.current) {
      (screenRef.current.material as MeshStandardMaterial).emissiveIntensity = glowRef.current
    }
  })

  // Only re-register when position changes — stable closure via refs above
  useEffect(() => {
    const pos = new THREE.Vector3(px, py, pz)
    registerInteractable({
      id: 'main-terminal',
      label: 'Terminal',
      position: pos,
      // Terminal and FrontDoor are only ~1.96 units apart in world space —
      // at radius 2.0 each, their proximity zones nearly fully overlapped,
      // so standing near either could trigger the wrong one depending on
      // which was a hair closer. Shrunk so 0.9+0.9=1.8 stays under 1.96.
      radius: 0.9,
      onNearby: (near) => setIsNear(near),
      onInteract: () => {
        playSound('interact')
        openTerminalRef.current()
      },
    })
    return () => unregisterInteractable('main-terminal')
  }, [px, py, pz])

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

      {/* Screen — ref for imperative glow animation */}
      <mesh ref={screenRef} position={[0, 0.88, 0.065]}>
        <boxGeometry args={[0.44, 0.32, 0.01]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={0.8}
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
