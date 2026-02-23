import type { AABB } from './collision'

/**
 * Scene colliders — all AABB boxes that block player movement.
 *
 * Coordinate system:
 *   X negative = player's left (facing house from street)
 *   X positive = player's right (driveway side)
 *   Z negative = toward house
 *   Z positive = toward street / player start
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

  // ── All others disabled — re-enable one at a time after house is solid ────
  // { label: 'terminal',      minX: -1.0,  maxX:  0.0,  minZ: -4.75, maxZ: -4.05 },
  // { label: 'willow-trunk',  minX: -9.5,  maxX: -6.5,  minZ:  8.5,  maxZ: 11.5  },
  // { label: 'fence-front-L', minX: -15.0, maxX:  0.15, minZ: -16.5, maxZ: -15.5 },
  // { label: 'fence-front-M', minX:  1.65, maxX:  2.5,  minZ: -16.5, maxZ: -15.5 },
  // { label: 'fence-front-R', minX:  5.5,  maxX: 15.0,  minZ: -16.5, maxZ: -15.5 },
  // { label: 'fence-left',    minX: -15.5, maxX: -14.5, minZ: -16.0, maxZ:  0.0  },
  // { label: 'fence-right',   minX:  14.5, maxX:  15.5, minZ: -16.0, maxZ:  0.0  },
]
