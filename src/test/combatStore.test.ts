import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useCombatStore } from '@/stores/combatStore'
import { useFloatingNumberStore } from '@/stores/floatingNumberStore'
import { createPlayer } from '@/game/units/playerFactory'
import type { CombatMapDefinition } from '@/types/grid'
import type { CombatSetup } from '@/types/combat'
import { SPELL_MELEE_STRIKE } from '@/game/combat/spellDefinitions'

// ---- Simple 5x5 open map for testing ----
const TEST_MAP: CombatMapDefinition = {
  name: 'Test 5x5',
  layout: ['.....', '.....', '.....', '.....', '.....'],
  tileSize: 1,
  tileGap: 0,
}

const testPlayer = createPlayer('p1', 'TestKnight', 'knight')

// ---- Helper to create a CombatSetup for tests ----
function makeSetup(
  playerPositions: { col: number; row: number }[],
  enemies: {
    id: string
    name: string
    position: { col: number; row: number }
  }[] = [],
): CombatSetup {
  return {
    map: TEST_MAP,
    playerStartPositions: playerPositions,
    enemies,
  }
}

// ---- Reset store state before each test ----
beforeEach(() => {
  vi.useFakeTimers()
  useCombatStore.setState({
    units: [],
    activeUnitIndex: 0,
    turnPhase: 'movement',
    turnNumber: 1,
    combatStatus: 'active',
    turnTimeRemaining: 30,
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
    hoveredUnit: null,
    hoveredUnitScreenPos: null,
  })
  useFloatingNumberStore.getState().clearAll()
})

afterEach(() => {
  useCombatStore.getState().clearTurnTimer()
  vi.useRealTimers()
})

describe('initCombat', () => {
  it('creates combat units from players and enemies', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    const state = useCombatStore.getState()
    expect(state.units).toHaveLength(2)
    expect(state.units[0]!.player.id).toBe('p1')
    expect(state.units[0]!.position).toEqual({ col: 2, row: 2 })
    expect(state.units[0]!.team).toBe('player')
    expect(state.units[0]!.currentAp).toBe(6)
    expect(state.units[0]!.currentMp).toBe(3)
    expect(state.units[1]!.player.id).toBe('e1')
    expect(state.units[1]!.team).toBe('enemy')
    expect(state.units[1]!.defeated).toBe(false)
  })

  it('computes reachable tiles after init', () => {
    const setup = makeSetup([{ col: 2, row: 2 }])
    useCombatStore.getState().initCombat(setup, [testPlayer])

    const state = useCombatStore.getState()
    // ---- From center of 5x5 with 3 MP, many tiles should be reachable ----
    expect(state.reachableTiles.length).toBeGreaterThan(0)
  })
})

