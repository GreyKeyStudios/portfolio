import { create } from 'zustand'
import type { FloorId } from './interior-layout'
import { FOYER_ENTRY_POINT, YARD_EXIT_POINT, YARD_EXIT_YAW } from './interior-layout'
import { INTERIOR_EYE_HEIGHT } from './player-camera'

export type EasterEggStep = 'touch-grass' // more steps added as rooms are built

export interface TeleportRequest {
  position: [number, number, number]
  yaw?: number
  floor: FloorId
}

interface PlayerState {
  // Door state
  // TEMP BYPASS: default true so the interior can be built/toured without the
  // terminal→unlock flow (reported broken in real play). Real puzzle mechanics
  // are a separate, deferred piece of work — see plan notes.
  frontDoorUnlocked: boolean
  unlockFrontDoor: () => void

  // Interior navigation
  currentLocation: FloorId
  setCurrentLocation: (floor: FloorId) => void
  teleportRequest: TeleportRequest | null
  requestTeleport: (req: TeleportRequest) => void
  clearTeleportRequest: () => void
  enterInterior: () => void
  exitToYard: () => void

  // Home Office overlay — sibling to terminalOpen
  homeOfficeOpen: boolean
  openHomeOffice: () => void
  closeHomeOffice: () => void

  // "Enter the house?" confirmation modal — sibling to terminalOpen. Was local
  // useState in HudOverlay, which meant fps-controls.tsx never paused movement
  // or released pointer lock for it (unlike terminal/home office), leaving the
  // mouse captured for camera-look with no free cursor to click Yes/No with.
  enterPromptOpen: boolean
  openEnterPrompt: () => void
  closeEnterPrompt: () => void

  // Easter egg progress
  completedEasterEggs: Set<EasterEggStep>
  completeEasterEgg: (step: EasterEggStep) => void
  isEasterEggComplete: (step: EasterEggStep) => boolean

  // HUD message
  hudMessage: string | null
  hudType: 'info' | 'locked' | 'success' | null
  showHud: (message: string, type?: 'info' | 'locked' | 'success', duration?: number) => void
  clearHud: () => void

  // Nearby interactable — drives "Press E" hint
  nearbyLabel: string | null
  setNearbyLabel: (label: string | null) => void

  // Terminal overlay — open/close the CLI screen
  terminalOpen: boolean
  openTerminal: () => void
  closeTerminal: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  frontDoorUnlocked: true, // TEMP BYPASS — see interface comment above
  unlockFrontDoor: () => set({ frontDoorUnlocked: true }),

  currentLocation: 'yard',
  setCurrentLocation: (floor) => set({ currentLocation: floor }),
  teleportRequest: null,
  requestTeleport: (req) => set({ teleportRequest: req }),
  clearTeleportRequest: () => set({ teleportRequest: null }),
  enterInterior: () =>
    set({
      currentLocation: 'ground',
      teleportRequest: { position: [FOYER_ENTRY_POINT[0], INTERIOR_EYE_HEIGHT, FOYER_ENTRY_POINT[2]], yaw: Math.PI, floor: 'ground' },
    }),
  exitToYard: () =>
    set({
      currentLocation: 'yard',
      teleportRequest: { position: YARD_EXIT_POINT, yaw: YARD_EXIT_YAW, floor: 'yard' },
    }),

  homeOfficeOpen: false,
  openHomeOffice: () => set({ homeOfficeOpen: true }),
  closeHomeOffice: () => set({ homeOfficeOpen: false }),

  enterPromptOpen: false,
  openEnterPrompt: () => set({ enterPromptOpen: true }),
  closeEnterPrompt: () => set({ enterPromptOpen: false }),

  completedEasterEggs: new Set(),
  completeEasterEgg: (step) =>
    set((state) => ({
      completedEasterEggs: new Set([...state.completedEasterEggs, step]),
    })),
  isEasterEggComplete: (step) => get().completedEasterEggs.has(step),

  hudMessage: null,
  hudType: null,
  showHud: (message, type = 'info', duration = 3000) => {
    set({ hudMessage: message, hudType: type })
    setTimeout(() => {
      set((state) => {
        // Only clear if the message hasn't been replaced
        if (state.hudMessage === message) {
          return { hudMessage: null, hudType: null }
        }
        return {}
      })
    }, duration)
  },
  clearHud: () => set({ hudMessage: null, hudType: null }),

  nearbyLabel: null,
  setNearbyLabel: (label) => set({ nearbyLabel: label }),

  terminalOpen: false,
  openTerminal: () => set({ terminalOpen: true }),
  closeTerminal: () => set({ terminalOpen: false }),
}))
