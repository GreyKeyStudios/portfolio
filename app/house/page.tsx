"use client"

import { Suspense, useEffect, useState, useCallback, useRef } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import type * as THREE from "three"
import { Environment, Sky, Stars } from "@react-three/drei"
import { FPSControls } from "@/components/fps-controls"
import { MobileFPSControls } from "@/components/mobile-fps-controls"
import { HouseModel } from "@/components/house-model"
import { WillowTreeModel } from "@/components/willow-tree-model"
import { TouchControls, clampPitch, LOOK_SENSITIVITY } from "@/components/touch-controls"
import { YardGround } from "@/components/yard-ground"
import { CurbAndSidewalk } from "@/components/curb-and-sidewalk"
import { PerimeterFence } from "@/components/perimeter-fence"
import { StreetLamp } from "@/components/street-lamp"
import { YardBushes } from "@/components/yard-bushes"
import { YardGrass } from "@/components/yard-grass"
import { SkylinePlate } from "@/components/skyline-plate"
import { NeighborStreet } from "@/components/neighbor-street"
import { MainTerminal } from "@/components/main-terminal"
import { TouchGrass } from "@/components/touch-grass"
import { FrontDoor } from "@/components/front-door"
import { TerminalUI } from "@/components/terminal-ui"
import { HomeOfficeUI } from "@/components/home-office-ui"
import { SceneEffects } from "@/components/scene-effects"
import { BootSequence } from "@/components/boot-sequence"
import { InteriorFloorBasement } from "@/components/interior/interior-floor-basement"
import { InteriorFloorGround } from "@/components/interior/interior-floor-ground"
import { InteriorFloorSecond } from "@/components/interior/interior-floor-second"
import { InteriorFloorAttic } from "@/components/interior/interior-floor-attic"
import { HomeOfficeRoom } from "@/components/interior/home-office-room"
import { ExitDoor } from "@/components/interior/exit-door"
import { DoorPlaceholder } from "@/components/interior/door-placeholder"
import { ProxyFurniture } from "@/components/interior/proxy-furniture"
import { useProximitySystem, triggerInteract } from "@/lib/use-interaction"
import { usePlayerStore } from "@/lib/player-store"
import { FLOOR_BASE_Y, X0, ROOMS, type FloorId } from "@/lib/interior-layout"

type InteriorFloor = Exclude<FloorId, 'yard'>

/**
 * Floors in vertical order, so "how far is this floor from the one I'm on"
 * is just an index distance.
 *
 * Only the active floor and its immediate neighbours are drawn. Neighbours
 * have to stay visible rather than culling to the active floor alone: every
 * stair is modelled into the GLB of the floor BELOW it, and looking down a
 * stairwell has to show the floor you just left rather than empty space.
 */
const FLOOR_ORDER: InteriorFloor[] = ['basement', 'ground', 'second', 'attic']

function nearFloor(active: FloorId, floor: InteriorFloor): boolean {
  if (active === 'yard') return false
  return Math.abs(FLOOR_ORDER.indexOf(active as InteriorFloor) - FLOOR_ORDER.indexOf(floor)) <= 1
}

/**
 * Every point light the scene can draw from, tagged with where it belongs.
 *
 * This is a candidate list, not a render list. At any moment only POOL_SIZE of
 * these are actually lit — see SceneLights for why the mounted count has to
 * stay fixed and small at the same time.
 */
/** Per-room light colour. Identity-keyed, so it survives any layout change. */
const ROOM_TINT: Record<string, string> = {
  'music-studio': '#9a7ad4',        // Grey Key Studios — creative / music
  'basement-landing': '#c9b8a0',
  'basement-mechanical': '#b8b0a0',
  'basement-stair-hall': '#e8dcc0',
  'home-office': '#cfe0ff',         // cool monitor light
  'gallery': '#ffe4b8',
  'bathroom': '#eaf2ff',
  'linen': '#b8b0a0',
  'upstairs-storage': '#b8b0a0',
  'pantry': '#b8b0a0',
  'half-bath': '#fff0d6',
  'foyer': '#f6c97a',               // warm entry
  'stair-landing-2': '#f6c97a',
  'archive': '#d8c8a8',             // dusty attic
  'secret-room': '#7a5cc4',
}

