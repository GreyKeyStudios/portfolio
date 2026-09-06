import { CORE_MIN_X, CORE_MAX_X, CORE_Z0, CORE_Z1, FLIGHT_W_MAX, ROOMS } from './interior-layout'

const frontOpening = ROOMS.find(r => r.id === 'foyer')!.doors.find(d => d.side === 'south')!
/** Closed interior leaf; exit remains the existing nearby E/USE interaction. */
export const ENTRY_DOOR = {
  centerX: frontOpening.center,
  openingWidth: frontOpening.width,
  leafWidth: frontOpening.width * .75,
  height: 1.98,
  bottomY: .018,
  centerZ: .10,
  thickness: .055,
}

/** World-space guard centrelines shared by art and collision. East-front stays open. */
export const ATTIC_GUARDS = [
  { id: 'west', a: [CORE_MIN_X + .04, CORE_Z0] as const, b: [CORE_MIN_X + .04, CORE_Z1 - .04] as const },
  { id: 'north', a: [CORE_MIN_X + .04, CORE_Z1 - .04] as const, b: [CORE_MAX_X - .04, CORE_Z1 - .04] as const },
  { id: 'east', a: [CORE_MAX_X - .04, CORE_Z0] as const, b: [CORE_MAX_X - .04, CORE_Z1 - .04] as const },
  { id: 'front-west', a: [CORE_MIN_X + .04, CORE_Z0] as const, b: [FLIGHT_W_MAX + .045, CORE_Z0] as const },
]

export const SHELL_PRACTICALS = [
  { id: 'foyer', position: [298.85 + .48, 2.12, .4] as [number, number, number], intensity: 1.8 },
  { id: 'client-south', position: [303.8, 2.12, .4] as [number, number, number], intensity: 2.8 },
  { id: 'client-north', position: [303.0, 2.12, 5.0] as [number, number, number], intensity: 2.8 },
]
