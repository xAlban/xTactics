import IsometricCamera from '@/game/camera/IsometricCamera'
import GridFloor from '@/game/map/GridFloor'
import TestCube from '@/game/map/TestCube'
import { ARENA_SMALL } from '../map/combatMaps'

function BattleScene() {
  return (
    <>
      <IsometricCamera />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} />

      <GridFloor map={ARENA_SMALL} />
      <TestCube />
    </>
  )
}

export default BattleScene
