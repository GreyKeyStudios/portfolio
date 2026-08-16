import type { AABB } from './collision'

/**
 * Scene colliders — all AABB boxes that block player movement.
 *
 * Coordinate system:
 *   X negative = player's left (facing house from street)
 *   X positive = player's right (driveway side)
 *   Z negative = toward the street / player spawn
 *   Z positive = toward the backyard
 *
 * Fence bounds mirror the runs in components/perimeter-fence.tsx. If you move a
 * fence line there, update the matching entry here — the fence is instanced
 * geometry, so there's no automatic bbox to read back.
 *
 * ── HOW TO CALIBRATE HOUSE BOUNDS ───────────────────────────────────────────
 * 1. npm run dev
 * 2. Open browser console (F12)
 * 3. Look for: [house] world-space bounds after Y-align: { minX, maxX, minZ, maxZ }
 * 4. Paste those exact values into the 'house' entry below
 * 5. Save — collision updates immediately on hot reload
 * ────────────────────────────────────────────────────────────────────────────
 */
export const COLLIDERS: AABB[] = [
  // ── House — single solid box, entire footprint ───────────────────────────
  // Measured from console: minX -4.735, maxX 6.172, minZ -4.471, maxZ 4.539
  // Added 0.1 buffer on all sides so wall feels solid, not paper-thin.
  // Front door interaction zone (proximity) handles entry — no gap needed here.
  { label: 'house', minX: -4.835, maxX: 6.272, minZ: -4.571, maxZ: 4.639 },

  // ── Front fence line (Z=-16), broken by the two gate openings ────────────
  // Walkway opening X=0.15..1.65, driveway opening X=2.5..5.5
  { label: 'fence-front-L', minX: -15.1, maxX: 0.25, minZ: -16.2, maxZ: -15.8 },
  { label: 'fence-front-M', minX: 1.55, maxX: 2.6, minZ: -16.2, maxZ: -15.8 },
  { label: 'fence-front-R', minX: 5.4, maxX: 15.1, minZ: -16.2, maxZ: -15.8 },

  // ── Side + back fence lines enclosing the backyard ───────────────────────
  { label: 'fence-left', minX: -15.2, maxX: -14.8, minZ: -16.2, maxZ: 14.2 },
  { label: 'fence-right', minX: 14.8, maxX: 15.2, minZ: -16.2, maxZ: 14.2 },
  { label: 'fence-back', minX: -15.1, maxX: 15.1, minZ: 13.8, maxZ: 14.2 },

  // ── Props ────────────────────────────────────────────────────────────────
  // Terminal at [-0.65, 0, -6.0]; body is 0.55 wide × ~0.4 deep.
  { label: 'terminal', minX: -0.95, maxX: -0.35, minZ: -6.25, maxZ: -5.75 },

  // Willow at [-8, 0, 10] scaled 5×. Only the trunk blocks — the canopy hangs
  // overhead and the player should be able to walk under its outer fringe.
  { label: 'willow-trunk', minX: -8.5, maxX: -7.5, minZ: 9.5, maxZ: 10.5 },
]
