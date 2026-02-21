import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ZoneDefinition } from '@/types/zone'
import { WORLD_MAP } from '@/game/world/zoneDefinitions'
import { useGameModeStore } from '@/stores/gameModeStore'

interface ZoneState {
  currentZoneId: string

  // ---- Derived getter for current zone definition ----
  getCurrentZone: () => ZoneDefinition

  // ---- Change to a different zone and teleport player to spawn ----
  changeZone: (zoneId: string, spawnPosition?: { x: number; z: number }) => void
}

export const useZoneStore = create<ZoneState>()(
  persist(
    (set, get) => ({
      currentZoneId: WORLD_MAP.startZoneId,

      getCurrentZone: () => {
        const { currentZoneId } = get()
        const zone = WORLD_MAP.zones.find((z) => z.id === currentZoneId)
        // ---- Fallback to start zone if ID is invalid ----
        return (
          zone ?? WORLD_MAP.zones.find((z) => z.id === WORLD_MAP.startZoneId)!
        )
      },

      changeZone: (zoneId, spawnPosition) => {
        const targetZone = WORLD_MAP.zones.find((z) => z.id === zoneId)
        if (!targetZone) return

        const spawn = spawnPosition ?? targetZone.defaultSpawn
        // ---- Teleport player to spawn position in the new zone ----
        useGameModeStore.getState().setPlayerPosition(spawn)
        set({ currentZoneId: zoneId })
      },
    }),
    {
      name: 'xtactics-zone',
      // ---- Only persist current zone ID ----
      partialize: (state) => ({ currentZoneId: state.currentZoneId }),
    },
  ),
)
