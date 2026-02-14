import { create } from 'zustand'
import type { TileCoord } from '@/types/grid'

// ---- Types of floating combat numbers ----
export type FloatingNumberType = 'damage' | 'ap' | 'mp'

export interface FloatingNumber {
  id: number
  value: number
  type: FloatingNumberType
  tileCoord: TileCoord
  createdAt: number
}

// ---- Projected screen-space representation of a floating number ----
export interface ProjectedFloatingNumber {
  id: number
  value: number
  type: FloatingNumberType
  x: number
  y: number
  opacity: number
}

interface FloatingNumberState {
  numbers: FloatingNumber[]
  projected: ProjectedFloatingNumber[]
  _nextId: number

  addFloatingNumber: (
    value: number,
    type: FloatingNumberType,
    tileCoord: TileCoord,
  ) => void
  removeFloatingNumber: (id: number) => void
  setProjected: (projected: ProjectedFloatingNumber[]) => void
  clearAll: () => void
}

// ---- Duration before a floating number expires (ms) ----
export const FLOATING_NUMBER_DURATION = 1500

export const useFloatingNumberStore = create<FloatingNumberState>(
  (set, get) => ({
    numbers: [],
    projected: [],
    _nextId: 0,

    addFloatingNumber: (value, type, tileCoord) => {
      const id = get()._nextId
      const entry: FloatingNumber = {
        id,
        value,
        type,
        tileCoord,
        createdAt: performance.now(),
      }
      set({
        numbers: [...get().numbers, entry],
        _nextId: id + 1,
      })
    },

    removeFloatingNumber: (id) => {
      set({ numbers: get().numbers.filter((n) => n.id !== id) })
    },

    setProjected: (projected) => {
      set({ projected })
    },

    clearAll: () => {
      set({ numbers: [], projected: [] })
    },
  }),
)
