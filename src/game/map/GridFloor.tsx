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

// ---- Movement range colors (green) ----
const COLOR_DEFAULT = '#4a4a4a'
const COLOR_REACHABLE = '#3a7a4a'
const COLOR_PATH = '#5baa6d'
const COLOR_HOVERED = '#7bdd8a'

// ---- Spell range colors (blue) ----
const COLOR_SPELL_RANGE = '#3b6fa0'
const COLOR_SPELL_TARGET = '#ff6b6b'

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
  // ---- Only show reachable zone when a tile in range is hovered ----
  const hasHover = useCombatStore((s) => s.hoveredTile !== null)

  // ---- Spell mode selectors ----
  const interactionMode = useCombatStore((s) => s.interactionMode)
  const isInSpellRange = useCombatStore((s) => s.spellRangeTileKeys.has(key))
  const isSpellHovered = useCombatStore(
    (s) =>
      s.spellHoveredTarget !== null &&
      s.spellHoveredTarget.col === tile.coord.col &&
      s.spellHoveredTarget.row === tile.coord.row,
  )

  const setHoveredTile = useCombatStore((s) => s.setHoveredTile)
  const executeMove = useCombatStore((s) => s.executeMove)
  const castSpell = useCombatStore((s) => s.castSpell)
  const units = useCombatStore((s) => s.units)
  const setHoveredUnit = useCombatStore((s) => s.setHoveredUnit)

  // ---- Determine tile color based on combat state and interaction mode ----
  const color =
    interactionMode === 'spell'
      ? isSpellHovered
        ? COLOR_SPELL_TARGET
        : isInSpellRange
          ? COLOR_SPELL_RANGE
          : COLOR_DEFAULT
      : isHovered
        ? COLOR_HOVERED
        : isOnPath
          ? COLOR_PATH
          : isReachable && hasHover
            ? COLOR_REACHABLE
            : COLOR_DEFAULT

  const worldPos = gridToWorld(tile.coord, config)

  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      setHoveredTile(tile.coord)
      // ---- Check if a unit occupies this tile ----
      const unitOnTile = units.find(
        (u) =>
          !u.defeated &&
          u.position.col === tile.coord.col &&
          u.position.row === tile.coord.row,
      )
      setHoveredUnit(unitOnTile ?? null)
    },
    [setHoveredTile, setHoveredUnit, tile.coord, units],
  )

  const handlePointerOut = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      setHoveredTile(null)
      setHoveredUnit(null)
    },
    [setHoveredTile, setHoveredUnit],
  )

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      if (interactionMode === 'spell' && isInSpellRange) {
        castSpell(tile.coord)
      } else if (interactionMode === 'movement' && isReachable) {
        executeMove(tile.coord)
      }
    },
    [executeMove, castSpell, isReachable, isInSpellRange, interactionMode, tile.coord],
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
