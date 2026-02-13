import { create } from 'zustand'
import type { GameMode } from '@/types/game'
import type { Player } from '@/types/player'
import { createPlayer } from '@/game/units/playerFactory'

interface GameModeState {
  mode: GameMode
  player: Player

  // ---- Player world position in normal mode ----
  playerPosition: { x: number; z: number }
  targetPosition: { x: number; z: number } | null

  // ---- Actions ----
  enterCombat: () => void
  exitCombat: () => void
  setTargetPosition: (pos: { x: number; z: number }) => void
  setPlayerPosition: (pos: { x: number; z: number }) => void
}

export const useGameModeStore = create<GameModeState>((set) => ({
  mode: 'normal',
  player: createPlayer('player1', 'xAlban', 'bomberman'),
  playerPosition: { x: 0, z: 0 },
  targetPosition: null,

  enterCombat: () => set({ mode: 'combat' }),

  exitCombat: () => set({ mode: 'normal', targetPosition: null }),

  setTargetPosition: (pos) => set({ targetPosition: pos }),

  setPlayerPosition: (pos) =>
    set({ playerPosition: pos, targetPosition: null }),
}))
