import { describe, it, expect, beforeEach } from 'vitest'
import { useUILayoutStore, PANEL_IDS } from '@/stores/uiLayoutStore'

// ---- Reset store before each test ----
beforeEach(() => {
  useUILayoutStore.setState({
    openPanels: {},
    normalLayout: {
      [PANEL_IDS.MAP]: {
        gridCol: 10,
        gridRow: 0,
        gridWidth: 2,
        gridHeight: 2,
      },
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
    },
    combatLayout: {
      [PANEL_IDS.MAP]: {
        gridCol: 10,
        gridRow: 0,
        gridWidth: 2,
        gridHeight: 2,
      },
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
    },
  })
})

describe('uiLayoutStore', () => {
  it('has default normal layout', () => {
    const state = useUILayoutStore.getState()
    expect(state.normalLayout[PANEL_IDS.MAP]).toEqual({
      gridCol: 10,
      gridRow: 0,
      gridWidth: 2,
      gridHeight: 2,
    })
  })

  it('has default combat layout', () => {
    const state = useUILayoutStore.getState()
    expect(state.combatLayout[PANEL_IDS.CHARACTER_INFO]).toEqual({
      gridCol: 5,
      gridRow: 6,
      gridWidth: 2,
      gridHeight: 2,
    })
  })

  it('updates a panel layout in normal mode', () => {
    const { updatePanelLayout } = useUILayoutStore.getState()
    updatePanelLayout('normal', PANEL_IDS.MAP, {
      gridCol: 0,
      gridRow: 0,
      gridWidth: 3,
      gridHeight: 3,
    })

    const state = useUILayoutStore.getState()
    expect(state.normalLayout[PANEL_IDS.MAP]).toEqual({
      gridCol: 0,
      gridRow: 0,
      gridWidth: 3,
      gridHeight: 3,
    })
  })

  it('updates a panel layout in combat mode without affecting normal', () => {
    const { updatePanelLayout } = useUILayoutStore.getState()
    updatePanelLayout('combat', PANEL_IDS.MAP, {
      gridCol: 8,
      gridRow: 1,
      gridWidth: 4,
      gridHeight: 4,
    })

    const state = useUILayoutStore.getState()
    // ---- Combat layout changed ----
    expect(state.combatLayout[PANEL_IDS.MAP]).toEqual({
      gridCol: 8,
      gridRow: 1,
      gridWidth: 4,
      gridHeight: 4,
    })
    // ---- Normal layout unchanged ----
    expect(state.normalLayout[PANEL_IDS.MAP]).toEqual({
      gridCol: 10,
      gridRow: 0,
      gridWidth: 2,
      gridHeight: 2,
    })
  })

  it('resets normal layout to defaults', () => {
    const { updatePanelLayout, resetLayout } = useUILayoutStore.getState()

    // ---- Move panel ----
    updatePanelLayout('normal', PANEL_IDS.MAP, {
      gridCol: 0,
      gridRow: 0,
      gridWidth: 5,
      gridHeight: 5,
    })

    // ---- Reset ----
    resetLayout('normal')

    const state = useUILayoutStore.getState()
    expect(state.normalLayout[PANEL_IDS.MAP]).toEqual({
      gridCol: 10,
      gridRow: 0,
      gridWidth: 2,
      gridHeight: 2,
    })
  })

  it('resets combat layout to defaults', () => {
    const { updatePanelLayout, resetLayout } = useUILayoutStore.getState()

    updatePanelLayout('combat', PANEL_IDS.BUTTON_ROW, {
      gridCol: 0,
      gridRow: 0,
      gridWidth: 4,
      gridHeight: 2,
    })

    resetLayout('combat')

    const state = useUILayoutStore.getState()
    expect(state.combatLayout[PANEL_IDS.BUTTON_ROW]).toEqual({
      gridCol: 10,
      gridRow: 7,
      gridWidth: 2,
      gridHeight: 1,
    })
  })

  it('getLayout returns the correct layout for each mode', () => {
    const { getLayout, updatePanelLayout } = useUILayoutStore.getState()

    updatePanelLayout('normal', PANEL_IDS.MAP, {
      gridCol: 1,
      gridRow: 1,
      gridWidth: 3,
      gridHeight: 3,
    })

    const normalLayout = getLayout('normal')
    const combatLayout = getLayout('combat')

    expect(normalLayout[PANEL_IDS.MAP].gridCol).toBe(1)
    expect(combatLayout[PANEL_IDS.MAP].gridCol).toBe(10)
  })

  it('togglePanel opens a closed panel', () => {
    const { togglePanel } = useUILayoutStore.getState()
    togglePanel(PANEL_IDS.CHARACTER_SHEET)

    const state = useUILayoutStore.getState()
    expect(state.openPanels[PANEL_IDS.CHARACTER_SHEET]).toBe(true)
  })

  it('togglePanel closes an open panel', () => {
    const { togglePanel } = useUILayoutStore.getState()
    togglePanel(PANEL_IDS.CHARACTER_SHEET)
    togglePanel(PANEL_IDS.CHARACTER_SHEET)

    const state = useUILayoutStore.getState()
    expect(state.openPanels[PANEL_IDS.CHARACTER_SHEET]).toBe(false)
  })

  it('closePanel closes an open panel', () => {
    const { togglePanel, closePanel } = useUILayoutStore.getState()
    togglePanel(PANEL_IDS.CHARACTER_SHEET)
    closePanel(PANEL_IDS.CHARACTER_SHEET)

    const state = useUILayoutStore.getState()
    expect(state.openPanels[PANEL_IDS.CHARACTER_SHEET]).toBe(false)
  })
})
