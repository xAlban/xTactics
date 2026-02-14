import Game from '@/game/Game'
import UIGridOverlay from '@/components/ui/UIGridOverlay'

function App() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Game />
      <UIGridOverlay />
    </div>
  )
}

export default App
