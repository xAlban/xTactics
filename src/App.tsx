import Game from '@/game/Game'
import { useGameModeStore } from '@/stores/gameModeStore'

function App() {
  const mode = useGameModeStore((s) => s.mode)
  const exitCombat = useGameModeStore((s) => s.exitCombat)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Game />
      {mode === 'combat' && (
        <button
          onClick={exitCombat}
          className="absolute top-4 right-4 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Exit Combat
        </button>
      )}
    </div>
  )
}

export default App
