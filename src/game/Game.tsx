import { Canvas } from '@react-three/fiber'
import BattleScene from '@/game/scenes/BattleScene'
import NormalScene from '@/game/scenes/NormalScene'
import { useGameModeStore } from '@/stores/gameModeStore'

function Game() {
  const mode = useGameModeStore((s) => s.mode)

  return (
    <Canvas
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {mode === 'normal' ? <NormalScene /> : <BattleScene />}
    </Canvas>
  )
}

export default Game
