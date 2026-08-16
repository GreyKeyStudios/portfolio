"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Touch controls: a movement stick on the left, drag-to-look on the right.
 *
 * Replaces a pair of fixed joysticks. A fixed look-stick is the weakest part of
 * any phone FPS — it caps turn speed at the stick's throw and forces the thumb
 * to hunt for a target it cannot see under itself. Dragging anywhere on the
 * right half is how every shipped mobile shooter does it, and it costs nothing.
 *
 * The movement stick is also FLOATING: it appears wherever the left thumb lands
 * rather than at a fixed rosette. On a phone the thumb never arrives in the
 * same place twice, and a fixed stick means every session starts with a
 * correction.
 *
 * Multi-touch is tracked per pointer id, so looking while walking works. A
 * single shared handler would have the second finger steal the first's stick.
 */

const STICK_RADIUS = 56
const DEAD_ZONE = 0.12
const LOOK_SENSITIVITY = 0.0042
const PITCH_LIMIT = Math.PI / 2 - 0.05

interface Props {
  onMove: (x: number, y: number, magnitude: number) => void
  onLook: (dx: number, dy: number) => void
  onInteract: () => void
  /** Shown on the interact button when something is in range. */
  nearbyLabel?: string | null
}

export function TouchControls({ onMove, onLook, onInteract, nearbyLabel }: Props) {
  const [stick, setStick] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null)
  const movePointer = useRef<number | null>(null)
  const lookPointer = useRef<number | null>(null)
  const lookLast = useRef({ x: 0, y: 0 })

  const half = () => (typeof window === "undefined" ? 0 : window.innerWidth / 2)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Capture the pointer so this element keeps receiving its events even if
    // the finger slides outside. Without it a pointerup can be missed entirely
    // and the stick stays engaged — the player then walks forever with nothing
    // touching the screen, which is the classic mobile stuck-input bug.
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      // Older Safari throws on capture for some pointer types; the plain
      // handlers below still work, just without the guarantee.
    }

    // Left half drives movement, right half drives look. Whichever side the
    // finger lands on owns that pointer until it lifts.
    if (e.clientX < half() && movePointer.current === null) {
      movePointer.current = e.pointerId
      setStick({ ox: e.clientX, oy: e.clientY, x: 0, y: 0 })
    } else if (e.clientX >= half() && lookPointer.current === null) {
      lookPointer.current = e.pointerId
      lookLast.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId === movePointer.current) {
        setStick((s) => {
          if (!s) return s
          let dx = e.clientX - s.ox
          let dy = e.clientY - s.oy
          const d = Math.hypot(dx, dy)
          // Clamp to the ring so the knob cannot be dragged off its base.
          if (d > STICK_RADIUS) {
            dx = (dx / d) * STICK_RADIUS
            dy = (dy / d) * STICK_RADIUS
          }
          const nx = dx / STICK_RADIUS
          const ny = dy / STICK_RADIUS
          const mag = Math.hypot(nx, ny)
          if (mag < DEAD_ZONE) onMove(0, 0, 0)
          else {
            // Rescale past the dead zone so the very first millimetre of travel
            // does not jump straight to a noticeable speed.
            const k = (mag - DEAD_ZONE) / (1 - DEAD_ZONE) / mag
            onMove(nx * k, ny * k, mag)
          }
          return { ...s, x: dx, y: dy }
        })
      } else if (e.pointerId === lookPointer.current) {
        onLook(e.clientX - lookLast.current.x, e.clientY - lookLast.current.y)
        lookLast.current = { x: e.clientX, y: e.clientY }
      }
    },
    [onMove, onLook]
  )

  const endPointer = useCallback(
    (e: React.PointerEvent) => {
      try {
        ;(e.target as Element).releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
      if (e.pointerId === movePointer.current) {
        movePointer.current = null
        setStick(null)
        onMove(0, 0, 0)
      } else if (e.pointerId === lookPointer.current) {
        lookPointer.current = null
      }
    },
    [onMove]
  )

  // A phone call, a notification shade, or an app switch will not deliver
  // pointerup either. Releasing on blur stops the player walking off while the
  // screen is not even in front of them.
  useEffect(() => {
    const drop = () => {
      movePointer.current = null
      lookPointer.current = null
      setStick(null)
      onMove(0, 0, 0)
    }
    window.addEventListener("blur", drop)
    document.addEventListener("visibilitychange", drop)
    return () => {
      window.removeEventListener("blur", drop)
      document.removeEventListener("visibilitychange", drop)
    }
  }, [onMove])

  return (
    <>
      {/* Full-screen capture layer. touchAction none stops the browser from
          treating a drag as a scroll or a pinch mid-look. */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        style={{
          position: "fixed",
          inset: 0,
          touchAction: "none",
          zIndex: 20,
        }}
      />

      {/* Floating stick — only drawn while a thumb is down. */}
      {stick && (
        <div
          style={{
            position: "fixed",
            left: stick.ox - STICK_RADIUS,
            top: stick.oy - STICK_RADIUS,
            width: STICK_RADIUS * 2,
            height: STICK_RADIUS * 2,
            borderRadius: "50%",
            border: "1px solid rgba(232,228,220,0.22)",
            background: "rgba(232,228,220,0.05)",
            zIndex: 21,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: STICK_RADIUS + stick.x - 22,
              top: STICK_RADIUS + stick.y - 22,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(201,169,97,0.30)",
              border: "1px solid rgba(201,169,97,0.6)",
            }}
          />
        </div>
      )}

      {/* Interact. Sits above the capture layer and lights up when something is
          actually in range, so it is not a permanently-live button you learn to
          ignore. */}
      <button
        onPointerDown={(e) => {
          e.stopPropagation()
          onInteract()
        }}
        style={{
          position: "fixed",
          right: 28,
          bottom: 42,
          width: 84,
          height: 84,
          borderRadius: "50%",
          zIndex: 22,
          border: `1px solid ${nearbyLabel ? "rgba(201,169,97,0.85)" : "rgba(232,228,220,0.2)"}`,
          background: nearbyLabel ? "rgba(201,169,97,0.16)" : "rgba(255,255,255,0.04)",
          color: nearbyLabel ? "#c9a961" : "rgba(232,228,220,0.45)",
          fontSize: 10,
          letterSpacing: "0.18em",
          fontFamily: "inherit",
          transition: "background 200ms ease, border-color 200ms ease, color 200ms ease",
        }}
      >
        {nearbyLabel ? "USE" : "—"}
      </button>
    </>
  )
}

/** Clamp helper shared with the page's look handler. */
export function clampPitch(x: number) {
  return Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, x))
}

export { LOOK_SENSITIVITY }
