import { useCallback } from 'react'
import type { Intersection } from 'three'
import type { GroundType } from '@/types/zone'
import { useGameModeStore } from '@/stores/gameModeStore'

// ---- Ground color palettes per ground type ----
const GROUND_COLORS: Record<GroundType, string> = {
  grass: '#2d5a1e',
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

  // ---- Click handler: clamp to zone bounds and move player ----
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
    <>
      {/* ---- Bounded zone ground (flat color, no grid) ---- */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={handleClick}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={GROUND_COLORS[groundType]} />
      </mesh>

      {/* ---- Subtle edge border lines ---- */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={
              new Float32Array([
                -halfW, 0.01, -halfH, halfW, 0.01, -halfH, halfW,
                0.01, -halfH, halfW, 0.01, halfH, halfW, 0.01,
                halfH, -halfW, 0.01, halfH, -halfW, 0.01, halfH,
                -halfW, 0.01, -halfH,
              ])
            }
            count={8}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" opacity={0.2} transparent />
      </lineSegments>
    </>
  )
}

export default ZoneGround
