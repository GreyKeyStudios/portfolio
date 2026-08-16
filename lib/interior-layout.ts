/**
 * Single source of truth for the Stack House interior floor plan.
 *
 * Built from the architectural sheet (11.0m × 9.0m, four floors, switchback
 * core), with three corrections applied where the sheet contradicted itself.
 * The corrected numbers win — see CORRECTIONS below.
 *
 * Interior floors live at X0=300 in world space; the yard clamps movement to
 * x∈[-25,25] (fps-controls.tsx), so this sits with a huge margin and can never
 * be walked into from outside.
 *
 * This data drives collision (interior-colliders.ts), vertical movement
 * (use-player-vertical.ts) AND the visible geometry — scripts/build-interior.cjs
 * regenerates the floor GLBs from these same numbers, using the same door-gap
 * algorithm the colliders use. Change a room here, run `npm run build:interior`,
 * and what you see matches what you collide with by construction.
 *
 * ── CORRECTIONS TO THE SHEET ────────────────────────────────────────────────
 * 1. Basement width chain was 3.3/2.6/5.1, which put the stair core at local
 *    X3.3–5.9 while the upper floors put it at X3.7–7.3. They overlap by only
 *    2.2m and a two-flight switchback needs 2.4m, so the staircase could not
 *    physically run basement→ground as drawn. Corrected to 3.7/2.6/4.7 — which
 *    also makes Grey Key Studios net out to the 35.8m² the sheet states, so the
 *    areas were computed from 4.7 and the 3.3 label was the typo.
 * 2. "Flight run: 1.25m" implies 1.6m of rise over 1.25m = 52°, contradicting
 *    the sheet's own ~35° pitch and ~4.7m developed run. Kept the pitch: each
 *    flight runs 2.3m, giving 34.8°.
 * 3. Second-floor right column read 3.2 + 2.5 = 5.7 against a 9.0m depth.
 *    The missing 3.3m goes to the Nook (2.5 → 5.8), closing the column.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type FloorId = 'yard' | 'basement' | 'ground' | 'second' | 'attic'

export const X0 = 300

/**
 * Footprint, front (street side) at Z=0.
 *
 * 11.0 x 9.0 originally, which was CONSTRAINT LAUNDERING: the exterior GLB
 * measures 10.9 x 9.0, that got handed to the floor-plan generator as a
 * requirement, and was then treated as one. The interior is a separate scene
 * at X0=300 — no camera ever sees it against the exterior, so it never had to
 * fit. The measurement was accurate and completely irrelevant.
 *
 * 1.2x from there, deliberately not more: most rooms already measured at or
 * above the reference sheet's areas, and this is a portfolio where traversal
 * time is a real cost. Human-scale dimensions — ceiling, doors, stairs, wall
 * thickness, player height — are untouched. Only the plan grows.
 */
/**
 * Plan scale. Room footprints multiply by this; human-scale dimensions never
 * do — ceiling, doors, stair run/rise/width, wall thickness and player height
 * are all authored as absolutes and are deliberately outside `pl()`.
 *
 * This exists so "make the house a bit bigger" is one number rather than forty
 * literals that can drift apart. Start 11.0 x 9.0 -> 1.2x -> 1.15x again.
 */
export const PLAN_SCALE = 1.15

/** Scale a plan-space length. Never apply to a human-scale dimension. */
const pl = (n: number) => n * PLAN_SCALE

export const HOUSE_W = pl(13.2)
export const HOUSE_D = pl(10.8)

/** Local plan X (0..11, west→east) to world X. */
const lx = (n: number) => X0 - HOUSE_W / 2 + n

// Column boundaries. The centre column carries the stair core on every floor;
// the basement's is narrower but still contains the core (see CORRECTION 1).
// The stair core's POSITION scales with the plan, but its WIDTH does not —
// it is set by two 1.05 flights plus a 0.2 newel and has to stay walkable.
const CORE_WIDTH = 2.3
const COL_W = lx(pl(5.45))
const COL_E = COL_W + CORE_WIDTH

export const FLOOR_BASE_Y: Record<Exclude<FloorId, 'yard'>, number> = {
  basement: -3.2,
  ground: 0,
  second: 3.2,
  attic: 6.4,
}

