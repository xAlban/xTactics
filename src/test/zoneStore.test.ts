import { describe, it, expect, beforeEach } from 'vitest'
import { useZoneStore } from '@/stores/zoneStore'
import { useGameModeStore } from '@/stores/gameModeStore'

describe('zoneStore', () => {
  beforeEach(() => {
    // ---- Reset stores before each test ----
    useZoneStore.setState({ currentZoneId: 'grass-zone' })
    useGameModeStore.setState({
      playerPosition: { x: 0, z: 0 },
      targetPosition: null,
    })
  })

  it('starts with the grass zone', () => {
    const { currentZoneId } = useZoneStore.getState()
    expect(currentZoneId).toBe('grass-zone')
  })

  it('getCurrentZone returns the correct zone definition', () => {
    const zone = useZoneStore.getState().getCurrentZone()
    expect(zone.id).toBe('grass-zone')
    expect(zone.name).toBe('Green Meadow')
    expect(zone.groundType).toBe('grass')
  })

  it('changeZone switches to the target zone', () => {
    useZoneStore.getState().changeZone('rock-zone')
    expect(useZoneStore.getState().currentZoneId).toBe('rock-zone')
  })

  it('changeZone teleports player to spawn position', () => {
    useZoneStore
      .getState()
      .changeZone('rock-zone', { x: -11, z: 0 })
    const { playerPosition } = useGameModeStore.getState()
    expect(playerPosition.x).toBe(-11)
    expect(playerPosition.z).toBe(0)
  })

  it('changeZone uses default spawn when no position given', () => {
    useZoneStore.getState().changeZone('rock-zone')
    const { playerPosition } = useGameModeStore.getState()
    // ---- Rock zone default spawn is (0, 0) ----
    expect(playerPosition.x).toBe(0)
    expect(playerPosition.z).toBe(0)
  })

  it('changeZone does nothing for invalid zone ID', () => {
    useZoneStore.getState().changeZone('nonexistent-zone')
    expect(useZoneStore.getState().currentZoneId).toBe('grass-zone')
  })

  it('getCurrentZone falls back to start zone for invalid ID', () => {
    useZoneStore.setState({ currentZoneId: 'invalid' })
    const zone = useZoneStore.getState().getCurrentZone()
    expect(zone.id).toBe('grass-zone')
  })

  it('changeZone clears target position via setPlayerPosition', () => {
    useGameModeStore
      .getState()
      .setTargetPosition({ x: 10, z: 10 })
    useZoneStore
      .getState()
      .changeZone('rock-zone', { x: -11, z: 0 })
    // ---- setPlayerPosition sets targetPosition to null ----
    expect(useGameModeStore.getState().targetPosition).toBeNull()
  })
})
