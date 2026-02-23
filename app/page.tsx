"use client"

import { Suspense, useEffect, useState, useCallback, useRef } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { Environment, Sky, Stars } from "@react-three/drei"
import { FPSControls } from "@/components/fps-controls"
import { MobileFPSControls } from "@/components/mobile-fps-controls"
import { VirtualJoystick } from "@/components/virtual-joystick"
import { HouseModel } from "@/components/house-model"
import { WillowTreeModel } from "@/components/willow-tree-model"
import { CameraJoystick } from "@/components/camera-joystick"
import { ActionButton } from "@/components/action-button"
import { YardGround } from "@/components/yard-ground"
import { CurbAndSidewalk } from "@/components/curb-and-sidewalk"
import { PerimeterFence } from "@/components/perimeter-fence"
import { StreetLamp } from "@/components/street-lamp"
import { YardBushes } from "@/components/yard-bushes"
import { MplsSkyline } from "@/components/mpls-skyline"
import { NeighborStreet } from "@/components/neighbor-street"
import { MainTerminal } from "@/components/main-terminal"
import { TouchGrass } from "@/components/touch-grass"
import { FrontDoor } from "@/components/front-door"
import { useProximitySystem, triggerInteract } from "@/lib/use-interaction"
import { usePlayerStore } from "@/lib/player-store"

function CameraInit() {
  const { camera } = useThree()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    camera.rotation.order = "YXZ"
    camera.rotation.set(0, Math.PI, 0)
    done.current = true
  }, [camera])
  return null
}

function ProximityManager() {
  const setNearbyLabel = usePlayerStore((s) => s.setNearbyLabel)
  useProximitySystem(setNearbyLabel)
  return null
}

function Scene() {
  return (
    <group>
      {/* Proximity interaction system */}
      <ProximityManager />

      {/* Ground layers */}
      <YardGround />

      {/* Hardscape — procedural curb + sidewalk */}
      <CurbAndSidewalk />

      {/* Fence — gaps match path positions */}
      <PerimeterFence />

      {/* House */}
      <HouseModel position={[0, 0, 0]} />

      {/* Front door interaction zone */}
      {/* House front face is at Z≈-4.47 (measured). Door sits just in front at Z≈-4.0 */}
      <FrontDoor position={[0.72, 1.0, -4.0]} />

      {/* Main terminal — Z -5.5, close to door. Look-to-interact disambiguates door vs terminal */}
      <MainTerminal position={[-0.65, 0, -5.5]} rotation={[0, Math.PI, 0]} />

      {/* Touch Grass — Easter egg step 1 */}
      <TouchGrass position={[-6, 0, 5]} />

      {/* Willow — behind house, viewer's left */}
      <WillowTreeModel position={[-8, 0, 10]} />

      {/* Bushes — procedural, will swap for GLB assets later */}
      <YardBushes />

      {/* Lamps — X confirmed via leva, Z matches fence at -16 */}
      <StreetLamp position={[2.15, 0, -16]} />
      <StreetLamp position={[6.15, 0, -16]} />

      {/* Street across the road — opposing sidewalk, curb, neighbor houses */}
      <NeighborStreet />

      {/* Minneapolis skyline — far background */}
      <MplsSkyline />
    </group>
  )
}

