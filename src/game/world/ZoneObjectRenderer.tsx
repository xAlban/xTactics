import { Suspense, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three/examples/jsm/Addons.js'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { ZoneObject } from '@/types/zone'
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
}

function ZoneObjectRenderer({ objects }: ZoneObjectRendererProps) {
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
        const modelConfig = obj.modelId ? DECORATION_MODELS[obj.modelId] : null
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

  // ---- Render a decoration visual (model or fallback box) ----
  const renderDecorationVisual = (obj: ZoneObject) => {
    const modelConfig = obj.modelId ? DECORATION_MODELS[obj.modelId] : null

    if (modelConfig) {
      const modelScale = (obj.scale ?? 1) * modelConfig.scale
      const y = (obj.position.y ?? 0) + modelConfig.yOffset
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
    const y = (obj.position.y ?? 0) + DECORATION_SIZE / 2
    return (
      <mesh key={obj.id} position={[obj.position.x, y, obj.position.z]}>
        <boxGeometry args={[obj.size.x * 2, DECORATION_SIZE, obj.size.z * 2]} />
        <meshStandardMaterial color={DECORATION_COLOR} />
      </mesh>
    )
  }

  // ---- Render a collidable decoration with Rapier physics body ----
  const renderCollidable = (obj: ZoneObject) => {
    const halfY = DECORATION_SIZE / 2
    const colliderY = (obj.position.y ?? 0) + halfY
    return (
      <RigidBody
        key={obj.id}
        type="fixed"
        colliders={false}
        position={[obj.position.x, 0, obj.position.z]}
      >
        <CuboidCollider
          args={[obj.size.x, halfY, obj.size.z]}
          position={[0, colliderY, 0]}
        />
        {renderDecorationVisual({
          ...obj,
          position: { ...obj.position, x: 0, z: 0 },
        })}
      </RigidBody>
    )
  }

  // ---- Render a walkable surface with Rapier physics body ----
  const renderWalkable = (obj: ZoneObject) => {
    const halfY = DECORATION_SIZE / 2
    const colliderY = (obj.position.y ?? 0) + halfY
    return (
      <RigidBody
        key={obj.id}
        type="fixed"
        colliders={false}
        position={[obj.position.x, 0, obj.position.z]}
      >
        <CuboidCollider
          args={[obj.size.x, halfY, obj.size.z]}
          position={[0, colliderY, 0]}
        />
        {renderDecorationVisual({
          ...obj,
          position: { ...obj.position, x: 0, z: 0 },
        })}
      </RigidBody>
    )
  }

  return (
    <>
      {/* ---- Collidable decorations with Rapier physics ---- */}
      {collidable.map(renderCollidable)}

      {/* ---- Walkable surfaces with Rapier physics ---- */}
      {walkable.map(renderWalkable)}

      {/* ---- Non-collidable decorations (visual only) ---- */}
      {nonCollidable.map(renderDecorationVisual)}

      {/* ---- Portals ---- */}
      {portals.map((obj) => {
        const portalY = obj.position.y ?? 1

        if (obj.type === 'combatPortal') {
          return obj.combatSetup ? (
            <CombatPortal
              key={obj.id}
              position={[obj.position.x, portalY, obj.position.z]}
              combatSetup={obj.combatSetup}
            />
          ) : null
        }

        if (obj.type === 'zonePortal') {
          return obj.targetZoneId ? (
            <ZonePortal
              key={obj.id}
              position={[obj.position.x, portalY, obj.position.z]}
              targetZoneId={obj.targetZoneId}
              targetSpawnPosition={obj.targetSpawnPosition}
            />
          ) : null
        }

        return null
      })}
    </>
  )
}

export default ZoneObjectRenderer
