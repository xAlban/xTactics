import type { GridConfig } from '@/types/grid'
import type { Path } from '@/types/combat'
import { gridToWorld } from '@/game/map/gridUtils'

const SPHERE_RADIUS = 0.08
const SPHERE_Y = 0.15

interface PathPreviewProps {
  path: Path
  config: GridConfig
}

function PathPreview({ path, config }: PathPreviewProps) {
  // ---- Skip origin (first element), show spheres along the rest of the path ----
  if (path.length < 2) return null

  const spheres = path.slice(1)

  return (
    <group>
      {spheres.map((coord, i) => {
        const worldPos = gridToWorld(coord, config)
        const isDestination = i === spheres.length - 1

        return (
          <mesh
            key={`${coord.col},${coord.row}`}
            position={[worldPos.x, SPHERE_Y, worldPos.z]}
          >
            <sphereGeometry args={[SPHERE_RADIUS, 12, 8]} />
            <meshStandardMaterial
              color={isDestination ? '#ffffff' : '#87ceeb'}
              emissive={isDestination ? '#ffffff' : '#87ceeb'}
              emissiveIntensity={isDestination ? 0.3 : 0.2}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export default PathPreview