const POINT_LIGHTS: {
  where: 'yard' | InteriorFloor
  position: [number, number, number]
  color: string
  intensity: number
  distance: number
  decay: number
}[] = [
  // ---- Yard ----
  // Porch light — over front door (X=0.9, confirmed via leva). Was at Z=-3,
  // which is 1.5 units *inside* the house (front face Z≈-4.47), so it lit the
  // model's interior and contributed nothing to the porch.
  { where: 'yard', position: [0.9, 2.2, -5.1], color: '#f6c97a', intensity: 2.5, distance: 16, decay: 2 },
  // Ground fill — near camera, lights up the foreground street
  { where: 'yard', position: [0, 2, -24], color: '#86a4f6', intensity: 2.0, distance: 30, decay: 1.2 },
  // Ground fill — mid-yard, walkway area
  { where: 'yard', position: [0, 2, -12], color: '#86a4f6', intensity: 1.2, distance: 20, decay: 1.2 },
  // Tree fill — willow is at [-8, 0, 10]
  { where: 'yard', position: [-10, 4, 8], color: '#86a4f6', intensity: 1.0, distance: 14, decay: 2 },

  // ---- Interior: DERIVED from ROOMS, never hand-positioned ----
  //
  // These were authored by hand twice and desynced from the floor plan both
  // times. The first set was written for a layout spanning Z-6..22 and left
  // eight of twelve lights sitting OUTSIDE the building; re-authoring them by
  // hand against the 11x9 plan broke again the moment the footprint became
  // 13.2x10.8, because every position was a literal.
  //
  // A light in the middle of a room is not a creative decision, so it should
  // not be hand-maintained. One fill per room, at its centre, near ceiling
  // height, with a radius scaled to the room. Move a wall and the lighting
  // follows — same guarantee the geometry and colliders already have.
  // Rooms above ~60m2 get TWO fills spaced along their long axis instead of
  // one. A single decay-2 source cannot reach the corners of a room that size
  // — the Archive is 134m2 and was lit to the point of being unreadable.
  ...ROOMS.flatMap((r) => {
    const { minX, maxX, minZ, maxZ } = r.bounds
    const w = maxX - minX
    const d = maxZ - minZ
    const alongZ = d >= w
    const splits = w * d > 60 ? [1 / 3, 2 / 3] : [1 / 2]
    return splits.map((t) => ({
      where: r.floor,
      position: [
        alongZ ? (minX + maxX) / 2 : minX + w * t,
        FLOOR_BASE_Y[r.floor] + 2.3,
        alongZ ? minZ + d * t : (minZ + maxZ) / 2,
      ] as [number, number, number],
      // Per-room tint, keyed off identity rather than position — the only part
      // of this that is actually an art decision.
      color: ROOM_TINT[r.id] ?? '#ffe9c4',
      // Bigger rooms need a brighter source to reach their corners, but decay 2
      // keeps it physical so light still pools rather than flooding the floor.
      intensity: 1.4 + Math.min(1.4, (w * d) / 26) / splits.length,
      distance: Math.max(5, Math.hypot(w, d) * 0.85),
      decay: 2,
    }))
  }),
]

