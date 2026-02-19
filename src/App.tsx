import { useAppStore } from '@/stores/appStore'
import Game from '@/game/Game'
import UIGridOverlay from '@/components/ui/UIGridOverlay'
import AutoSave from '@/components/AutoSave'
import LoginScreen from '@/components/screens/LoginScreen'
import CharacterSelectScreen from '@/components/screens/CharacterSelectScreen'
import CharacterCreateScreen from '@/components/screens/CharacterCreateScreen'

function App() {
  const screen = useAppStore((s) => s.screen)

  // ---- Route to the appropriate screen ----
  if (screen === 'login') return <LoginScreen />
  if (screen === 'characterSelect') return <CharacterSelectScreen />
  if (screen === 'characterCreate') return <CharacterCreateScreen />

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Game />
      <UIGridOverlay />
      <AutoSave />
    </div>
  )
}

export default App
