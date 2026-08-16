"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { usePlayerStore } from "@/lib/player-store"
import { stepPlayer } from "@/lib/player-movement"

interface MobileFPSControlsProps {
  /** -1..1 per axis, from the movement stick. */
  joystickRef: React.MutableRefObject<{ x: number; y: number }>
  /** Yaw/pitch in radians, driven by drag-to-look. */
  cameraRotationRef: React.MutableRefObject<{ x: number; y: number }>
  /** 0..1 — how far the stick is pushed, used to blend walk into run. */
  magnitudeRef?: React.MutableRefObject<number>
}

const WALK = 2
const RUN = 4.5

export function MobileFPSControls({ joystickRef, cameraRotationRef, magnitudeRef }: MobileFPSControlsProps) {
  const { camera } = useThree()
  const teleported = useRef(false)

  const terminalOpen = usePlayerStore((s) => s.terminalOpen)
  const homeOfficeOpen = usePlayerStore((s) => s.homeOfficeOpen)
  const enterPromptOpen = usePlayerStore((s) => s.enterPromptOpen)
  const pausedRef = useRef(false)
  useEffect(() => {
    pausedRef.current = terminalOpen || homeOfficeOpen || enterPromptOpen
  }, [terminalOpen, homeOfficeOpen, enterPromptOpen])

  useEffect(() => {
    camera.rotation.order = "YXZ"
  }, [camera])

  // Teleports land on the next frame rather than waiting on a stale ref read.
  useEffect(() => {
    return usePlayerStore.subscribe((state, prevState) => {
      const req = state.teleportRequest
      if (!req || req === prevState.teleportRequest) return
      camera.position.set(req.position[0], req.position[1], req.position[2])
      if (req.yaw !== undefined) {
        cameraRotationRef.current.y = req.yaw
        cameraRotationRef.current.x = 0
      }
      // A teleport is a legitimate discontinuity; without this the step-height
      // guard sees the storey change and puts the player straight back.
      teleported.current = true
      usePlayerStore.getState().clearTeleportRequest()
    })
  }, [camera, cameraRotationRef])

  useFrame((_state, delta) => {
    camera.rotation.y = cameraRotationRef.current.y
    camera.rotation.x = cameraRotationRef.current.x

    if (pausedRef.current) {
      teleported.current = false
      return
    }

    const mag = magnitudeRef?.current ?? Math.hypot(joystickRef.current.x, joystickRef.current.y)

    const justTeleported = teleported.current
    teleported.current = false

    const { crossedTo } = stepPlayer(
      camera,
      usePlayerStore.getState().currentLocation,
      {
        // Stick Y is screen-space (down is positive), so forward is negated.
        forward: -joystickRef.current.y,
        strafe: joystickRef.current.x,
        // Push past ~85% to run. No sprint button on a phone — there is no
        // spare thumb, and a stick already carries the intent.
        speed: mag > 0.85 ? RUN : WALK,
      },
      delta,
      justTeleported
    )

    if (crossedTo) usePlayerStore.getState().setCurrentLocation(crossedTo)

    // TEMP DEBUG — mirrors the readout in fps-controls.tsx so the touch scheme
    // can be verified the same way. Remove alongside that one.
    ;(window as any).__pos = {
      x: +camera.position.x.toFixed(3),
      y: +camera.position.y.toFixed(3),
      z: +camera.position.z.toFixed(3),
      location: usePlayerStore.getState().currentLocation,
      crossedTo,
    }
    ;(window as any).__frame = { mobile: true, paused: pausedRef.current, mag }
  })

  return null
}
