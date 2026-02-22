"use client"

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { registerInteractable, unregisterInteractable } from '@/lib/use-interaction'
import { usePlayerStore } from '@/lib/player-store'

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
      // Reset particles
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
      p.vy -= 4 * delta // gravity
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
  const [glowPulse, setGlowPulse] = useState(0.6)
  const glowRef = useRef(0.6)
  const dirRef = useRef(1)
  const { completeEasterEgg, isEasterEggComplete, showHud } = usePlayerStore()

  useFrame((_, delta) => {
    glowRef.current += dirRef.current * delta * (touched ? 0.8 : 0.3)
    if (glowRef.current > (touched ? 2.5 : 1.0)) dirRef.current = -1
    if (glowRef.current < (touched ? 1.0 : 0.3)) dirRef.current = 1
    setGlowPulse(glowRef.current)
  })

  useEffect(() => {
    const pos = new THREE.Vector3(position[0], position[1], position[2])
    registerInteractable({
      id: 'touch-grass',
      position: pos,
      radius: 2.5,
      onNearby: (near) => setIsNear(near),
      onInteract: () => {
        if (isEasterEggComplete('touch-grass')) {
          showHud("You already touched grass. Congrats, you're practically outdoorsy.", 'info', 3000)
          return
        }
        setTouched(true)
        setConfettiActive(false)
        setTimeout(() => setConfettiActive(true), 50)
        completeEasterEgg('touch-grass')
        showHud("YEAHHH! You touched grass! Good job!", 'success', 5000)
      },
    })
    return () => unregisterInteractable('touch-grass')
  }, [position, completeEasterEgg, isEasterEggComplete, showHud])

  const [px, py, pz] = position

  return (
    <group position={[px, py, pz]}>
      {/* Grass mound base */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 0.1, 12]} />
        <meshStandardMaterial
          color={touched ? '#00ff66' : '#1a4d2e'}
          emissive={touched ? '#00ff66' : '#0d2b22'}
          emissiveIntensity={glowPulse * 0.3}
          roughness={0.8}
        />
      </mesh>

      {/* Grass blades — 5 spike clusters */}
      {[
        [0, 0, 0], [0.3, 0, 0.2], [-0.3, 0, 0.1],
        [0.1, 0, -0.3], [-0.2, 0, -0.25],
      ].map(([bx, , bz], i) => (
        <mesh key={i} position={[bx, 0.22, bz]} rotation={[(Math.random() - 0.5) * 0.3, i * 1.2, 0]}>
          <coneGeometry args={[0.04, 0.35, 5]} />
          <meshStandardMaterial
            color={touched ? '#00ff66' : '#2d7a44'}
            emissive={touched ? '#00ff88' : '#1a4d2e'}
            emissiveIntensity={glowPulse * 0.5}
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

      {/* Glow light — brightens when touched */}
      <pointLight
        position={[0, 0.8, 0]}
        color={touched ? '#00ff88' : '#2d7a44'}
        intensity={isNear ? glowPulse * 2 : glowPulse}
        distance={touched ? 6 : 3}
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
