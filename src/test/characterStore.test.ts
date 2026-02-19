import { describe, it, expect, beforeEach } from 'vitest'
import { useCharacterStore } from '@/stores/characterStore'
import { useGameModeStore } from '@/stores/gameModeStore'
import { useZoneStore } from '@/stores/zoneStore'

// ---- Reset store state before each test ----
beforeEach(() => {
  useCharacterStore.setState({
    slots: [null, null, null],
    activeSlotIndex: null,
  })
  useGameModeStore.setState({
    mode: 'normal',
    playerPosition: { x: 0, z: 0 },
    targetPosition: null,
  })
})

describe('characterStore', () => {
  it('starts with 3 empty slots', () => {
    const state = useCharacterStore.getState()
    expect(state.slots).toHaveLength(3)
    expect(state.slots.every((s) => s === null)).toBe(true)
    expect(state.activeSlotIndex).toBeNull()
  })

  it('creates a character in an empty slot', () => {
    useCharacterStore.getState().createCharacter(0, 'Hero', 'knight')
    const slot = useCharacterStore.getState().slots[0]
    expect(slot).not.toBeNull()
    expect(slot!.player.name).toBe('Hero')
    expect(slot!.player.playerClass).toBe('knight')
    expect(slot!.player.levelProgress.level).toBe(1)
    expect(slot!.zoneId).toBe('grass-zone')
    expect(slot!.position).toEqual({ x: -65, z: 0 })
  })

  it('does not overwrite an occupied slot', () => {
    useCharacterStore.getState().createCharacter(0, 'Hero', 'knight')
    useCharacterStore.getState().createCharacter(0, 'Other', 'mage')
    expect(useCharacterStore.getState().slots[0]!.player.name).toBe('Hero')
  })

  it('rejects invalid slot indices', () => {
    useCharacterStore.getState().createCharacter(-1, 'Bad', 'knight')
    useCharacterStore.getState().createCharacter(3, 'Bad', 'knight')
    const state = useCharacterStore.getState()
    expect(state.slots.every((s) => s === null)).toBe(true)
  })

  it('deletes a character', () => {
    useCharacterStore.getState().createCharacter(1, 'Hero', 'archer')
    useCharacterStore.getState().deleteCharacter(1)
    expect(useCharacterStore.getState().slots[1]).toBeNull()
  })

  it('clears activeSlotIndex when deleting the active character', () => {
    useCharacterStore.getState().createCharacter(0, 'Hero', 'knight')
    useCharacterStore.getState().selectCharacter(0)
    expect(useCharacterStore.getState().activeSlotIndex).toBe(0)
    useCharacterStore.getState().deleteCharacter(0)
    expect(useCharacterStore.getState().activeSlotIndex).toBeNull()
  })

  it('selects a character and hydrates game stores', () => {
    useCharacterStore.getState().createCharacter(2, 'Mage', 'mage')
    useCharacterStore.getState().selectCharacter(2)

    const charState = useCharacterStore.getState()
    expect(charState.activeSlotIndex).toBe(2)

    // ---- Check that game mode store was hydrated ----
    const gameState = useGameModeStore.getState()
    expect(gameState.player.name).toBe('Mage')
    expect(gameState.player.playerClass).toBe('mage')
    expect(gameState.playerPosition).toEqual({ x: -65, z: 0 })

    // ---- Check that zone store was hydrated ----
    const zoneState = useZoneStore.getState()
    expect(zoneState.currentZoneId).toBe('grass-zone')
  })

  it('does not select a null slot', () => {
    useCharacterStore.getState().selectCharacter(1)
    expect(useCharacterStore.getState().activeSlotIndex).toBeNull()
  })

  it('saves active character state from game stores', () => {
    useCharacterStore.getState().createCharacter(0, 'Hero', 'knight')
    useCharacterStore.getState().selectCharacter(0)

    // ---- Simulate player moving in-game ----
    useGameModeStore.getState().setPlayerPosition({ x: 10, z: 20 })
    useZoneStore.setState({ currentZoneId: 'rock-zone' })

    useCharacterStore.getState().saveActiveCharacter()

    const slot = useCharacterStore.getState().slots[0]
    expect(slot!.position).toEqual({ x: 10, z: 20 })
    expect(slot!.zoneId).toBe('rock-zone')
  })

  it('does not save when no active character', () => {
    // ---- Should not throw ----
    useCharacterStore.getState().saveActiveCharacter()
    expect(useCharacterStore.getState().activeSlotIndex).toBeNull()
  })

  it('can create characters in all 3 slots', () => {
    useCharacterStore.getState().createCharacter(0, 'A', 'bomberman')
    useCharacterStore.getState().createCharacter(1, 'B', 'archer')
    useCharacterStore.getState().createCharacter(2, 'C', 'mage')

    const slots = useCharacterStore.getState().slots
    expect(slots[0]!.player.name).toBe('A')
    expect(slots[1]!.player.name).toBe('B')
    expect(slots[2]!.player.name).toBe('C')
  })
})
