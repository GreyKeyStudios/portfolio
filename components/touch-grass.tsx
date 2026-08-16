"use client"

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { registerInteractable, unregisterInteractable } from '@/lib/use-interaction'
import { usePlayerStore } from '@/lib/player-store'
import { playSound } from '@/lib/audio'

// Simple confetti particle system
function Confetti({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const particles = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      x: (Math.random() - 0.5) * 3,
      y: 0,
      z: (Math.random() - 0.5) * 3,
      vy: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 2,
      vz: (Math.random() - 0.5) * 2,
      color: ['#ff4444', '#44ff88', '#4488ff', '#ffff44', '#ff44ff'][i % 5],
      life: 1,
    }))
  )
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (active) {
      particles.current.forEach((p) => {
        p.y = 0
        p.vy = Math.random() * 4 + 2
        p.vx = (Math.random() - 0.5) * 2
        p.vz = (Math.random() - 0.5) * 2
        p.life = 1
      })
      setVisible(true)
      setTimeout(() => setVisible(false), 3000)
    }
  }, [active])

  useFrame((_, delta) => {
    if (!visible || !groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      const p = particles.current[i]
      if (!p) return
      p.y += p.vy * delta
      p.x += p.vx * delta
      p.z += p.vz * delta
      p.vy -= 4 * delta
      p.life -= delta * 0.4
      child.position.set(p.x, p.y, p.z)
      child.scale.setScalar(Math.max(0, p.life))
    })
  })

  if (!visible) return null

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {particles.current.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

interface TouchGrassProps {
  position?: [number, number, number]
}

export function TouchGrass({ position = [-6, 0, 5] }: TouchGrassProps) {
  const [isNear, setIsNear] = useState(false)
  const [touched, setTouched] = useState(false)
  const [confettiActive, setConfettiActive] = useState(false)

  // Imperative glow — no setState in useFrame to avoid 60fps re-renders
  const glowRef = useRef(0.6)
  const dirRef = useRef(1)
  const touchedRef = useRef(touched)
  const moundMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const bladeMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([])

  useEffect(() => { touchedRef.current = touched }, [touched])

  // Stable store refs — prevents re-registration every render (same pattern as front-door.tsx)
  const { completeEasterEgg, isEasterEggComplete, showHud } = usePlayerStore()
  const completeEasterEggRef = useRef(completeEasterEgg)
  const isEasterEggCompleteRef = useRef(isEasterEggComplete)
  const showHudRef = useRef(showHud)
  useEffect(() => { completeEasterEggRef.current = completeEasterEgg }, [completeEasterEgg])
  useEffect(() => { isEasterEggCompleteRef.current = isEasterEggComplete }, [isEasterEggComplete])
  useEffect(() => { showHudRef.current = showHud }, [showHud])

  const [px, py, pz] = position

  // Drive glow imperatively via material refs
  useFrame((_, delta) => {
    const t = touchedRef.current
    glowRef.current += dirRef.current * delta * (t ? 0.8 : 0.3)
    if (glowRef.current > (t ? 2.5 : 1.0)) dirRef.current = -1
    if (glowRef.current < (t ? 1.0 : 0.3)) dirRef.current = 1
    const g = glowRef.current
    if (moundMatRef.current) moundMatRef.current.emissiveIntensity = g * 0.3
    bladeMatRefs.current.forEach((m) => { if (m) m.emissiveIntensity = g * 0.5 })
  })

  // Only re-register when position changes — stable closure via refs above
  useEffect(() => {
    const pos = new THREE.Vector3(px, py, pz)
    registerInteractable({
      id: 'touch-grass',
      label: 'Touch Grass',
      position: pos,
      radius: 2.5,
      onNearby: (near) => setIsNear(near),
      onInteract: () => {
        if (isEasterEggCompleteRef.current('touch-grass')) {
          playSound('interact')
          showHudRef.current("You already touched grass. Congrats, you're practically outdoorsy.", 'info', 3000)
          return
        }
        playSound('confetti')
        setTouched(true)
        setConfettiActive(false)
        setTimeout(() => setConfettiActive(true), 50)
        completeEasterEggRef.current('touch-grass')
        showHudRef.current('YEAHHH! You touched grass! Good job!', 'success', 5000)
      },
    })
    return () => unregisterInteractable('touch-grass')
  }, [px, py, pz])

  const bladePositions: [number, number, number][] = [
    [0, 0.22, 0], [0.3, 0.22, 0.2], [-0.3, 0.22, 0.1],
    [0.1, 0.22, -0.3], [-0.2, 0.22, -0.25],
  ]

  return (
    <group position={[px, py, pz]}>
      {/* Grass mound base */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 0.1, 12]} />
        <meshStandardMaterial
          ref={moundMatRef}
          color={touched ? '#00ff66' : '#1a4d2e'}
          emissive={touched ? '#00ff66' : '#0d2b22'}
          emissiveIntensity={0.18}
          roughness={0.8}
        />
      </mesh>

      {/* Grass blades — 5 spike clusters */}
      {bladePositions.map(([bx, by, bz], i) => (
        <mesh key={i} position={[bx, by, bz]} rotation={[0, i * 1.2, 0]}>
          <coneGeometry args={[0.04, 0.35, 5]} />
          <meshStandardMaterial
            ref={(el) => { bladeMatRefs.current[i] = el }}
            color={touched ? '#00ff66' : '#2d7a44'}
            emissive={touched ? '#00ff88' : '#1a4d2e'}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Sign post */}
      <mesh position={[0.9, 0.5, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.0, 6]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
      </mesh>

      {/* Sign board */}
      <mesh position={[0.9, 1.05, 0]}>
        <boxGeometry args={[0.55, 0.22, 0.04]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.7} />
      </mesh>

      {/* Glow light */}
      <pointLight
        position={[0, 0.8, 0]}
        color={touched ? '#00ff88' : '#2d7a44'}
        intensity={touched ? 6 : 3}
        distance={8}
        decay={2}
      />

      {/* Proximity ring */}
      {isNear && !touched && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 1.05, 32]} />
          <meshStandardMaterial color="#2d7a44" emissive="#2d7a44" emissiveIntensity={0.8} transparent opacity={0.6} />
        </mesh>
      )}

      <Confetti active={confettiActive} />
    </group>
  )
}
