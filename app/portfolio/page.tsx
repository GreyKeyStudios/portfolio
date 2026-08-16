"use client"

import Link from "next/link"

const GOLD = "#c9a961"

/**
 * PLACEHOLDER. The recruiter-friendly side, pending design.
 *
 * Exists so the gate has somewhere real to point and so the route is in the
 * static export from the start — a dead link on the front door is worse than
 * a holding page, and adding the route later would mean re-testing deployment.
 * Content and layout are entirely open.
 */
export default function Portfolio() {
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
        gap: 28,
        padding: 24,
        textAlign: "center",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.42em", opacity: 0.45 }}>A PORTFOLIO BY</div>
      <h1 style={{ fontSize: "clamp(26px, 5vw, 46px)", letterSpacing: "0.16em", fontWeight: 300, color: GOLD, margin: 0 }}>
        MICHAEL WALTON
      </h1>

      <p style={{ maxWidth: 460, fontSize: 13, lineHeight: 1.9, opacity: 0.45, letterSpacing: "0.03em" }}>
        The standard portfolio is being built. The interactive version is fully
        walkable — and very much still a work in progress.
      </p>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
        <Link
          href="/house"
          style={{
            padding: "13px 26px",
            border: `1px solid ${GOLD}88`,
            color: GOLD,
            textDecoration: "none",
            fontSize: 11,
            letterSpacing: "0.24em",
            background: "rgba(201,169,97,0.05)",
          }}
        >
          ENTER THE STACK HOUSE
        </Link>
        <Link
          href="/"
          style={{
            padding: "13px 26px",
            border: "1px solid #ffffff1a",
            color: "#e8e4dc",
            textDecoration: "none",
            fontSize: 11,
            letterSpacing: "0.24em",
            opacity: 0.7,
          }}
        >
          BACK
        </Link>
      </div>
    </main>
  )
}
