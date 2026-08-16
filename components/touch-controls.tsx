"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ACCENT, TEXT, alpha } from "@/lib/brand"

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
 * ── Why move/end are on WINDOW rather than the element ─────────────────────
 * The stick kept walking after the finger lifted, and only stopped on the next
 * touch. The element-level pointerup was not arriving: an earlier version
 * called setPointerCapture, and on iOS a captured touch pointer can be
 * retargeted or have its capture dropped — which fires lostpointercapture and
 * NO pointerup. The element then never learns the gesture ended.
 *
 * Window listeners sidestep the whole class of problem. They fire wherever the
 * finger goes and whatever the capture state, so no arrangement of retargeting
 * can strand the stick on. pointerdown stays on the element because it is the
 * only part that needs to know WHERE the touch landed, and every plausible
 * end-of-gesture signal is treated as an end: pointerup, pointercancel,
 * lostpointercapture, touchend, touchcancel, blur, and the tab being hidden.
 * Belt and braces deliberately — this bug is invisible in emulation and
 * infuriating on a real device.
 */

/**
 * Height of the strip along the top edge the capture layer does NOT claim.
 *
 * touch-action:none over the whole viewport swallows the browser's own
 * gestures — pull-to-refresh, and the swipe that brings back a hidden address
 * bar. On a phone that leaves no way to reload the page at all. Leaving the top
 * edge free restores browser chrome while keeping gesture protection over the
 * part of the screen you actually play in.
 */
const TOP_SAFE = 40

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
  const origin = useRef({ x: 0, y: 0 })
  const lookLast = useRef({ x: 0, y: 0 })

  // Window listeners register once; refs keep their callbacks from going stale.
  const onMoveRef = useRef(onMove)
  const onLookRef = useRef(onLook)
  onMoveRef.current = onMove
  onLookRef.current = onLook

  const releaseMove = useCallback(() => {
    movePointer.current = null
    setStick(null)
    onMoveRef.current(0, 0, 0)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Left half drives movement, right half drives look. Whichever side the
    // finger lands on owns that pointer until it lifts.
    //
    // Deliberately NO setPointerCapture — see the note at the top of this file.
    const half = window.innerWidth / 2
    if (e.clientX < half) {
      if (movePointer.current !== null) return
      movePointer.current = e.pointerId
      origin.current = { x: e.clientX, y: e.clientY }
      setStick({ ox: e.clientX, oy: e.clientY, x: 0, y: 0 })
    } else {
      if (lookPointer.current !== null) return
      lookPointer.current = e.pointerId
      lookLast.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (e.pointerId === movePointer.current) {
        let dx = e.clientX - origin.current.x
        let dy = e.clientY - origin.current.y
        const d = Math.hypot(dx, dy)
        // Clamp to the ring so the knob cannot be dragged off its base.
        if (d > STICK_RADIUS) {
          dx = (dx / d) * STICK_RADIUS
          dy = (dy / d) * STICK_RADIUS
        }
        const nx = dx / STICK_RADIUS
        const ny = dy / STICK_RADIUS
        const mag = Math.hypot(nx, ny)
        if (mag < DEAD_ZONE) onMoveRef.current(0, 0, 0)
        else {
          // Rescale past the dead zone so the first millimetre of travel does
          // not jump straight to a noticeable speed.
          const k = (mag - DEAD_ZONE) / (1 - DEAD_ZONE) / mag
          onMoveRef.current(nx * k, ny * k, mag)
        }
        setStick((s) => (s ? { ...s, x: dx, y: dy } : s))
      } else if (e.pointerId === lookPointer.current) {
        onLookRef.current(e.clientX - lookLast.current.x, e.clientY - lookLast.current.y)
        lookLast.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleEnd = (e: PointerEvent) => {
      if (e.pointerId === movePointer.current) releaseMove()
      else if (e.pointerId === lookPointer.current) lookPointer.current = null
    }

    // Touch events carry no pointerId, and touchend/touchcancel can arrive when
    // the pointer equivalents do not. If no touches remain, nothing can still
    // be held, so drop everything.
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        lookPointer.current = null
        releaseMove()
      }
    }

    // A call, a notification shade, or an app switch delivers no release at all.
    const dropAll = () => {
      lookPointer.current = null
      releaseMove()
    }

    window.addEventListener("pointermove", handleMove, { passive: true })
    window.addEventListener("pointerup", handleEnd)
    window.addEventListener("pointercancel", handleEnd)
    window.addEventListener("lostpointercapture", handleEnd)
    window.addEventListener("touchend", handleTouchEnd, { passive: true })
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true })
    window.addEventListener("blur", dropAll)
    document.addEventListener("visibilitychange", dropAll)

    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleEnd)
      window.removeEventListener("pointercancel", handleEnd)
      window.removeEventListener("lostpointercapture", handleEnd)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("touchcancel", handleTouchEnd)
      window.removeEventListener("blur", dropAll)
      document.removeEventListener("visibilitychange", dropAll)
    }
  }, [releaseMove])

  return (
    <>
      {/* Capture layer. touchAction none stops a drag being treated as a scroll
          or pinch mid-look. Inset from the top so the browser keeps its own
          edge gestures — see TOP_SAFE. Only pointerdown lives here. */}
      <div
        onPointerDown={onPointerDown}
        style={{
          position: "fixed",
          top: TOP_SAFE,
          left: 0,
          right: 0,
          bottom: 0,
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
            border: `1px solid ${alpha(TEXT, 0.22)}`,
            background: alpha(TEXT, 0.05),
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
              background: alpha(ACCENT, 0.3),
              border: `1px solid ${alpha(ACCENT, 0.6)}`,
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
          border: `1px solid ${nearbyLabel ? alpha(ACCENT, 0.85) : alpha(TEXT, 0.2)}`,
          background: nearbyLabel ? alpha(ACCENT, 0.16) : alpha(TEXT, 0.04),
          color: nearbyLabel ? ACCENT : alpha(TEXT, 0.45),
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
