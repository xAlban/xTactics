import { useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useGameModeStore } from '@/stores/gameModeStore'
import { useZoneStore } from '@/stores/zoneStore'

const PORTAL_COLOR = '#3498db'
const PORTAL_HOVER_COLOR = '#5dade2'
const ROTATION_SPEED = 1.5

interface ZonePortalProps {
  position: [number, number, number]
  targetZoneId: string
  targetSpawnPosition?: { x: number; z: number }
}

function ZonePortal({
  position,
  targetZoneId,
  targetSpawnPosition,
}: ZonePortalProps) {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const changeZone = useZoneStore((s) => s.changeZone)
  const setTargetWithAction = useGameModeStore(
    (s) => s.setTargetWithAction,
  )

  // ---- Slowly rotate the portal ----
  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * ROTATION_SPEED
  })

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      // ---- Walk to portal position, then change zone on arrival ----
      setTargetWithAction({ x: position[0], z: position[2] }, () =>
        changeZone(targetZoneId, targetSpawnPosition),
      )
    },
    [
      setTargetWithAction,
      changeZone,
      targetZoneId,
      targetSpawnPosition,
      position,
    ],
  )

  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      setHovered(true)
      document.body.style.cursor = 'pointer'
    },
    [],
  )

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    document.body.style.cursor = 'default'
  }, [])

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* ---- Invisible collision mesh for raycasting ---- */}
      <mesh visible={false}>
        <sphereGeometry args={[0.8, 8, 8]} />
      </mesh>
      {/* ---- Blue/cyan torus to distinguish from combat portals ---- */}
      <mesh>
        <torusGeometry args={[0.6, 0.15, 16, 32]} />
        <meshStandardMaterial
          color={hovered ? PORTAL_HOVER_COLOR : PORTAL_COLOR}
          emissive={hovered ? PORTAL_HOVER_COLOR : PORTAL_COLOR}
          emissiveIntensity={hovered ? 0.8 : 0.4}
        />
      </mesh>
    </group>
  )
}

export default ZonePortal
