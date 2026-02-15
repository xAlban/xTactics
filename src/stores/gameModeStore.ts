import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameMode } from '@/types/game'
import type { Player, Item, EquipmentSlot } from '@/types/player'
import type { CombatSetup } from '@/types/combat'
import { createPlayer } from '@/game/units/playerFactory'
import { DEFAULT_INVENTORY } from '@/game/items/itemDefinitions'

interface GameModeState {
  mode: GameMode
  player: Player

  // ---- Player world position in normal mode ----
  playerPosition: { x: number; z: number }
  targetPosition: { x: number; z: number } | null

  // ---- Active combat encounter definition ----
  activeCombatSetup: CombatSetup | null

  // ---- Actions ----
  enterCombat: (setup: CombatSetup) => void
  exitCombat: () => void
  setTargetPosition: (pos: { x: number; z: number }) => void
  setPlayerPosition: (pos: { x: number; z: number }) => void
  updatePlayerPosition: (pos: { x: number; z: number }) => void

  // ---- Inventory actions ----
  addItemToInventory: (item: Item, quantity?: number) => void
  removeItemFromInventory: (itemId: string, quantity?: number) => void
  equipItem: (itemId: string) => void
  unequipItem: (slot: EquipmentSlot) => void
}

export const useGameModeStore = create<GameModeState>()(
  persist(
    (set, get) => ({
      mode: 'normal',
      player: createPlayer(
        'player1',
        'xAlban',
        'bomberman',
        DEFAULT_INVENTORY,
      ),
      playerPosition: { x: 0, z: 0 },
      targetPosition: null,
      activeCombatSetup: null,

      enterCombat: (setup) =>
        set({ mode: 'combat', activeCombatSetup: setup }),

      exitCombat: () =>
        set({
          mode: 'normal',
          targetPosition: null,
          activeCombatSetup: null,
        }),

      setTargetPosition: (pos) => set({ targetPosition: pos }),

      setPlayerPosition: (pos) =>
        set({ playerPosition: pos, targetPosition: null }),

      updatePlayerPosition: (pos) => set({ playerPosition: pos }),

      // ---- Add item to inventory (stacks if stackable and already present) ----
      addItemToInventory: (item, quantity = 1) => {
        const { player } = get()
        const inventory = [...player.inventory]
        const existing = inventory.find(
          (slot) => slot.item.id === item.id,
        )

        if (existing && item.stackable) {
          // ---- Stack onto existing slot ----
          existing.quantity += quantity
        } else {
          // ---- Add as new slot ----
          inventory.push({ item, quantity })
        }

        set({ player: { ...player, inventory } })
      },

      // ---- Remove item from inventory (reduces quantity or removes entirely) ----
      removeItemFromInventory: (itemId, quantity = 1) => {
        const { player } = get()
        const inventory = [...player.inventory]
        const index = inventory.findIndex(
          (slot) => slot.item.id === itemId,
        )
        if (index === -1) return

        const slot = inventory[index]!
        if (slot.quantity <= quantity) {
          inventory.splice(index, 1)
        } else {
          inventory[index] = {
            ...slot,
            quantity: slot.quantity - quantity,
          }
        }

        set({ player: { ...player, inventory } })
      },

      // ---- Equip item from inventory to matching slot (swaps if occupied) ----
      equipItem: (itemId) => {
        const { player } = get()
        const slotIndex = player.inventory.findIndex(
          (slot) => slot.item.id === itemId,
        )
        if (slotIndex === -1) return

        const inventorySlot = player.inventory[slotIndex]!
        const item = inventorySlot.item
        if (item.category !== 'equipment' || !item.equipmentSlot)
          return

        // ---- Determine target slot (rings can go in ring1 or ring2) ----
        let targetSlot: EquipmentSlot = item.equipmentSlot
        if (item.subcategory === 'ring') {
          // ---- Prefer empty ring slot, fallback to ring1 ----
          if (!player.equipment.ring1) {
            targetSlot = 'ring1'
          } else if (!player.equipment.ring2) {
            targetSlot = 'ring2'
          } else {
            targetSlot = 'ring1'
          }
        }

        const inventory = [...player.inventory]
        const equipment = { ...player.equipment }

        // ---- If slot is occupied, swap: move old item to inventory ----
        const currentEquipped = equipment[targetSlot]
        if (currentEquipped) {
          // ---- Check if old item stacks with something in inventory ----
          const existingSwap = inventory.find(
            (s) =>
              s.item.id === currentEquipped.id &&
              currentEquipped.stackable,
          )
          if (existingSwap) {
            existingSwap.quantity += 1
          } else {
            inventory.push({ item: currentEquipped, quantity: 1 })
          }
        }

        // ---- Remove equipped item from inventory ----
        if (inventorySlot.quantity <= 1) {
          inventory.splice(slotIndex, 1)
        } else {
          inventory[slotIndex] = {
            ...inventorySlot,
            quantity: inventorySlot.quantity - 1,
          }
        }

        // ---- Place item in equipment slot ----
        equipment[targetSlot] = item

        set({ player: { ...player, inventory, equipment } })
      },

      // ---- Unequip item from slot back to inventory ----
      unequipItem: (slot) => {
        const { player } = get()
        const equipped = player.equipment[slot]
        if (!equipped) return

        const inventory = [...player.inventory]
        const equipment = { ...player.equipment }

        // ---- Move item to inventory (stack if possible) ----
        const existingSlot = inventory.find(
          (s) => s.item.id === equipped.id && equipped.stackable,
        )
        if (existingSlot) {
          existingSlot.quantity += 1
        } else {
          inventory.push({ item: equipped, quantity: 1 })
        }

        // ---- Clear equipment slot ----
        equipment[slot] = null

        set({ player: { ...player, inventory, equipment } })
      },
    }),
    {
      name: 'xtactics-game-mode',
      // ---- Only persist player data (equipment + inventory) ----
      partialize: (state) => ({ player: state.player }),
    },
  ),
)
