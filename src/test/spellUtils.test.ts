import { describe, it, expect } from 'vitest'
import {
  manhattanDistance,
  getSpellRangeTiles,
  isTileInSpellRange,
  computeDamagePreview,
  rollSpellDamage,
} from '@/game/combat/spellUtils'
import { generateGridTiles } from '@/game/map/gridUtils'
import type { CombatMapDefinition } from '@/types/grid'
import type { SpellDefinition } from '@/types/spell'
import type { BonusStats } from '@/types/player'

// ---- Simple 3x3 all-ground map ----
const SIMPLE_3X3: CombatMapDefinition = {
  name: 'Test 3x3',
  layout: ['...', '...', '...'],
  tileSize: 1,
  tileGap: 0,
}

// ---- 3x3 map with center obstacle ----
const CENTER_OBSTACLE: CombatMapDefinition = {
  name: 'Test obstacle',
  layout: ['...', '.X.', '...'],
  tileSize: 1,
  tileGap: 0,
}

// ---- Test spell: range 1, single earth element ----
const TEST_MELEE: SpellDefinition = {
  id: 'test-melee',
  name: 'Test Melee',
  description: 'Test',
  apCost: 3,
  minRange: 1,
  maxRange: 1,
  damages: [{ element: 'earth', minDamage: 10, maxDamage: 15 }],
  icon: 'Sword',
}

// ---- Test spell: range 1-3, multi-element ----
const TEST_RANGED: SpellDefinition = {
  id: 'test-ranged',
  name: 'Test Ranged',
  description: 'Test',
  apCost: 4,
  minRange: 1,
  maxRange: 3,
  damages: [
    { element: 'fire', minDamage: 5, maxDamage: 10 },
    { element: 'earth', minDamage: 2, maxDamage: 4 },
  ],
  icon: 'Flame',
}

// ---- Zero bonus stats ----
const ZERO_STATS: BonusStats = {
  health: 0,
  power: 0,
  intelligence: 0,
  agility: 0,
  luck: 0,
}

describe('manhattanDistance', () => {
  it('returns 0 for same tile', () => {
    expect(manhattanDistance({ col: 1, row: 1 }, { col: 1, row: 1 })).toBe(0)
  })

  it('returns 1 for adjacent tiles', () => {
    expect(manhattanDistance({ col: 0, row: 0 }, { col: 1, row: 0 })).toBe(1)
    expect(manhattanDistance({ col: 0, row: 0 }, { col: 0, row: 1 })).toBe(1)
  })

  it('returns sum of col and row differences', () => {
    expect(manhattanDistance({ col: 0, row: 0 }, { col: 2, row: 3 })).toBe(5)
  })

  it('handles negative direction', () => {
    expect(manhattanDistance({ col: 3, row: 3 }, { col: 1, row: 0 })).toBe(5)
  })
})

