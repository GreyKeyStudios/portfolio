const GITHUB_BASE =
  "https://raw.githubusercontent.com/GreyKeyStudios/portfolio/main/public/models"

/**
 * Returns the correct URL for a GLB model file based on the environment.
 *
 * - Development: loads from /public/models/ locally (no GitHub dependency,
 *   no 100MB file size limit — oversized files like grass-1.glb work fine)
 * - Production: loads from GitHub raw CDN (same as before for committed files;
 *   local-only oversized files will gracefully 404 until hosted elsewhere)
 */
export function getModelUrl(filename: string): string {
  if (process.env.NODE_ENV === "development") {
    return `/models/${filename}`
  }
  return `${GITHUB_BASE}/${encodeURIComponent(filename)}`
}
