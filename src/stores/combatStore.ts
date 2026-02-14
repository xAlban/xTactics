import { create } from 'zustand'
import type { TileCoord, TileData } from '@/types/grid'
import type {
  CombatUnit,
  Path,
  TurnPhase,
  CombatStatus,
  CombatSetup,
  UnitTeam,
} from '@/types/combat'
import type { Player } from '@/types/player'
import type { SpellDefinition } from '@/types/spell'
import {
  coordKey,
  buildWalkableSet,
  bfsReachable,
  getReachableCoords,
  reconstructPath,
} from '@/game/combat/pathfinding'
import { getSpellRangeTiles, rollSpellDamage } from '@/game/combat/spellUtils'
import { createEnemy } from '@/game/units/playerFactory'
import { generateGridTiles } from '@/game/map/gridUtils'

// ---- Turn timer duration in seconds ----
const TURN_TIMER_DURATION = 30

// ---- Default HP for units (until proper health system) ----
const DEFAULT_HP = 50

interface CombatState {
  // ---- Combat units and turn tracking ----
  units: CombatUnit[]
  activeUnitIndex: number
  turnPhase: TurnPhase
  turnNumber: number

  // ---- Combat status ----
  combatStatus: CombatStatus

  // ---- Turn timer ----
  turnTimeRemaining: number
  _timerInterval: ReturnType<typeof setInterval> | null

  // ---- Map tiles (set once at combat init) ----
  tiles: TileData[]

  // ---- Reachable tiles from active unit's position ----
  reachableTiles: TileCoord[]
  reachableTileKeys: Set<string>

  // ---- Hover/preview state ----
  hoveredTile: TileCoord | null
  previewPath: Path
  previewPathKeys: Set<string>

  // ---- Movement animation state ----
  movementPath: Path
  isMoving: boolean

  // ---- Spell system state ----
  selectedSpell: SpellDefinition | null
  spellRangeTiles: TileCoord[]
  spellRangeTileKeys: Set<string>
  spellHoveredTarget: TileCoord | null
  interactionMode: 'movement' | 'spell'
  spellTargetScreenPos: { x: number; y: number } | null

  // ---- Actions ----
  initCombat: (setup: CombatSetup, players: Player[]) => void
  computeReachable: () => void
  setHoveredTile: (coord: TileCoord | null) => void
  executeMove: (target: TileCoord) => void
  setIsMoving: (moving: boolean) => void
  endTurn: () => void
  passTurn: () => void
  startTurnTimer: () => void
  clearTurnTimer: () => void
  tickTimer: () => void
  checkCombatEnd: () => CombatStatus
  _processNextUnit: () => void

  // ---- Spell actions ----
  selectSpell: (spell: SpellDefinition) => void
  cancelSpell: () => void
  setSpellHoveredTarget: (coord: TileCoord | null) => void
  castSpell: (targetCoord: TileCoord) => void
  setSpellTargetScreenPos: (pos: { x: number; y: number } | null) => void
}

// ---- Helper: check if the active unit belongs to the player team ----
function isPlayerTurn(units: CombatUnit[], activeUnitIndex: number): boolean {
  const unit = units[activeUnitIndex]
  return unit !== undefined && unit.team === 'player'
}

// ---- Helper: find next alive unit index ----
function findNextAliveUnit(units: CombatUnit[], currentIndex: number): number {
  const count = units.length
  for (let i = 1; i <= count; i++) {
    const idx = (currentIndex + i) % count
    if (!units[idx]!.defeated) return idx
  }
  return currentIndex
}

