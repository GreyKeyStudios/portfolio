"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useGLTF, useTexture } from "@react-three/drei"

const GOLD = "#c9a961"

/**
 * The gate. Two doors: a recruiter-friendly portfolio, and the house.
 *
 * This page also WARMS THE CACHE. Hovering "Enter The Stack House" starts
 * pulling the heaviest GLBs, so by the time the credits are playing on /house
 * a good chunk of the payload is already in the browser cache. Costs nothing
 * for anyone who takes the other door, because it only fires on intent.
 */

// Heaviest first — these dominate the load.
const WARM = [
  "/models/tree-main-optimized.glb",
  "/models/house-main-optimized.glb",
  "/models/interior-ground.glb",
  "/models/interior-second.glb",
  "/models/interior-basement.glb",
  "/models/interior-attic.glb",
]

function warmCache() {
  WARM.forEach((u) => useGLTF.preload(u))
  useTexture.preload("/textures/skyline.png")
}

export default function Gate() {
  // Also warm on idle, for anyone who lands and reads before choosing.
  useEffect(() => {
    const id = window.setTimeout(warmCache, 2500)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "radial-gradient(120% 90% at 50% 0%, #14141a 0%, #08080a 60%)",
        color: "#e8e4dc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 56,
        padding: "48px 24px",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <header style={{ textAlign: "center" }}>
        <div style={{ fontSize: "clamp(26px, 4.6vw, 44px)", letterSpacing: "0.2em", fontWeight: 300, color: GOLD }}>
          GREY KEY
        </div>
        <div style={{ fontSize: 11, letterSpacing: "0.52em", opacity: 0.5, marginTop: 12 }}>S T U D I O S</div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 300px))",
          gap: 20,
          justifyContent: "center",
          width: "100%",
          maxWidth: 660,
        }}
      >
        <GateCard
          href="/portfolio"
          title="STANDARD PORTFOLIO"
          sub="Clean. Simple. Professional."
          accent="#7d848f"
        />
        <GateCard
          href="/house"
          title="ENTER THE STACK HOUSE"
          sub="An Interactive Experience"
          accent={GOLD}
          primary
          onIntent={warmCache}
        />
      </div>

      <footer style={{ fontSize: 10, letterSpacing: "0.34em", opacity: 0.32 }}>CHOOSE YOUR PATH</footer>
    </main>
  )
}

function GateCard({
  href,
  title,
  sub,
  accent,
  primary,
  onIntent,
}: {
  href: string
  title: string
  sub: string
  accent: string
  primary?: boolean
  onIntent?: () => void
}) {
  return (
    <Link
      href={href}
      // Intent, not click — a hover or a focus is enough to start fetching, and
      // buys most of a second before the route even changes.
      onMouseEnter={onIntent}
      onFocus={onIntent}
      onTouchStart={onIntent}
      style={{
        display: "block",
        padding: "34px 26px",
        textDecoration: "none",
        color: "inherit",
        border: `1px solid ${primary ? accent + "88" : "#ffffff1a"}`,
        background: primary ? "rgba(201,169,97,0.05)" : "rgba(255,255,255,0.02)",
        transition: "border-color 220ms ease, background 220ms ease, transform 220ms ease",
        textAlign: "center",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = accent
        e.currentTarget.style.transform = "translateY(-2px)"
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = primary ? accent + "88" : "#ffffff1a"
        e.currentTarget.style.transform = "none"
      }}
    >
      <div style={{ fontSize: 13, letterSpacing: "0.22em", color: primary ? accent : "#e8e4dc" }}>{title}</div>
      <div style={{ fontSize: 11, opacity: 0.45, marginTop: 12, letterSpacing: "0.06em" }}>{sub}</div>
    </Link>
  )
}