describe('setHoveredTile', () => {
  it('sets preview path when hovering a reachable tile', () => {
    const setup = makeSetup([{ col: 2, row: 2 }])
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().setHoveredTile({ col: 2, row: 0 })
    const state = useCombatStore.getState()

    expect(state.hoveredTile).toEqual({ col: 2, row: 0 })
    expect(state.previewPath.length).toBeGreaterThan(0)
    expect(state.previewPathKeys.size).toBeGreaterThan(0)
  })

  it('clears preview when hovering null', () => {
    const setup = makeSetup([{ col: 2, row: 2 }])
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().setHoveredTile({ col: 2, row: 0 })
    useCombatStore.getState().setHoveredTile(null)

    const state = useCombatStore.getState()
    expect(state.hoveredTile).toBeNull()
    expect(state.previewPath).toHaveLength(0)
  })

  it('clears preview when hovering unreachable tile', () => {
    const setup = makeSetup([{ col: 0, row: 0 }])
    useCombatStore.getState().initCombat(setup, [testPlayer])

    // ---- (4,4) is 8 steps away, unreachable with 3 MP ----
    useCombatStore.getState().setHoveredTile({ col: 4, row: 4 })

    const state = useCombatStore.getState()
    expect(state.hoveredTile).toBeNull()
    expect(state.previewPath).toHaveLength(0)
  })

  it('ignores hover during enemy turns', () => {
    const setup = makeSetup(
      [{ col: 0, row: 0 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    // ---- Manually set active to enemy unit ----
    useCombatStore.setState({ activeUnitIndex: 1 })
    useCombatStore.getState().setHoveredTile({ col: 1, row: 0 })

    expect(useCombatStore.getState().hoveredTile).toBeNull()
  })
})

describe('executeMove', () => {
  it('moves the unit and reduces MP', () => {
    const setup = makeSetup([{ col: 2, row: 2 }])
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().executeMove({ col: 2, row: 0 })
    const state = useCombatStore.getState()

    expect(state.units[0]!.position).toEqual({ col: 2, row: 0 })
    expect(state.units[0]!.currentMp).toBe(1)
    expect(state.isMoving).toBe(true)
    expect(state.movementPath.length).toBeGreaterThan(0)
  })

  it('does nothing during movement animation', () => {
    const setup = makeSetup([{ col: 2, row: 2 }])
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().executeMove({ col: 2, row: 0 })
    const mpAfterFirst = useCombatStore.getState().units[0]!.currentMp

    // ---- Try to move again while still animating ----
    useCombatStore.getState().executeMove({ col: 3, row: 0 })
    expect(useCombatStore.getState().units[0]!.currentMp).toBe(mpAfterFirst)
  })

  it('recomputes reachable tiles after animation completes', () => {
    const setup = makeSetup([{ col: 2, row: 2 }])
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().executeMove({ col: 2, row: 0 })
    // ---- Clear reachable during animation ----
    expect(useCombatStore.getState().reachableTiles).toHaveLength(0)

    // ---- Signal animation complete ----
    useCombatStore.getState().setIsMoving(false)
    expect(useCombatStore.getState().reachableTiles.length).toBeGreaterThan(0)
  })
})

describe('endTurn', () => {
  it('cycles to next player unit and resets their resources', () => {
    const player2 = createPlayer('p2', 'TestMage', 'mage')

    const setup = makeSetup([
      { col: 0, row: 0 },
      { col: 4, row: 4 },
    ])
    useCombatStore.getState().initCombat(setup, [testPlayer, player2])

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

    const setup = makeSetup([
      { col: 0, row: 0 },
      { col: 4, row: 4 },
    ])
    useCombatStore.getState().initCombat(setup, [testPlayer, player2])

    useCombatStore.getState().endTurn()
    useCombatStore.getState().endTurn()

    expect(useCombatStore.getState().activeUnitIndex).toBe(0)
  })

  it('skips defeated units', () => {
    const player2 = createPlayer('p2', 'TestMage', 'mage')

    const setup = makeSetup([
      { col: 0, row: 0 },
      { col: 2, row: 2 },
      { col: 4, row: 4 },
    ])
    const player3 = createPlayer('p3', 'TestArcher', 'archer')
    useCombatStore.getState().initCombat(setup, [testPlayer, player2, player3])

    // ---- Defeat the second player ----
    const units = [...useCombatStore.getState().units]
    units[1] = { ...units[1]!, defeated: true, currentHp: 0 }
    useCombatStore.setState({ units })

    useCombatStore.getState().endTurn()

    // ---- Should skip index 1 (defeated) and go to index 2 ----
    expect(useCombatStore.getState().activeUnitIndex).toBe(2)
  })
})

describe('enemy auto-pass', () => {
  it('enemies auto-pass their turn after delay', () => {
    const setup = makeSetup(
      [{ col: 0, row: 0 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    // ---- End player turn, cycling to enemy (index 1) ----
    useCombatStore.getState().endTurn()
    expect(useCombatStore.getState().activeUnitIndex).toBe(1)

    // ---- Enemy auto-passes after 500ms delay ----
    vi.advanceTimersByTime(500)
    // ---- Should cycle back to player (index 0) ----
    expect(useCombatStore.getState().activeUnitIndex).toBe(0)
  })
})

describe('turn timer', () => {
  it('starts at 30 seconds for player turns', () => {
    const setup = makeSetup([{ col: 2, row: 2 }])
    useCombatStore.getState().initCombat(setup, [testPlayer])

    expect(useCombatStore.getState().turnTimeRemaining).toBe(30)
  })

  it('counts down each second', () => {
    const setup = makeSetup([{ col: 2, row: 2 }])
    useCombatStore.getState().initCombat(setup, [testPlayer])

    vi.advanceTimersByTime(3000)
    expect(useCombatStore.getState().turnTimeRemaining).toBe(27)
  })

  it('auto-ends turn when timer reaches 0', () => {
    const setup = makeSetup(
      [{ col: 0, row: 0 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    const initialTurn = useCombatStore.getState().turnNumber

    // ---- Advance 30 seconds to expire the timer ----
    vi.advanceTimersByTime(30000)

    // ---- Turn should have advanced (enemy auto-passes too) ----
    expect(useCombatStore.getState().turnNumber).toBeGreaterThan(initialTurn)
  })
})

describe('passTurn', () => {
  it('ends the current turn', () => {
    const setup = makeSetup(
      [{ col: 0, row: 0 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().passTurn()

    // ---- Enemy auto-passes ----
    vi.advanceTimersByTime(500)

    // ---- Should be back to player turn ----
    expect(useCombatStore.getState().activeUnitIndex).toBe(0)
    expect(useCombatStore.getState().turnNumber).toBe(3)
  })
})

describe('combat end conditions', () => {
  it('detects victory when all enemies are defeated', () => {
    const setup = makeSetup(
      [{ col: 0, row: 0 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    // ---- Defeat the enemy ----
    const units = [...useCombatStore.getState().units]
    units[1] = { ...units[1]!, defeated: true, currentHp: 0 }
    useCombatStore.setState({ units })

    expect(useCombatStore.getState().checkCombatEnd()).toBe('victory')
  })

  it('detects defeat when all players are defeated', () => {
    const setup = makeSetup(
      [{ col: 0, row: 0 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    // ---- Defeat the player ----
    const units = [...useCombatStore.getState().units]
    units[0] = { ...units[0]!, defeated: true, currentHp: 0 }
    useCombatStore.setState({ units })

    expect(useCombatStore.getState().checkCombatEnd()).toBe('defeat')
  })

  it('returns active when both teams have alive units', () => {
    const setup = makeSetup(
      [{ col: 0, row: 0 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    expect(useCombatStore.getState().checkCombatEnd()).toBe('active')
  })
})

describe('MP depletion', () => {
  it('has no reachable tiles when MP is 0', () => {
    const setup = makeSetup([{ col: 2, row: 2 }])
    useCombatStore.getState().initCombat(setup, [testPlayer])

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

describe('spell selection', () => {
  it('selectSpell sets selectedSpell, interactionMode, and computes range', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)

    const state = useCombatStore.getState()
    expect(state.selectedSpell).toBe(SPELL_MELEE_STRIKE)
    expect(state.interactionMode).toBe('spell')
    expect(state.spellRangeTiles.length).toBeGreaterThan(0)
    expect(state.spellRangeTileKeys.size).toBeGreaterThan(0)
  })

  it('selectSpell blocked when not enough AP', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    // ---- Set AP to 2 (less than Strike's cost of 3) ----
    const units = [...useCombatStore.getState().units]
    units[0] = { ...units[0]!, currentAp: 2 }
    useCombatStore.setState({ units })

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)

    expect(useCombatStore.getState().selectedSpell).toBeNull()
    expect(useCombatStore.getState().interactionMode).toBe('movement')
  })

  it('selectSpell blocked during enemy turn', () => {
    const setup = makeSetup(
      [{ col: 0, row: 0 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    // ---- Switch to enemy turn ----
    useCombatStore.setState({ activeUnitIndex: 1 })

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)

    expect(useCombatStore.getState().selectedSpell).toBeNull()
  })

  it('cancelSpell clears spell state and restores movement mode', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    useCombatStore.getState().cancelSpell()

    const state = useCombatStore.getState()
    expect(state.selectedSpell).toBeNull()
    expect(state.interactionMode).toBe('movement')
    expect(state.spellRangeTiles).toHaveLength(0)
    // ---- Movement reachable tiles should be restored ----
    expect(state.reachableTiles.length).toBeGreaterThan(0)
  })
})

describe('spell casting', () => {
  it('castSpell deducts AP from active unit', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 2, row: 3 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    const apBefore = useCombatStore.getState().units[0]!.currentAp
    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    useCombatStore.getState().castSpell({ col: 2, row: 3 })

    expect(useCombatStore.getState().units[0]!.currentAp).toBe(
      apBefore - SPELL_MELEE_STRIKE.apCost,
    )
  })

  it('castSpell deals damage to target unit', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 2, row: 3 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    const hpBefore = useCombatStore.getState().units[1]!.currentHp
    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    useCombatStore.getState().castSpell({ col: 2, row: 3 })

    expect(useCombatStore.getState().units[1]!.currentHp).toBeLessThan(hpBefore)
  })

  it('castSpell marks unit defeated when HP reaches 0', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 2, row: 3 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    // ---- Set enemy HP very low so a single hit kills ----
    const units = [...useCombatStore.getState().units]
    units[1] = { ...units[1]!, currentHp: 1 }
    useCombatStore.setState({ units })

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    useCombatStore.getState().castSpell({ col: 2, row: 3 })

    expect(useCombatStore.getState().units[1]!.defeated).toBe(true)
    expect(useCombatStore.getState().units[1]!.currentHp).toBe(0)
  })

  it('castSpell triggers victory when last enemy killed', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 2, row: 3 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    // ---- Set enemy HP very low ----
    const units = [...useCombatStore.getState().units]
    units[1] = { ...units[1]!, currentHp: 1 }
    useCombatStore.setState({ units })

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    useCombatStore.getState().castSpell({ col: 2, row: 3 })

    expect(useCombatStore.getState().combatStatus).toBe('victory')
  })

  it('castSpell on empty tile consumes AP but deals no damage', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    const apBefore = useCombatStore.getState().units[0]!.currentAp
    const enemyHpBefore = useCombatStore.getState().units[1]!.currentHp

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    // ---- Cast on adjacent empty tile ----
    useCombatStore.getState().castSpell({ col: 2, row: 3 })

    expect(useCombatStore.getState().units[0]!.currentAp).toBe(
      apBefore - SPELL_MELEE_STRIKE.apCost,
    )
    // ---- Enemy should not take damage ----
    expect(useCombatStore.getState().units[1]!.currentHp).toBe(enemyHpBefore)
  })

  it('castSpell blocked when target not in range', () => {
    const setup = makeSetup(
      [{ col: 0, row: 0 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    const apBefore = useCombatStore.getState().units[0]!.currentAp

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    // ---- (4,4) is far out of melee range ----
    useCombatStore.getState().castSpell({ col: 4, row: 4 })

    // ---- AP should not have changed ----
    expect(useCombatStore.getState().units[0]!.currentAp).toBe(apBefore)
  })

  it('castSpell clears spell state after cast', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 2, row: 3 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    useCombatStore.getState().castSpell({ col: 2, row: 3 })

    const state = useCombatStore.getState()
    expect(state.selectedSpell).toBeNull()
    expect(state.interactionMode).toBe('movement')
    expect(state.spellRangeTiles).toHaveLength(0)
  })
})

describe('spell interaction mode', () => {
  it('setHoveredTile delegates to setSpellHoveredTarget when in spell mode', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 2, row: 3 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    useCombatStore.getState().setHoveredTile({ col: 2, row: 3 })

    const state = useCombatStore.getState()
    expect(state.spellHoveredTarget).toEqual({ col: 2, row: 3 })
    // ---- Movement hover state should remain clear ----
    expect(state.hoveredTile).toBeNull()
  })

  it('executeMove blocked when in spell mode', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    useCombatStore.getState().executeMove({ col: 2, row: 0 })

    // ---- Position should not have changed ----
    expect(useCombatStore.getState().units[0]!.position).toEqual({
      col: 2,
      row: 2,
    })
  })

  it('endTurn clears spell state', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    expect(useCombatStore.getState().interactionMode).toBe('spell')

    useCombatStore.getState().endTurn()

    // ---- After enemy auto-passes back to player ----
    vi.advanceTimersByTime(500)

    const state = useCombatStore.getState()
    expect(state.selectedSpell).toBeNull()
    expect(state.interactionMode).toBe('movement')
  })
})

describe('floating numbers', () => {
  it('emits MP floating number on movement', () => {
    const setup = makeSetup([{ col: 2, row: 2 }])
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().executeMove({ col: 2, row: 0 })

    const numbers = useFloatingNumberStore.getState().numbers
    expect(numbers).toHaveLength(1)
    expect(numbers[0]!.type).toBe('mp')
    expect(numbers[0]!.value).toBe(2)
    expect(numbers[0]!.tileCoord).toEqual({ col: 2, row: 0 })
  })

  it('emits AP floating number on spell cast', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 2, row: 3 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    useCombatStore.getState().castSpell({ col: 2, row: 3 })

    const numbers = useFloatingNumberStore.getState().numbers
    const apNumber = numbers.find((n) => n.type === 'ap')
    expect(apNumber).toBeDefined()
    expect(apNumber!.value).toBe(SPELL_MELEE_STRIKE.apCost)
    expect(apNumber!.tileCoord).toEqual({ col: 2, row: 2 })
  })

  it('emits damage floating number when spell hits a unit', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 2, row: 3 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    useCombatStore.getState().castSpell({ col: 2, row: 3 })

    const numbers = useFloatingNumberStore.getState().numbers
    const damageNumber = numbers.find((n) => n.type === 'damage')
    expect(damageNumber).toBeDefined()
    expect(damageNumber!.value).toBeGreaterThan(0)
    expect(damageNumber!.tileCoord).toEqual({ col: 2, row: 3 })
  })

  it('does not emit damage floating number when spell hits empty tile', () => {
    const setup = makeSetup(
      [{ col: 2, row: 2 }],
      [{ id: 'e1', name: 'Dummy', position: { col: 4, row: 4 } }],
    )
    useCombatStore.getState().initCombat(setup, [testPlayer])

    useCombatStore.getState().selectSpell(SPELL_MELEE_STRIKE)
    useCombatStore.getState().castSpell({ col: 2, row: 3 })

    const numbers = useFloatingNumberStore.getState().numbers
    const damageNumber = numbers.find((n) => n.type === 'damage')
    expect(damageNumber).toBeUndefined()
    // ---- AP cost should still be emitted ----
    const apNumber = numbers.find((n) => n.type === 'ap')
    expect(apNumber).toBeDefined()
  })
})