/**
 * Vertical distance between one floor's base and the next. Walls are built to
 * THIS, not to FLOOR_CEILING — see below.
 */
export const FLOOR_TO_FLOOR = 3.2

/**
 * Visible ceiling height. 2.8 is a normal residential ceiling but read as low
 * in first person: the camera sits at 1.7, and a 75-degree FOV makes 1.1 of
 * headroom feel tighter than it measures. 3.0 costs nothing and reads correctly.
 *
 * Note this is a VISUAL plane only. Walls span the full FLOOR_TO_FLOOR, so the
 * ceiling height can move freely without ever reopening the joist cavity.
 */
export const FLOOR_CEILING = 3.0

export interface RoomBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export type DoorSide = 'north' | 'south' | 'east' | 'west'
export interface DoorDef { side: DoorSide; center: number; width: number }

export interface RoomDef {
  id: string
  label: string
  floor: Exclude<FloorId, 'yard'>
  bounds: RoomBounds
  /**
   * Wall openings, one per connection. A shared boundary needs a MATCHING entry
   * on BOTH sides — each room only knows how to cut gaps in its own walls, so a
   * door declared on one side with no counterpart on its neighbour is a locked
   * room: the neighbour's wall renders solid across that span regardless.
   *
   * For east/west sides `center` is a Z coordinate; for north/south it is an X.
   */
  doors: DoorDef[]
  furnished: boolean
  /** True for a room with no walls of its own. */
  noWalls?: boolean
  /**
   * Metres of the room's own X-span that are VISIBLE but not WALKABLE, at each
   * side. Extra colliders close the strip off; the geometry is untouched.
   *
   * Exists because collision here is 2D AABB and has no concept of height, so
   * a sloped roof — low at the eaves, high at the ridge — cannot be expressed
   * as a collider. Rather than raise the roof until it clears a head
   * everywhere (which would flatten the one room whose character is its
   * shape), the low strip is simply made unreachable and dressed as storage.
   *
   * The barrier is invisible on its own, so anything using this needs clutter
   * or low shelving along the line to read as occupied space, not as a bug.
   */
  eaveInset?: number
}

// ── Stair core ──────────────────────────────────────────────────────────────
// Identical X/Z on every floor so the shaft is vertically continuous.
// Two 1.2-wide flights either side of a 0.2 newel, 2.6 overall — fits inside
// both the 3.6 upper centre column and the 2.6 basement one.
// Flights are 1.05 wide rather than the sheet's 1.2. The centre column is 3.6;
// a 2.6 shaft left 1.0 gross to walk past it, which after a 0.15 rail, a 0.15
// wall and the player's 0.22 radius on each side came to a ~0.4 band — the sim
// could not get from the front of the Foyer to the Kitchen or Game Room doors
// at all. 2.3 leaves 1.3 gross and a comfortable corridor. 1.05 is still a
// legal residential flight width and the pitch is untouched.
export const CORE_MIN_X = COL_W          // lx(5.45)
export const CORE_MAX_X = COL_E          // lx(7.75)
const FLIGHT_W = 1.05
export const FLIGHT_W_MAX = CORE_MIN_X + FLIGHT_W
export const FLIGHT_E_MIN = CORE_MAX_X - FLIGHT_W

export const CORE_Z0 = pl(2.6)           // foot of the first flight
const FLIGHT_RUN = 2.3                   // 1.6 rise / 2.3 run = 34.8°
const LANDING_D = 1.2
export const TURN_Z = CORE_Z0 + FLIGHT_RUN // 5.1 — top of flight A, start of B
export const CORE_Z1 = TURN_Z + LANDING_D // 6.3 — far edge of the half-landing

// Standard door opening from the sheet.
const DOOR = 1.0

/**
 * How far in from the footprint edge the attic knee walls sit. The strip
 * outside them is under the lowest part of the roof — storable, not walkable.
 */
export const ATTIC_KNEE_INSET = 2.2

/**
 * How far inside the knee walls the Archive's walkable area stops.
 *
 * Rafter undersides drop below head height 1.69 in from the knee; 1.8 is
 * deliberately conservative, leaving margin for the player radius and any
 * camera movement rather than grazing the roof at exactly the limit.
 */