export const useCombatStore = create<CombatState>((set, get) => ({
  units: [],
  activeUnitIndex: 0,
  turnPhase: 'movement',
  turnNumber: 1,
  combatStatus: 'active',
  turnTimeRemaining: TURN_TIMER_DURATION,
  _timerInterval: null,
  tiles: [],
  reachableTiles: [],
  reachableTileKeys: new Set(),
  hoveredTile: null,
  previewPath: [],
  previewPathKeys: new Set(),
  movementPath: [],
  isMoving: false,

  selectedSpell: null,
  spellRangeTiles: [],
  spellRangeTileKeys: new Set(),
  spellHoveredTarget: null,
  interactionMode: 'movement',
  spellTargetScreenPos: null,

  initCombat: (setup, players) => {
    // ---- Clear any existing timer ----
    get().clearTurnTimer()

    // ---- Create player units ----
    const playerUnits: CombatUnit[] = players.map((player, i) => ({
      player,
      position: setup.playerStartPositions[i]!,
      currentAp: player.baseAp,
      currentMp: player.baseMp,
      currentHp: DEFAULT_HP,
      maxHp: DEFAULT_HP,
      team: 'player' as UnitTeam,
      defeated: false,
    }))

    // ---- Create enemy units from setup ----
    const enemyUnits: CombatUnit[] = setup.enemies.map((enemy) => {
      const enemyPlayer = createEnemy(enemy.id, enemy.name)
      return {
        player: enemyPlayer,
        position: enemy.position,
        currentAp: enemyPlayer.baseAp,
        currentMp: enemyPlayer.baseMp,
        currentHp: DEFAULT_HP,
        maxHp: DEFAULT_HP,
        team: 'enemy' as UnitTeam,
        defeated: false,
      }
    })

    // ---- Players first, then enemies in turn order ----
    const units = [...playerUnits, ...enemyUnits]

    // ---- Generate tiles from the map definition ----
    const tiles = generateGridTiles(setup.map)

    set({
      units,
      tiles,
      activeUnitIndex: 0,
      turnNumber: 1,
      turnPhase: 'movement',
      combatStatus: 'active',
      turnTimeRemaining: TURN_TIMER_DURATION,
      movementPath: [],
      isMoving: false,
      selectedSpell: null,
      spellRangeTiles: [],
      spellRangeTileKeys: new Set(),
      spellHoveredTarget: null,
      interactionMode: 'movement',
      spellTargetScreenPos: null,
    })

    // ---- Compute reachable tiles for first active unit ----
    get().computeReachable()

    // ---- Start timer if first unit is a player ----
    if (units[0] && units[0].team === 'player') {
      get().startTurnTimer()
    }
  },

  computeReachable: () => {
    const { units, activeUnitIndex, tiles, combatStatus } = get()
    if (combatStatus !== 'active') return

    const activeUnit = units[activeUnitIndex]
    if (!activeUnit || activeUnit.defeated) return

    // ---- Build occupied set excluding the active unit itself ----
    const occupied = units
      .filter((_, i) => i !== activeUnitIndex)
      .filter((u) => !u.defeated)
      .map((u) => u.position)

    const walkable = buildWalkableSet(tiles, occupied)
    // ---- Add the active unit's own position as walkable for BFS origin ----
    walkable.add(coordKey(activeUnit.position))

    const reachableMap = bfsReachable(
      activeUnit.position,
      activeUnit.currentMp,
      walkable,
    )
    const reachableTiles = getReachableCoords(reachableMap, activeUnit.position)
    const reachableTileKeys = new Set(reachableTiles.map(coordKey))

    set({
      reachableTiles,
      reachableTileKeys,
      hoveredTile: null,
      previewPath: [],
      previewPathKeys: new Set(),
    })
  },

  setHoveredTile: (coord) => {
    const {
      reachableTileKeys,
      units,
      activeUnitIndex,
      tiles,
      isMoving,
      combatStatus,
      interactionMode,
    } = get()

    // ---- Ignore hover during movement animation or when combat is over ----
    if (isMoving || combatStatus !== 'active') return

    // ---- Only allow interaction on player turns ----
    if (!isPlayerTurn(units, activeUnitIndex)) return

    // ---- Delegate to spell hover when in spell mode ----
    if (interactionMode === 'spell') {
      get().setSpellHoveredTarget(coord)
      return
    }

    if (!coord) {
      set({
        hoveredTile: null,
        previewPath: [],
        previewPathKeys: new Set(),
      })
      return
    }

    const activeUnit = units[activeUnitIndex]
    if (!activeUnit) return

    const key = coordKey(coord)
    const isOwnTile =
      coord.col === activeUnit.position.col &&
      coord.row === activeUnit.position.row

    // ---- Allow hover on active unit's tile to reveal reachable zone ----
    if (!reachableTileKeys.has(key) && !isOwnTile) {
      set({
        hoveredTile: null,
        previewPath: [],
        previewPathKeys: new Set(),
      })
      return
    }

    if (isOwnTile) {
      set({
        hoveredTile: coord,
        previewPath: [],
        previewPathKeys: new Set(),
      })
      return
    }

    // ---- Rebuild BFS to reconstruct path to hovered tile ----
    const occupied = units
      .filter((_, i) => i !== activeUnitIndex)
      .filter((u) => !u.defeated)
      .map((u) => u.position)
    const walkable = buildWalkableSet(tiles, occupied)
    walkable.add(coordKey(activeUnit.position))

    const reachableMap = bfsReachable(
      activeUnit.position,
      activeUnit.currentMp,
      walkable,
    )
    const previewPath = reconstructPath(reachableMap, coord)
    const previewPathKeys = new Set(previewPath.map(coordKey))

    set({ hoveredTile: coord, previewPath, previewPathKeys })
  },

  executeMove: (target) => {
    const { units, activeUnitIndex, tiles, isMoving, combatStatus, interactionMode } = get()
    if (isMoving || combatStatus !== 'active') return

    // ---- Block movement when in spell mode ----
    if (interactionMode === 'spell') return

    // ---- Only allow movement on player turns ----
    if (!isPlayerTurn(units, activeUnitIndex)) return

    const activeUnit = units[activeUnitIndex]
    if (!activeUnit) return

    // ---- Rebuild BFS and reconstruct path ----
    const occupied = units
      .filter((_, i) => i !== activeUnitIndex)
      .filter((u) => !u.defeated)
      .map((u) => u.position)
    const walkable = buildWalkableSet(tiles, occupied)
    walkable.add(coordKey(activeUnit.position))

    const reachableMap = bfsReachable(
      activeUnit.position,
      activeUnit.currentMp,
      walkable,
    )
    const movementPath = reconstructPath(reachableMap, target)
    if (movementPath.length < 2) return

    // ---- Steps consumed = path length minus the origin tile ----
    const stepsUsed = movementPath.length - 1

    const updatedUnits = [...units]
    updatedUnits[activeUnitIndex] = {
      ...activeUnit,
      position: target,
      currentMp: activeUnit.currentMp - stepsUsed,
    }

    set({
      units: updatedUnits,
      movementPath,
      isMoving: true,
      hoveredTile: null,
      previewPath: [],
      previewPathKeys: new Set(),
      reachableTiles: [],
      reachableTileKeys: new Set(),
    })
  },

  setIsMoving: (moving) => {
    set({ isMoving: moving })

    // ---- Recompute reachable tiles after animation completes ----
    if (!moving) {
      get().computeReachable()
    }
  },

  endTurn: () => {
    const { units, activeUnitIndex, combatStatus } = get()
    if (combatStatus !== 'active') return

    // ---- Clear timer for the current turn ----
    get().clearTurnTimer()

    // ---- Find next alive unit ----
    const nextIndex = findNextAliveUnit(units, activeUnitIndex)

    // ---- Reset the next unit's AP/MP to their base values ----
    const updatedUnits = [...units]
    const nextUnit = updatedUnits[nextIndex]!
    updatedUnits[nextIndex] = {
      ...nextUnit,
      currentAp: nextUnit.player.baseAp,
      currentMp: nextUnit.player.baseMp,
    }

    set({
      units: updatedUnits,
      activeUnitIndex: nextIndex,
      turnPhase: 'movement',
      turnNumber: get().turnNumber + 1,
      turnTimeRemaining: TURN_TIMER_DURATION,
      movementPath: [],
      hoveredTile: null,
      previewPath: [],
      previewPathKeys: new Set(),
      selectedSpell: null,
      spellRangeTiles: [],
      spellRangeTileKeys: new Set(),
      spellHoveredTarget: null,
      interactionMode: 'movement',
      spellTargetScreenPos: null,
    })

    get().computeReachable()

    // ---- Process the next unit (auto-pass if enemy) ----
    get()._processNextUnit()
  },

  passTurn: () => {
    const { combatStatus } = get()
    if (combatStatus !== 'active') return
    get().endTurn()
  },

  startTurnTimer: () => {
    get().clearTurnTimer()

    const interval = setInterval(() => {
      get().tickTimer()
    }, 1000)

    set({ _timerInterval: interval, turnTimeRemaining: TURN_TIMER_DURATION })
  },

  clearTurnTimer: () => {
    const { _timerInterval } = get()
    if (_timerInterval !== null) {
      clearInterval(_timerInterval)
      set({ _timerInterval: null })
    }
  },

  tickTimer: () => {
    const { turnTimeRemaining, combatStatus } = get()
    if (combatStatus !== 'active') {
      get().clearTurnTimer()
      return
    }

    const newTime = turnTimeRemaining - 1
    if (newTime <= 0) {
      // ---- Timer expired, auto-end the turn ----
      get().endTurn()
    } else {
      set({ turnTimeRemaining: newTime })
    }
  },

  checkCombatEnd: () => {
    const { units } = get()

    const aliveEnemies = units.filter((u) => u.team === 'enemy' && !u.defeated)
    const alivePlayers = units.filter((u) => u.team === 'player' && !u.defeated)

    if (aliveEnemies.length === 0) return 'victory'
    if (alivePlayers.length === 0) return 'defeat'
    return 'active'
  },

  _processNextUnit: () => {
    const { units, activeUnitIndex, combatStatus } = get()
    if (combatStatus !== 'active') return

    const nextUnit = units[activeUnitIndex]
    if (!nextUnit) return

    if (nextUnit.team === 'enemy') {
      // ---- Enemies auto-pass after a short delay for visual feedback ----
      setTimeout(() => {
        const current = get()
        if (current.combatStatus !== 'active') return
        current.endTurn()
      }, 500)
    } else {
      // ---- Player turn: start the timer ----
      get().startTurnTimer()
    }
  },

  selectSpell: (spell) => {
    const { units, activeUnitIndex, tiles, combatStatus } = get()
    if (combatStatus !== 'active') return
    if (!isPlayerTurn(units, activeUnitIndex)) return

    const activeUnit = units[activeUnitIndex]
    if (!activeUnit || activeUnit.currentAp < spell.apCost) return

    // ---- Compute spell range tiles ----
    const spellRangeTiles = getSpellRangeTiles(
      spell,
      activeUnit.position,
      tiles,
    )
    const spellRangeTileKeys = new Set(spellRangeTiles.map(coordKey))

    set({
      selectedSpell: spell,
      spellRangeTiles,
      spellRangeTileKeys,
      spellHoveredTarget: null,
      interactionMode: 'spell',
      // ---- Clear movement hover state ----
      hoveredTile: null,
      previewPath: [],
      previewPathKeys: new Set(),
    })
  },

  cancelSpell: () => {
    set({
      selectedSpell: null,
      spellRangeTiles: [],
      spellRangeTileKeys: new Set(),
      spellHoveredTarget: null,
      interactionMode: 'movement',
      spellTargetScreenPos: null,
    })

    // ---- Restore movement highlights ----
    get().computeReachable()
  },

  setSpellHoveredTarget: (coord) => {
    const { interactionMode, selectedSpell, spellRangeTileKeys } = get()
    if (interactionMode !== 'spell' || !selectedSpell) return

    if (!coord) {
      set({ spellHoveredTarget: null })
      return
    }

    const key = coordKey(coord)
    if (spellRangeTileKeys.has(key)) {
      set({ spellHoveredTarget: coord })
    } else {
      set({ spellHoveredTarget: null })
    }
  },

  castSpell: (targetCoord) => {
    const {
      selectedSpell,
      interactionMode,
      units,
      activeUnitIndex,
      combatStatus,
      spellRangeTileKeys,
    } = get()

    // ---- Guards ----
    if (!selectedSpell) return
    if (interactionMode !== 'spell') return
    if (combatStatus !== 'active') return
    if (!isPlayerTurn(units, activeUnitIndex)) return

    const targetKey = coordKey(targetCoord)
    if (!spellRangeTileKeys.has(targetKey)) return

    const activeUnit = units[activeUnitIndex]
    if (!activeUnit || activeUnit.currentAp < selectedSpell.apCost) return

    // ---- Deduct AP ----
    const updatedUnits = [...units]
    updatedUnits[activeUnitIndex] = {
      ...activeUnit,
      currentAp: activeUnit.currentAp - selectedSpell.apCost,
    }

    // ---- Check if there is a living unit on the target tile ----
    const targetUnitIndex = updatedUnits.findIndex(
      (u) =>
        !u.defeated &&
        u.position.col === targetCoord.col &&
        u.position.row === targetCoord.row,
    )

    if (targetUnitIndex !== -1) {
      const targetUnit = updatedUnits[targetUnitIndex]!
      const damage = rollSpellDamage(selectedSpell, activeUnit.player.bonusStats)
      const newHp = Math.max(0, targetUnit.currentHp - damage)

      updatedUnits[targetUnitIndex] = {
        ...targetUnit,
        currentHp: newHp,
        defeated: newHp <= 0,
      }
    }

    // ---- Clear spell state ----
    set({
      units: updatedUnits,
      selectedSpell: null,
      spellRangeTiles: [],
      spellRangeTileKeys: new Set(),
      spellHoveredTarget: null,
      interactionMode: 'movement',
      spellTargetScreenPos: null,
    })

    // ---- Check combat end after damage ----
    const result = get().checkCombatEnd()
    if (result !== 'active') {
      set({ combatStatus: result })
      get().clearTurnTimer()
    }

    // ---- Recompute movement range (AP changed) ----
    get().computeReachable()
  },

  setSpellTargetScreenPos: (pos) => {
    set({ spellTargetScreenPos: pos })
  },
}))
