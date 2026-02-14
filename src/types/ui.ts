// ---- UI Grid Layout Types ----

export interface PanelLayout {
  gridCol: number
  gridRow: number
  gridWidth: number
  gridHeight: number
}

export interface PanelConfig {
  id: string
  defaultLayout: PanelLayout
  resizable: boolean
  gridLocked: boolean
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
}

// ---- Grid Constants ----
export const UI_GRID_COLS = 12
export const UI_GRID_ROWS = 8
