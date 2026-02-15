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

// ---- Item categories ----
export type ItemCategory = 'equipment' | 'consumable' | 'resource' | 'key'

// ---- Equipment subcategory maps to slot groups ----
export type EquipmentSubcategory = 'head' | 'cape' | 'belt' | 'boots' | 'ring'

// ---- A game item (equipment, consumable, resource, key) ----
export interface Item {
  id: string
  name: string
  description: string
  category: ItemCategory
  subcategory?: EquipmentSubcategory | string
  equipmentSlot?: EquipmentSlot
  bonusStats?: Partial<BonusStats>
  stackable: boolean
  icon?: string
}

// ---- A slot in the player inventory (item + quantity) ----
export interface InventorySlot {
  item: Item
  quantity: number
}

// ---- Equipment loadout: one item (or null) per slot ----
export type EquipmentLoadout = Record<EquipmentSlot, Item | null>

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
  inventory: InventorySlot[]
}
