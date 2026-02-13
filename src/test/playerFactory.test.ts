import { describe, it, expect } from 'vitest'
import {
  createPlayer,
  createDefaultBonusStats,
  createEmptyEquipment,
  addXp,
  xpForLevel,
} from '@/game/units/playerFactory'

describe('xpForLevel', () => {
  it('returns level * 100', () => {
    expect(xpForLevel(1)).toBe(100)
    expect(xpForLevel(5)).toBe(500)
    expect(xpForLevel(10)).toBe(1000)
  })
})

describe('createDefaultBonusStats', () => {
  it('creates all stats at zero', () => {
    const stats = createDefaultBonusStats()
    expect(stats.health).toBe(0)
    expect(stats.power).toBe(0)
    expect(stats.intelligence).toBe(0)
    expect(stats.agility).toBe(0)
    expect(stats.luck).toBe(0)
  })
})

describe('createEmptyEquipment', () => {
  it('creates all slots as null', () => {
    const equipment = createEmptyEquipment()
    expect(equipment.head).toBeNull()
    expect(equipment.cape).toBeNull()
    expect(equipment.belt).toBeNull()
    expect(equipment.boots).toBeNull()
    expect(equipment.ring1).toBeNull()
    expect(equipment.ring2).toBeNull()
  })
})

describe('createPlayer', () => {
  it('creates a level-1 player with correct defaults', () => {
    const player = createPlayer('p1', 'TestKnight', 'knight')

    expect(player.id).toBe('p1')
    expect(player.name).toBe('TestKnight')
    expect(player.playerClass).toBe('knight')
    expect(player.levelProgress.level).toBe(1)
    expect(player.levelProgress.currentXp).toBe(0)
    expect(player.levelProgress.xpToNextLevel).toBe(100)
    expect(player.baseAp).toBe(6)
    expect(player.baseMp).toBe(3)
  })

  it('starts with zero bonus stats', () => {
    const player = createPlayer('p1', 'Test', 'mage')
    expect(Object.values(player.bonusStats).every((v) => v === 0)).toBe(true)
  })

  it('starts with empty equipment', () => {
    const player = createPlayer('p1', 'Test', 'archer')
    expect(Object.values(player.equipment).every((v) => v === null)).toBe(true)
  })
})

describe('addXp', () => {
  it('adds XP without leveling up', () => {
    const result = addXp({ level: 1, currentXp: 0, xpToNextLevel: 100 }, 50)
    expect(result.level).toBe(1)
    expect(result.currentXp).toBe(50)
  })

  it('levels up when XP reaches threshold', () => {
    const result = addXp({ level: 1, currentXp: 0, xpToNextLevel: 100 }, 100)
    expect(result.level).toBe(2)
    expect(result.currentXp).toBe(0)
    expect(result.xpToNextLevel).toBe(200)
  })

  it('handles overflow into multiple level-ups', () => {
    // ---- Level 1 needs 100, level 2 needs 200: total 300 to reach level 3 ----
    const result = addXp({ level: 1, currentXp: 0, xpToNextLevel: 100 }, 350)
    expect(result.level).toBe(3)
    expect(result.currentXp).toBe(50)
    expect(result.xpToNextLevel).toBe(300)
  })

  it('preserves existing XP when adding more', () => {
    const result = addXp({ level: 1, currentXp: 80, xpToNextLevel: 100 }, 30)
    expect(result.level).toBe(2)
    expect(result.currentXp).toBe(10)
  })
})
