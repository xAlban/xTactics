import { useCallback, useMemo, forwardRef } from 'react'
import * as THREE from 'three'
import type { Intersection, Mesh } from 'three'
import type { GroundType } from '@/types/zone'
import type { ZoneTerrain } from '@/game/world/terrainUtils'
import { useGameModeStore } from '@/stores/gameModeStore'

// ---- Ground color palettes per ground type ----
const GROUND_COLORS: Record<GroundType, string> = {
  grass: '#70c048',
  rock: '#4a4040',
}

// ---- Terrain subdivision: 1 segment per 2 world units ----
const SEGMENT_DENSITY = 2

interface ZoneGroundProps {
  width: number
  height: number
  groundType: GroundType
  terrain: ZoneTerrain
}

const ZoneGround = forwardRef<Mesh, ZoneGroundProps>(function ZoneGround(
  { width, height, groundType, terrain },
  ref,
) {
  const setTargetPosition = useGameModeStore((s) => s.setTargetPosition)

  const halfW = width / 2
  const halfH = height / 2

  // ---- Build subdivided geometry with terrain displacement ----
  const geometry = useMemo(() => {
    const segsX = Math.ceil(width / SEGMENT_DENSITY)
    const segsZ = Math.ceil(height / SEGMENT_DENSITY)
    const geo = new THREE.PlaneGeometry(width, height, segsX, segsZ)

    // ---- Rotate plane to lie flat (XZ plane) ----
    geo.rotateX(-Math.PI / 2)

    // ---- Displace vertex Y by terrain height ----
    const pos = geo.attributes.position!
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, terrain.getHeightAt(x, z))
    }

    geo.computeVertexNormals()
    return geo
  }, [width, height, terrain])

  // ---- Click handler: use intersection point directly (follows terrain) ----
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
    <mesh ref={ref} geometry={geometry} onClick={handleClick}>
      <meshStandardMaterial color={GROUND_COLORS[groundType]} />
    </mesh>
  )
})

export default ZoneGround
