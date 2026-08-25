"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect } from "react"
import { useGLTF, useTexture } from "@react-three/drei"
import "./gate.css"

const GateScene = dynamic(() => import("@/components/gate-scene").then((module) => module.GateScene), { ssr: false })

const HOUSE_ASSETS = [
  "/models/tree-main-optimized.glb",
  "/models/house-main-optimized.glb",
  "/models/interior-ground.glb",
  "/models/interior-second.glb",
  "/models/interior-basement.glb",
  "/models/interior-attic.glb",
]

function warmHouse() {
  HOUSE_ASSETS.forEach((url) => useGLTF.preload(url))
  useTexture.preload("/textures/minneapolis-skyline-cinematic.png")
}

export default function Gate() {
  useEffect(() => {
    const id = window.setTimeout(warmHouse, 2800)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <main className="gate">
      <div className="gate__sky" aria-hidden="true" />
      <div className="gate__haze" aria-hidden="true" />
      <div className="gate__house" aria-hidden="true"><GateScene /></div>
      <div className="gate__grain" aria-hidden="true" />
      <header className="gate__brand">
        <img src="/brand/greykey-lockup.svg" alt="Grey Key Studios — Minneapolis" />
      </header>
      <section className="gate__content" aria-label="Choose a portfolio experience">
        <div className="gate__choices">
        <GateCard
          href="/portfolio"
          title="VIEW THE WORK"
          sub="Selected projects, case studies, experiments, and music."
        />
        <GateCard
          href="/house"
          title="ENTER THE STACK HOUSE"
          sub="Explore the full interactive experience."
          primary
          onIntent={warmHouse}
        />
        </div>
        <div className="gate__prompt" aria-hidden="true"><span /><p>CHOOSE YOUR PATH</p><b>⚿</b><span /></div>
      </section>
      <p className="gate__manifesto">BUILDING <em>SOFTWARE.</em> EXPERIENCING <em>HISTORY.</em> MAKING <em>MUSIC.</em> CREATING <em>WORLDS.</em></p>
    </main>
  )
}

function GateCard({
  href,
  title,
  sub,
  primary,
  onIntent,
}: {
  href: string
  title: string
  sub: string
  primary?: boolean
  onIntent?: () => void
}) {
  return (
    <Link
      href={href}
      className={`gate-choice${primary ? " gate-choice--primary" : ""}`}
      onMouseEnter={onIntent}
      onFocus={onIntent}
      onTouchStart={onIntent}
    >
      <span className="gate-choice__text"><strong>{title}</strong><span>{sub}</span></span>
      <span className="gate-choice__arrow" aria-hidden="true">→</span>
    </Link>
  )
}
