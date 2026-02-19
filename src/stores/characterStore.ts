import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterSlot } from '@/types/character'
import type { PlayerClass } from '@/types/player'
import { MAX_CHARACTER_SLOTS } from '@/types/character'
import { createPlayer } from '@/game/units/playerFactory'
import { DEFAULT_INVENTORY } from '@/game/items/itemDefinitions'
import { useGameModeStore } from '@/stores/gameModeStore'
import { useZoneStore } from '@/stores/zoneStore'

// ---- Default spawn for new characters (GRASS_ZONE) ----
const DEFAULT_ZONE_ID = 'grass-zone'
const DEFAULT_SPAWN = { x: -65, z: 0 }

interface CharacterState {
  slots: (CharacterSlot | null)[]
  activeSlotIndex: number | null

  // ---- Actions ----
  createCharacter: (
    slotIndex: number,
    name: string,
    playerClass: PlayerClass,
  ) => void
  deleteCharacter: (slotIndex: number) => void
  selectCharacter: (slotIndex: number) => void
  saveActiveCharacter: () => void
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      slots: Array(MAX_CHARACTER_SLOTS).fill(null),
      activeSlotIndex: null,

      createCharacter: (slotIndex, name, playerClass) => {
        const { slots } = get()
        if (slotIndex < 0 || slotIndex >= MAX_CHARACTER_SLOTS) return
        if (slots[slotIndex] !== null) return

        const player = createPlayer(
          `char-${slotIndex}-${Date.now()}`,
          name,
          playerClass,
          [...DEFAULT_INVENTORY],
        )

        const newSlot: CharacterSlot = {
          slotIndex,
          player,
          zoneId: DEFAULT_ZONE_ID,
          position: { ...DEFAULT_SPAWN },
          createdAt: Date.now(),
          lastPlayedAt: Date.now(),
        }

        const newSlots = [...slots]
        newSlots[slotIndex] = newSlot
        set({ slots: newSlots })
      },

      deleteCharacter: (slotIndex) => {
        const { slots, activeSlotIndex } = get()
        if (slotIndex < 0 || slotIndex >= MAX_CHARACTER_SLOTS) return
        if (slots[slotIndex] === null) return

        const newSlots = [...slots]
        newSlots[slotIndex] = null
        set({
          slots: newSlots,
          // ---- Clear active if we deleted the active character ----
          activeSlotIndex:
            activeSlotIndex === slotIndex ? null : activeSlotIndex,
        })
      },

      selectCharacter: (slotIndex) => {
        const { slots } = get()
        if (slotIndex < 0 || slotIndex >= MAX_CHARACTER_SLOTS) return
        const slot = slots[slotIndex]
        if (!slot) return

        // ---- Hydrate game stores with saved character data ----
        useGameModeStore.getState().setPlayer(slot.player)
        useGameModeStore.getState().setPlayerPosition(slot.position)
        useZoneStore.setState({ currentZoneId: slot.zoneId })

        // ---- Update last played timestamp ----
        const newSlots = [...slots]
        newSlots[slotIndex] = { ...slot, lastPlayedAt: Date.now() }
        set({ slots: newSlots, activeSlotIndex: slotIndex })
      },

      saveActiveCharacter: () => {
        const { slots, activeSlotIndex } = get()
        if (activeSlotIndex === null) return
        const slot = slots[activeSlotIndex]
        if (!slot) return

        // ---- Snapshot current state from game stores ----
        const { player, playerPosition } = useGameModeStore.getState()
        const { currentZoneId } = useZoneStore.getState()

        const newSlots = [...slots]
        newSlots[activeSlotIndex] = {
          ...slot,
          player,
          position: { ...playerPosition },
          zoneId: currentZoneId,
          lastPlayedAt: Date.now(),
        }
        set({ slots: newSlots })
      },
    }),
    {
      name: 'xtactics-characters',
    },
  ),
)
