import { useEffect, useMemo, useCallback } from 'react'
import IsometricCamera from '@/game/camera/IsometricCamera'
import GridFloor from '@/game/map/GridFloor'
import UnitCube from '@/game/units/UnitCube'
import PathPreview from '@/game/combat/PathPreview'
import { mapToGridConfig } from '@/game/map/gridUtils'
import { useCombatStore } from '@/stores/combatStore'
import { useGameModeStore } from '@/stores/gameModeStore'

const ROTATION_Y = Math.PI / 4

function BattleScene() {
  const player = useGameModeStore((s) => s.player)
  const setup = useGameModeStore((s) => s.activeCombatSetup)

  const config = useMemo(
    () => (setup ? mapToGridConfig(setup.map) : null),
    [setup],
  )

  // ---- Init combat with the setup from game mode store ----
  useEffect(() => {
    if (!setup) return
    useCombatStore.getState().initCombat(setup, [player])
  }, [player, setup])

  const units = useCombatStore((s) => s.units)
  const activeUnitIndex = useCombatStore((s) => s.activeUnitIndex)
  const movementPath = useCombatStore((s) => s.movementPath)
  const isMoving = useCombatStore((s) => s.isMoving)
  const previewPath = useCombatStore((s) => s.previewPath)
  const setIsMoving = useCombatStore((s) => s.setIsMoving)

  const handleMoveComplete = useCallback(() => {
    setIsMoving(false)
  }, [setIsMoving])

  if (!setup || !config) return null

  return (
    <>
      <IsometricCamera />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} />

      <GridFloor map={setup.map} />

      <group rotation={[0, ROTATION_Y, 0]}>
        {units.map((unit, i) => {
          if (unit.defeated) return null
          // ---- Only animate the active unit's movement ----
          const isActive = i === activeUnitIndex
          return (
            <UnitCube
              key={unit.player.id}
              position={unit.position}
              playerClass={unit.player.playerClass}
              team={unit.team}
              config={config}
              movementPath={isActive ? movementPath : []}
              isMoving={isActive && isMoving}
              onMoveComplete={isActive ? handleMoveComplete : undefined}
            />
          )
        })}
        <PathPreview path={previewPath} config={config} />
      </group>
    </>
  )
}

export default BattleScene
