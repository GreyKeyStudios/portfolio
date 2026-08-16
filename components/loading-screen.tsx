"use client"

import { useProgress } from "@react-three/drei"
import { HouseGlyph } from "@/components/house-glyph"

/**
 * Reusable loading overlay.
 *
 * Deliberately not welded to first launch — anything that needs a beat to
 * stream in should use this rather than growing its own: entering the house,
 * the easter-egg transition, the second building, any future heavy scene. One
 * component means one visual language for "wait a moment", which is most of
 * what makes a loading screen feel intentional instead of like a stall.
 *
 * Drive it either way:
 *   <LoadingScreen />                       — follows drei's asset queue
 *   <LoadingScreen progress={n} />          — you own the number
 */

export const GOLD = "#c9a961"

const STAGES = [
  "PREPARING ENVIRONMENT",
  "LOADING ASSETS",
  "INITIALIZING SYSTEMS",
  "FINALIZING EXPERIENCE",
]

export interface LoadingScreenProps {
  /** 0–100. Omit to follow the three.js loading manager via drei. */
  progress?: number
  label?: string
  /** Replaces the auto stage caption. */
  stage?: string
  /** Fades out rather than unmounting, so the handover isn't a hard cut. */
  leaving?: boolean
  /** Transparent backdrop, for overlaying a scene that is already rendering. */
  overlay?: boolean
}

export function LoadingScreen({
  progress,
  label = "LOADING EXPERIENCE",
  stage,
  leaving = false,
  overlay = false,
}: LoadingScreenProps) {
  const auto = useProgress()
  const pct = progress ?? auto.progress
  const detail = progress === undefined && auto.active && auto.item ? auto.item.split("/").pop() : ""
  const caption = stage ?? STAGES[Math.min(STAGES.length - 1, Math.floor((pct / 100) * STAGES.length))]

  return (
    <div
      aria-hidden={leaving}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: overlay ? "rgba(8,8,10,0.82)" : "#08080a",
        backdropFilter: overlay ? "blur(6px)" : undefined,
        color: "#e8e4dc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        opacity: leaving ? 0 : 1,
        transition: "opacity 700ms ease",
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      <div style={{ width: "min(520px, 78vw)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* The house draws itself in and lights up storey by storey as the
            queue drains — see HouseGlyph. Reads as part of the building rather
            than a generic progress widget. */}
        <div style={{ marginBottom: 34 }}>
          <HouseGlyph progress={pct} />
        </div>

        <div style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.32em", opacity: 0.6 }}>{label}</span>
          <span style={{ fontSize: 11, letterSpacing: "0.1em", color: GOLD }}>{Math.round(pct)}%</span>
        </div>

        <div style={{ height: 2, background: "#ffffff14", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: GOLD, transition: "width 240ms ease" }} />
        </div>

        <div style={{ marginTop: 18, fontSize: 10, letterSpacing: "0.26em", opacity: 0.4, minHeight: 14 }}>
          {caption}
        </div>

        {/* Which file is actually in flight. Genuinely useful on a slow deploy
            when you need to know what the holdup is rather than guessing. */}
        <div style={{ marginTop: 6, fontSize: 9, letterSpacing: "0.08em", opacity: 0.22, minHeight: 12 }}>
          {detail}
        </div>
        </div>
      </div>
    </div>
  )
}
