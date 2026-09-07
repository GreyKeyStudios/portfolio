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
 * literals that can drift apart. Start 11.0 x 9.0 -> 1.2x -> 1.15x -> back to
 * 1.0 on 2026-09-04.
 *
 * ── WHY IT CAME BACK DOWN ────────────────────────────────────────────────────
 * The two increases compounded to 1.38x, which is 1.9x the AREA of the original
 * plan, and the comment above records that most rooms already met or exceeded
 * the reference sheet before any of it. The result was a house measuring 189 m2
 * per floor — roughly 8,100 sqft over four storeys — with a 41 m2 living room,
 * a 41 m2 home office, a 22 m2 bathroom and an 18 m2 linen closet. Grey Key
 * Studios came out at 82 m2 against the sheet's own stated 35.8.
 *
 * That is the wrong direction for the stated goal. The interior is aiming at
 * arch-viz quality, and what makes those spaces read as real is DENSITY —
 * furniture, rugs, lamps, clutter. Empty floor is the clearest tell that a room
 * is a set, and a 41 m2 room needs about three times the props of a 22 m2 one
 * to fill. With 27 rooms still unfurnished, size multiplies the remaining work.
 *
 * Two existing problems in this codebase were the oversizing surfacing
 * elsewhere, and both improve for free at 1.0:
 *
 * 1. Lighting. SceneLights runs a fixed pool of 7 decay-2 point lights; the
 *    comments there record rooms over 60 m2 needing two fills and the 134 m2
 *    Archive being "lit to the point of being unreadable". No room this size can
 *    be lit from one source with physical falloff.
 * 2. Ceiling proportion. 3.0 reads as lofty in a small room and squat in a
 *    6.6 x 6.2 one, which is why 2.8 "read as low" and got raised. Smaller
 *    footprints make the existing 3.0 generous rather than a compromise.
 *
 * Do not raise this again without a reason that isn't "the rooms feel small in
 * first person" — that is usually the 75-degree FOV in app/house/page.tsx
 * talking, not the plan. Fix the camera before the architecture.
 *
 * Going BELOW 1.0 gets progressively riskier: CORE_WIDTH is a fixed 2.3 and does
 * not scale, so the columns either side of the stair absorb every reduction and
 * the east one shrinks fastest. Circulation has already failed once here (see
 * the CORE_WIDTH note below).
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const PLAN_SCALE = 1.0

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

/**
 * A glazed opening in an EXTERIOR wall.
 *
 * Deliberately a separate list from `doors` rather than a flag on DoorDef,
 * because the two differ in every way that matters:
 *
 * - A door is a hole in the collider. A window is not — collision reads
 *   `doors` and nothing else, so a window can never be walked through by
 *   construction rather than by remembering to special-case it.
 * - A door on a shared boundary needs a MATCHING entry on both rooms. A window
 *   never does: it faces outside, so exactly one room owns it. The generator
 *   asserts the wall is actually on the footprint edge, which turns the old
 *   door-matching class of bug into a build error here.
 * - A door interrupts the baseboard. A window does not — the base runs
 *   underneath it.
 *
 * `center` follows the same convention as DoorDef: a Z coordinate on
 * east/west sides, an X coordinate on north/south.
 *
 * `sill` and `head` are heights above THIS floor's base. They default to
 * WINDOW_SILL / WINDOW_HEAD; below-grade and privacy openings override them.
 */
export interface WindowDef {
  side: DoorSide
  center: number
  width: number
  sill?: number
  head?: number
}

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
  /**
   * Exterior openings. Only walls lying on the footprint edge may carry one —
   * `npm run build:interior` fails loudly otherwise rather than quietly
   * cutting a hole into the room next door.
   *
   * The attic is the exception: its room bounds are inset to the knee walls, so
   * its north/south windows are GABLE windows, cut from the triangle above the
   * knee rather than from a rectangular wall. East/west there is rejected — a
   * 1.15 knee wall cannot hold a window.
   */
  windows?: WindowDef[]
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
 * Default glazing heights, above the floor of whatever storey they sit on.
 *
 * The 0.9 sill and 2.4 head give the common 1.2-wide openings a taller profile
 * closer to the exterior, leaving 0.6 of plaster below the 3.0 ceiling.
 */
export const WINDOW_SILL = 0.9
export const WINDOW_HEAD = 2.4

/**
 * Below grade. The basement floor is at -3.2, so anything at normal sill
 * height would be looking at soil. These sit hard up under the ceiling, the way
 * a real window well does, and are the only daylight the basement has.
 */
export const BASEMENT_SILL = 2.25
export const BASEMENT_HEAD = 2.75

