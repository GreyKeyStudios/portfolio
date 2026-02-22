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
  // Thin front wall — player can walk up close to interact with the door
  // (door at Z≈-2.8) and the terminal (at Z≈-4.4). Wall sits at the facade
  // surface so player stops just outside it, not 2 units away.
  // Front door is at X≈0.9, so leave the full front open — no cutout needed
  // (the door interaction zone handles entry, not collision).
  { label: 'house-front',  minX: -5.5, maxX: 5.5,  minZ: -6.5, maxZ: -5.8 },

  // Side walls — only block the rear portion so player can walk along the
  // sides of the house to reach the back yard area.
  { label: 'house-left',   minX: -5.8, maxX: -4.8, minZ: -6.5, maxZ: -2.0 },
  { label: 'house-right',  minX:  4.8, maxX:  5.8, minZ: -6.5, maxZ: -2.0 },

  // ── Perimeter Fence ──────────────────────────────────────────────────────
  // Front fence — 3 segments with gate gaps.
  // Walkway gap: X 0.15 → 1.65 (centered on walkway at X=0.9, ~1.5 wide)
  // Driveway gap: X 2.5 → 5.5 (centered on driveway at X=4.0, ~3.0 wide)
  { label: 'fence-front-L', minX: -15.0, maxX:  0.15, minZ: -16.5, maxZ: -15.5 },
  { label: 'fence-front-M', minX:  1.65,  maxX:  2.5,  minZ: -16.5, maxZ: -15.5 },
  { label: 'fence-front-R', minX:  5.5,   maxX: 15.0,  minZ: -16.5, maxZ: -15.5 },

  // Left side fence
  { label: 'fence-left',    minX: -15.5, maxX: -14.5, minZ: -16.0, maxZ: 0.0 },

  // Right side fence
  { label: 'fence-right',   minX:  14.5, maxX:  15.5, minZ: -16.0, maxZ: 0.0 },

  // ── Main Terminal ─────────────────────────────────────────────────────────
  // Terminal at [-0.65, 0, -4.40], facing player. Thin blocker — player
  // needs to get close (within 3.5 units) to trigger interaction.
  // Collider stops player walking INTO it, not from approaching it.
  { label: 'terminal',      minX: -1.0, maxX:  0.0, minZ: -4.75, maxZ: -4.05 },

  // ── Willow Tree Trunk ────────────────────────────────────────────────────
  // Tree at [-8, 0, 10], scale 5. Tight trunk blocker.
  { label: 'willow-trunk',  minX: -9.5, maxX: -6.5, minZ: 8.5, maxZ: 11.5 },
]
