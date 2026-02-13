import { useMemo, useRef, useEffect, useCallback } from 'react'
import { InstancedMesh, Matrix4, Color, Object3D } from 'three'
import type { CombatMapDefinition, TileData, GridConfig } from '@/types/grid'
import {
  generateGridTiles,
  gridToWorld,
  mapToGridConfig,
  DEFAULT_MAP,
} from '@/game/map/gridUtils'
import { coordKey } from '@/game/combat/pathfinding'
import { useCombatStore } from '@/stores/combatStore'

const GROUND_HEIGHT = 0.08
const OBSTACLE_HEIGHT = 0.4
const OBSTACLE_COLOR = new Color('#2c2c2c')
const ROTATION_Y = Math.PI / 4

// ---- Tile color constants ----
const COLOR_DEFAULT = '#4a4a4a'
const COLOR_REACHABLE = '#3b6fa0'
const COLOR_PATH = '#5b9fd0'
const COLOR_HOVERED = '#7bc0f0'

interface GridFloorProps {
  map?: CombatMapDefinition
}

// ---- Individual ground tile with hover/click interaction ----
function GroundTile({ tile, config }: { tile: TileData; config: GridConfig }) {
  const key = coordKey(tile.coord)

  // ---- Zustand selectors for O(1) tile state lookups ----
  const isReachable = useCombatStore((s) => s.reachableTileKeys.has(key))
  const isOnPath = useCombatStore((s) => s.previewPathKeys.has(key))
  const isHovered = useCombatStore(
    (s) =>
      s.hoveredTile !== null &&
      s.hoveredTile.col === tile.coord.col &&
      s.hoveredTile.row === tile.coord.row,
  )

  const setHoveredTile = useCombatStore((s) => s.setHoveredTile)
  const executeMove = useCombatStore((s) => s.executeMove)

  // ---- Determine tile color based on combat state ----
  const color = isHovered
    ? COLOR_HOVERED
    : isOnPath
      ? COLOR_PATH
      : isReachable
        ? COLOR_REACHABLE
        : COLOR_DEFAULT

  const worldPos = gridToWorld(tile.coord, config)

  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      setHoveredTile(tile.coord)
    },
    [setHoveredTile, tile.coord],
  )

  const handlePointerOut = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      setHoveredTile(null)
    },
    [setHoveredTile],
  )

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      if (isReachable) {
        executeMove(tile.coord)
      }
    },
    [executeMove, isReachable, tile.coord],
  )

  return (
    <mesh
      position={[worldPos.x, 0, worldPos.z]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <boxGeometry args={[config.tileSize, GROUND_HEIGHT, config.tileSize]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function GridFloor({ map = DEFAULT_MAP }: GridFloorProps) {
  const obstacleRef = useRef<InstancedMesh>(null)

  const config = useMemo(() => mapToGridConfig(map), [map])
  const allTiles = useMemo(() => generateGridTiles(map), [map])

  // ---- Split tiles by type ----
  const { groundTiles, obstacleTiles } = useMemo(() => {
    const ground = allTiles.filter((t) => t.type === 'ground')
    const obstacles = allTiles.filter((t) => t.type === 'obstacle')
    return { groundTiles: ground, obstacleTiles: obstacles }
  }, [allTiles])

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
      {groundTiles.map((tile) => (
        <GroundTile
          key={`${tile.coord.col},${tile.coord.row}`}
          tile={tile}
          config={config}
        />
      ))}
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
