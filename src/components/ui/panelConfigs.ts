import type { PanelConfig } from '@/types/ui'
import { PANEL_IDS } from '@/stores/uiLayoutStore'

// ---- Map panel config: resizable, min 2x2 ----
export const MAP_PANEL_CONFIG: PanelConfig = {
  id: PANEL_IDS.MAP,
  defaultLayout: { gridCol: 10, gridRow: 0, gridWidth: 2, gridHeight: 2 },
  resizable: true,
  minWidth: 2,
  minHeight: 2,
  maxWidth: 6,
  maxHeight: 6,
}

// ---- Character info config: fixed 2x2, not resizable ----
export const CHARACTER_INFO_CONFIG: PanelConfig = {
  id: PANEL_IDS.CHARACTER_INFO,
  defaultLayout: {
    gridCol: 5,
    gridRow: 6,
    gridWidth: 2,
    gridHeight: 2,
  },
  resizable: false,
  minWidth: 2,
  minHeight: 2,
  maxWidth: 2,
  maxHeight: 2,
}

// ---- Character sheet config: secondary panel, fixed size, not resizable ----
export const CHARACTER_SHEET_CONFIG: PanelConfig = {
  id: PANEL_IDS.CHARACTER_SHEET,
  defaultLayout: {
    gridCol: 3,
    gridRow: 1,
    gridWidth: 4,
    gridHeight: 6,
  },
  resizable: false,
  minWidth: 4,
  minHeight: 6,
  maxWidth: 4,
  maxHeight: 6,
}

// ---- Button row config: resizable, min 1x1 ----
export const BUTTON_ROW_CONFIG: PanelConfig = {
  id: PANEL_IDS.BUTTON_ROW,
  defaultLayout: {
    gridCol: 10,
    gridRow: 7,
    gridWidth: 2,
    gridHeight: 1,
  },
  resizable: true,
  minWidth: 1,
  minHeight: 1,
  maxWidth: 6,
  maxHeight: 2,
}
