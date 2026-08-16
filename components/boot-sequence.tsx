"use client"

import { useEffect, useRef, useState } from "react"
import { useProgress } from "@react-three/drei"
import { LoadingScreen } from "@/components/loading-screen"
import { ACCENT, INK, TEXT } from "@/lib/brand"

/**
 * Opening credits, played over a Canvas that is already streaming behind them.
 *
 * Not decoration. The Stack House pulls tens of MB of GLBs, and a progress bar
 * staring at you for that long is dead time. Mounting the Canvas immediately
 * and running credits over it spends the wait on something deliberate — and on
 * a fast connection the scene is ready before the titles even finish.
 *
 * Handover waits on BOTH conditions: credits finished AND the asset queue
 * drained. Whichever is slower decides. A quick connection therefore sees a
 * clean title sequence; a slow one falls through to the shared LoadingScreen
 * instead of sitting on a frozen card.
 */

interface Card {
  eyebrow?: string
  title?: string
  sub?: string
  /** Renders the studio lockup instead of typeset text. */
  logo?: boolean
  ms: number
}

// Card one is the studio ident, which is what an opening credit actually is —
// so it shows the real logo rather than a typeset imitation of it.
const CARDS: Card[] = [
  { logo: true, ms: 2600 },
  { eyebrow: "A PORTFOLIO BY", title: "MICHAEL WALTON", ms: 2600 },
  { eyebrow: "THE", title: "STACK HOUSE", sub: "INTERACTIVE PORTFOLIO", ms: 2800 },
]

/**
 * Minimum time the loader is on screen once the credits end.
 *
 * On a warm cache the assets finish during the titles, so the loading screen
 * rendered for essentially zero frames — the house-drawing animation existed
 * but nobody ever saw it. The bar is now paced to at least this long, which is
 * enough to read as a real loading beat without becoming a wait.
 */
const MIN_LOADER_MS = 2200

export function BootSequence({ onDone }: { onDone: () => void }) {
  const { progress, active } = useProgress()
  const [cardIndex, setCardIndex] = useState(0)
  const [creditsDone, setCreditsDone] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [shown, setShown] = useState(0)
  const handedOver = useRef(false)
  const loaderStart = useRef(0)
  // Lets the rAF loop below read the live progress without restarting on every
  // update. Declared here, above its first use, rather than after the effect.
  const progressRef = useRef(progress)
  progressRef.current = progress

  // Cards run on their own clock, independent of loading.
  useEffect(() => {
    if (cardIndex >= CARDS.length) {
      setCreditsDone(true)
      return
    }
    const t = setTimeout(() => setCardIndex((i) => i + 1), CARDS[cardIndex].ms)
    return () => clearTimeout(t)
  }, [cardIndex])

  // Paced progress. Ramps to 100 over MIN_LOADER_MS but is CLAMPED to the real
  // figure, so it can never claim 90% while a third of the assets are still in
  // flight — a fast load is paced, a slow one still tells the truth.
  useEffect(() => {
    if (!creditsDone) return
    loaderStart.current = performance.now()
    let raf = 0
    const tick = () => {
      const t = (performance.now() - loaderStart.current) / MIN_LOADER_MS
      setShown(Math.min(progressRef.current, Math.min(1, t) * 100))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [creditsDone])

  // `active` matters as well as progress: drei reports 100 in the gap between
  // one asset finishing and the next being requested, so progress alone would
  // hand over mid-load. `shown` adds the pacing floor on top.
  const ready = creditsDone && !active && progress >= 100 && shown >= 100

  useEffect(() => {
    if (!ready || handedOver.current) return
    handedOver.current = true
    setLeaving(true)
    const t = setTimeout(onDone, 700)
    return () => clearTimeout(t)
  }, [ready, onDone])

  if (creditsDone) return <LoadingScreen progress={shown} leaving={leaving} />

  const card = CARDS[Math.min(cardIndex, CARDS.length - 1)]

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: INK,
        color: TEXT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <div key={cardIndex} style={{ textAlign: "center", animation: "bootFade 700ms ease both" }}>
        {card.logo ? (
          <img
            src="/brand/greykey-lockup.svg"
            alt="Grey Key Studios — Minneapolis"
            width={340}
            height={255}
            style={{ width: "min(340px, 68vw)", height: "auto", display: "block" }}
          />
        ) : (
          <>
            {card.eyebrow && (
              <div style={{ fontSize: 11, letterSpacing: "0.42em", opacity: 0.5, marginBottom: 18 }}>
                {card.eyebrow}
              </div>
            )}
            {/* Title in paper, subtitle in accent — the same division the master
                logo uses, where the wordmark is white and "Minneapolis" is blue.
                An accent-coloured TITLE was the old gold treatment and it
                inverts the lockup. */}
            <div
              style={{ fontSize: "clamp(28px, 5.5vw, 56px)", letterSpacing: "0.16em", fontWeight: 300, color: TEXT }}
            >
              {card.title}
            </div>
            {card.sub && (
              <div style={{ fontSize: 12, letterSpacing: "0.38em", marginTop: 16, color: ACCENT }}>{card.sub}</div>
            )}
          </>
        )}
      </div>

      {/* Skip. Nobody should be trapped in a title sequence on their second
          visit — and a recruiter with thirty seconds certainly should not be. */}
      <button
        onClick={() => setCreditsDone(true)}
        style={{
          position: "fixed",
          bottom: 28,
          right: 32,
          background: "none",
          border: "none",
          color: TEXT,
          opacity: 0.35,
          fontSize: 10,
          letterSpacing: "0.3em",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        SKIP
      </button>

      <style>{`@keyframes bootFade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }`}</style>
    </div>
  )
}
