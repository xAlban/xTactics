import { useEffect, useMemo, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import IsometricCamera from '@/game/camera/IsometricCamera'
import GridFloor from '@/game/map/GridFloor'
import UnitCube from '@/game/units/UnitCube'
import PathPreview from '@/game/combat/PathPreview'
import FloatingNumberProjector from '@/game/combat/FloatingNumberProjector'
import { mapToGridConfig, gridToWorld } from '@/game/map/gridUtils'
import { useCombatStore } from '@/stores/combatStore'
import { useGameModeStore } from '@/stores/gameModeStore'
import type { GridConfig } from '@/types/grid'

const ROTATION_Y = Math.PI / 4

// ---- Projects spell target world position to screen coords each frame ----
function SpellTargetProjector({ config }: { config: GridConfig }) {
  const { camera, size } = useThree()
  const spellHoveredTarget = useCombatStore((s) => s.spellHoveredTarget)
  const setSpellTargetScreenPos = useCombatStore(
    (s) => s.setSpellTargetScreenPos,
  )

  useFrame(() => {
    if (!spellHoveredTarget) {
      setSpellTargetScreenPos(null)
      return
    }

    const worldPos = gridToWorld(spellHoveredTarget, config)
    const vec = new Vector3(worldPos.x, 0.5, worldPos.z)
    // ---- Apply the same rotation as the grid group ----
    vec.applyAxisAngle(new Vector3(0, 1, 0), ROTATION_Y)
    vec.project(camera)

    const x = (vec.x * 0.5 + 0.5) * size.width
    const y = (-vec.y * 0.5 + 0.5) * size.height

    setSpellTargetScreenPos({ x, y })
  })

  return null
}

// ---- Projects hovered unit world position to screen coords each frame ----
function UnitHoverProjector({ config }: { config: GridConfig }) {
  const { camera, size } = useThree()
  const hoveredUnit = useCombatStore((s) => s.hoveredUnit)
  const setHoveredUnitScreenPos = useCombatStore(
    (s) => s.setHoveredUnitScreenPos,
  )

  useFrame(() => {
    if (!hoveredUnit) {
      setHoveredUnitScreenPos(null)
      return
    }

    const worldPos = gridToWorld(hoveredUnit.position, config)
    const vec = new Vector3(worldPos.x, 0.5, worldPos.z)
    vec.applyAxisAngle(new Vector3(0, 1, 0), ROTATION_Y)
    vec.project(camera)

    const x = (vec.x * 0.5 + 0.5) * size.width
    const y = (-vec.y * 0.5 + 0.5) * size.height

    setHoveredUnitScreenPos({ x, y })
  })

  return null
}

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

      <SpellTargetProjector config={config} />
      <UnitHoverProjector config={config} />
      <FloatingNumberProjector config={config} />
    </>
  )
}

export default BattleScene
