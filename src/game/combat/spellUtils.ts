import type { TileCoord, TileData } from '@/types/grid'
import type {
  SpellDefinition,
  SpellDamagePreview,
  DamagePreview,
} from '@/types/spell'
import type { BonusStats } from '@/types/player'
import { ELEMENT_STAT_MAP } from '@/types/spell'

// ---- Compute Manhattan distance between two tiles ----
export function manhattanDistance(a: TileCoord, b: TileCoord): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row)
}

// ---- Get all tiles within spell range from caster position ----
// ---- Respects minRange and maxRange, only returns ground tiles ----
export function getSpellRangeTiles(
  spell: SpellDefinition,
  casterPosition: TileCoord,
  tiles: TileData[],
): TileCoord[] {
  const result: TileCoord[] = []

  for (const tile of tiles) {
    if (tile.type !== 'ground') continue
    const dist = manhattanDistance(casterPosition, tile.coord)
    if (dist >= spell.minRange && dist <= spell.maxRange) {
      result.push(tile.coord)
    }
  }

  return result
}

// ---- Check if a specific tile is within spell range ----
export function isTileInSpellRange(
  spell: SpellDefinition,
  casterPosition: TileCoord,
  targetCoord: TileCoord,
): boolean {
  const dist = manhattanDistance(casterPosition, targetCoord)
  return dist >= spell.minRange && dist <= spell.maxRange
}

// ---- Compute damage preview with stat scaling ----
export function computeDamagePreview(
  spell: SpellDefinition,
  casterStats: BonusStats,
): SpellDamagePreview {
  const damages: DamagePreview[] = spell.damages.map((dmg) => {
    const statKey = ELEMENT_STAT_MAP[dmg.element]
    const statBonus = casterStats[statKey]

    return {
      element: dmg.element,
      minDamage: dmg.minDamage + statBonus,
      maxDamage: dmg.maxDamage + statBonus,
    }
  })

  const totalMinDamage = damages.reduce((sum, d) => sum + d.minDamage, 0)
  const totalMaxDamage = damages.reduce((sum, d) => sum + d.maxDamage, 0)

  return {
    spellName: spell.name,
    damages,
    totalMinDamage,
    totalMaxDamage,
  }
}

// ---- Roll actual damage (random within range, per element) ----
export function rollSpellDamage(
  spell: SpellDefinition,
  casterStats: BonusStats,
): number {
  let total = 0

  for (const dmg of spell.damages) {
    const statKey = ELEMENT_STAT_MAP[dmg.element]
    const statBonus = casterStats[statKey]
    const min = dmg.minDamage + statBonus
    const max = dmg.maxDamage + statBonus
    // ---- Random integer between min and max inclusive ----
    total += Math.floor(Math.random() * (max - min + 1)) + min
  }

  return total
}