// Unfurnished rooms — each gets a "still being built" marker near its own
// doorway. Positions read off the same coordinates as their wall openings
// in interior-layout.ts's ROOMS. music-studio and archive have no wall door
// (see RoomDef comments there), so their markers sit near where the stairs
// actually land instead.
const PLACEHOLDER_ROOMS: { id: string; label: string; floor: InteriorFloor; position: [number, number, number] }[] = [
  { id: 'kitchen', label: 'Kitchen', floor: 'ground', position: [X0 - 2, FLOOR_BASE_Y.ground + 1.2, 3] },
  { id: 'client-room', label: 'Client Room', floor: 'ground', position: [X0 + 2, FLOOR_BASE_Y.ground + 1.2, 3] },
  { id: 'half-bath', label: 'Half-Bath', floor: 'ground', position: [X0 + 2, FLOOR_BASE_Y.ground + 1.2, 8.5] },
  { id: 'game-room', label: 'Game Room', floor: 'ground', position: [X0 - 2, FLOOR_BASE_Y.ground + 1.2, 11] },
  { id: 'bathroom', label: 'Bathroom', floor: 'second', position: [X0 + 2, FLOOR_BASE_Y.second + 1.2, 8] },
  { id: 'music-studio', label: 'Grey Key Studios', floor: 'basement', position: [X0 - 2, FLOOR_BASE_Y.basement + 1.2, -1.5] },
  // Near where stair-attic now lands (Z19..21), not its old Z15..17 footprint.
  { id: 'archive', label: 'Archive', floor: 'attic', position: [X0 + 2.2, FLOOR_BASE_Y.attic + 1.2, 20] },
]

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

/**
 * Sky dome and stars, culled while indoors.
 *
 * These sat at the top of the Canvas outside <Scene>, so the yard-visibility
 * toggle didn't reach them: standing in the interior still paid for the sky
 * dome and 4000 star points that are invisible from inside the house. Both are
 * ordinary geometry, so hiding them is free of side effects.
 *
 * The yard's LIGHTS deliberately do not live here — see SceneLights.
 *
 * <fog> and <Environment> stay outside — both set properties on the scene
 * itself rather than adding objects to it, so `visible` has nothing to act on.
 */
function YardSky() {
  const isYard = usePlayerStore((s) => s.currentLocation === 'yard')

  return (
    <group visible={isYard}>
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
    </group>
  )
}

/**
 * How many point lights exist at once. Every frame the nearest relevant
 * candidates from POINT_LIGHTS are copied into these slots; the rest go dark.
 *
 * Seven, not five. The stairwell is a continuous shaft: standing in it you can
 * see three storeys at once, and it is the only place in the house where that
 * happens. At five the nearest candidates were all ground and second floor —
 * the basement stair hall missed the cut by 0.06 units — so looking down the
 * shaft showed an unlit floor reading as a void under the stairs. Seven covers
 * the shaft; everywhere else the extra two contribute almost nothing because
 * decay 2 has already taken them to near zero.
 */
const POOL_SIZE = 7

/**
 * A fixed pool of lights, repositioned as you move, rather than one light per
 * fixture toggled on and off.
 *
 * The fixed count is a hard constraint, not a style choice. three.js keys every
 * material's compiled shader on the scene's light configuration, so changing the
 * NUMBER of active lights invalidates every material's program at once and
 * recompiles the lot. Unmounting does it, and so does `visible={false}` on a
 * group containing a light. Measured cost of one light appearing: a 666ms frozen
 * frame — that was the delay before the front door's green glow and its "press
 * E" prompt would respond.
 *
 * Dimming to intensity 0 fixes the stall but not the cost: an unused light is
 * still evaluated by every lit fragment, and holding all 16 candidates mounted
 * measured 33fps in the yard and 44 inside. Hence the pool — the count stays
 * fixed (no recompiles, ever) AND stays small (no wasted per-fragment work).
 *
 * Slots are written imperatively through refs. Doing it in React state would
 * re-render the whole subtree every time the player walks a few metres.
 */
