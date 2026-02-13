import { useMemo, useRef, useEffect } from 'react'
import { InstancedMesh, Matrix4, Color, Object3D } from 'three'
import {
  generateGridTiles,
  gridToWorld,
  DEFAULT_GRID_CONFIG,
} from '@/game/map/gridUtils'

const TILE_HEIGHT = 0.08
const TILE_COLOR = new Color('#4a4a4a')
const ROTATION_Y = Math.PI / 4

function GridFloor() {
  const meshRef = useRef<InstancedMesh>(null)
  const tiles = useMemo(() => generateGridTiles(), [])

  // ---- Set instance transforms and colors ----
  useEffect(() => {
    if (!meshRef.current) return

    const dummy = new Object3D()
    const matrix = new Matrix4()

    for (const tile of tiles) {
      const pos = gridToWorld(tile.coord)
      dummy.position.set(pos.x, 0, pos.z)
      dummy.updateMatrix()
      matrix.copy(dummy.matrix)
      meshRef.current.setMatrixAt(tile.index, matrix)
      meshRef.current.setColorAt(tile.index, TILE_COLOR)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [tiles])

  return (
    <group rotation={[0, ROTATION_Y, 0]}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, tiles.length]}>
        <boxGeometry
          args={[
            DEFAULT_GRID_CONFIG.tileSize,
            TILE_HEIGHT,
            DEFAULT_GRID_CONFIG.tileSize,
          ]}
        />
        <meshStandardMaterial />
      </instancedMesh>
    </group>
  )
}

export default GridFloor