/** Bathrooms and the half-bath: high enough that the glass is not at eye level. */
export const PRIVACY_SILL = 1.45

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
    windows: [
      // Window wells along the west foundation wall. Two, on the same Z as the
      // openings on the storeys above, so the west elevation stacks.
      { side: 'west', center: pl(2.7), width: 0.7, sill: BASEMENT_SILL, head: BASEMENT_HEAD },
      { side: 'west', center: pl(8.5), width: 0.7, sill: BASEMENT_SILL, head: BASEMENT_HEAD },
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
    // No window. It had one, purely because the bottom of the shaft is the
    // darkest point in the house — but that is a lighting problem and this is
    // the front elevation. A basement well directly under the front door reads
    // as a mistake from outside.
    furnished: true,
  },
  {
    // 10.8 m2 and staying that way: a furnace, water heater, panel and softener
    // is genuinely what this much floor is for.
    id: 'basement-mechanical',
    label: 'Mechanical',
    floor: 'basement',
    bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: CORE_Z1, maxZ: HOUSE_D },
    doors: [{ side: 'west', center: pl(8.5), width: DOOR }],
    windows: [
      { side: 'north', center: lx(pl(6.6)), width: 0.6, sill: BASEMENT_SILL, head: BASEMENT_HEAD },
    ],
    furnished: false,
  },
  {
    // Deliberately left oversized at 58.9 m2 against the sheet's 35.8. It is
    // the one room in the house allowed to be a fantasy — a live room that size
    // is the point of it, not an accident of the plan.
    id: 'music-studio',
    label: 'Grey Key Studios',
    floor: 'basement',
    bounds: { minX: CORE_MAX_X, maxX: lx(HOUSE_W), minZ: 0, maxZ: HOUSE_D },
    doors: [{ side: 'west', center: pl(1.3), width: DOOR }],
    windows: [
      { side: 'east', center: pl(2.7), width: 0.7, sill: BASEMENT_SILL, head: BASEMENT_HEAD },
      { side: 'east', center: pl(8.1), width: 0.7, sill: BASEMENT_SILL, head: BASEMENT_HEAD },
    ],
    furnished: false,
  },
  {
    // Beyond the footprint, under the back yard — which is exactly why it can
    // exist without appearing on any floor plan. No windows, ever: there is
    // earth on every side of it.
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
    // 1.7 wide, not 2.45. At 2.45 x 3.0 this was a 7.3 m2 powder room — bigger
    // than most bedrooms get, for a toilet and a basin. The 0.75 it gives up
    // goes to the Mudroom, which is the only room it shares a wall with.
    id: 'half-bath',
    label: 'Half Bath',
    floor: 'ground',
    bounds: { minX: lx(0), maxX: lx(pl(1.7)), minZ: 0, maxZ: pl(3.0) },
    doors: [{ side: 'east', center: pl(1.5), width: DOOR }],
    windows: [
      { side: 'west', center: pl(1.5), width: 0.6, sill: PRIVACY_SILL, head: WINDOW_HEAD },
    ],
    furnished: false,
  },
  {
    // Sits between the Foyer and the Half Bath so that neither the Kitchen nor
    // the bathroom is reached by walking through the other.
    id: 'mudroom',
    label: 'Mudroom / Coats',
    floor: 'ground',
    bounds: { minX: lx(pl(1.7)), maxX: CORE_MIN_X, minZ: 0, maxZ: pl(3.0) },
    doors: [
      { side: 'west', center: pl(1.5), width: DOOR },
      { side: 'east', center: pl(1.4), width: DOOR },
      { side: 'north', center: lx(pl(3.9)), width: DOOR },
    ],
    windows: [
      { side: 'south', center: lx(pl(3.5)), width: 0.8 },
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
      // Two doors east now: the Pantry no longer runs the whole depth of the
      // core column, and the Laundry behind it needs its own way in.
      { side: 'east', center: pl(7.1), width: DOOR },
      { side: 'east', center: pl(9.4), width: DOOR },
    ],
    windows: [
      // Over the back yard — the big one on this floor.
      { side: 'north', center: lx(pl(2.7)), width: 1.6 },
      { side: 'west', center: pl(5.5), width: 1.0 },
      { side: 'west', center: pl(8.5), width: 1.0 },
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
    // 2.0 deep, not the whole 4.7 of the core column. A pantry is a cupboard
    // you can stand in; at 10.8 m2 it was a room with shelves.
    id: 'pantry',
    label: 'Pantry',
    floor: 'ground',
    bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: CORE_Z1, maxZ: pl(8.1) },
    doors: [{ side: 'west', center: pl(7.1), width: DOOR }],
    // No window. It backs onto the stair core and its only exterior wall would
    // be north, where the Laundry now sits.
    furnished: false,
  },
  {
    // NEW. The area the Pantry gave up had to go somewhere, and the core
    // column's north end backs onto the kitchen with an exterior wall behind
    // it — which is exactly where a laundry goes in a real plan.
    id: 'laundry',
    label: 'Laundry',
    floor: 'ground',
    bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: pl(8.1), maxZ: HOUSE_D },
    doors: [{ side: 'west', center: pl(9.4), width: DOOR }],
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
    windows: [
      // Street-facing pair, on the same X as the Home Office directly above, so
      // the front elevation stacks instead of scattering.
      { side: 'south', center: lx(pl(9.0)), width: 1.2 },
      { side: 'south', center: lx(pl(11.8)), width: 1.2 },
      // One on the return, not two. A corner room reads as a corner room with a
      // single opening on the short elevation; two made every room on this side
      // of the house look like a shopfront.
      { side: 'east', center: pl(2.7), width: 1.0 },
    ],
    furnished: false,
  },
  {
    id: 'game-room',
    label: 'Game Room / Lounge',
    floor: 'ground',
    bounds: { minX: CORE_MAX_X, maxX: lx(HOUSE_W), minZ: pl(5.4), maxZ: HOUSE_D },
    doors: [{ side: 'south', center: lx(pl(10.5)), width: DOOR }],
    windows: [
      { side: 'east', center: pl(8.1), width: 1.0 },
      { side: 'north', center: lx(pl(10.5)), width: 1.4 },
    ],
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
    windows: [
      { side: 'south', center: lx(pl(3.5)), width: 1.2 },
      { side: 'west', center: pl(2.7), width: 1.0 },
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
      // The Linen room behind the stair opens off here too — see below.
      { side: 'east', center: pl(10.1), width: DOOR },
    ],
    windows: [
      { side: 'west', center: pl(8.5), width: 1.0 },
      { side: 'north', center: lx(pl(2.7)), width: 1.4 },
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
    windows: [
      // Halfway up the shaft, and directly above the front door. A stair window
      // is the single most useful opening in a house this tall — it is the only
      // one visible from three floors.
      { side: 'south', center: lx(pl(6.6)), width: 1.0 },
    ],
    furnished: true,
  },
  {
    // Behind the stair, so the shaft sits between it and the landing — it is
    // reachable only from the Nook.
    id: 'upstairs-storage',
    label: 'Storage',
    floor: 'second',
    bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: CORE_Z1, maxZ: pl(9.4) },
    doors: [{ side: 'west', center: pl(8.5), width: DOOR }],
    furnished: false,
  },
  {
    // MOVED here from the east column, where it was a 14 m2 "linen closet" with
    // its own window. A linen store wants to be small, central and windowless,
    // and the tail of the core column is all three.
    id: 'linen',
    label: 'Linen',
    floor: 'second',
    bounds: { minX: CORE_MIN_X, maxX: CORE_MAX_X, minZ: pl(9.4), maxZ: HOUSE_D },
    doors: [{ side: 'west', center: pl(10.1), width: DOOR }],
    furnished: false,
  },
  {
    id: 'home-office',
    label: 'Home Office',
    floor: 'second',
    bounds: { minX: CORE_MAX_X, maxX: lx(HOUSE_W), minZ: 0, maxZ: pl(5.4) },
    doors: [
      { side: 'west', center: pl(1.4), width: DOOR },
      { side: 'north', center: lx(pl(8.7)), width: DOOR },
      { side: 'north', center: lx(pl(11.9)), width: DOOR },
    ],
    windows: [
      // Stacked directly above the Client Room's pair on the floor below.
      { side: 'south', center: lx(pl(9.0)), width: 1.2 },
      { side: 'south', center: lx(pl(11.8)), width: 1.2 },
      { side: 'east', center: pl(2.7), width: 1.0 },
    ],
    furnished: true,
  },
  {
    // Re-cut as a long narrow room against the core rather than a 15.4 m2
    // square. 1.85 x 5.4 is the shape a real bathroom takes — a tub is 1.7 —
    // and it frees the whole east side of this block for a proper room.
    id: 'bathroom',
    label: 'Bathroom',
    floor: 'second',
    bounds: { minX: CORE_MAX_X, maxX: lx(pl(9.6)), minZ: pl(5.4), maxZ: HOUSE_D },
    doors: [{ side: 'south', center: lx(pl(8.7)), width: DOOR }],
    windows: [
      { side: 'north', center: lx(pl(8.7)), width: 0.8, sill: PRIVACY_SILL, head: WINDOW_HEAD },
    ],
    furnished: false,
  },
  {
    // NEW, and the one genuinely new IDEA rather than a resize: shrinking the
    // Bathroom and moving the Linen out left 19.4 m2 of the east column with
    // two exterior walls and no purpose. The house had no bedroom at all, which
    // is a stranger thing for a dream house to be missing than an oversized
    // linen closet. Rename it if it should carry portfolio content instead.
    id: 'guest-room',
    label: 'Guest Room',
    floor: 'second',
    bounds: { minX: lx(pl(9.6)), maxX: lx(HOUSE_W), minZ: pl(5.4), maxZ: HOUSE_D },
    doors: [{ side: 'south', center: lx(pl(11.9)), width: DOOR }],
    windows: [
      { side: 'east', center: pl(8.1), width: 1.0 },
      { side: 'north', center: lx(pl(11.4)), width: 1.2 },
    ],
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
    windows: [
      // Gable ends, not walls — cut from the triangle above the knee. Centred
      // on the ridge so they sit at the tallest part of the section, which is
      // the only place in the attic with the height for a real window.
      { side: 'south', center: lx(HOUSE_W / 2), width: 1.2, sill: 1.6, head: 2.7 },
      { side: 'north', center: lx(HOUSE_W / 2), width: 1.2, sill: 1.6, head: 2.7 },
    ],
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

/** Arrival just inside the front door, with the foyer openings ahead. */
export const FOYER_ENTRY_POINT: [number, number, number] = [X0, 1.7, .65]

/**
 * Where the "Exit to Yard" trigger sits — INSIDE the foyer, at the front door.
 *
 * Derived, because a hardcoded copy of this stranded the player in the house.
 * components/interior/exit-door.tsx defaulted to z = -3.8, which was correct
 * for an older, smaller floor plan; after the rebuild (PLAN_SCALE 1.15) the
 * foyer's south wall — the front door — sits at z = 0, putting that trigger
 * 3.8 units OUTSIDE the building. Its 2.0 radius reached z = -1.8 at best and
 * the player can only reach about z = 0.3 before the wall stops them, so the
 * exit was roughly 1.5 units beyond anywhere you could stand. No way out.
 *
 * Kept a little north of the wall so the prompt appears as you approach the
 * door from inside rather than while standing in it.
 */
export const FOYER_EXIT_POINT: [number, number, number] = [X0, 1.0, 0.35]

/**
 * Plan-space scale helper, exported so that anything POSITIONED against the
 * plan scales with it.
 *
 * This is the bug that stranded the exit door and scattered the props: the
 * rebuild multiplied every room bound by PLAN_SCALE, but components holding
 * raw literals did not move. Anything placing objects in the house should work
 * in plan units and convert here, or better, use roomCenter/placeInRoom below.
 */
export const plan = (n: number) => n * PLAN_SCALE

export function roomById(id: string): RoomDef | undefined {
  return ROOMS.find((r) => r.id === id)
}

/** Floor-level centre of a room, in world space. */
export function roomCenter(id: string): [number, number, number] {
  const r = roomById(id)
  if (!r) throw new Error(`roomCenter: no room "${id}"`)
  const b = r.bounds
  return [(b.minX + b.maxX) / 2, FLOOR_BASE_Y[r.floor], (b.minZ + b.maxZ) / 2]
}

/**
 * Place something inside a room using 0..1 coordinates across its bounds, and
 * refuse to let it poke through a wall.
 *
 * `half` is the object's half-extent in X and Z; the result is clamped so the
 * object stays inside the room by at least `margin`. Props previously used raw
 * world coordinates, which meant every plan change silently pushed furniture
 * into walls — an armchair at x=301.01 straddling a wall at x=300.98, for one.
 */
export function placeInRoom(
  id: string,
  u: number,
  v: number,
  half: [number, number] = [0, 0],
  margin = 0.08
): [number, number, number] {
  const r = roomById(id)
  if (!r) throw new Error(`placeInRoom: no room "${id}"`)
  const b = r.bounds
  const loX = b.minX + half[0] + margin
  const hiX = b.maxX - half[0] - margin
  const loZ = b.minZ + half[1] + margin
  const hiZ = b.maxZ - half[1] - margin
  const x = Math.min(Math.max(b.minX + (b.maxX - b.minX) * u, loX), Math.max(loX, hiX))
  const z = Math.min(Math.max(b.minZ + (b.maxZ - b.minZ) * v, loZ), Math.max(loZ, hiZ))
  return [x, FLOOR_BASE_Y[r.floor], z]
}

/** Where the player lands back in the yard after using the Foyer exit door. */
export const YARD_EXIT_POINT: [number, number, number] = [0.72, 1.7, -5.1]
export const YARD_EXIT_YAW = 0 // facing -Z, away from the house

