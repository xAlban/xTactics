import type { SpellDefinition } from '@/types/spell'

// ---- Melee strike: 1-range, low AP, earth element ----
export const SPELL_MELEE_STRIKE: SpellDefinition = {
  id: 'melee-strike',
  name: 'Strike',
  description: 'A powerful close-range blow.',
  apCost: 3,
  minRange: 1,
  maxRange: 1,
  damages: [{ element: 'earth', minDamage: 8, maxDamage: 12 }],
  icon: 'Sword',
}

// ---- Ranged attack: 1-3 range, higher AP, fire + earth element ----
export const SPELL_FIREBALL: SpellDefinition = {
  id: 'fireball',
  name: 'Fireball',
  description: 'Hurl a ball of fire at a distant foe.',
  apCost: 4,
  minRange: 1,
  maxRange: 3,
  damages: [
    { element: 'fire', minDamage: 5, maxDamage: 10 },
    { element: 'earth', minDamage: 1, maxDamage: 3 },
  ],
  icon: 'Flame',
}

// ---- Default spell loadout for all classes (for now) ----
export const DEFAULT_SPELLS: SpellDefinition[] = [
  SPELL_MELEE_STRIKE,
  SPELL_FIREBALL,
]
