import { create } from 'zustand'
import type { GameMode } from '@/types/game'
import type { Player } from '@/types/player'
import type { CombatSetup } from '@/types/combat'
import { createPlayer } from '@/game/units/playerFactory'

interface GameModeState {
  mode: GameMode
  player: Player

  // ---- Player world position in normal mode ----
  playerPosition: { x: number; z: number }
  targetPosition: { x: number; z: number } | null

  // ---- Active combat encounter definition ----
  activeCombatSetup: CombatSetup | null

  // ---- Actions ----
  enterCombat: (setup: CombatSetup) => void
  exitCombat: () => void
  setTargetPosition: (pos: { x: number; z: number }) => void
  setPlayerPosition: (pos: { x: number; z: number }) => void
  updatePlayerPosition: (pos: { x: number; z: number }) => void
}

export const useGameModeStore = create<GameModeState>((set) => ({
  mode: 'normal',
  player: createPlayer('player1', 'xAlban', 'bomberman'),
  playerPosition: { x: 0, z: 0 },
  targetPosition: null,
  activeCombatSetup: null,

  enterCombat: (setup) => set({ mode: 'combat', activeCombatSetup: setup }),

  exitCombat: () =>
    set({ mode: 'normal', targetPosition: null, activeCombatSetup: null }),

  setTargetPosition: (pos) => set({ targetPosition: pos }),

  setPlayerPosition: (pos) =>
    set({ playerPosition: pos, targetPosition: null }),

  updatePlayerPosition: (pos) => set({ playerPosition: pos }),
}))
