import { useRef, useState, useEffect, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { TileCoord, GridConfig } from '@/types/grid'
import type { PlayerClass } from '@/types/player'
import type { Path, UnitTeam } from '@/types/combat'
import type { AnimationState } from '@/game/models/modelRegistry'
import { gridToWorld } from '@/game/map/gridUtils'
import { getUnitModelConfig } from '@/game/models/modelRegistry'
import ModelRenderer from '@/game/models/GLTFModel'
import ModelErrorBoundary from '@/game/models/ModelErrorBoundary'
import {
  shortestAngleDelta,
  facingAngleFromDirection,
} from '@/game/utils/rotationUtils'

const TILE_HEIGHT = 0.08

// ---- Movement speed in tiles per second ----
const MOVE_SPEED = 4

// ---- Rotation lerp speed (radians per second) ----
const ROTATION_SPEED = 12

// ---- Duration to keep death animation visible before hiding (ms) ----
const DEATH_ANIM_DURATION = 1500

interface UnitModelProps {
  position: TileCoord
  playerClass: PlayerClass
  team: UnitTeam
  config: GridConfig
  movementPath: Path
  isMoving: boolean
  onMoveComplete?: () => void
  attackTarget?: TileCoord | null
  defeated?: boolean
}

// ---- Fallback cube shown when model is missing or loading ----
function FallbackCube({ size, color }: { size: number; color: string }) {
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
  attackTarget,
  defeated,
}: UnitModelProps) {
  const groupRef = useRef<Group>(null)
  const cubeSize = config.tileSize * 0.6
  const modelConfig = getUnitModelConfig(playerClass, team)

  // ---- Animation state ----
  const [pathIndex, setPathIndex] = useState(0)
  const progressRef = useRef(0)

  // ---- Facing rotation state ----
  const targetRotationRef = useRef(0)
  const currentRotationRef = useRef(0)

  // ---- Attack animation state ----
  const [isAttacking, setIsAttacking] = useState(false)

  // ---- Death animation state: hide after animation completes ----
  const [deathComplete, setDeathComplete] = useState(false)

  // ---- Reset animation state when a new movement path starts ----
  useEffect(() => {
    if (isMoving && movementPath.length > 1) {
      setPathIndex(0)
      progressRef.current = 0
    }
  }, [isMoving, movementPath])

  // ---- Handle attack target changes ----
  useEffect(() => {
    if (!attackTarget) {
      setIsAttacking(false)
      return
    }

    // ---- Compute facing angle toward attack target ----
    const fromWorld = gridToWorld(position, config)
    const toWorld = gridToWorld(attackTarget, config)
    const dx = toWorld.x - fromWorld.x
    const dz = toWorld.z - fromWorld.z
    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
      targetRotationRef.current = facingAngleFromDirection(dx, dz)
    }
    setIsAttacking(true)
  }, [attackTarget, position, config])

  // ---- Hide unit after death animation finishes ----
  useEffect(() => {
    if (!defeated) return
    const timer = setTimeout(() => {
      setDeathComplete(true)
    }, DEATH_ANIM_DURATION)
    return () => clearTimeout(timer)
  }, [defeated])

  // ---- Derive animation state ----
  const animationState: AnimationState = defeated
    ? 'death'
    : isMoving
      ? 'walk'
      : isAttacking
        ? 'attack'
        : 'idle'

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

      // ---- Compute facing direction toward next tile ----
      const dx = to.x - from.x
      const dz = to.z - from.z
      if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        targetRotationRef.current = facingAngleFromDirection(dx, dz)
      }

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

    // ---- Smooth rotation interpolation (shortest path) ----
    const angleDelta = shortestAngleDelta(
      currentRotationRef.current,
      targetRotationRef.current,
    )
    if (Math.abs(angleDelta) > 0.01) {
      const step =
        Math.sign(angleDelta) *
        Math.min(Math.abs(angleDelta), delta * ROTATION_SPEED)
      currentRotationRef.current += step
    } else {
      currentRotationRef.current = targetRotationRef.current
    }
    groupRef.current.rotation.y = currentRotationRef.current
  })

  // ---- After death animation completes, stop rendering ----
  if (deathComplete) return null

  const fallback = (
    <FallbackCube size={cubeSize} color={modelConfig.fallbackColor} />
  )

  return (
    <group ref={groupRef}>
      <ModelErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <ModelRenderer
            config={{ ...modelConfig, animationState, yOffset: -0.2 }}
          />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  )
}

export default UnitModel
