// ---- Player class determines visual style and future abilities ----
export type PlayerClass = 'bomberman' | 'archer' | 'knight' | 'mage'

// ---- Stat keys for bonus stats (extensible union) ----
export type StatKey = 'health' | 'power' | 'intelligence' | 'agility' | 'luck'

// ---- Bonus stats: all start at 0, can be increased by gear/levels ----
export type BonusStats = Record<StatKey, number>

// ---- Equipment slots available to a player ----
export type EquipmentSlot =
  | 'head'
  | 'cape'
  | 'belt'
  | 'boots'
  | 'ring1'
  | 'ring2'

// ---- A piece of equipment that can go in a slot ----
export interface EquipmentItem {
  id: string
  name: string
  slot: EquipmentSlot
  bonusStats: Partial<BonusStats>
}

// ---- Equipment loadout: one item (or null) per slot ----
export type EquipmentLoadout = Record<EquipmentSlot, EquipmentItem | null>

// ---- XP and level tracking ----
export interface LevelProgress {
  level: number
  currentXp: number
  xpToNextLevel: number
}

// ---- Full player definition ----
export interface Player {
  id: string
  name: string
  playerClass: PlayerClass
  levelProgress: LevelProgress
  baseAp: number
  baseMp: number
  bonusStats: BonusStats
  equipment: EquipmentLoadout
}
