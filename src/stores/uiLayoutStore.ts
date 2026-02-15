import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameMode } from '@/types/game'
import type { PanelLayout } from '@/types/ui'

// ---- Panel ID constants ----
export const PANEL_IDS = {
  MAP: 'map',
  CHARACTER_INFO: 'characterInfo',
  BUTTON_ROW: 'buttonRow',
  CHARACTER_SHEET: 'characterSheet',
  SPELL_PANEL: 'spellPanel',
  INVENTORY: 'inventory',
} as const

type LayoutMap = Record<string, PanelLayout>

// ---- Default layouts per mode ----
const DEFAULT_NORMAL_LAYOUT: LayoutMap = {
  [PANEL_IDS.MAP]: { gridCol: 10, gridRow: 0, gridWidth: 2, gridHeight: 2 },
  [PANEL_IDS.CHARACTER_INFO]: {
    gridCol: 5,
    gridRow: 6,
    gridWidth: 2,
    gridHeight: 2,
  },
  [PANEL_IDS.BUTTON_ROW]: {
    gridCol: 10,
    gridRow: 7,
    gridWidth: 2,
    gridHeight: 1,
  },
}

const DEFAULT_COMBAT_LAYOUT: LayoutMap = {
  [PANEL_IDS.MAP]: { gridCol: 10, gridRow: 0, gridWidth: 2, gridHeight: 2 },
  [PANEL_IDS.CHARACTER_INFO]: {
    gridCol: 5,
    gridRow: 6,
    gridWidth: 2,
    gridHeight: 2,
  },
  [PANEL_IDS.BUTTON_ROW]: {
    gridCol: 10,
    gridRow: 7,
    gridWidth: 2,
    gridHeight: 1,
  },
  [PANEL_IDS.SPELL_PANEL]: {
    gridCol: 0,
    gridRow: 2,
    gridWidth: 2,
    gridHeight: 4,
  },
}

interface UILayoutState {
  normalLayout: LayoutMap
  combatLayout: LayoutMap
  // ---- Tracks which secondary panels are open ----
  openPanels: Record<string, boolean>
  // ---- Z-index ordering for panel stacking (higher = in front) ----
  panelZOrder: Record<string, number>
  panelZCounter: number

  // ---- Actions ----
  updatePanelLayout: (
    mode: GameMode,
    panelId: string,
    layout: PanelLayout,
  ) => void
  resetLayout: (mode: GameMode) => void
  getLayout: (mode: GameMode) => LayoutMap
  togglePanel: (panelId: string) => void
  closePanel: (panelId: string) => void
  bringToFront: (panelId: string) => void
}

export const useUILayoutStore = create<UILayoutState>()(
  persist(
    (set, get) => ({
      normalLayout: { ...DEFAULT_NORMAL_LAYOUT },
      combatLayout: { ...DEFAULT_COMBAT_LAYOUT },
      openPanels: {},
      panelZOrder: {},
      panelZCounter: 0,

      updatePanelLayout: (mode, panelId, layout) =>
        set((state) => {
          const key = mode === 'normal' ? 'normalLayout' : 'combatLayout'
          return {
            [key]: { ...state[key], [panelId]: layout },
          }
        }),

      resetLayout: (mode) =>
        set(() => {
          if (mode === 'normal') {
            return { normalLayout: { ...DEFAULT_NORMAL_LAYOUT } }
          }
          return { combatLayout: { ...DEFAULT_COMBAT_LAYOUT } }
        }),

      getLayout: (mode) => {
        const state = get()
        return mode === 'normal' ? state.normalLayout : state.combatLayout
      },

      togglePanel: (panelId) =>
        set((state) => ({
          openPanels: {
            ...state.openPanels,
            [panelId]: !state.openPanels[panelId],
          },
        })),

      closePanel: (panelId) =>
        set((state) => ({
          openPanels: {
            ...state.openPanels,
            [panelId]: false,
          },
        })),

      // ---- Bring a panel to the front by assigning it the next z-index ----
      bringToFront: (panelId) =>
        set((state) => {
          const next = state.panelZCounter + 1
          return {
            panelZCounter: next,
            panelZOrder: { ...state.panelZOrder, [panelId]: next },
          }
        }),
    }),
    {
      name: 'xtactics-ui-layout',
      // ---- Only persist panel layouts, not open/close state or z-order ----
      partialize: (state) => ({
        normalLayout: state.normalLayout,
        combatLayout: state.combatLayout,
      }),
    },
  ),
)
