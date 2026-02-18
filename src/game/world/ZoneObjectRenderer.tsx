import { Suspense, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three/examples/jsm/Addons.js'
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
  return (
    <>
      {objects.map((obj) => {
        switch (obj.type) {
          case 'decoration': {
            // ---- Look up model config from registry ----
            const modelConfig = obj.modelId
              ? DECORATION_MODELS[obj.modelId]
              : null

            if (modelConfig) {
              const modelScale =
                (obj.scale ?? 1) * modelConfig.scale
              return (
                <Suspense key={obj.id} fallback={null}>
                  <DecorationModel
                    modelPath={modelConfig.path}
                    position={[
                      obj.position.x,
                      modelConfig.yOffset,
                      obj.position.z,
                    ]}
                    scale={modelScale}
                    rotationY={obj.rotationY ?? 0}
                  />
                </Suspense>
              )
            }

            // ---- Fallback: plain box for decorations without a model ----
            return (
              <mesh
                key={obj.id}
                position={[
                  obj.position.x,
                  DECORATION_SIZE / 2,
                  obj.position.z,
                ]}
              >
                <boxGeometry
                  args={[
                    obj.size.x * 2,
                    DECORATION_SIZE,
                    obj.size.z * 2,
                  ]}
                />
                <meshStandardMaterial color={DECORATION_COLOR} />
              </mesh>
            )
          }

          case 'combatPortal':
            return obj.combatSetup ? (
              <CombatPortal
                key={obj.id}
                position={[obj.position.x, 1, obj.position.z]}
                combatSetup={obj.combatSetup}
              />
            ) : null

          case 'zonePortal':
            return obj.targetZoneId ? (
              <ZonePortal
                key={obj.id}
                position={[obj.position.x, 1, obj.position.z]}
                targetZoneId={obj.targetZoneId}
                targetSpawnPosition={obj.targetSpawnPosition}
              />
            ) : null

          default:
            return null
        }
      })}
    </>
  )
}

export default ZoneObjectRenderer
