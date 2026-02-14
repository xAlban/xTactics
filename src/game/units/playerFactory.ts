import type {
  Player,
  PlayerClass,
  BonusStats,
  EquipmentLoadout,
  LevelProgress,
} from '@/types/player'

// ---- XP required to reach a given level ----
export function xpForLevel(level: number): number {
  return level * 100
}

// ---- All bonus stats start at zero ----
export function createDefaultBonusStats(): BonusStats {
  return {
    health: 0,
    power: 0,
    intelligence: 0,
    agility: 0,
    luck: 0,
  }
}

// ---- All equipment slots start empty ----
export function createEmptyEquipment(): EquipmentLoadout {
  return {
    head: null,
    cape: null,
    belt: null,
    boots: null,
    ring1: null,
    ring2: null,
  }
}

// ---- Create a fresh level-1 player ----
export function createPlayer(
  id: string,
  name: string,
  playerClass: PlayerClass,
): Player {
  return {
    id,
    name,
    playerClass,
    levelProgress: {
      level: 1,
      currentXp: 0,
      xpToNextLevel: xpForLevel(1),
    },
    baseAp: 6,
    baseMp: 3,
    bonusStats: createDefaultBonusStats(),
    equipment: createEmptyEquipment(),
  }
}

// ---- Create a dummy enemy with basic stats ----
export function createEnemy(id: string, name: string): Player {
  return {
    id,
    name,
    playerClass: 'knight',
    levelProgress: {
      level: 1,
      currentXp: 0,
      xpToNextLevel: xpForLevel(1),
    },
    baseAp: 6,
    baseMp: 3,
    bonusStats: createDefaultBonusStats(),
    equipment: createEmptyEquipment(),
  }
}

// ---- Add XP with overflow handling for multi-level-ups ----
export function addXp(
  levelProgress: LevelProgress,
  amount: number,
): LevelProgress {
  let { level, currentXp, xpToNextLevel } = levelProgress
  currentXp += amount

  // ---- Keep leveling up while XP exceeds threshold ----
  while (currentXp >= xpToNextLevel) {
    currentXp -= xpToNextLevel
    level++
    xpToNextLevel = xpForLevel(level)
  }

  return { level, currentXp, xpToNextLevel }
}
