import type { StatKey } from './player'

// ---- Damage element determines which stat boosts it ----
export type DamageElement = 'earth' | 'fire' | 'air' | 'water'

// ---- Mapping from element to the stat that scales it ----
// ---- earth -> power, fire -> intelligence, air -> agility, water -> luck ----
export const ELEMENT_STAT_MAP: Record<DamageElement, StatKey> = {
  earth: 'power',
  fire: 'intelligence',
  air: 'agility',
  water: 'luck',
}

// ---- A single damage component with min/max range and element ----
export interface SpellDamage {
  element: DamageElement
  minDamage: number
  maxDamage: number
}

// ---- Full spell definition ----
export interface SpellDefinition {
  id: string
  name: string
  description: string
  apCost: number
  minRange: number // 0 means can target self
  maxRange: number
  damages: SpellDamage[]
  icon: string // Lucide icon name for future use
}

// ---- Computed damage preview for a single damage component ----
export interface DamagePreview {
  element: DamageElement
  minDamage: number
  maxDamage: number
}

// ---- Full preview for displaying to the user ----
export interface SpellDamagePreview {
  spellName: string
  damages: DamagePreview[]
  totalMinDamage: number
  totalMaxDamage: number
}
