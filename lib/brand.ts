/**
 * Grey Key Studios brand palette — the single source for every colour the UI
 * paints. Sampled from the master logo, not eyeballed:
 * `logo-files/basic/color.svg` contains exactly four colours, and they are the
 * first four below.
 *
 * The site previously ran on an invented gold (#c9a961) that came from concept
 * mockups and matched nothing the studio actually uses. This module exists so
 * that never silently happens again: if a colour is not in here, it is not a
 * brand colour.
 *
 * Master logo: logo-files/basic/color.svg — the drawn cube in NAVY, wordmark in
 * PAPER, and the key glyph and "Minneapolis" in ACCENT. Other lockups
 * (black/white/inverse/gradient/texture variants) live alongside it.
 */

export const BRAND = {
  /** Logo background. True black, not a near-black. */
  black: "#000000",
  /** Wordmark. Warm off-white — never pure #fff. */
  paper: "#f6f6f6",
  /** Palette accent 1 — lightest blue. Faint states, disabled, hairlines. */
  accent1: "#becdf6",
  /** Palette accent 2 — mid blue. Secondary emphasis, hover. */
  accent2: "#86a4f6",
  /** Palette accent 3 — primary blue. The key glyph and "Minneapolis". */
  accent3: "#4e7cf6",
  /**
   * The logo's drawn cube. Not in the five-swatch palette but present in the
   * master SVG, and it does real work here: the skyline art's night sky
   * measures #152a53, which is this colour within a rounding error. The sky
   * dome, the fog, and the mark are all the same navy — see
   * components/sky-dome.tsx.
   */
  navy: "#1a2952",
} as const

/** Semantic aliases. Prefer these in components; they survive a palette move. */
export const INK = BRAND.black
export const TEXT = BRAND.paper
export const ACCENT = BRAND.accent3
export const ACCENT_SOFT = BRAND.accent2
export const ACCENT_FAINT = BRAND.accent1

const CHANNELS = {
  [BRAND.paper]: "246,246,246",
  [BRAND.accent1]: "190,205,246",
  [BRAND.accent2]: "134,164,246",
  [BRAND.accent3]: "78,124,246",
  [BRAND.navy]: "26,41,82",
  [BRAND.black]: "0,0,0",
} as const

/**
 * `alpha(ACCENT, 0.16)` → "rgba(78,124,246,0.16)".
 *
 * Beats hand-writing rgba() triples, which is how the old palette ended up with
 * gold channel values scattered across six files with no way to grep them back
 * to a name.
 */
export function alpha(hex: string, a: number): string {
  const ch = CHANNELS[hex as keyof typeof CHANNELS]
  if (!ch) throw new Error(`alpha(): ${hex} is not a brand colour — see lib/brand.ts`)
  return `rgba(${ch},${a})`
}