// HUD overlay rendered outside the canvas
function HudOverlay() {
  const { hudMessage, hudType, clearHud, showHud, nearbyLabel } = usePlayerStore()
  const [enterPrompt, setEnterPrompt] = useState(false)

  useEffect(() => {
    if (hudMessage === '__ENTER_PROMPT__') {
      clearHud()
      setEnterPrompt(true)
    }
  }, [hudMessage, clearHud])

  const hudColors: Record<string, string> = {
    info: '#becdf6',
    locked: '#ff6666',
    success: '#00ff88',
  }

  return (
    <>
      {/* "Press E to interact" proximity hint — shown when near an interactable */}
      {nearbyLabel && !enterPrompt && (
        <div
          className="fixed bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono pointer-events-none"
          style={{
            background: 'rgba(0,0,0,0.65)',
            color: '#becdf6',
            border: '1px solid #becdf622',
          }}
        >
          <span
            className="inline-flex items-center justify-center rounded text-xs font-bold"
            style={{
              background: 'rgba(190,205,246,0.15)',
              border: '1px solid #becdf644',
              color: '#becdf6',
              minWidth: '1.4rem',
              height: '1.4rem',
              padding: '0 4px',
            }}
          >
            E
          </span>
          <span style={{ opacity: 0.85 }}>{nearbyLabel}</span>
        </div>
      )}

      {/* Contextual HUD message */}
      {hudMessage && hudMessage !== '__ENTER_PROMPT__' && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2 rounded-lg text-sm font-mono text-center pointer-events-none"
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: hudColors[hudType ?? 'info'] ?? '#becdf6',
            border: `1px solid ${hudColors[hudType ?? 'info'] ?? '#becdf6'}44`,
            maxWidth: '80vw',
          }}
        >
          {hudMessage}
        </div>
      )}

      {/* Enter house prompt */}
      {enterPrompt && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-auto" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="px-8 py-6 rounded-xl text-center font-mono"
            style={{ background: 'rgba(10,15,30,0.95)', border: '1px solid #becdf644', color: '#becdf6' }}
          >
            <p className="text-lg mb-1">🚪 Enter the house?</p>
            <p className="text-xs opacity-60 mb-5">You can come back outside anytime.</p>
            <div className="flex gap-4 justify-center">
              <button
                className="px-6 py-2 rounded text-sm font-bold"
                style={{ background: '#00ff8822', border: '1px solid #00ff88', color: '#00ff88' }}
                onClick={() => {
                  setEnterPrompt(false)
                  // TODO: trigger interior scene load
                  showHud('Interior coming soon!', 'info', 3000)
                }}
              >
                Yes
              </button>
              <button
                className="px-6 py-2 rounded text-sm"
                style={{ background: '#ffffff11', border: '1px solid #ffffff33', color: '#becdf6' }}
                onClick={() => setEnterPrompt(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function StackHouse() {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const joystickRef = useRef({ x: 0, y: 0 })
  const cameraRotationRef = useRef({ x: 0, y: Math.PI })

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      return (
        /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
        window.innerWidth < 768
      )
    }
    setIsMobile(checkMobile())
  }, [])

  const handleJoystickMove = useCallback((x: number, y: number) => {
    joystickRef.current = { x, y }
  }, [])

  const handleCameraMove = useCallback((deltaX: number, deltaY: number) => {
    cameraRotationRef.current.y -= deltaX * 0.002
    cameraRotationRef.current.x -= deltaY * 0.002
    // Clamp vertical rotation to prevent flipping
    cameraRotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotationRef.current.x))
  }, [])

  const handleCameraJoystick = useCallback((x: number, y: number) => {
    // Update camera rotation based on joystick input
    cameraRotationRef.current.y -= x * 0.01
    cameraRotationRef.current.x -= y * 0.01
    // Clamp vertical rotation
    cameraRotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotationRef.current.x))
  }, [])

  // Desktop E key — interact
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') triggerInteract()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleInteract = useCallback(() => {
    triggerInteract()
  }, [])

  const handleJump = useCallback(() => {
    // Future: implement jump action
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white" style={{ background: "linear-gradient(to bottom, #0a0f1e, #1a2444)" }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: "#0a0f1e" }}>
      <Canvas
        camera={{
          position: [0, 1.7, -30],
          fov: 75,
        }}
        shadows
      >
        <Suspense fallback={null}>
          <CameraInit />

          {/* Night/dusk atmosphere */}
          <Sky
            distance={450000}
            sunPosition={[-2, 0.1, -5]}
            inclination={0.52}
            azimuth={0.25}
            turbidity={12}
            rayleigh={0.5}
            mieCoefficient={0.005}
            mieDirectionalG={0.8}
          />
          <Stars radius={120} depth={60} count={4000} factor={4} fade speed={0.5} />
          <fog attach="fog" args={["#0d1530", 30, 90]} />

          {/* Ambient — lifted so ground is visible */}
          <ambientLight intensity={0.6} color="#becdf6" />

          {/* Moon — strong enough to light the ground */}
          <directionalLight
            position={[-8, 12, -5]}
            intensity={0.8}
            color="#becdf6"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          {/* Porch light — over front door (X=0.9, confirmed via leva) */}
          <pointLight position={[0.9, 2, -3]} color="#f6c97a" intensity={2.5} distance={16} decay={2} />

          {/* Ground fill — near camera, lights up the foreground street */}
          <pointLight position={[0, 2, -24]} color="#86a4f6" intensity={2.0} distance={30} decay={1.2} />
          {/* Ground fill — mid-yard, walkway area */}
          <pointLight position={[0, 2, -12]} color="#86a4f6" intensity={1.2} distance={20} decay={1.2} />

          {/* Tree fill light — willow is now at [-8, 0, 10] */}
          <pointLight position={[-10, 4, 8]} color="#86a4f6" intensity={1.0} distance={14} decay={2} />

          {/* Accent fill from left — blue rim (flipped with orientation fix) */}
          <directionalLight position={[-10, 4, 2]} intensity={0.4} color="#4e7cf6" />

          <Environment preset="night" />

          <Scene />

          {isMobile ? (
            <MobileFPSControls joystickRef={joystickRef} cameraRotationRef={cameraRotationRef} />
          ) : (
            <FPSControls />
          )}
        </Suspense>
      </Canvas>

      <div className="absolute top-4 left-4" style={{ color: "#becdf6" }}>
        <h1 className="text-2xl font-bold mb-1 tracking-wide">The Stack House</h1>
        <p className="text-xs opacity-60">
          {isMobile ? "Left stick: Move • Right stick: Look • A: Interact" : "Click to lock cursor • WASD to move • E to interact"}
        </p>
      </div>

      <HudOverlay />

      {isMobile && (
        <>
          {/* Movement joystick - left side */}
          <VirtualJoystick onMove={handleJoystickMove} />

          {/* Camera joystick - right side */}
          <CameraJoystick onMove={handleCameraJoystick} />

          {/* Action buttons - Xbox style layout */}
          <div className="fixed bottom-32 right-32 w-24 h-24">
            <ActionButton label="A" position="bottom" onPress={handleInteract} />
            <ActionButton label="B" position="right" onPress={handleJump} />
          </div>
        </>
      )}
    </div>
  )
}