describe('getSpellRangeTiles', () => {
  it('returns tiles within range', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const result = getSpellRangeTiles(TEST_MELEE, { col: 1, row: 1 }, tiles)

    // ---- 4 cardinal neighbors at distance 1 ----
    expect(result).toHaveLength(4)
  })

  it('excludes tiles outside max range', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const result = getSpellRangeTiles(TEST_MELEE, { col: 0, row: 0 }, tiles)

    // ---- From corner, only 2 adjacent ground tiles at distance 1 ----
    expect(result).toHaveLength(2)
    expect(result.some((c) => c.col === 2 && c.row === 2)).toBe(false)
  })

  it('excludes tiles below min range', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    // ---- minRange 1 means self-tile is excluded ----
    const result = getSpellRangeTiles(TEST_MELEE, { col: 1, row: 1 }, tiles)

    expect(result.some((c) => c.col === 1 && c.row === 1)).toBe(false)
  })

  it('excludes obstacle tiles', () => {
    const tiles = generateGridTiles(CENTER_OBSTACLE)
    const result = getSpellRangeTiles(TEST_MELEE, { col: 0, row: 1 }, tiles)

    // ---- Center (1,1) is an obstacle, should not be in range ----
    expect(result.some((c) => c.col === 1 && c.row === 1)).toBe(false)
  })

  it('returns correct tiles for ranged spell', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const result = getSpellRangeTiles(TEST_RANGED, { col: 0, row: 0 }, tiles)

    // ---- From (0,0), range 1-3 on 3x3 grid: all tiles except self ----
    expect(result.some((c) => c.col === 0 && c.row === 0)).toBe(false)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('isTileInSpellRange', () => {
  it('returns true at min range', () => {
    expect(
      isTileInSpellRange(TEST_MELEE, { col: 0, row: 0 }, { col: 1, row: 0 }),
    ).toBe(true)
  })

  it('returns true at max range', () => {
    expect(
      isTileInSpellRange(TEST_RANGED, { col: 0, row: 0 }, { col: 3, row: 0 }),
    ).toBe(true)
  })

  it('returns false below min range', () => {
    expect(
      isTileInSpellRange(TEST_MELEE, { col: 0, row: 0 }, { col: 0, row: 0 }),
    ).toBe(false)
  })

  it('returns false above max range', () => {
    expect(
      isTileInSpellRange(TEST_MELEE, { col: 0, row: 0 }, { col: 2, row: 0 }),
    ).toBe(false)
  })
})

describe('computeDamagePreview', () => {
  it('returns base damage with zero stats', () => {
    const preview = computeDamagePreview(TEST_MELEE, ZERO_STATS)

    expect(preview.spellName).toBe('Test Melee')
    expect(preview.damages).toHaveLength(1)
    expect(preview.damages[0]!.minDamage).toBe(10)
    expect(preview.damages[0]!.maxDamage).toBe(15)
    expect(preview.totalMinDamage).toBe(10)
    expect(preview.totalMaxDamage).toBe(15)
  })

  it('scales earth damage with power stat', () => {
    const stats: BonusStats = { ...ZERO_STATS, power: 5 }
    const preview = computeDamagePreview(TEST_MELEE, stats)

    expect(preview.damages[0]!.minDamage).toBe(15)
    expect(preview.damages[0]!.maxDamage).toBe(20)
  })

  it('scales fire damage with intelligence stat', () => {
    const stats: BonusStats = { ...ZERO_STATS, intelligence: 3 }
    const preview = computeDamagePreview(TEST_RANGED, stats)

    // ---- Fire component: 5+3=8 to 10+3=13 ----
    expect(preview.damages[0]!.minDamage).toBe(8)
    expect(preview.damages[0]!.maxDamage).toBe(13)
  })

  it('computes correct totals for multi-element spell', () => {
    const stats: BonusStats = { ...ZERO_STATS, intelligence: 2, power: 3 }
    const preview = computeDamagePreview(TEST_RANGED, stats)

    // ---- Fire: 5+2=7 to 10+2=12, Earth: 2+3=5 to 4+3=7 ----
    expect(preview.totalMinDamage).toBe(12)
    expect(preview.totalMaxDamage).toBe(19)
  })
})

describe('rollSpellDamage', () => {
  it('returns value within expected range', () => {
    // ---- Run multiple times to check bounds ----
    for (let i = 0; i < 50; i++) {
      const damage = rollSpellDamage(TEST_MELEE, ZERO_STATS)
      expect(damage).toBeGreaterThanOrEqual(10)
      expect(damage).toBeLessThanOrEqual(15)
    }
  })

  it('includes stat bonuses in damage range', () => {
    const stats: BonusStats = { ...ZERO_STATS, power: 5 }
    for (let i = 0; i < 50; i++) {
      const damage = rollSpellDamage(TEST_MELEE, stats)
      expect(damage).toBeGreaterThanOrEqual(15)
      expect(damage).toBeLessThanOrEqual(20)
    }
  })

  it('sums multi-element damage', () => {
    for (let i = 0; i < 50; i++) {
      const damage = rollSpellDamage(TEST_RANGED, ZERO_STATS)
      // ---- Fire: 5-10, Earth: 2-4, total: 7-14 ----
      expect(damage).toBeGreaterThanOrEqual(7)
      expect(damage).toBeLessThanOrEqual(14)
    }
  })
})
