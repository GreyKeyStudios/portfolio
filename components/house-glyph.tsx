"use client"

import { ACCENT, ACCENT_SOFT } from "@/lib/brand"

/**
 * The Stack House as an architectural line drawing that resolves as assets load.
 *
 * Replaces a bare percentage bar with something that belongs to this project:
 * the blueprint draws itself in as the queue drains, then the windows warm up
 * one storey at a time — basement, ground, second, attic — mirroring the actual
 * building. By the time you spawn in, the house on screen is lit and so is the
 * one you walk into.
 *
 * Deliberately inline SVG rather than an image asset: it has to be driven by a
 * live number, it costs nothing to load (which matters in a *loading* screen),
 * and it survives a rebrand as a colour change.
 *
 * `pathLength="100"` normalises every path so one progress value drives the
 * dash offset regardless of a path's real geometric length.
 */

interface Props {
  /** 0–100. */
  progress: number
  size?: number
}

// Windows, grouped by storey, lit in order as progress climbs.
const WINDOWS: { x: number; y: number; at: number }[] = [
  // basement
  { x: 56, y: 132, at: 14 }, { x: 132, y: 132, at: 18 },
  // ground
  { x: 56, y: 106, at: 34 }, { x: 132, y: 106, at: 38 },
  // second
  { x: 56, y: 84, at: 56 }, { x: 92, y: 84, at: 60 }, { x: 132, y: 84, at: 64 },
  // attic
  { x: 92, y: 56, at: 84 },
]

export function HouseGlyph({ progress, size = 190 }: Props) {
  const draw = Math.min(100, progress * 1.25) // outline completes a little early
  const dash = { pathLength: 100, strokeDasharray: 100, strokeDashoffset: 100 - draw } as const

  return (
    <svg
      width={size}
      height={size * 0.82}
      viewBox="0 0 200 164"
      fill="none"
      stroke={ACCENT}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ overflow: "visible" }}
      aria-hidden
    >
      {/* Ground line */}
      <path d="M18 150 H182" {...dash} opacity={0.35} />

      {/* Body */}
      <path d="M46 150 V74 H154 V150" {...dash} />

      {/* Gable */}
      <path d="M36 76 L100 30 L164 76" {...dash} />

      {/* Floor plates — the four storeys, which is the whole conceit */}
      <path d="M46 122 H154" {...dash} opacity={0.55} />
      <path d="M46 98 H154" {...dash} opacity={0.55} />
      <path d="M46 74 H154" {...dash} opacity={0.55} />

      {/* Door */}
      <path d="M92 150 V128 H108 V150" {...dash} />

      {/* Windows — drawn with the outline, then lit one storey at a time. */}
      {WINDOWS.map((w, i) => {
        const lit = progress >= w.at
        return (
          <rect
            key={i}
            x={w.x}
            y={w.y}
            width={12}
            height={10}
            rx={1}
            // A step lighter than the outline so a lit window reads as light
            // coming out of the building rather than as more line work.
            fill={ACCENT_SOFT}
            stroke="none"
            style={{
              opacity: lit ? 0.95 : 0.07,
              transition: "opacity 520ms ease",
            }}
          />
        )
      })}
    </svg>
  )
}
