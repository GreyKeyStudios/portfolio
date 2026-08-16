"use client"

import { useRef, useEffect } from "react"

interface TouchCameraProps {
  onMove: (deltaX: number, deltaY: number) => void
}

export function TouchCamera({ onMove }: TouchCameraProps) {
  const touchId = useRef<number | null>(null)
  const lastPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only capture touches on the right side of the screen
      const touch = e.touches[0]
      if (touch.clientX > window.innerWidth / 2) {
        touchId.current = touch.identifier
        lastPos.current = { x: touch.clientX, y: touch.clientY }
        e.preventDefault()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchId.current === null) return

      const touch = Array.from(e.touches).find((t) => t.identifier === touchId.current)
      if (!touch) return

      const deltaX = touch.clientX - lastPos.current.x
      const deltaY = touch.clientY - lastPos.current.y

      onMove(-deltaX, deltaY)

      lastPos.current = { x: touch.clientX, y: touch.clientY }
      e.preventDefault()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touches = Array.from(e.changedTouches)
      if (touches.some((t) => t.identifier === touchId.current)) {
        touchId.current = null
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: false })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [onMove])

  return <div className="fixed top-8 right-8 text-white/60 text-xs pointer-events-none">Touch right side to look</div>
}
