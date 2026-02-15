import { useRef, useState, useEffect, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { TileCoord, GridConfig } from '@/types/grid'
import type { PlayerClass } from '@/types/player'
import type { Path, UnitTeam } from '@/types/combat'
import { gridToWorld } from '@/game/map/gridUtils'
import { getUnitModelConfig } from '@/game/models/modelRegistry'
import ModelRenderer from '@/game/models/GLTFModel'
import ModelErrorBoundary from '@/game/models/ModelErrorBoundary'

const TILE_HEIGHT = 0.08

// ---- Movement speed in tiles per second ----
const MOVE_SPEED = 4

interface UnitModelProps {
  position: TileCoord
  playerClass: PlayerClass
  team: UnitTeam
  config: GridConfig
  movementPath: Path
  isMoving: boolean
  onMoveComplete?: () => void
}

// ---- Fallback cube shown when model is missing or loading ----
function FallbackCube({
  size,
  color,
}: {
  size: number
  color: string
}) {
  return (
    <mesh>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function UnitModel({
  position,
  playerClass,
  team,
  config,
  movementPath,
  isMoving,
  onMoveComplete,
}: UnitModelProps) {
  const groupRef = useRef<Group>(null)
  const cubeSize = config.tileSize * 0.6
  const modelConfig = getUnitModelConfig(playerClass, team)

  // ---- Animation state ----
  const [pathIndex, setPathIndex] = useState(0)
  const progressRef = useRef(0)

  // ---- Reset animation state when a new movement path starts ----
  useEffect(() => {
    if (isMoving && movementPath.length > 1) {
      setPathIndex(0)
      progressRef.current = 0
    }
  }, [isMoving, movementPath])

  // ---- Y offset for the unit above the tile ----
  const unitY = TILE_HEIGHT / 2 + config.tileSize * 0.6 * 0.5

  // ---- Animate tile-by-tile along the movement path ----
  useFrame((_, delta) => {
    if (!groupRef.current) return

    // ---- Y position always controlled here to avoid JSX prop conflicts ----
    groupRef.current.position.y = unitY

    if (isMoving && movementPath.length > 1) {
      const currentIdx = pathIndex
      const nextIdx = currentIdx + 1

      if (nextIdx >= movementPath.length) {
        // ---- Animation complete ----
        onMoveComplete?.()
        return
      }

      const from = gridToWorld(movementPath[currentIdx]!, config)
      const to = gridToWorld(movementPath[nextIdx]!, config)

      progressRef.current += delta * MOVE_SPEED
      const t = Math.min(progressRef.current, 1)

      // ---- Lerp between current and next tile ----
      groupRef.current.position.x = from.x + (to.x - from.x) * t
      groupRef.current.position.z = from.z + (to.z - from.z) * t

      if (t >= 1) {
        // ---- Snap to next tile and advance ----
        progressRef.current = 0
        setPathIndex(currentIdx + 1)
      }
    } else {
      // ---- Static position when not moving ----
      const worldPos = gridToWorld(position, config)
      groupRef.current.position.x = worldPos.x
      groupRef.current.position.z = worldPos.z
    }
  })

  const fallback = (
    <FallbackCube size={cubeSize} color={modelConfig.fallbackColor} />
  )

  return (
    <group ref={groupRef}>
      <ModelErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <ModelRenderer config={{...modelConfig, isMoving}} />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  )
}

export default UnitModel
