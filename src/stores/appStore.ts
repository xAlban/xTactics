import { create } from 'zustand'
import type { AppScreen } from '@/types/app'

interface AppState {
  screen: AppScreen
  loggedInUser: string | null

  // ---- Actions ----
  login: (username: string) => void
  logout: () => void
  goToCharacterSelect: () => void
  goToCharacterCreate: () => void
  enterGame: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  screen: 'login',
  loggedInUser: null,

  login: (username) =>
    set({ screen: 'characterSelect', loggedInUser: username }),

  logout: () => set({ screen: 'login', loggedInUser: null }),

  goToCharacterSelect: () => set({ screen: 'characterSelect' }),

  goToCharacterCreate: () => set({ screen: 'characterCreate' }),

  enterGame: () => set({ screen: 'inGame' }),
}))
