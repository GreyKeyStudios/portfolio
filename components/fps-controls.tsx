"use client"

import { useRef, useEffect, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { PointerLockControls } from "@react-three/drei"
import * as THREE from "three"
import { moveWithCollision } from "@/lib/collision"
import { getActiveColliders, getWorldBounds, resolveEyeY } from "@/lib/use-player-vertical"
import { usePlayerStore } from "@/lib/player-store"

export function FPSControls() {
  const { camera, gl } = useThree()
  const controlsRef = useRef<any>()
  const [isLocked, setIsLocked] = useState(false)
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  // Set by the teleport handler, consumed by the next frame's step-height check.
  const teleported = useRef(false)
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    sprint: false,
  })

  // Terminal / Home Office / enter-house-prompt overlays — when any is open,
  // release pointer lock and pause movement. enterPromptOpen used to be local
  // state in HudOverlay, disconnected from this — pointer lock stayed engaged
  // while the modal was up, so its Yes/No buttons had no free cursor to click.
  const terminalOpen = usePlayerStore((s) => s.terminalOpen)
  const homeOfficeOpen = usePlayerStore((s) => s.homeOfficeOpen)
  const enterPromptOpen = usePlayerStore((s) => s.enterPromptOpen)
  const paused = terminalOpen || homeOfficeOpen || enterPromptOpen
  const pausedRef = useRef(paused)
  useEffect(() => { pausedRef.current = paused }, [paused])

  useEffect(() => {
    if (paused) {
      // Release pointer lock directly — Drei's .unlock() doesn't always fire exitPointerLock
      if (document.pointerLockElement) {
        document.exitPointerLock()
      }
      // Zero movement so the player doesn't keep drifting
      keys.current = { w: false, a: false, s: false, d: false, sprint: false }
      velocity.current.set(0, 0, 0)
    }
  }, [paused])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          keys.current.w = true
          break
        case "KeyA":
          keys.current.a = true
          break
        case "KeyS":
          keys.current.s = true
          break
        case "KeyD":
          keys.current.d = true
          break
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.sprint = true
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          keys.current.w = false
          break
        case "KeyA":
          keys.current.a = false
          break
        case "KeyS":
          keys.current.s = false
          break
        case "KeyD":
          keys.current.d = false
          break
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.sprint = false
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!controlsRef.current) return

    const controls = controlsRef.current

    const onLock = () => setIsLocked(true)
    const onUnlock = () => setIsLocked(false)

    try {
      controls.addEventListener("lock", onLock)
      controls.addEventListener("unlock", onUnlock)
      controls.pointerSpeed = 0.8
    } catch (error) {
      console.error("Pointer lock not available:", error)
    }

    return () => {
      try {
        controls.removeEventListener("lock", onLock)
        controls.removeEventListener("unlock", onUnlock)
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }, [])

  // Teleport handling — react to store changes directly (not inside useFrame) so a
  // teleport lands on the very next frame instead of waiting on a stale ref read.
  useEffect(() => {
    return usePlayerStore.subscribe((state, prevState) => {
      const req = state.teleportRequest
      if (!req || req === prevState.teleportRequest) return
      if (!controlsRef.current) return

      const controlsObject = controlsRef.current.getObject()
      controlsObject.position.set(req.position[0], req.position[1], req.position[2])
      if (req.yaw !== undefined) {
        controlsObject.rotation.set(0, req.yaw, 0)
      }
      velocity.current.set(0, 0, 0)
      // A teleport is a legitimate discontinuity, so the step-height limit below
      // must not treat it as one to refuse. Without this the guard compares the
      // destination's eye height against the departure's, sees the storey
      // difference, and silently puts the player back where they came from —
      // the teleport appears to do nothing at all. Harmless for the two live
      // teleports (both land at y=1.7) but it would break any "jump to floor"
      // the moment one is added.
      teleported.current = true
      usePlayerStore.getState().clearTeleportRequest()
    })
  }, [])

  useFrame((state, delta) => {
    ;(window as any).__frame = { hasControls: !!controlsRef.current, paused: pausedRef.current, t: state.clock.elapsedTime }
    if (!controlsRef.current) return
    if (pausedRef.current) return   // paused while terminal/home-office overlay is open

    const speed = keys.current.sprint ? 4.5 : 2
    const dampingFactor = 3.0

    velocity.current.x *= 1 - dampingFactor * delta
    velocity.current.z *= 1 - dampingFactor * delta

    direction.current.z = Number(keys.current.w) - Number(keys.current.s)
    direction.current.x = Number(keys.current.d) - Number(keys.current.a)
    direction.current.normalize()

    velocity.current.z = direction.current.z * speed
    velocity.current.x = direction.current.x * speed

    const controlsObject = controlsRef.current.getObject()

    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()

    controlsObject.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    // Capture where we started before applying movement — moveWithCollision
    // needs the actual path (from -> to), not just the destination, so it can
    // catch walls crossed mid-frame instead of only ones we happen to land in.
    const prevX = controlsObject.position.x
    const prevZ = controlsObject.position.z

    controlsObject.position.addScaledVector(forward, velocity.current.z * delta)
    controlsObject.position.addScaledVector(right, velocity.current.x * delta)

    const location = usePlayerStore.getState().currentLocation

    const resolved = moveWithCollision(
      prevX,
      prevZ,
      controlsObject.position.x,
      controlsObject.position.z,
      getActiveColliders(location)
    )
    // Eye height follows the active floor, interpolating smoothly across any stair
    // underfoot. Flips currentLocation once the player has fully crossed onto a
    // different floor.
    const prevY = controlsObject.position.y
    const step = resolveEyeY(location, resolved.x, resolved.z, prevY)
    let crossedTo = step.crossedTo

    // Step-height limit. Walking a stair changes Y by only a few centimetres
    // per frame, so anything larger means this move would teleport the player
    // vertically — stepping off the middle of a flight onto a flat floor, or
    // in off a doorway onto a tread well above where they stand. Refusing the
    // horizontal move is what a solid surface would do anyway, and it lets
    // doorways stay comfortably wide instead of being narrowed to the point of
    // being unwalkable just to geometrically forbid those spots.
    const MAX_STEP = 0.35
    const justTeleported = teleported.current
    teleported.current = false
    if (!justTeleported && prevY !== 0 && Math.abs(step.y - prevY) > MAX_STEP) {
      // Refuse the ENTIRE transition, not just its horizontal half.
      //
      // Reverting x/z alone used to leave `step.y` and `crossedTo` applied
      // regardless, which is the actual "warping" bug: the move was judged
      // illegal, yet the player still dropped a whole storey and had the
      // active collider set swapped under them mid-frame. Re-resolving at
      // (prevX, prevZ) didn't help either — the stale `location` means that
      // lookup can report the same far-away floor and the same crossing.
      //
      // Holding y at prevY is safe because a legitimate stair changes it by
      // only a few cm per frame, so nothing real is ever refused here.
      controlsObject.position.x = prevX
      controlsObject.position.z = prevZ
      controlsObject.position.y = prevY
      crossedTo = null
    } else {
      controlsObject.position.x = resolved.x
      controlsObject.position.z = resolved.z
      controlsObject.position.y = step.y
    }

    if (crossedTo && crossedTo !== location) {
      usePlayerStore.getState().setCurrentLocation(crossedTo)
    }

    const bounds = getWorldBounds(location)
    controlsObject.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, controlsObject.position.x))
    controlsObject.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, controlsObject.position.z))

    // TEMP DEBUG — renderer cost readout for the culling work. Remove with
    // the position block below.
    ;(window as any).__render = {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      programs: gl.info.programs?.length ?? 0,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
    }

    // TEMP DEBUG — live position readout for diagnosing the stair-warp
    // report. Remove once resolved.
    ;(window as any).__pos = {
      x: +controlsObject.position.x.toFixed(3),
      y: +controlsObject.position.y.toFixed(3),
      z: +controlsObject.position.z.toFixed(3),
      location,
      crossedTo,
    }
  })

  return (
    <>
      <PointerLockControls ref={controlsRef} args={[camera, gl.domElement]} selector={null} />
      {!isLocked && (
        <mesh position={[0, 1.7, -5]} onClick={() => controlsRef.current?.lock()}>
          <planeGeometry args={[0.1, 0.1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </>
  )
}
