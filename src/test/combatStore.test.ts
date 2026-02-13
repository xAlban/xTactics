import { describe, it, expect, beforeEach } from 'vitest'
import { useCombatStore } from '@/stores/combatStore'
import { createPlayer } from '@/game/units/playerFactory'
import { generateGridTiles } from '@/game/map/gridUtils'
import type { CombatMapDefinition } from '@/types/grid'

// ---- Simple 5x5 open map for testing ----
const TEST_MAP: CombatMapDefinition = {
  name: 'Test 5x5',
  layout: ['.....', '.....', '.....', '.....', '.....'],
  tileSize: 1,
  tileGap: 0,
}

const testTiles = generateGridTiles(TEST_MAP)
const testPlayer = createPlayer('p1', 'TestKnight', 'knight')

// ---- Reset store state before each test ----
beforeEach(() => {
  useCombatStore.setState({
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
  })
})

describe('initCombat', () => {
  it('creates combat units from players', () => {
    const store = useCombatStore.getState()
    store.initCombat([testPlayer], [{ col: 2, row: 2 }], testTiles)

    const state = useCombatStore.getState()
    expect(state.units).toHaveLength(1)
    expect(state.units[0]!.player.id).toBe('p1')
    expect(state.units[0]!.position).toEqual({ col: 2, row: 2 })
    expect(state.units[0]!.currentAp).toBe(6)
    expect(state.units[0]!.currentMp).toBe(3)
  })

  it('computes reachable tiles after init', () => {
    const store = useCombatStore.getState()
    store.initCombat([testPlayer], [{ col: 2, row: 2 }], testTiles)

    const state = useCombatStore.getState()
    // ---- From center of 5x5 with 3 MP, many tiles should be reachable ----
    expect(state.reachableTiles.length).toBeGreaterThan(0)
  })
})

describe('setHoveredTile', () => {
  it('sets preview path when hovering a reachable tile', () => {
    const store = useCombatStore.getState()
    store.initCombat([testPlayer], [{ col: 2, row: 2 }], testTiles)

    useCombatStore.getState().setHoveredTile({ col: 2, row: 0 })
    const state = useCombatStore.getState()

    expect(state.hoveredTile).toEqual({ col: 2, row: 0 })
    expect(state.previewPath.length).toBeGreaterThan(0)
    expect(state.previewPathKeys.size).toBeGreaterThan(0)
  })

  it('clears preview when hovering null', () => {
    const store = useCombatStore.getState()
    store.initCombat([testPlayer], [{ col: 2, row: 2 }], testTiles)

    useCombatStore.getState().setHoveredTile({ col: 2, row: 0 })
    useCombatStore.getState().setHoveredTile(null)

    const state = useCombatStore.getState()
    expect(state.hoveredTile).toBeNull()
    expect(state.previewPath).toHaveLength(0)
  })

  it('clears preview when hovering unreachable tile', () => {
    const store = useCombatStore.getState()
    store.initCombat([testPlayer], [{ col: 0, row: 0 }], testTiles)

    // ---- (4,4) is 8 steps away, unreachable with 3 MP ----
    useCombatStore.getState().setHoveredTile({ col: 4, row: 4 })

    const state = useCombatStore.getState()
    expect(state.hoveredTile).toBeNull()
    expect(state.previewPath).toHaveLength(0)
  })
})

describe('executeMove', () => {
  it('moves the unit and reduces MP', () => {
    const store = useCombatStore.getState()
    store.initCombat([testPlayer], [{ col: 2, row: 2 }], testTiles)

    useCombatStore.getState().executeMove({ col: 2, row: 0 })
    const state = useCombatStore.getState()

    expect(state.units[0]!.position).toEqual({ col: 2, row: 0 })
    expect(state.units[0]!.currentMp).toBe(1)
    expect(state.isMoving).toBe(true)
    expect(state.movementPath.length).toBeGreaterThan(0)
  })

  it('does nothing during movement animation', () => {
    const store = useCombatStore.getState()
    store.initCombat([testPlayer], [{ col: 2, row: 2 }], testTiles)

    useCombatStore.getState().executeMove({ col: 2, row: 0 })
    const mpAfterFirst = useCombatStore.getState().units[0]!.currentMp

    // ---- Try to move again while still animating ----
    useCombatStore.getState().executeMove({ col: 3, row: 0 })
    expect(useCombatStore.getState().units[0]!.currentMp).toBe(mpAfterFirst)
  })

  it('recomputes reachable tiles after animation completes', () => {
    const store = useCombatStore.getState()
    store.initCombat([testPlayer], [{ col: 2, row: 2 }], testTiles)

    useCombatStore.getState().executeMove({ col: 2, row: 0 })
    // ---- Clear reachable during animation ----
    expect(useCombatStore.getState().reachableTiles).toHaveLength(0)

    // ---- Signal animation complete ----
    useCombatStore.getState().setIsMoving(false)
    expect(useCombatStore.getState().reachableTiles.length).toBeGreaterThan(0)
  })
})

describe('endTurn', () => {
  it('cycles to next unit and resets their resources', () => {
    const player2 = createPlayer('p2', 'TestMage', 'mage')

    const store = useCombatStore.getState()
    store.initCombat(
      [testPlayer, player2],
      [
        { col: 0, row: 0 },
        { col: 4, row: 4 },
      ],
      testTiles,
    )

    // ---- Deplete some MP on first player ----
    useCombatStore.getState().executeMove({ col: 1, row: 0 })
    useCombatStore.getState().setIsMoving(false)

    useCombatStore.getState().endTurn()

    const state = useCombatStore.getState()
    expect(state.activeUnitIndex).toBe(1)
    expect(state.units[1]!.currentMp).toBe(3)
    expect(state.units[1]!.currentAp).toBe(6)
    expect(state.turnNumber).toBe(2)
  })

  it('wraps around to first unit', () => {
    const player2 = createPlayer('p2', 'TestMage', 'mage')

    const store = useCombatStore.getState()
    store.initCombat(
      [testPlayer, player2],
      [
        { col: 0, row: 0 },
        { col: 4, row: 4 },
      ],
      testTiles,
    )

    useCombatStore.getState().endTurn()
    useCombatStore.getState().endTurn()

    expect(useCombatStore.getState().activeUnitIndex).toBe(0)
  })
})

describe('MP depletion', () => {
  it('has no reachable tiles when MP is 0', () => {
    const store = useCombatStore.getState()
    store.initCombat([testPlayer], [{ col: 2, row: 2 }], testTiles)

    // ---- Move 3 times (3 MP total) ----
    useCombatStore.getState().executeMove({ col: 2, row: 1 })
    useCombatStore.getState().setIsMoving(false)

    useCombatStore.getState().executeMove({ col: 2, row: 0 })
    useCombatStore.getState().setIsMoving(false)

    useCombatStore.getState().executeMove({ col: 3, row: 0 })
    useCombatStore.getState().setIsMoving(false)

    const state = useCombatStore.getState()
    expect(state.units[0]!.currentMp).toBe(0)
    expect(state.reachableTiles).toHaveLength(0)
  })
})
