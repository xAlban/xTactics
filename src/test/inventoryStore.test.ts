import { describe, it, expect, beforeEach } from 'vitest'
import { useGameModeStore } from '@/stores/gameModeStore'
import {
  IRON_HELM,
  TRAVELERS_CAPE,
  RUBY_RING,
  EMERALD_RING,
  HEALTH_POTION,
  PEBBLE,
} from '@/game/items/itemDefinitions'
import type { Item } from '@/types/player'

// ---- Reset player state before each test with a clean inventory ----
beforeEach(() => {
  const state = useGameModeStore.getState()
  useGameModeStore.setState({
    player: {
      ...state.player,
      inventory: [],
      equipment: {
        head: null,
        cape: null,
        belt: null,
        boots: null,
        ring1: null,
        ring2: null,
      },
    },
  })
})

describe('addItemToInventory', () => {
  it('adds a new item to empty inventory', () => {
    useGameModeStore.getState().addItemToInventory(IRON_HELM)
    const inv = useGameModeStore.getState().player.inventory
    expect(inv).toHaveLength(1)
    expect(inv[0]!.item.id).toBe('iron-helm')
    expect(inv[0]!.quantity).toBe(1)
  })

  it('stacks stackable items', () => {
    useGameModeStore.getState().addItemToInventory(HEALTH_POTION, 2)
    useGameModeStore.getState().addItemToInventory(HEALTH_POTION, 3)
    const inv = useGameModeStore.getState().player.inventory
    expect(inv).toHaveLength(1)
    expect(inv[0]!.quantity).toBe(5)
  })

  it('does not stack non-stackable items', () => {
    useGameModeStore.getState().addItemToInventory(IRON_HELM)
    useGameModeStore.getState().addItemToInventory(IRON_HELM)
    const inv = useGameModeStore.getState().player.inventory
    expect(inv).toHaveLength(2)
  })
})

describe('removeItemFromInventory', () => {
  it('removes item entirely when quantity reaches zero', () => {
    useGameModeStore.getState().addItemToInventory(IRON_HELM)
    useGameModeStore.getState().removeItemFromInventory('iron-helm')
    const inv = useGameModeStore.getState().player.inventory
    expect(inv).toHaveLength(0)
  })

  it('reduces quantity for stackable items', () => {
    useGameModeStore.getState().addItemToInventory(PEBBLE, 5)
    useGameModeStore.getState().removeItemFromInventory('pebble', 2)
    const inv = useGameModeStore.getState().player.inventory
    expect(inv).toHaveLength(1)
    expect(inv[0]!.quantity).toBe(3)
  })

  it('does nothing for non-existent item', () => {
    useGameModeStore.getState().addItemToInventory(IRON_HELM)
    useGameModeStore.getState().removeItemFromInventory('non-existent')
    expect(useGameModeStore.getState().player.inventory).toHaveLength(1)
  })
})

describe('equipItem', () => {
  it('equips an equipment item from inventory to correct slot', () => {
    useGameModeStore.getState().addItemToInventory(IRON_HELM)
    useGameModeStore.getState().equipItem('iron-helm')

    const player = useGameModeStore.getState().player
    expect(player.equipment.head).not.toBeNull()
    expect(player.equipment.head!.id).toBe('iron-helm')
    expect(player.inventory).toHaveLength(0)
  })

  it('swaps equipment when slot is occupied', () => {
    // ---- Create a second helm item ----
    const secondHelm: Item = {
      ...IRON_HELM,
      id: 'steel-helm',
      name: 'Steel Helm',
    }

    useGameModeStore.getState().addItemToInventory(IRON_HELM)
    useGameModeStore.getState().equipItem('iron-helm')

    useGameModeStore.getState().addItemToInventory(secondHelm)
    useGameModeStore.getState().equipItem('steel-helm')

    const player = useGameModeStore.getState().player
    // ---- New helm is equipped ----
    expect(player.equipment.head!.id).toBe('steel-helm')
    // ---- Old helm is back in inventory ----
    expect(player.inventory.some((s) => s.item.id === 'iron-helm')).toBe(true)
  })

  it('places ring in ring1 first, then ring2', () => {
    useGameModeStore.getState().addItemToInventory(RUBY_RING)
    useGameModeStore.getState().addItemToInventory(EMERALD_RING)

    useGameModeStore.getState().equipItem('ruby-ring')
    useGameModeStore.getState().equipItem('emerald-ring')

    const player = useGameModeStore.getState().player
    expect(player.equipment.ring1!.id).toBe('ruby-ring')
    expect(player.equipment.ring2!.id).toBe('emerald-ring')
  })

  it('does nothing for non-equipment items', () => {
    useGameModeStore.getState().addItemToInventory(HEALTH_POTION)
    useGameModeStore.getState().equipItem('health-potion')

    const player = useGameModeStore.getState().player
    // ---- Still in inventory, not equipped anywhere ----
    expect(player.inventory).toHaveLength(1)
  })

  it('does nothing for non-existent item', () => {
    useGameModeStore.getState().equipItem('does-not-exist')
    const player = useGameModeStore.getState().player
    expect(player.inventory).toHaveLength(0)
  })
})

describe('unequipItem', () => {
  it('moves equipped item back to inventory', () => {
    useGameModeStore.getState().addItemToInventory(IRON_HELM)
    useGameModeStore.getState().equipItem('iron-helm')
    useGameModeStore.getState().unequipItem('head')

    const player = useGameModeStore.getState().player
    expect(player.equipment.head).toBeNull()
    expect(player.inventory).toHaveLength(1)
    expect(player.inventory[0]!.item.id).toBe('iron-helm')
  })

  it('does nothing when slot is empty', () => {
    useGameModeStore.getState().unequipItem('head')
    const player = useGameModeStore.getState().player
    expect(player.equipment.head).toBeNull()
    expect(player.inventory).toHaveLength(0)
  })

  it('equip and unequip multiple items correctly', () => {
    useGameModeStore.getState().addItemToInventory(IRON_HELM)
    useGameModeStore.getState().addItemToInventory(TRAVELERS_CAPE)

    useGameModeStore.getState().equipItem('iron-helm')
    useGameModeStore.getState().equipItem('travelers-cape')

    const mid = useGameModeStore.getState().player
    expect(mid.equipment.head!.id).toBe('iron-helm')
    expect(mid.equipment.cape!.id).toBe('travelers-cape')
    expect(mid.inventory).toHaveLength(0)

    useGameModeStore.getState().unequipItem('head')
    useGameModeStore.getState().unequipItem('cape')

    const final = useGameModeStore.getState().player
    expect(final.equipment.head).toBeNull()
    expect(final.equipment.cape).toBeNull()
    expect(final.inventory).toHaveLength(2)
  })
})
