import type { AABB } from './collision'

/**
 * Scene colliders — all AABB boxes that block player movement.
 *
 * Coordinate system reminder:
 *   X negative = left of house (facing house)
 *   X positive = right (driveway side)
 *   Z negative = toward house / fence
 *   Z positive = toward player start / street
 *
 * Adjust values here if colliders feel off — changes apply to both
 * desktop and mobile controls automatically.
 */
export const COLLIDERS: AABB[] = [
  // ── House ────────────────────────────────────────────────────────────────
  // Front face of the house. Wide enough to cover the full facade + garage.
  { label: 'house-front',   minX: -5.5, maxX: 5.5,  minZ: -6.5,  maxZ: -2.5 },

  // Side walls (stop player walking into the sides)
  { label: 'house-left',    minX: -5.5, maxX: -4.5, minZ: -6.5,  maxZ: 2.0  },
  { label: 'house-right',   minX:  4.5, maxX:  5.5, minZ: -6.5,  maxZ: 2.0  },

  // ── Perimeter Fence ──────────────────────────────────────────────────────
  // Front fence — split into 3 segments around the walkway (X≈0.9) and
  // driveway (X≈4.0) gate gaps. Gap widths: walkway ~1.5, driveway ~3.0.
  { label: 'fence-front-L', minX: -15.0, maxX:  0.1, minZ: -16.5, maxZ: -15.5 },
  { label: 'fence-front-M', minX:  1.7,  maxX:  2.5, minZ: -16.5, maxZ: -15.5 },
  { label: 'fence-front-R', minX:  5.8,  maxX: 15.0, minZ: -16.5, maxZ: -15.5 },

  // Left side fence
  { label: 'fence-left',    minX: -15.5, maxX: -14.5, minZ: -16.0, maxZ:  0.0  },

  // Right side fence
  { label: 'fence-right',   minX:  14.5, maxX:  15.5, minZ: -16.0, maxZ:  0.0  },

  // ── Main Terminal ─────────────────────────────────────────────────────────
  // Terminal sits at approx [-0.65, 0, -4.40], facing player (rotation Y=PI)
  // Pedestal base ~0.4 wide, body ~0.55 wide. Give it a small blocker.
  { label: 'terminal',      minX: -1.1,  maxX:  0.0,  minZ: -4.9,  maxZ: -3.9  },

  // ── Willow Tree Trunk ────────────────────────────────────────────────────
  // Tree placed at [-8, 0, 10], scale 5 — trunk is wide but let's keep
  // the blocker tight so player can walk close to the drape.
  { label: 'willow-trunk',  minX: -9.5,  maxX: -6.5,  minZ:  8.5,  maxZ: 11.5  },
]
