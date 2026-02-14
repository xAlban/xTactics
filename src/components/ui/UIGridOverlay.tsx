import { useCallback } from 'react'
import { useGameModeStore } from '@/stores/gameModeStore'
import { useUILayoutStore, PANEL_IDS } from '@/stores/uiLayoutStore'
import type { PanelConfig, PanelLayout } from '@/types/ui'
import UIPanel from './UIPanel'
import MapPanel from './MapPanel'
import CharacterInfoPanel from './CharacterInfoPanel'
import ButtonRowPanel from './ButtonRowPanel'
import CharacterSheetPanel from './CharacterSheetPanel'
import SpellPanel from './SpellPanel'
import DamagePreviewOverlay from './DamagePreviewOverlay'
import {
  MAP_PANEL_CONFIG,
  CHARACTER_INFO_CONFIG,
  BUTTON_ROW_CONFIG,
  CHARACTER_SHEET_CONFIG,
  SPELL_PANEL_CONFIG,
} from './panelConfigs'

// ---- Base panels always visible ----
const BASE_PANELS: PanelConfig[] = [
  MAP_PANEL_CONFIG,
  CHARACTER_INFO_CONFIG,
  BUTTON_ROW_CONFIG,
]

// ---- Panel content by ID ----
const PANEL_CONTENT: Record<string, React.ReactNode> = {
  [PANEL_IDS.MAP]: <MapPanel />,
  [PANEL_IDS.CHARACTER_INFO]: <CharacterInfoPanel />,
  [PANEL_IDS.BUTTON_ROW]: <ButtonRowPanel />,
  [PANEL_IDS.CHARACTER_SHEET]: <CharacterSheetPanel />,
  [PANEL_IDS.SPELL_PANEL]: <SpellPanel />,
}

// ---- Secondary panels toggled by actions ----
const SECONDARY_PANELS: PanelConfig[] = [CHARACTER_SHEET_CONFIG, SPELL_PANEL_CONFIG]

export default function UIGridOverlay() {
  const mode = useGameModeStore((s) => s.mode)
  const normalLayout = useUILayoutStore((s) => s.normalLayout)
  const combatLayout = useUILayoutStore((s) => s.combatLayout)
  const openPanels = useUILayoutStore((s) => s.openPanels)
  const closePanel = useUILayoutStore((s) => s.closePanel)
  const layouts = mode === 'normal' ? normalLayout : combatLayout
  const updatePanelLayout = useUILayoutStore((s) => s.updatePanelLayout)

  const handleLayoutChange = useCallback(
    (panelId: string, layout: PanelLayout) => {
      updatePanelLayout(mode, panelId, layout)
    },
    [mode, updatePanelLayout],
  )

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* ---- Base panels (always visible) ---- */}
      {BASE_PANELS.map((config) => {
        const layout = layouts[config.id] ?? config.defaultLayout

        return (
          <UIPanel
            key={config.id}
            config={config}
            layout={layout}
            onLayoutChange={(l) => handleLayoutChange(config.id, l)}
          >
            {PANEL_CONTENT[config.id]}
          </UIPanel>
        )
      })}

      {/* ---- Secondary panels (toggled open/close) ---- */}
      {SECONDARY_PANELS.map((config) => {
        if (!openPanels[config.id]) return null

        const layout = layouts[config.id] ?? config.defaultLayout

        return (
          <UIPanel
            key={config.id}
            config={config}
            layout={layout}
            onLayoutChange={(l) => handleLayoutChange(config.id, l)}
            closable
            onClose={() => closePanel(config.id)}
          >
            {PANEL_CONTENT[config.id]}
          </UIPanel>
        )
      })}

      {/* ---- Damage preview overlay (positioned by spell target screen coords) ---- */}
      <DamagePreviewOverlay />
    </div>
  )
}
