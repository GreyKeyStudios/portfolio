"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useGLTF, useTexture } from "@react-three/drei"
import { ACCENT, ACCENT_FAINT, TEXT, alpha } from "@/lib/brand"

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
        // Black ground with the faintest lift of brand navy at the top, so the
        // gate reads as the logo's own black rather than a generic dark page.
        background: "radial-gradient(120% 90% at 50% 0%, #0e1424 0%, #000000 62%)",
        color: TEXT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 56,
        padding: "48px 24px",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      {/* The real lockup, not a typeset approximation of it. Copied from
          logo-files/basic/transparent.svg — the variant with no background
          rect, so it sits on the gate's own black. The drawn cube happens to
          be exactly the right mark for this project: the whole site is a box
          you walk into. */}
      <header style={{ textAlign: "center" }}>
        <img
          src="/brand/greykey-lockup.svg"
          alt="Grey Key Studios — Minneapolis"
          width={300}
          height={225}
          style={{ width: "min(300px, 62vw)", height: "auto", display: "block" }}
        />
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
          accent={ACCENT_FAINT}
        />
        <GateCard
          href="/house"
          title="ENTER THE STACK HOUSE"
          sub="An Interactive Experience"
          accent={ACCENT}
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
        border: `1px solid ${primary ? accent + "88" : alpha(TEXT, 0.1)}`,
        background: primary ? alpha(ACCENT, 0.06) : alpha(TEXT, 0.02),
        transition: "border-color 220ms ease, background 220ms ease, transform 220ms ease",
        textAlign: "center",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = accent
        e.currentTarget.style.transform = "translateY(-2px)"
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = primary ? accent + "88" : alpha(TEXT, 0.1)
        e.currentTarget.style.transform = "none"
      }}
    >
      <div style={{ fontSize: 13, letterSpacing: "0.22em", color: primary ? accent : TEXT }}>{title}</div>
      <div style={{ fontSize: 11, opacity: 0.45, marginTop: 12, letterSpacing: "0.06em" }}>{sub}</div>
    </Link>
  )
}
