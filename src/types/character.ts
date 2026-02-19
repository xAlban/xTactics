import type { Player } from '@/types/player'

// ---- Maximum number of character slots per account ----
export const MAX_CHARACTER_SLOTS = 3

// ---- A saved character slot with world state ----
export interface CharacterSlot {
  slotIndex: number
  player: Player
  zoneId: string
  position: { x: number; z: number }
  createdAt: number
  lastPlayedAt: number
}
