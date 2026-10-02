/**
 * This file was committed EMPTY in the first Cloudflare deploy (088a5a7), so
 * Tailwind never ran: every utility class in the app shipped as dead CSS. The
 * hand-written gate/portfolio CSS did not notice, but the house overlays did —
 * the Home Office panel's `fixed inset-0` never applied, so it rendered as a
 * static block below the full-screen canvas, off-screen (found 2026-10-01).
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
