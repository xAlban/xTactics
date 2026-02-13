import { useMemo } from 'react'
import {
  gridToWorld,
  mapToGridConfig,
  DEFAULT_MAP,
} from '@/game/map/gridUtils'

const config = mapToGridConfig(DEFAULT_MAP)
const CUBE_SIZE = config.tileSize * 0.6
const TILE_HEIGHT = 0.08
const ROTATION_Y = Math.PI / 4

function TestCube() {
  // ---- Place cube at grid coord (3, 4) ----
  const position = useMemo(() => {
    const pos = gridToWorld({ col: 3, row: 4 }, config)
    return [pos.x, TILE_HEIGHT / 2 + CUBE_SIZE / 2, pos.z] as const
  }, [])

  return (
    <group rotation={[0, ROTATION_Y, 0]}>
      <mesh position={[position[0], position[1], position[2]]}>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial color="#c0392b" />
      </mesh>
    </group>
  )
}

export default TestCube
