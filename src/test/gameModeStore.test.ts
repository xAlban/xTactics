import { describe, it, expect, beforeEach } from 'vitest'
import { useGameModeStore } from '@/stores/gameModeStore'
import type { CombatSetup } from '@/types/combat'

// ---- Minimal combat setup for testing mode switching ----
const TEST_SETUP: CombatSetup = {
  map: {
    name: 'Test',
    layout: ['...', '...', '...'],
    tileSize: 1,
    tileGap: 0,
  },
  playerStartPositions: [{ col: 1, row: 1 }],
  enemies: [],
}

// ---- Reset store state before each test ----
beforeEach(() => {
  useGameModeStore.setState({
    mode: 'normal',
    playerPosition: { x: 0, z: 0 },
    targetPosition: null,
    activeCombatSetup: null,
  })
})

describe('gameModeStore', () => {
  it('starts in normal mode', () => {
    const state = useGameModeStore.getState()
    expect(state.mode).toBe('normal')
  })

  it('has a player created on init', () => {
    const state = useGameModeStore.getState()
    expect(state.player).toBeDefined()
    expect(state.player.id).toBe('player1')
    expect(state.player.playerClass).toBe('bomberman')
  })

  it('enters combat mode with setup', () => {
    useGameModeStore.getState().enterCombat(TEST_SETUP)
    const state = useGameModeStore.getState()
    expect(state.mode).toBe('combat')
    expect(state.activeCombatSetup).toBe(TEST_SETUP)
  })

  it('exits combat mode back to normal', () => {
    useGameModeStore.getState().enterCombat(TEST_SETUP)
    useGameModeStore.getState().exitCombat()

    const state = useGameModeStore.getState()
    expect(state.mode).toBe('normal')
    expect(state.targetPosition).toBeNull()
    expect(state.activeCombatSetup).toBeNull()
  })

  it('sets target position for click-to-move', () => {
    useGameModeStore.getState().setTargetPosition({ x: 5, z: 3 })
    expect(useGameModeStore.getState().targetPosition).toEqual({ x: 5, z: 3 })
  })

  it('updates player position and clears target on arrival', () => {
    useGameModeStore.getState().setTargetPosition({ x: 5, z: 3 })
    useGameModeStore.getState().setPlayerPosition({ x: 5, z: 3 })

    const state = useGameModeStore.getState()
    expect(state.playerPosition).toEqual({ x: 5, z: 3 })
    expect(state.targetPosition).toBeNull()
  })

  it('updates player position without clearing target', () => {
    useGameModeStore.getState().setTargetPosition({ x: 10, z: 10 })
    useGameModeStore.getState().updatePlayerPosition({ x: 5, z: 5 })

    const state = useGameModeStore.getState()
    expect(state.playerPosition).toEqual({ x: 5, z: 5 })
    expect(state.targetPosition).toEqual({ x: 10, z: 10 })
  })
})
