/**
 * URL for a GLB under public/models/.
 *
 * Always the site's own origin. Production used to fetch these from
 * raw.githubusercontent.com on `main`, a workaround for files over Cloudflare
 * Pages' 25 MiB per-file limit. Nothing in use is that large any more
 * (scripts/validate-static.cjs enforces it), and the workaround had become the
 * bug: preview deploys rendered main's models instead of their own, GitHub raw
 * is not a CDN, and the gate's same-origin warm-up never matched the URL the
 * scene then requested, so the exterior downloaded twice.
 */
export function getModelUrl(filename: string): string {
  return `/models/${encodeURIComponent(filename)}`
}
