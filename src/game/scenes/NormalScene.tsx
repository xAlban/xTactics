import { useRef, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { ShaderMaterial, Color } from 'three'
import type { Mesh, Intersection } from 'three'
import IsometricCamera from '@/game/camera/IsometricCamera'
import CombatPortal from '@/game/objects/CombatPortal'
import { useGameModeStore } from '@/stores/gameModeStore'

const FLOOR_SIZE = 200
const MOVE_SPEED = 5
const ARRIVAL_THRESHOLD = 0.05

// ---- Portal placed at a fixed world position ----
const PORTAL_POSITION: [number, number, number] = [5, 1, 5]

// ---- Player cube settings ----
const CUBE_SIZE = 0.7
const CUBE_Y = CUBE_SIZE / 2

// ---- Color per class (same as UnitCube) ----
const CLASS_COLORS: Record<string, string> = {
  bomberman: '#c0392b',
  archer: '#27ae60',
  knight: '#2980b9',
  mage: '#8e44ad',
}

function NormalScene() {
  const meshRef = useRef<Mesh>(null)
  const targetRef = useRef<{ x: number; z: number } | null>(null)

  const playerPosition = useGameModeStore((s) => s.playerPosition)
  const targetPosition = useGameModeStore((s) => s.targetPosition)
  const player = useGameModeStore((s) => s.player)
  const setTargetPosition = useGameModeStore((s) => s.setTargetPosition)
  const setPlayerPosition = useGameModeStore((s) => s.setPlayerPosition)

  // ---- Sync store target into local ref for useFrame access ----
  targetRef.current = targetPosition

  // ---- Track current position in a ref for smooth animation ----
  const posRef = useRef({ x: playerPosition.x, z: playerPosition.z })

  // ---- Animate player toward click target ----
  useFrame((_, delta) => {
    if (!meshRef.current) return

    const target = targetRef.current
    if (target) {
      const dx = target.x - posRef.current.x
      const dz = target.z - posRef.current.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < ARRIVAL_THRESHOLD) {
        // ---- Arrived at destination ----
        posRef.current.x = target.x
        posRef.current.z = target.z
        setPlayerPosition({ x: target.x, z: target.z })
      } else {
        // ---- Move toward target ----
        const step = Math.min(delta * MOVE_SPEED, dist)
        posRef.current.x += (dx / dist) * step
        posRef.current.z += (dz / dist) * step
      }
    }

    meshRef.current.position.x = posRef.current.x
    meshRef.current.position.z = posRef.current.z
  })

  // ---- Click on the floor to set movement target ----
  const handleFloorClick = useCallback(
    (e: { stopPropagation: () => void; intersections: Intersection[] }) => {
      e.stopPropagation()
      const hit = e.intersections[0]
      if (hit) {
        setTargetPosition({ x: hit.point.x, z: hit.point.z })
      }
    },
    [setTargetPosition],
  )

  const cubeColor = CLASS_COLORS[player.playerClass] ?? '#ffffff'

  // ---- Shader material that draws a subtle grid pattern ----
  const gridMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uBaseColor: { value: new Color('#3a3a3a') },
          uLineColor: { value: new Color('#4a4a4a') },
          uGridSize: { value: 1.2 },
          uLineWidth: { value: 0.03 },
        },
        vertexShader: `
          varying vec2 vWorldPos;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPosition.xz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uBaseColor;
          uniform vec3 uLineColor;
          uniform float uGridSize;
          uniform float uLineWidth;
          varying vec2 vWorldPos;
          void main() {
            vec2 grid = abs(fract(vWorldPos / uGridSize - 0.5) - 0.5);
            float line = step(min(grid.x, grid.y), uLineWidth / uGridSize);
            gl_FragColor = vec4(mix(uBaseColor, uLineColor, line), 1.0);
          }
        `,
      }),
    [],
  )

  return (
    <>
      <IsometricCamera />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} />

      {/* ---- Infinite flat floor with grid pattern ---- */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        material={gridMaterial}
        onClick={handleFloorClick}
      >
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
      </mesh>

      {/* ---- Player cube ---- */}
      <mesh
        ref={meshRef}
        position={[playerPosition.x, CUBE_Y, playerPosition.z]}
      >
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial color={cubeColor} />
      </mesh>

      {/* ---- Combat trigger portal ---- */}
      <CombatPortal position={PORTAL_POSITION} />
    </>
  )
}

export default NormalScene