export const ATTIC_EAVE_INSET = 1.8

export const ROOMS: RoomDef[] = [
  // -- BASEMENT --------------------------------------------------------------
  {
    id: 'basement-landing',
    label: 'Landing / Storage',
    floor: 'basement',
    bounds: { minX: lx(0), maxX: CORE_MIN_X, minZ: 0, maxZ: HOUSE_D },
    doors: [
      { side: 'east', center: pl(1.3), width: DOOR },
      { side: 'east', center: pl(8.5), width: DOOR },
      // The secret door. Cover story: foundation walls and shelving.
      { side: 'north', center: lx(pl(2.7)), width: DOOR },
    ],
    furnished: true,
  },
  {
    id: 'basement-stair-hall',
    label: 'Stair Hall',
    floor: 'basement',
    bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: 0, maxZ: CORE_Z1 },
    doors: [
      { side: 'west', center: pl(1.3), width: DOOR },
      { side: 'east', center: pl(1.3), width: DOOR },
    ],
    furnished: true,
  },
  {
    id: 'basement-mechanical',
    label: 'Mechanical',
    floor: 'basement',
    bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: CORE_Z1, maxZ: HOUSE_D },
    doors: [{ side: 'west', center: pl(8.5), width: DOOR }],
    furnished: false,
  },
  {
    id: 'music-studio',
    label: 'Grey Key Studios',
    floor: 'basement',
    bounds: { minX: CORE_MAX_X, maxX: lx(HOUSE_W), minZ: 0, maxZ: HOUSE_D },
    doors: [{ side: 'west', center: pl(1.3), width: DOOR }],
    furnished: false,
  },
  {
    // Beyond the footprint, under the back yard — which is exactly why it can
    // exist without appearing on any floor plan.
    id: 'secret-room',
    label: '???',
    floor: 'basement',
    bounds: { minX: lx(pl(1.2)), maxX: lx(pl(5.0)), minZ: HOUSE_D, maxZ: HOUSE_D + 4 },
    doors: [{ side: 'south', center: lx(pl(2.7)), width: DOOR }],
    furnished: false,
  },

  // -- GROUND ----------------------------------------------------------------
  //
  // The full-depth foyer spine is GONE. It ran the whole depth of the house
  // down the centre and measured 2.19x the reference's area: circulation
  // consuming the middle of the floor while the actual rooms went short. The
  // foyer is now an entry vestibule with the stair directly behind it, and
  // rooms open off it. Client, Game and Kitchen absorb the reclaimed space.
  {
    id: 'half-bath',
    label: 'Half Bath',
    floor: 'ground',
    bounds: { minX: lx(0), maxX: lx(pl(2.45)), minZ: 0, maxZ: pl(3.0) },
    doors: [{ side: 'east', center: pl(1.5), width: DOOR }],
    furnished: false,
  },
  {
    // Sits between the Foyer and the Half Bath so that neither the Kitchen nor
    // the bathroom is reached by walking through the other.
    id: 'mudroom',
    label: 'Mudroom / Coats',
    floor: 'ground',
    bounds: { minX: lx(pl(2.45)), maxX: CORE_MIN_X, minZ: 0, maxZ: pl(3.0) },
    doors: [
      { side: 'west', center: pl(1.5), width: DOOR },
      { side: 'east', center: pl(1.4), width: DOOR },
      { side: 'north', center: lx(pl(3.9)), width: DOOR },
    ],
    furnished: false,
  },
  {
    id: 'kitchen',
    label: 'Kitchen / Dining',
    floor: 'ground',
    bounds: { minX: lx(0), maxX: CORE_MIN_X, minZ: pl(3.0), maxZ: HOUSE_D },
    doors: [
      { side: 'south', center: lx(pl(3.9)), width: DOOR },
      { side: 'east', center: pl(8.5), width: DOOR },
    ],
    furnished: false,
  },
  {
    // Entry vestibule with the stair immediately behind it. Walkable floor is
    // the Z0..CORE_Z0 apron; north of that is the flight. Every door lives in
    // the apron, because anything cut further north opens onto the stairwell.
    id: 'foyer',
    label: 'Foyer / Stair Hall',
    floor: 'ground',
    bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: 0, maxZ: CORE_Z1 },
    doors: [
      { side: 'west', center: pl(1.4), width: DOOR },
      { side: 'east', center: pl(1.4), width: DOOR },
      { side: 'south', center: lx(pl(6.6)), width: 1.2 },
    ],
    furnished: true,
  },
  {
    id: 'pantry',
    label: 'Pantry',
    floor: 'ground',
    bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: CORE_Z1, maxZ: HOUSE_D },
    doors: [{ side: 'west', center: pl(8.5), width: DOOR }],
    furnished: false,
  },
  {
    id: 'client-room',
    label: 'Client Room / Living',
    floor: 'ground',
    bounds: { minX: CORE_MAX_X, maxX: lx(HOUSE_W), minZ: 0, maxZ: pl(5.4) },
    doors: [
      { side: 'west', center: pl(1.4), width: DOOR },
      { side: 'north', center: lx(pl(10.5)), width: DOOR },
    ],
    furnished: false,
  },
  {
    id: 'game-room',
    label: 'Game Room / Lounge',
    floor: 'ground',
    bounds: { minX: CORE_MAX_X, maxX: lx(HOUSE_W), minZ: pl(5.4), maxZ: HOUSE_D },
    doors: [{ side: 'south', center: lx(pl(10.5)), width: DOOR }],
    furnished: false,
  },

  // -- SECOND ----------------------------------------------------------------
  {
    id: 'gallery',
    label: 'Gallery / Library',
    floor: 'second',
    bounds: { minX: lx(0), maxX: CORE_MIN_X, minZ: 0, maxZ: pl(5.4) },
    doors: [
      { side: 'east', center: pl(1.4), width: DOOR },
      { side: 'north', center: lx(pl(2.7)), width: DOOR },
    ],
    furnished: false,
  },
  {
    id: 'nook',
    label: 'Nook / Flex Space',
    floor: 'second',
    bounds: { minX: lx(0), maxX: CORE_MIN_X, minZ: pl(5.4), maxZ: HOUSE_D },
    doors: [
      { side: 'south', center: lx(pl(2.7)), width: DOOR },
      { side: 'east', center: pl(8.5), width: DOOR },
    ],
    furnished: false,
  },
  {
    id: 'stair-landing-2',
    label: 'Stair Landing / Hall',
    floor: 'second',
    bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: 0, maxZ: CORE_Z1 },
    doors: [
      { side: 'west', center: pl(1.4), width: DOOR },
      { side: 'east', center: pl(1.4), width: DOOR },
    ],
    furnished: true,
  },
  {
    // Behind the stair, so the shaft sits between it and the landing — it is
    // reachable only from the Nook.
    id: 'upstairs-storage',
    label: 'Storage',
    floor: 'second',
    bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: CORE_Z1, maxZ: HOUSE_D },
    doors: [{ side: 'west', center: pl(8.5), width: DOOR }],
    furnished: false,
  },
  {
    id: 'home-office',
    label: 'Home Office',
    floor: 'second',
    bounds: { minX: CORE_MAX_X, maxX: lx(HOUSE_W), minZ: 0, maxZ: pl(5.4) },
    doors: [
      { side: 'west', center: pl(1.4), width: DOOR },
      { side: 'north', center: lx(pl(9.2)), width: DOOR },
      { side: 'north', center: lx(pl(11.9)), width: DOOR },
    ],
    furnished: true,
  },
  {
    id: 'bathroom',
    label: 'Bathroom',
    floor: 'second',
    bounds: { minX: CORE_MAX_X, maxX: lx(pl(10.6)), minZ: pl(5.4), maxZ: HOUSE_D },
    doors: [{ side: 'south', center: lx(pl(9.2)), width: DOOR }],
    furnished: false,
  },
  {
    id: 'linen',
    label: 'Linen',
    floor: 'second',
    bounds: { minX: lx(pl(10.6)), maxX: lx(HOUSE_W), minZ: pl(5.4), maxZ: HOUSE_D },
    doors: [{ side: 'south', center: lx(pl(11.9)), width: DOOR }],
    furnished: false,
  },

  // -- ATTIC -----------------------------------------------------------------
  {
    // Inset to the knee walls rather than the full footprint. Under a gable
    // the outer strip has almost no headroom, so letting the player walk there
    // would mean walking into the roof; the collider stops at the knee and the
    // dead space behind it stays dead. See ATTIC_* in build-interior.cjs.
    id: 'archive',
    label: 'Archive',
    floor: 'attic',
    bounds: {
      minX: lx(ATTIC_KNEE_INSET),
      maxX: lx(HOUSE_W - ATTIC_KNEE_INSET),
      minZ: 0,
      maxZ: HOUSE_D,
    },
    // Roof geometry is deliberately NOT adjusted to suit the collider. The low
    // eaves stay low and stay visible; they are just not walkable.
    eaveInset: ATTIC_EAVE_INSET,
    doors: [],
    furnished: false,
  },
]

