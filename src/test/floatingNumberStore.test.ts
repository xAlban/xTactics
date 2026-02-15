import { describe, it, expect, beforeEach } from 'vitest'
import { useFloatingNumberStore } from '@/stores/floatingNumberStore'

beforeEach(() => {
  useFloatingNumberStore.getState().clearAll()
})

describe('floatingNumberStore', () => {
  it('addFloatingNumber adds an entry', () => {
    useFloatingNumberStore
      .getState()
      .addFloatingNumber(10, 'damage', { col: 2, row: 3 })

    const numbers = useFloatingNumberStore.getState().numbers
    expect(numbers).toHaveLength(1)
    expect(numbers[0]!.value).toBe(10)
    expect(numbers[0]!.type).toBe('damage')
    expect(numbers[0]!.tileCoord).toEqual({ col: 2, row: 3 })
    expect(numbers[0]!.createdAt).toBeGreaterThan(0)
  })

  it('assigns unique incremental IDs', () => {
    const store = useFloatingNumberStore.getState()
    store.addFloatingNumber(5, 'ap', { col: 0, row: 0 })
    store.addFloatingNumber(3, 'mp', { col: 1, row: 1 })

    const numbers = useFloatingNumberStore.getState().numbers
    expect(numbers[0]!.id).not.toBe(numbers[1]!.id)
  })

  it('removeFloatingNumber removes the correct entry', () => {
    const store = useFloatingNumberStore.getState()
    store.addFloatingNumber(10, 'damage', { col: 0, row: 0 })
    store.addFloatingNumber(4, 'ap', { col: 1, row: 1 })

    const firstId = useFloatingNumberStore.getState().numbers[0]!.id
    useFloatingNumberStore.getState().removeFloatingNumber(firstId)

    const remaining = useFloatingNumberStore.getState().numbers
    expect(remaining).toHaveLength(1)
    expect(remaining[0]!.type).toBe('ap')
  })

  it('clearAll removes all numbers and projected', () => {
    const store = useFloatingNumberStore.getState()
    store.addFloatingNumber(10, 'damage', { col: 0, row: 0 })
    store.addFloatingNumber(3, 'mp', { col: 1, row: 1 })
    store.setProjected([
      { id: 0, value: 10, type: 'damage', x: 100, y: 200, opacity: 1 },
    ])

    useFloatingNumberStore.getState().clearAll()

    const state = useFloatingNumberStore.getState()
    expect(state.numbers).toHaveLength(0)
    expect(state.projected).toHaveLength(0)
  })

  it('setProjected updates projected numbers', () => {
    const projected = [
      {
        id: 0,
        value: 10,
        type: 'damage' as const,
        x: 50,
        y: 100,
        opacity: 0.8,
      },
      { id: 1, value: 4, type: 'ap' as const, x: 60, y: 110, opacity: 1 },
    ]
    useFloatingNumberStore.getState().setProjected(projected)

    expect(useFloatingNumberStore.getState().projected).toHaveLength(2)
    expect(useFloatingNumberStore.getState().projected[0]!.opacity).toBe(0.8)
  })
})
