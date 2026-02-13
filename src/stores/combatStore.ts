import { create } from 'zustand'
import type { TileCoord, TileData } from '@/types/grid'
import type { CombatUnit, Path, TurnPhase } from '@/types/combat'
import type { Player } from '@/types/player'
import {
  coordKey,
  buildWalkableSet,
  bfsReachable,
  getReachableCoords,
  reconstructPath,
} from '@/game/combat/pathfinding'

interface CombatState {
  // ---- Combat units and turn tracking ----
  units: CombatUnit[]
  activeUnitIndex: number
  turnPhase: TurnPhase
  turnNumber: number

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

  // ---- Actions ----
  initCombat: (
    players: Player[],
    startPositions: TileCoord[],
    tiles: TileData[],
  ) => void
  computeReachable: () => void
  setHoveredTile: (coord: TileCoord | null) => void
  executeMove: (target: TileCoord) => void
  setIsMoving: (moving: boolean) => void
  endTurn: () => void
}

export const useCombatStore = create<CombatState>((set, get) => ({
  units: [],
  activeUnitIndex: 0,
  turnPhase: 'movement',
  turnNumber: 1,
  tiles: [],
  reachableTiles: [],
  reachableTileKeys: new Set(),
  hoveredTile: null,
  previewPath: [],
  previewPathKeys: new Set(),
  movementPath: [],
  isMoving: false,

  initCombat: (players, startPositions, tiles) => {
    const units: CombatUnit[] = players.map((player, i) => ({
      player,
      position: startPositions[i]!,
      currentAp: player.baseAp,
      currentMp: player.baseMp,
    }))

    set({ units, tiles, activeUnitIndex: 0, turnNumber: 1 })

    // ---- Compute reachable tiles for first active unit ----
    get().computeReachable()
  },

  computeReachable: () => {
    const { units, activeUnitIndex, tiles } = get()
    const activeUnit = units[activeUnitIndex]
    if (!activeUnit) return

    // ---- Build occupied set excluding the active unit itself ----
    const occupied = units
      .filter((_, i) => i !== activeUnitIndex)
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
    const { reachableTileKeys, units, activeUnitIndex, tiles, isMoving } = get()

    // ---- Ignore hover during movement animation ----
    if (isMoving) return

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
      set({ hoveredTile: coord, previewPath: [], previewPathKeys: new Set() })
      return
    }

    // ---- Rebuild BFS to reconstruct path to hovered tile ----
    const occupied = units
      .filter((_, i) => i !== activeUnitIndex)
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
    const { units, activeUnitIndex, tiles, isMoving } = get()
    if (isMoving) return

    const activeUnit = units[activeUnitIndex]
    if (!activeUnit) return

    // ---- Rebuild BFS and reconstruct path ----
    const occupied = units
      .filter((_, i) => i !== activeUnitIndex)
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
    const { units, activeUnitIndex } = get()
    const nextIndex = (activeUnitIndex + 1) % units.length

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
      movementPath: [],
    })

    get().computeReachable()
  },
}))
