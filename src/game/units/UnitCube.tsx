import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import type { TileCoord, GridConfig } from '@/types/grid'
import type { PlayerClass } from '@/types/player'
import type { Path } from '@/types/combat'
import { gridToWorld } from '@/game/map/gridUtils'

const TILE_HEIGHT = 0.08

// ---- Color per class ----
const CLASS_COLORS: Record<PlayerClass, string> = {
  bomberman: '#c0392b',
  archer: '#27ae60',
  knight: '#2980b9',
  mage: '#8e44ad',
}

// ---- Movement speed in tiles per second ----
const MOVE_SPEED = 4

interface UnitCubeProps {
  position: TileCoord
  playerClass: PlayerClass
  config: GridConfig
  movementPath: Path
  isMoving: boolean
  onMoveComplete: () => void
}

function UnitCube({
  position,
  playerClass,
  config,
  movementPath,
  isMoving,
  onMoveComplete,
}: UnitCubeProps) {
  const meshRef = useRef<Mesh>(null)
  const cubeSize = config.tileSize * 0.6

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

  // ---- Animate tile-by-tile along the movement path ----
  useFrame((_, delta) => {
    if (!meshRef.current) return

    if (isMoving && movementPath.length > 1) {
      const currentIdx = pathIndex
      const nextIdx = currentIdx + 1

      if (nextIdx >= movementPath.length) {
        // ---- Animation complete ----
        onMoveComplete()
        return
      }

      const from = gridToWorld(movementPath[currentIdx]!, config)
      const to = gridToWorld(movementPath[nextIdx]!, config)

      progressRef.current += delta * MOVE_SPEED
      const t = Math.min(progressRef.current, 1)

      // ---- Lerp between current and next tile ----
      meshRef.current.position.x = from.x + (to.x - from.x) * t
      meshRef.current.position.z = from.z + (to.z - from.z) * t

      if (t >= 1) {
        // ---- Snap to next tile and advance ----
        progressRef.current = 0
        setPathIndex(currentIdx + 1)
      }
    } else {
      // ---- Static position when not moving ----
      const worldPos = gridToWorld(position, config)
      meshRef.current.position.x = worldPos.x
      meshRef.current.position.z = worldPos.z
    }
  })

  // ---- Initial world position ----
  const worldPos = gridToWorld(position, config)

  return (
    <mesh
      ref={meshRef}
      position={[worldPos.x, TILE_HEIGHT / 2 + cubeSize / 2, worldPos.z]}
    >
      <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
      <meshStandardMaterial color={CLASS_COLORS[playerClass]} />
    </mesh>
  )
}

export default UnitCube
