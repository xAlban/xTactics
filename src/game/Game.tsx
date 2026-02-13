import { Canvas } from '@react-three/fiber'
import BattleScene from '@/game/scenes/BattleScene'

function Game() {
  return (
    <Canvas>
      <BattleScene />
    </Canvas>
  )
}

export default Game
