import { Suspense, useMemo, forwardRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three/examples/jsm/Addons.js'
import type { Group } from 'three'
import type { ZoneObject } from '@/types/zone'
import type { ZoneTerrain } from '@/game/world/terrainUtils'
import { DECORATION_MODELS } from '@/game/world/decorationRegistry'
import CombatPortal from '@/game/objects/CombatPortal'
import ZonePortal from '@/game/objects/ZonePortal'

const DECORATION_COLOR = '#8b7355'
const DECORATION_SIZE = 1

// ---- Renders a single GLTF decoration model ----
function DecorationModel({
  modelPath,
  position,
  scale,
  rotationY,
}: {
  modelPath: string
  position: [number, number, number]
  scale: number
  rotationY: number
}) {
  const { scene } = useGLTF(modelPath)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])

  return (
    <primitive
      object={clone}
      position={position}
      scale={scale}
      rotation={[0, rotationY, 0]}
    />
  )
}

interface ZoneObjectRendererProps {
  objects: ZoneObject[]
  terrain: ZoneTerrain
  walkablesRef?: React.RefObject<Group | null>
}

// ---- Compute Y for an object: absolute if defined, terrain-based if undefined ----
function computeObjectY(
  obj: ZoneObject,
  terrainY: number,
  yOffset: number,
): number {
  if (obj.position.y !== undefined) {
    // ---- Absolute Y from WorldBuilder ----
    return obj.position.y + yOffset
  }
  // ---- Backwards-compatible: terrain height + offset ----
  return terrainY + yOffset
}

const ZoneObjectRenderer = forwardRef<Group, ZoneObjectRendererProps>(
  function ZoneObjectRenderer({ objects, terrain, walkablesRef }, ref) {
    // ---- Split objects into collidable, walkable, non-collidable, and portals ----
    const { collidable, walkable, nonCollidable, portals } = useMemo(() => {
      const collidable: ZoneObject[] = []
      const walkable: ZoneObject[] = []
      const nonCollidable: ZoneObject[] = []
      const portals: ZoneObject[] = []

      for (const obj of objects) {
        if (obj.type === 'combatPortal' || obj.type === 'zonePortal') {
          portals.push(obj)
        } else if (obj.type === 'decoration') {
          // ---- Walkable surfaces: player can walk on top ----
          if (obj.walkable) {
            walkable.push(obj)
            continue
          }
          // ---- Check if decoration has collision ----
          const modelConfig = obj.modelId
            ? DECORATION_MODELS[obj.modelId]
            : null
          const hasCollision =
            !obj.noCollision &&
            (modelConfig ? modelConfig.hasCollision !== false : true)

          if (hasCollision) {
            collidable.push(obj)
          } else {
            nonCollidable.push(obj)
          }
        }
      }

      return { collidable, walkable, nonCollidable, portals }
    }, [objects])

    // ---- Render a decoration object ----
    const renderDecoration = (obj: ZoneObject) => {
      const terrainY = terrain.getHeightAt(obj.position.x, obj.position.z)
      const modelConfig = obj.modelId
        ? DECORATION_MODELS[obj.modelId]
        : null

      if (modelConfig) {
        const modelScale = (obj.scale ?? 1) * modelConfig.scale
        const y = computeObjectY(obj, terrainY, modelConfig.yOffset)
        return (
          <Suspense key={obj.id} fallback={null}>
            <DecorationModel
              modelPath={modelConfig.path}
              position={[obj.position.x, y, obj.position.z]}
              scale={modelScale}
              rotationY={obj.rotationY ?? 0}
            />
          </Suspense>
        )
      }

      // ---- Fallback: plain box for decorations without a model ----
      const y = computeObjectY(obj, terrainY, DECORATION_SIZE / 2)
      return (
        <mesh
          key={obj.id}
          position={[obj.position.x, y, obj.position.z]}
        >
          <boxGeometry
            args={[obj.size.x * 2, DECORATION_SIZE, obj.size.z * 2]}
          />
          <meshStandardMaterial color={DECORATION_COLOR} />
        </mesh>
      )
    }

    return (
      <>
        {/* ---- Collidable decorations: block pathfinding, NOT raycasted ---- */}
        <group ref={ref}>
          {collidable.map(renderDecoration)}
        </group>

        {/* ---- Walkable surfaces: player can walk on top, raycasted for Y ---- */}
        <group ref={walkablesRef}>
          {walkable.map(renderDecoration)}
        </group>

        {/* ---- Non-collidable decorations ---- */}
        {nonCollidable.map(renderDecoration)}

        {/* ---- Portals ---- */}
        {portals.map((obj) => {
          const terrainY = terrain.getHeightAt(
            obj.position.x,
            obj.position.z,
          )

          if (obj.type === 'combatPortal') {
            return obj.combatSetup ? (
              <CombatPortal
                key={obj.id}
                position={[obj.position.x, terrainY + 1, obj.position.z]}
                combatSetup={obj.combatSetup}
              />
            ) : null
          }

          if (obj.type === 'zonePortal') {
            return obj.targetZoneId ? (
              <ZonePortal
                key={obj.id}
                position={[obj.position.x, terrainY + 1, obj.position.z]}
                targetZoneId={obj.targetZoneId}
                targetSpawnPosition={obj.targetSpawnPosition}
              />
            ) : null
          }

          return null
        })}
      </>
    )
  },
)

export default ZoneObjectRenderer