function SceneLights() {
  const currentLocation = usePlayerStore((s) => s.currentLocation)
  const isYard = currentLocation === 'yard'

  const pool = useRef<(THREE.PointLight | null)[]>([])
  const keyLight = useRef<THREE.DirectionalLight>(null)
  const sinceUpdate = useRef(Infinity)

  // The shadow-casting key light is reconfigured rather than duplicated — two
  // permanently-mounted shadow casters would mean two full shadow-map passes
  // every frame, for one that is always pointed at scenery nobody can see.
  useEffect(() => {
    const l = keyLight.current
    if (!l) return
    if (isYard) {
      l.position.set(-8, 12, -5)
      l.color.set('#becdf6')
      l.intensity = 0.8
      Object.assign(l.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 0.5, far: 40 })
    } else {
      l.position.set(X0 - 4, 10, 4)
      l.color.set('#fff4e0')
      l.intensity = 0.3
      Object.assign(l.shadow.camera, { left: X0 - 14, right: X0 + 14, top: 20, bottom: -8, near: 0.5, far: 40 })
    }
    l.shadow.camera.updateProjectionMatrix()
  }, [isYard])

  // Re-pick slots on a timer rather than per frame — the winning set only
  // changes when the player crosses a light's falloff radius, which walking
  // does far slower than 60Hz. Forced immediately on a location change so a
  // teleport never lands in a dark room.
  useEffect(() => { sinceUpdate.current = Infinity }, [currentLocation])

  useFrame((state, delta) => {
    sinceUpdate.current += delta
    if (sinceUpdate.current < 0.1) return
    sinceUpdate.current = 0

    const cam = state.camera.position
    const active = POINT_LIGHTS
      .filter((l) => (isYard ? l.where === 'yard' : l.where !== 'yard' && nearFloor(currentLocation, l.where)))
      .map((l) => ({
        l,
        d2: (l.position[0] - cam.x) ** 2 + (l.position[1] - cam.y) ** 2 + (l.position[2] - cam.z) ** 2,
      }))
      .sort((a, b) => a.d2 - b.d2)

    for (let i = 0; i < POOL_SIZE; i++) {
      const slot = pool.current[i]
      if (!slot) continue
      const pick = active[i]
      if (!pick) {
        slot.intensity = 0
        continue
      }
      const { l } = pick
      slot.position.set(l.position[0], l.position[1], l.position[2])
      slot.color.set(l.color)
      slot.intensity = l.intensity
      slot.distance = l.distance
      slot.decay = l.decay
    }
  })

  return (
    <>
      {/* Ambient — one light, retuned per location. Outside it's the lifted
          moonlight fill; inside it's cooler and dimmer so the fill lights
          still carry the contrast. */}
      {/* Interior ambient is deliberately low. The concept renders are dark
          rooms with two or three warm sources and deep falloff; an ambient of
          0.35 flattens all of that into even grey. The pooled practicals above
          now do the lighting, and ambient only stops shadow sides going pure
          black. */}
      <ambientLight
        intensity={isYard ? 0.6 : 0.12}
        color={isYard ? '#becdf6' : '#4a5570'}
      />

      {/* Key light — the moon outdoors, the interior's directional indoors.
          Configured in the effect above. */}
      <directionalLight
        ref={keyLight}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Accent fill from left — blue rim (flipped with orientation fix).
          No shadow map, so leaving it mounted costs almost nothing. */}
      <directionalLight position={[-10, 4, 2]} intensity={isYard ? 0.4 : 0} color="#4e7cf6" />

      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <pointLight
          key={i}
          ref={(r) => { pool.current[i] = r }}
          intensity={0}
        />
      ))}
    </>
  )
}

/**
 * Everything in the yard, culled while indoors.
 *
 * This used to render unconditionally, so standing in the interior still drew
 * the entire exterior — house, the 10.8 MB willow, fence, bushes, grass,
 * skyline, neighbour street — every frame, for geometry 300 units away and
 * completely out of view.
 *
 * Interactable registration is a plain JS registry untouched by `visible`, so
 * the front door still works the moment you're back outside. It can't fire
 * from indoors regardless, since proximity is measured 300 units away.
 */
