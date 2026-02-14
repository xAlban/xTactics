import { useGameModeStore } from '@/stores/gameModeStore'
import { useUILayoutStore, PANEL_IDS } from '@/stores/uiLayoutStore'

export default function ButtonRowPanel() {
  const mode = useGameModeStore((s) => s.mode)
  const exitCombat = useGameModeStore((s) => s.exitCombat)
  const resetLayout = useUILayoutStore((s) => s.resetLayout)
  const togglePanel = useUILayoutStore((s) => s.togglePanel)

  // ---- Shared style for action buttons ----
  const btnClass =
    'rounded bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20'

  return (
    <div className="flex h-full w-full items-center gap-1 p-1">
      {mode === 'combat' && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            exitCombat()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Exit Combat
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation()
          togglePanel(PANEL_IDS.CHARACTER_SHEET)
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={btnClass}
      >
        Character
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation()
          resetLayout(mode)
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={btnClass}
      >
        Reset UI
      </button>
    </div>
  )
}
