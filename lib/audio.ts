/**
 * Procedural audio via Web Audio API — no sound files required.
 * All sounds are synthesized in real time.
 *
 * Usage:
 *   import { playSound } from '@/lib/audio'
 *   playSound('locked')
 *   playSound('unlock')
 *   playSound('interact')
 *   playSound('confetti')
 */

let _ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  // AudioContext can be suspended until user gesture — resume on demand
  if (_ctx.state === 'suspended') {
    _ctx.resume()
  }
  return _ctx
}

// ── Sound definitions ────────────────────────────────────────────────────────

/**
 * Low buzzing "locked" sound — two short pulses that rise then drop.
 */
function playLocked() {
  const ctx = getCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(120, now)
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.15)

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.18, now + 0.02)
  gain.gain.linearRampToValueAtTime(0.18, now + 0.13)
  gain.gain.linearRampToValueAtTime(0, now + 0.18)

  // Second pulse
  osc.frequency.setValueAtTime(100, now + 0.22)
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.36)

  gain.gain.setValueAtTime(0, now + 0.22)
  gain.gain.linearRampToValueAtTime(0.14, now + 0.24)
  gain.gain.linearRampToValueAtTime(0.14, now + 0.34)
  gain.gain.linearRampToValueAtTime(0, now + 0.40)

  osc.start(now)
  osc.stop(now + 0.45)
}

/**
 * Rising chime — terminal unlock / door open confirmation.
 * Three ascending tones.
 */
function playUnlock() {
  const ctx = getCtx()
  const freqs = [440, 554, 659] // A4, C#5, E5 — major triad

  freqs.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.12
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.22, t + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)

    osc.start(t)
    osc.stop(t + 0.5)
  })
}

/**
 * Soft click / blip — generic interact confirmation.
 */
function playInteract() {
  const ctx = getCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, now)
  osc.frequency.exponentialRampToValueAtTime(660, now + 0.06)

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.15, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

  osc.start(now)
  osc.stop(now + 0.15)
}

/**
 * Bright sparkle burst — confetti / Touch Grass easter egg.
 * Random-pitched short tones in rapid succession.
 */
function playConfetti() {
  const ctx = getCtx()
  const sparkleCount = 8

  for (let i = 0; i < sparkleCount; i++) {
    const t = ctx.currentTime + i * 0.045
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Random pentatonic-ish freq: 800–2400 Hz
    const freq = 800 + Math.random() * 1600
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, t + 0.1)

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.12, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)

    osc.start(t)
    osc.stop(t + 0.18)
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export type SoundId = 'locked' | 'unlock' | 'interact' | 'confetti'

export function playSound(id: SoundId) {
  // Guard: Web Audio not available in SSR
  if (typeof window === 'undefined') return

  try {
    switch (id) {
      case 'locked':    return playLocked()
      case 'unlock':    return playUnlock()
      case 'interact':  return playInteract()
      case 'confetti':  return playConfetti()
    }
  } catch (e) {
    // Audio errors should never crash the scene
    console.warn('[audio] playSound failed:', e)
  }
}
