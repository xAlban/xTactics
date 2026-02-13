import { useMemo, useRef, useEffect } from 'react'
import { InstancedMesh, Matrix4, Color, Object3D } from 'three'
import type { CombatMapDefinition } from '@/types/grid'
import {
  generateGridTiles,
  gridToWorld,
  mapToGridConfig,
  DEFAULT_MAP,
} from '@/game/map/gridUtils'

const GROUND_HEIGHT = 0.08
const OBSTACLE_HEIGHT = 0.4
const GROUND_COLOR = new Color('#4a4a4a')
const OBSTACLE_COLOR = new Color('#2c2c2c')
const ROTATION_Y = Math.PI / 4

interface GridFloorProps {
  map?: CombatMapDefinition
}

function GridFloor({ map = DEFAULT_MAP }: GridFloorProps) {
  const groundRef = useRef<InstancedMesh>(null)
  const obstacleRef = useRef<InstancedMesh>(null)

  const config = useMemo(() => mapToGridConfig(map), [map])
  const allTiles = useMemo(() => generateGridTiles(map), [map])

  // ---- Split tiles by type for separate InstancedMesh rendering ----
  const { groundTiles, obstacleTiles } = useMemo(() => {
    const ground = allTiles.filter((t) => t.type === 'ground')
    const obstacles = allTiles.filter((t) => t.type === 'obstacle')
    return { groundTiles: ground, obstacleTiles: obstacles }
  }, [allTiles])

  // ---- Set ground instance transforms and colors ----
  useEffect(() => {
    if (!groundRef.current || groundTiles.length === 0) return

    const dummy = new Object3D()
    const matrix = new Matrix4()

    for (let i = 0; i < groundTiles.length; i++) {
      const pos = gridToWorld(groundTiles[i]!.coord, config)
      dummy.position.set(pos.x, 0, pos.z)
      dummy.updateMatrix()
      matrix.copy(dummy.matrix)
      groundRef.current.setMatrixAt(i, matrix)
      groundRef.current.setColorAt(i, GROUND_COLOR)
    }

    groundRef.current.instanceMatrix.needsUpdate = true
    if (groundRef.current.instanceColor) {
      groundRef.current.instanceColor.needsUpdate = true
    }
  }, [groundTiles, config])

  // ---- Set obstacle instance transforms and colors ----
  useEffect(() => {
    if (!obstacleRef.current || obstacleTiles.length === 0) return

    const dummy = new Object3D()
    const matrix = new Matrix4()

    for (let i = 0; i < obstacleTiles.length; i++) {
      const pos = gridToWorld(obstacleTiles[i]!.coord, config)
      // ---- Raise obstacles so their base sits on the ground plane ----
      dummy.position.set(pos.x, OBSTACLE_HEIGHT / 2, pos.z)
      dummy.updateMatrix()
      matrix.copy(dummy.matrix)
      obstacleRef.current.setMatrixAt(i, matrix)
      obstacleRef.current.setColorAt(i, OBSTACLE_COLOR)
    }

    obstacleRef.current.instanceMatrix.needsUpdate = true
    if (obstacleRef.current.instanceColor) {
      obstacleRef.current.instanceColor.needsUpdate = true
    }
  }, [obstacleTiles, config])

  return (
    <group rotation={[0, ROTATION_Y, 0]}>
      {groundTiles.length > 0 && (
        <instancedMesh
          ref={groundRef}
          args={[undefined, undefined, groundTiles.length]}
        >
          <boxGeometry
            args={[config.tileSize, GROUND_HEIGHT, config.tileSize]}
          />
          <meshStandardMaterial />
        </instancedMesh>
      )}
      {obstacleTiles.length > 0 && (
        <instancedMesh
          ref={obstacleRef}
          args={[undefined, undefined, obstacleTiles.length]}
        >
          <boxGeometry
            args={[config.tileSize, OBSTACLE_HEIGHT, config.tileSize]}
          />
          <meshStandardMaterial />
        </instancedMesh>
      )}
    </group>
  )
}

export default GridFloor
