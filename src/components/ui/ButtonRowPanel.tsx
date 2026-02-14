import { useGameModeStore } from '@/stores/gameModeStore'
import { useCombatStore } from '@/stores/combatStore'
import { useUILayoutStore, PANEL_IDS } from '@/stores/uiLayoutStore'

export default function ButtonRowPanel() {
  const mode = useGameModeStore((s) => s.mode)
  const exitCombat = useGameModeStore((s) => s.exitCombat)
  const resetLayout = useUILayoutStore((s) => s.resetLayout)
  const togglePanel = useUILayoutStore((s) => s.togglePanel)

  // ---- Combat state for PASS TURN button ----
  const passTurn = useCombatStore((s) => s.passTurn)
  const combatStatus = useCombatStore((s) => s.combatStatus)
  const units = useCombatStore((s) => s.units)
  const activeUnitIndex = useCombatStore((s) => s.activeUnitIndex)
  const turnTimeRemaining = useCombatStore((s) => s.turnTimeRemaining)

  // ---- Check if it is currently a player's turn ----
  const activeUnit = units[activeUnitIndex]
  const isPlayerTurn = activeUnit !== undefined && activeUnit.team === 'player'

  // ---- Shared style for action buttons ----
  const btnClass =
    'rounded bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20'

  return (
    <div className="flex h-full w-full items-center gap-1 p-1">
      {mode === 'combat' && combatStatus === 'active' && isPlayerTurn && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            passTurn()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded bg-amber-600 px-2 py-1 text-xs font-bold text-white hover:bg-amber-700"
        >
          PASS TURN ({turnTimeRemaining}s)
        </button>
      )}

      {mode === 'combat' && combatStatus !== 'active' && (
        <span className="px-2 py-1 text-xs font-bold text-yellow-300">
          {combatStatus === 'victory' ? 'Victory!' : 'Defeat!'}
        </span>
      )}

      {mode === 'combat' && combatStatus === 'active' && isPlayerTurn && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            togglePanel(PANEL_IDS.SPELL_PANEL)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={btnClass}
        >
          Spells
        </button>
      )}

      {mode === 'combat' && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            useCombatStore.getState().clearTurnTimer()
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
