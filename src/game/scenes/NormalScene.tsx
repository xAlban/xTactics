import { useRef, useState, useEffect, useCallback, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { Physics, RigidBody, CapsuleCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import FollowCamera from '@/game/camera/FollowCamera'
import ModelRenderer from '@/game/models/GLTFModel'
import ModelErrorBoundary from '@/game/models/ModelErrorBoundary'
import { UNIT_MODELS } from '@/game/models/modelRegistry'
import { useGameModeStore } from '@/stores/gameModeStore'
import { useZoneStore } from '@/stores/zoneStore'
import ZoneGround from '@/game/world/ZoneGround'
import ZoneObjectRenderer from '@/game/world/ZoneObjectRenderer'
import {
  shortestAngleDelta,
  facingAngleFromDirection,
} from '@/game/utils/rotationUtils'

const MOVE_SPEED = 15
const ARRIVAL_THRESHOLD = 0.5

// ---- Player cube settings ----
const CUBE_SIZE = 0.7

// ---- Rotation lerp speed (radians per second) ----
const ROTATION_SPEED = 12

// ---- Destination marker settings ----
const MARKER_BOUNCE_SPEED = 3
const MARKER_BOUNCE_HEIGHT = 0.3
const MARKER_BASE_Y = 0.05

// ---- Spawn height so player falls to ground via gravity ----
const SPAWN_Y = 10

function PlayerController() {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const meshRef = useRef<Mesh>(null)
  const markerRef = useRef<Mesh>(null)
  const playerYRef = useRef<number>(0)

  // ---- Facing rotation state ----
  const facingRef = useRef(0)
  const currentRotationRef = useRef(0)

  // ---- Track moving state for animation ----
  const movingRef = useRef(false)
  const [isMovingState, setIsMovingState] = useState(false)

  // ---- Destination marker position ----
  const [destination, setDestination] = useState<{
    x: number
    z: number
  } | null>(null)

  const playerPosition = useGameModeStore((s) => s.playerPosition)
  const targetPosition = useGameModeStore((s) => s.targetPosition)
  const pendingArrivalAction = useGameModeStore((s) => s.pendingArrivalAction)
  const player = useGameModeStore((s) => s.player)
  const setPlayerPosition = useGameModeStore((s) => s.setPlayerPosition)
  const updatePlayerPosition = useGameModeStore((s) => s.updatePlayerPosition)

  // ---- Sync pending action into ref for useFrame access ----
  const pendingActionRef = useRef<(() => void) | null>(null)
  pendingActionRef.current = pendingArrivalAction

  // ---- Get current zone id to detect zone transitions ----
  const currentZoneId = useZoneStore((s) => s.currentZoneId)

  // ---- Show destination marker when target changes ----
  useEffect(() => {
    if (targetPosition) {
      setDestination({ x: targetPosition.x, z: targetPosition.z })
    } else {
      setDestination(null)
    }
  }, [targetPosition])

  // ---- Teleport on zone change ----
  useEffect(() => {
    const body = rigidBodyRef.current
    if (!body) return

    // ---- Teleport: set body position high so it falls down ----
    body.setTranslation(
      { x: playerPosition.x, y: SPAWN_Y, z: playerPosition.z },
      true,
    )
    body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentZoneId])

  // ---- Physics-based movement toward target ----
  useFrame((_, delta) => {
    const body = rigidBodyRef.current
    if (!body || !meshRef.current) return

    const pos = body.translation()
    let currentlyMoving = false

    if (targetPosition) {
      const dx = targetPosition.x - pos.x
      const dz = targetPosition.z - pos.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < ARRIVAL_THRESHOLD) {
        // ---- Arrived at target ----
        const vel = body.linvel()
        body.setLinvel({ x: 0, y: vel.y, z: 0 }, true)
        setPlayerPosition({ x: targetPosition.x, z: targetPosition.z })
        setDestination(null)
        const action = pendingActionRef.current
        if (action) action()
      } else {
        // ---- Move toward target ----
        currentlyMoving = true
        facingRef.current = facingAngleFromDirection(dx, dz)
        const vel = body.linvel()
        // ---- Clamp Y velocity to prevent capsule bouncing upward ----
        body.setLinvel(
          {
            x: (dx / dist) * MOVE_SPEED,
            y: Math.min(vel.y, 0),
            z: (dz / dist) * MOVE_SPEED,
          },
          true,
        )
        updatePlayerPosition({ x: pos.x, z: pos.z })
      }
    }

    // ---- Only trigger re-render when moving state actually changes ----
    if (currentlyMoving !== movingRef.current) {
      movingRef.current = currentlyMoving
      setIsMovingState(currentlyMoving)
    }

    // ---- Smooth rotation interpolation ----
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

    // ---- Sync visual mesh with physics body position ----
    playerYRef.current = pos.y
    meshRef.current.position.set(pos.x, pos.y, pos.z)
    meshRef.current.rotation.y = currentRotationRef.current

    // ---- Animate destination marker bounce ----
    if (markerRef.current && destination) {
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
      <FollowCamera playerYRef={playerYRef} />

      {/* ---- Player physics body ---- */}
      <RigidBody
        ref={rigidBodyRef}
        type="dynamic"
        position={[playerPosition.x, 0, playerPosition.z]}
        lockRotations
        ccd
        colliders={false}
      >
        <CapsuleCollider args={[0.25, 0.2]} />
      </RigidBody>

      {/* ---- Player visual model (synced via useFrame) ---- */}
      <group ref={meshRef as React.RefObject<never>}>
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
                <meshStandardMaterial color={modelConfig.fallbackColor} />
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

      {/* ---- Destination marker ---- */}
      {destination && (
        <mesh
          ref={markerRef}
          position={[destination.x, MARKER_BASE_Y, destination.z]}
        >
          <cylinderGeometry args={[0, 0.3, 0.5, 4]} />
          <meshStandardMaterial color="#2ecc71" transparent opacity={0.7} />
        </mesh>
      )}
    </>
  )
}

function NormalScene() {
  // ---- Get current zone from zone store ----
  const currentZone = useZoneStore((s) => s.getCurrentZone())

  // ---- Stable key to reset Physics when zone changes ----
  const physicsKey = useRef(currentZone.id)
  const [, forceUpdate] = useState(0)

  // ---- Reset physics world on zone change ----
  const handleZoneChange = useCallback(() => {
    physicsKey.current = currentZone.id
    forceUpdate((n) => n + 1)
  }, [currentZone.id])

  useEffect(() => {
    handleZoneChange()
  }, [handleZoneChange])

  return (
    <Physics key={physicsKey.current} gravity={[0, -30, 0]}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} />

      {/* ---- Zone ground with Rapier collider ---- */}
      <ZoneGround
        width={currentZone.width}
        height={currentZone.height}
        groundType={currentZone.groundType}
      />

      {/* ---- Zone objects (decorations, portals) ---- */}
      <ZoneObjectRenderer objects={currentZone.objects} />

      {/* ---- Player with physics-based movement ---- */}
      <PlayerController />
    </Physics>
  )
}

export default NormalScene
