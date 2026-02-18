import type { ZoneObject } from '@/types/zone'
import CombatPortal from '@/game/objects/CombatPortal'
import ZonePortal from '@/game/objects/ZonePortal'

const DECORATION_COLOR = '#8b7355'
const DECORATION_SIZE = 1

interface ZoneObjectRendererProps {
  objects: ZoneObject[]
}

function ZoneObjectRenderer({ objects }: ZoneObjectRendererProps) {
  return (
    <>
      {objects.map((obj) => {
        switch (obj.type) {
          case 'decoration':
            return (
              <mesh
                key={obj.id}
                position={[obj.position.x, DECORATION_SIZE / 2, obj.position.z]}
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