function YardScene() {
  const isYard = usePlayerStore((s) => s.currentLocation === 'yard')

  return (
    <group visible={isYard}>
      {/* Ground layers */}
      <YardGround />

      {/* Hardscape — procedural curb + sidewalk */}
      <CurbAndSidewalk />

      {/* Fence — gaps match path positions */}
      <PerimeterFence />

      {/* House */}
      <HouseModel position={[0, 0, 0]} />

      {/* Front door interaction zone */}
      {/* House front face is at Z≈-4.47 (measured), and the house spans Z -4.57..4.64.
          Z=-4.0 sat *inside* the model; -4.6 puts the trigger just proud of the wall
          so the "Press E" prompt reads against the door rather than through it. */}
      <FrontDoor position={[0.72, 1.0, -4.6]} />

      {/* Main terminal — TEMPORARILY REMOVED per user request. Its proximity
          zone overlapped FrontDoor's and it has its own unresolved "gets stuck"
          bug independent of the door. Being redone later — re-add
          <MainTerminal position={[-0.65, 0, -6.0]} rotation={[0, Math.PI, 0]} />
          once that pass happens. */}

      {/* Touch Grass — Easter egg step 1 */}
      <TouchGrass position={[-6, 0, 5]} />

      {/* Willow — behind house, viewer's left */}
      <WillowTreeModel position={[-8, 0, 10]} />

      {/* Bushes */}
      <YardBushes />

      {/* Grass clumps — stylized low-poly patches scattered near the walkway */}
      <YardGrass />

      {/* Lamps — flanking the driveway opening (gate posts at X=2.5 and X=5.5),
          set just outside the gap so they frame the entrance rather than sit in it.
          Pulled forward to the sidewalk so they light the walk, not the fence line. */}
      <StreetLamp position={[2.2, 0, -17.4]} />
      <StreetLamp position={[5.8, 0, -17.4]} />

      {/* Street across the road — opposing sidewalk, curb, neighbor houses */}
      <NeighborStreet />

      {/* Distant skyline — image plate, not geometry. See SkylinePlate. */}
      <SkylinePlate />
    </group>
  )
}

function Scene() {
  const currentLocation = usePlayerStore((s) => s.currentLocation)
  const isYard = currentLocation === 'yard'

  return (
    <group>
      {/* Proximity interaction system */}
      <ProximityManager />

      {/* Every light in the scene lives here, mounted permanently — see
          SceneLights for why the count must never change. */}
      <SceneLights />

      <YardScene />

      {/* Interior — always MOUNTED (no pop-in on teleport — visibility flips
          the same frame the teleport happens, not a mount/unmount), but only
          VISIBLE while inside. It lives at X0=300, only 300 units away — well
          within the camera's default far-clip (2000) — so scene fog (which
          only tints color, it doesn't cull) wasn't enough to hide it: it was
          rendering as a faint silhouette on the yard's horizon. */}
      <group visible={!isYard}>
        <group visible={nearFloor(currentLocation, 'basement')}>
          <InteriorFloorBasement />
        </group>
        <group visible={nearFloor(currentLocation, 'ground')}>
          <InteriorFloorGround />
          <ExitDoor />
          {/* TEMPORARY scale reference — see ProxyFurniture. */}
          <ProxyFurniture />
        </group>
        <group visible={nearFloor(currentLocation, 'second')}>
          <InteriorFloorSecond />
          <HomeOfficeRoom />
        </group>
        <group visible={nearFloor(currentLocation, 'attic')}>
          <InteriorFloorAttic />
        </group>

        {PLACEHOLDER_ROOMS.map((r) => (
          <group key={r.id} visible={nearFloor(currentLocation, r.floor)}>
            <DoorPlaceholder id={r.id} label={r.label} position={r.position} />
          </group>
        ))}
      </group>
    </group>
  )
}