/**
 * One straight run of walkable surface at a constant gradient.
 *
 * Ends are explicit HEIGHTS rather than floor names. The original model said
 * "this stair goes from the ground floor to the second", which cannot express a
 * switchback: its half-landing sits half a storey up, matching no floor at all.
 * Naming heights makes a flight a plain ramp between two altitudes, and a floor
 * change becomes emergent — it happens where a run's end coincides with a
 * floor's base height (see floorAtY).
 *
 * A flat landing is just a run with `bottomY === topY`, so half-landings and
 * flights live in one list and resolveEyeY needs no separate concept.
 *
 * `bottomCoord`/`topCoord` are raw axis values and are NOT required to be in
 * min/max order — a switchback's return leg genuinely runs toward -Z.
 */
export interface StairDef {
  id: string
  /** Which floor's collider set and GLB this run belongs to. */
  floor: Exclude<FloorId, 'yard'>
  bounds: RoomBounds
  /** Axis the run rises along; eye-Y is interpolated across this axis's span. */
  axis: 'x' | 'z'
  bottomCoord: number
  bottomY: number
  topCoord: number
  topY: number
}

/**
 * The floor whose base sits at this height, or null for an intermediate level
 * such as a switchback's half-landing.
 */
export function floorAtY(y: number): Exclude<FloorId, 'yard'> | null {
  for (const [floor, base] of Object.entries(FLOOR_BASE_Y)) {
    if (Math.abs(base - y) < 1e-6) return floor as Exclude<FloorId, 'yard'>
  }
  return null
}

