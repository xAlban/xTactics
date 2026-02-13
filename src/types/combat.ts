import type { TileCoord } from '@/types/grid'
import type { Player } from '@/types/player'

// ---- A player placed on the combat grid with current resources ----
export interface CombatUnit {
  player: Player
  position: TileCoord
  currentAp: number
  currentMp: number
}

// ---- Phases within a single turn ----
export type TurnPhase = 'movement' | 'action' | 'end'

// ---- Ordered list of tile coordinates forming a movement path ----
export type Path = TileCoord[]
