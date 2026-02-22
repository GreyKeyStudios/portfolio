import { create } from 'zustand'

export type EasterEggStep = 'touch-grass' // more steps added as rooms are built

interface PlayerState {
  // Door state
  frontDoorUnlocked: boolean
  unlockFrontDoor: () => void

  // Easter egg progress
  completedEasterEggs: Set<EasterEggStep>
  completeEasterEgg: (step: EasterEggStep) => void
  isEasterEggComplete: (step: EasterEggStep) => boolean

  // HUD message
  hudMessage: string | null
  hudType: 'info' | 'locked' | 'success' | null
  showHud: (message: string, type?: 'info' | 'locked' | 'success', duration?: number) => void
  clearHud: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  frontDoorUnlocked: false,
  unlockFrontDoor: () => set({ frontDoorUnlocked: true }),

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
}))
