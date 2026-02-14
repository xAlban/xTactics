import type { TileCoord, CombatMapDefinition } from '@/types/grid'
import type { Player } from '@/types/player'

// ---- Team allegiance for multiplayer-ready architecture ----
export type UnitTeam = 'player' | 'enemy'

// ---- A unit placed on the combat grid with current resources ----
export interface CombatUnit {
  player: Player
  position: TileCoord
  currentAp: number
  currentMp: number
  currentHp: number
  maxHp: number
  team: UnitTeam
  defeated: boolean
}

// ---- Phases within a single turn ----
export type TurnPhase = 'movement' | 'action' | 'end'

// ---- Ordered list of tile coordinates forming a movement path ----
export type Path = TileCoord[]

// ---- Combat outcome ----
export type CombatStatus = 'active' | 'victory' | 'defeat'

// ---- Enemy placement in a combat encounter ----
export interface EnemySetup {
  id: string
  name: string
  position: TileCoord
}

// ---- Full combat encounter definition ----
export interface CombatSetup {
  map: CombatMapDefinition
  playerStartPositions: TileCoord[]
  enemies: EnemySetup[]
}