/** Builds the three runs of one switchback: up, across, back up. */
function switchback(floor: Exclude<FloorId, 'yard'>): StairDef[] {
  const base = FLOOR_BASE_Y[floor]
  const mid = base + 1.6
  const top = base + 3.2
  return [
    {
      id: `${floor}-flight-a`, floor, axis: 'z',
      bounds: { minX: CORE_MIN_X, maxX: FLIGHT_W_MAX, minZ: CORE_Z0, maxZ: TURN_Z },
      bottomCoord: CORE_Z0, bottomY: base, topCoord: TURN_Z, topY: mid,
    },
    {
      id: `${floor}-half-landing`, floor, axis: 'z',
      bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: TURN_Z, maxZ: CORE_Z1 },
      bottomCoord: TURN_Z, bottomY: mid, topCoord: CORE_Z1, topY: mid,
    },
    {
      // Runs back toward -Z, which is why topCoord < bottomCoord.
      id: `${floor}-flight-b`, floor, axis: 'z',
      bounds: { minX: FLIGHT_E_MIN, maxX: CORE_MAX_X, minZ: CORE_Z0, maxZ: TURN_Z },
      bottomCoord: TURN_Z, bottomY: mid, topCoord: CORE_Z0, topY: top,
    },
  ]
}

export const STAIRS: StairDef[] = [
  ...switchback('basement'),
  ...switchback('ground'),
  ...switchback('second'),
]

/** Where the player lands inside, just north of the front door. */
export const FOYER_ENTRY_POINT: [number, number, number] = [X0, 1.7, 1.3]

/** Where the player lands back in the yard after using the Foyer exit door. */
export const YARD_EXIT_POINT: [number, number, number] = [0.72, 1.7, -3.5]
export const YARD_EXIT_YAW = 0 // facing +Z, away from the house
