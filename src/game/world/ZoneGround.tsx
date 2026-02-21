import { useCallback } from 'react'
import type { Intersection } from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { GroundType } from '@/types/zone'
import { useGameModeStore } from '@/stores/gameModeStore'

// ---- Ground color palettes per ground type ----
const GROUND_COLORS: Record<GroundType, string> = {
  grass: '#70c048',
  rock: '#4a4040',
}

interface ZoneGroundProps {
  width: number
  height: number
  groundType: GroundType
}

function ZoneGround({ width, height, groundType }: ZoneGroundProps) {
  const setTargetPosition = useGameModeStore((s) => s.setTargetPosition)

  const halfW = width / 2
  const halfH = height / 2

  // ---- Click handler: use intersection point directly ----
  const handleClick = useCallback(
    (e: { stopPropagation: () => void; intersections: Intersection[] }) => {
      e.stopPropagation()
      const hit = e.intersections[0]
      if (!hit) return

      // ---- Clamp click to zone bounds ----
      const x = Math.max(-halfW, Math.min(halfW, hit.point.x))
      const z = Math.max(-halfH, Math.min(halfH, hit.point.z))
      setTargetPosition({ x, z })
    },
    [setTargetPosition, halfW, halfH],
  )

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[halfW, 0.1, halfH]} position={[0, -0.1, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={handleClick}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={GROUND_COLORS[groundType]} />
      </mesh>
    </RigidBody>
  )
}

export default ZoneGround