// HUD overlay rendered outside the canvas
function HudOverlay() {
  const { hudMessage, hudType, clearHud, nearbyLabel, enterPromptOpen, openEnterPrompt, closeEnterPrompt } = usePlayerStore()

  useEffect(() => {
    if (hudMessage === '__ENTER_PROMPT__') {
      clearHud()
      openEnterPrompt()
    }
  }, [hudMessage, clearHud, openEnterPrompt])

  const hudColors: Record<string, string> = {
    info: '#becdf6',
    locked: '#ff6666',
    success: '#00ff88',
  }

  return (
    <>
      {/* "Press E to interact" proximity hint — shown when near an interactable */}
      {nearbyLabel && !enterPromptOpen && (
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
      {enterPromptOpen && (
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
                  closeEnterPrompt()
                  usePlayerStore.getState().enterInterior()
                }}
              >
                Yes
              </button>
              <button
                className="px-6 py-2 rounded text-sm"
                style={{ background: '#ffffff11', border: '1px solid #ffffff33', color: '#becdf6' }}
                onClick={closeEnterPrompt}
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
  // The Canvas mounts immediately and streams underneath the credits — that is
  // the entire point of the boot sequence. Do NOT gate the Canvas on this.
  const [booted, setBooted] = useState(false)
  // Drives the interact button's lit state, so it only reads as live when
  // something is actually in range.
  const nearbyLabel = usePlayerStore((st) => st.nearbyLabel)
  const joystickRef = useRef({ x: 0, y: 0 })
  const joystickMagnitude = useRef(0)
  const cameraRotationRef = useRef({ x: 0, y: Math.PI })

  useEffect(() => {
    setMounted(true)
    // A narrow window alone used to be enough to switch to touch joystick
    // controls (window.innerWidth < 768), which meant a desktop user with a
    // normal mouse+keyboard but a somewhat narrow browser window silently
    // lost WASD/E entirely — no error, just a joystick UI they may not
    // recognize as the reason keyboard input stopped doing anything. Narrow
    // width now only counts alongside an actual touch signal.
    const checkMobile = () => {
      const hasTouch = navigator.maxTouchPoints > 0
      return (
        /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (hasTouch && (navigator.maxTouchPoints > 2 || window.innerWidth < 768))
      )
    }
    setIsMobile(checkMobile())

    // TEMP DEBUG — exposes the store for direct inspection/manipulation
    // while diagnosing the stair-warp report. Remove once resolved.
    ;(window as any).__store = usePlayerStore
  }, [])

  const handleTouchMove = useCallback((x: number, y: number, magnitude: number) => {
    joystickRef.current = { x, y }
    joystickMagnitude.current = magnitude
  }, [])

  // Drag-to-look. Pitch is clamped just short of vertical so the camera can
  // never flip, which is disorienting and hard to recover from on a phone.
  const handleLook = useCallback((dx: number, dy: number) => {
    cameraRotationRef.current.y -= dx * LOOK_SENSITIVITY
    cameraRotationRef.current.x = clampPitch(cameraRotationRef.current.x - dy * LOOK_SENSITIVITY)
  }, [])

  // Desktop E key — interact (gated: no-op while terminal, home office, or the enter-house prompt is open)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const state = usePlayerStore.getState()
      if (e.code === 'KeyE' && !state.terminalOpen && !state.homeOfficeOpen && !state.enterPromptOpen) {
        triggerInteract()
      }
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

          <fog attach="fog" args={["#0d1530", 30, 90]} />

          <YardSky />

          <Environment preset="night" />

          <Scene />

          {isMobile ? (
            <MobileFPSControls
              joystickRef={joystickRef}
              cameraRotationRef={cameraRotationRef}
              magnitudeRef={joystickMagnitude}
            />
          ) : (
            <FPSControls />
          )}

          {/* Readability pass — AO, restrained bloom, ACES. Mounted last so it
              composites everything above it. Desktop only: these are full-screen
              passes and a phone GPU has no headroom for them on top of a scene
              that already fills the frame. */}
          {!isMobile && <SceneEffects />}
        </Suspense>
      </Canvas>

      {!booted && <BootSequence onDone={() => setBooted(true)} />}

      <div className="absolute top-4 left-4" style={{ color: "#becdf6", opacity: booted ? 1 : 0, transition: "opacity 600ms ease" }}>
        <h1 className="text-2xl font-bold mb-1 tracking-wide">The Stack House</h1>
        <p className="text-xs opacity-60">
          {isMobile
            ? "Left: move (push to run) • Right: drag to look • USE to interact"
            : "Click to lock cursor • WASD to move • Shift to sprint • E to interact"}
        </p>
      </div>

      <HudOverlay />
      <TerminalUI />
      <HomeOfficeUI />

      {isMobile && booted && (
        <TouchControls
          onMove={handleTouchMove}
          onLook={handleLook}
          onInteract={handleInteract}
          nearbyLabel={nearbyLabel}
        />
      )}
    </div>
  )
}
