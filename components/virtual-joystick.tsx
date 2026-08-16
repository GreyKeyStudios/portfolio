"use client"

import { useRef, useState, useEffect } from "react"

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void
}

export function VirtualJoystick({ onMove }: VirtualJoystickProps) {
  const [active, setActive] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const touchId = useRef<number | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const maxDistance = 50

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()

      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i]

        if (
          touchId.current === null && // Only capture if not already active
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          touchId.current = touch.identifier
          startPos.current = { x: touch.clientX, y: touch.clientY }
          setActive(true)
          break
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchId.current === null) return

      const touch = Array.from(e.touches).find((t) => t.identifier === touchId.current)
      if (!touch) return

      const deltaX = touch.clientX - startPos.current.x
      const deltaY = touch.clientY - startPos.current.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX)
        setPosition({
          x: Math.cos(angle) * maxDistance,
          y: Math.sin(angle) * maxDistance,
        })
        onMove(Math.cos(angle), Math.sin(angle))
      } else {
        setPosition({ x: deltaX, y: deltaY })
        onMove(deltaX / maxDistance, deltaY / maxDistance)
      }
      e.preventDefault()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touches = Array.from(e.changedTouches)
      if (touches.some((t) => t.identifier === touchId.current)) {
        touchId.current = null
        setActive(false)
        setPosition({ x: 0, y: 0 })
        onMove(0, 0)
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

  return (
    <div
      ref={containerRef}
      className="fixed bottom-8 left-8 w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center"
    >
      <div
        className="w-16 h-16 rounded-full bg-white/60 transition-transform"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          opacity: active ? 1 : 0.5,
        }}
      />
    </div>
  )
}
