import { useRef, useState, useEffect, useMemo, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import FollowCamera from '@/game/camera/FollowCamera'
import ModelRenderer from '@/game/models/GLTFModel'
import ModelErrorBoundary from '@/game/models/ModelErrorBoundary'
import { UNIT_MODELS } from '@/game/models/modelRegistry'
import { useGameModeStore } from '@/stores/gameModeStore'
import { useZoneStore } from '@/stores/zoneStore'
import ZoneGround from '@/game/world/ZoneGround'
import ZoneObjectRenderer from '@/game/world/ZoneObjectRenderer'
import {
  findPath,
  getDecorationObstacles,
} from '@/game/world/collisionUtils'
import {
  shortestAngleDelta,
  facingAngleFromDirection,
} from '@/game/utils/rotationUtils'

const MOVE_SPEED = 15
const ARRIVAL_THRESHOLD = 0.05

// ---- Player cube settings ----
const CUBE_SIZE = 0.7

// ---- Rotation lerp speed (radians per second) ----
const ROTATION_SPEED = 12

// ---- Destination marker settings ----
const MARKER_BOUNCE_SPEED = 3
const MARKER_BOUNCE_HEIGHT = 0.3
const MARKER_BASE_Y = 0.05

function NormalScene() {
  const meshRef = useRef<Group>(null)
  const markerRef = useRef<Mesh>(null)

  // ---- Facing rotation state ----
  const facingRef = useRef(0)
  const currentRotationRef = useRef(0)

  // ---- Track moving state for animation (only update on change) ----
  const movingRef = useRef(false)
  const [isMovingState, setIsMovingState] = useState(false)

  // ---- Destination marker position (final waypoint) ----
  const [destination, setDestination] = useState<{
    x: number
    z: number
  } | null>(null)

  const playerPosition = useGameModeStore((s) => s.playerPosition)
  const targetPosition = useGameModeStore((s) => s.targetPosition)
  const pendingArrivalAction = useGameModeStore(
    (s) => s.pendingArrivalAction,
  )
  const player = useGameModeStore((s) => s.player)
  const setPlayerPosition = useGameModeStore((s) => s.setPlayerPosition)
  const updatePlayerPosition = useGameModeStore(
    (s) => s.updatePlayerPosition,
  )

  // ---- Get current zone from zone store ----
  const currentZone = useZoneStore((s) => s.getCurrentZone())

  // ---- Cache decoration obstacles for pathfinding ----
  const decorations = useMemo(
    () => getDecorationObstacles(currentZone.objects),
    [currentZone.objects],
  )

  // ---- Waypoints the player follows (computed on target change) ----
  const waypointsRef = useRef<{ x: number; z: number }[]>([])
  const waypointIndexRef = useRef(0)

  // ---- Sync pending action into ref for useFrame access ----
  const pendingActionRef = useRef<(() => void) | null>(null)
  pendingActionRef.current = pendingArrivalAction

  // ---- Track current position in a ref for smooth animation ----
  const posRef = useRef({ x: playerPosition.x, z: playerPosition.z })

  // ---- Sync posRef on teleport (zone change sets position without a target) ----
  useEffect(() => {
    if (!targetPosition && waypointsRef.current.length === 0) {
      posRef.current.x = playerPosition.x
      posRef.current.z = playerPosition.z
    }
  }, [playerPosition, targetPosition])

  // ---- Compute waypoints when targetPosition changes ----
  useEffect(() => {
    if (!targetPosition) {
      waypointsRef.current = []
      waypointIndexRef.current = 0
      setDestination(null)
      return
    }

    const waypoints = findPath(
      { x: posRef.current.x, z: posRef.current.z },
      targetPosition,
      decorations,
    )
    waypointsRef.current = waypoints
    waypointIndexRef.current = 0

    // ---- Show marker at final waypoint ----
    if (waypoints.length > 0) {
      const last = waypoints[waypoints.length - 1]!
      setDestination({ x: last.x, z: last.z })
    }
  }, [targetPosition, decorations])

  // ---- Animate player along waypoints ----
  useFrame((_, delta) => {
    if (!meshRef.current) return

    const waypoints = waypointsRef.current
    const wpIdx = waypointIndexRef.current
    let currentlyMoving = false

    if (waypoints.length > 0 && wpIdx < waypoints.length) {
      const wp = waypoints[wpIdx]!
      const dx = wp.x - posRef.current.x
      const dz = wp.z - posRef.current.z
      const d = Math.sqrt(dx * dx + dz * dz)

      if (d < ARRIVAL_THRESHOLD) {
        // ---- Reached current waypoint ----
        posRef.current.x = wp.x
        posRef.current.z = wp.z

        if (wpIdx < waypoints.length - 1) {
          // ---- Advance to next waypoint ----
          waypointIndexRef.current = wpIdx + 1
          currentlyMoving = true
        } else {
          // ---- Reached final waypoint ----
          const action = pendingActionRef.current
          setPlayerPosition({ x: wp.x, z: wp.z })
          waypointsRef.current = []
          waypointIndexRef.current = 0
          setDestination(null)
          if (action) action()
        }
      } else {
        // ---- Move toward current waypoint ----
        facingRef.current = facingAngleFromDirection(dx, dz)
        currentlyMoving = true

        const step = Math.min(delta * MOVE_SPEED, d)
        posRef.current.x += (dx / d) * step
        posRef.current.z += (dz / d) * step
        updatePlayerPosition({
          x: posRef.current.x,
          z: posRef.current.z,
        })
      }
    }

    // ---- Only trigger re-render when moving state actually changes ----
    if (currentlyMoving !== movingRef.current) {
      movingRef.current = currentlyMoving
      setIsMovingState(currentlyMoving)
    }

    // ---- Smooth rotation interpolation (shortest path) ----
    const angleDelta = shortestAngleDelta(
      currentRotationRef.current,
      facingRef.current,
    )
    if (Math.abs(angleDelta) > 0.01) {
      const step =
        Math.sign(angleDelta) *
        Math.min(Math.abs(angleDelta), delta * ROTATION_SPEED)
      currentRotationRef.current += step
    } else {
      currentRotationRef.current = facingRef.current
    }
    meshRef.current.rotation.y = currentRotationRef.current

    // ---- Position fully controlled here to avoid JSX prop conflicts ----
    meshRef.current.position.x = posRef.current.x
    meshRef.current.position.y = 0
    meshRef.current.position.z = posRef.current.z

    // ---- Animate destination marker bounce ----
    if (markerRef.current) {
      markerRef.current.rotation.y += delta * 2
      markerRef.current.position.y =
        MARKER_BASE_Y +
        Math.abs(Math.sin(Date.now() * 0.001 * MARKER_BOUNCE_SPEED)) *
          MARKER_BOUNCE_HEIGHT
    }
  })

  const modelConfig = UNIT_MODELS[player.playerClass]

  return (
    <>
      <FollowCamera />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} />

      {/* ---- Zone ground (click always accepted) ---- */}
      <ZoneGround
        width={currentZone.width}
        height={currentZone.height}
        groundType={currentZone.groundType}
      />

      {/* ---- Zone objects (decorations, portals) ---- */}
      <ZoneObjectRenderer objects={currentZone.objects} />

      {/* ---- Destination marker (shows where the player is heading) ---- */}
      {destination && (
        <mesh
          ref={markerRef}
          position={[destination.x, MARKER_BASE_Y, destination.z]}
          rotation={[0, 0, 0]}
        >
          <cylinderGeometry args={[0, 0.3, 0.5, 4]} />
          <meshStandardMaterial
            color="#2ecc71"
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      {/* ---- Player model (position controlled by useFrame) ---- */}
      <group ref={meshRef}>
        <ModelErrorBoundary
          fallback={
            <mesh>
              <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
              <meshStandardMaterial color={modelConfig.fallbackColor} />
            </mesh>
          }
        >
          <Suspense
            fallback={
              <mesh>
                <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
                <meshStandardMaterial
                  color={modelConfig.fallbackColor}
                />
              </mesh>
            }
          >
            <ModelRenderer
              config={{
                ...modelConfig,
                animationState: isMovingState ? 'run' : 'idle',
              }}
            />
          </Suspense>
        </ModelErrorBoundary>
      </group>
    </>
  )
}

export default NormalScene
