import { useEffect, useMemo, useCallback } from 'react'
import IsometricCamera from '@/game/camera/IsometricCamera'
import GridFloor from '@/game/map/GridFloor'
import UnitCube from '@/game/units/UnitCube'
import PathPreview from '@/game/combat/PathPreview'
import { ARENA_SMALL } from '@/game/map/combatMaps'
import { createPlayer } from '@/game/units/playerFactory'
import { generateGridTiles, mapToGridConfig } from '@/game/map/gridUtils'
import { useCombatStore } from '@/stores/combatStore'

const ROTATION_Y = Math.PI / 4

function BattleScene() {
  const config = useMemo(() => mapToGridConfig(ARENA_SMALL), [])

  // ---- Init combat with a test knight on mount ----
  useEffect(() => {
    const player = createPlayer('player1', 'xAlban', 'bomberman')
    const tiles = generateGridTiles(ARENA_SMALL)
    useCombatStore.getState().initCombat([player], [{ col: 3, row: 4 }], tiles)
  }, [])

  const units = useCombatStore((s) => s.units)
  const movementPath = useCombatStore((s) => s.movementPath)
  const isMoving = useCombatStore((s) => s.isMoving)
  const previewPath = useCombatStore((s) => s.previewPath)
  const setIsMoving = useCombatStore((s) => s.setIsMoving)

  const handleMoveComplete = useCallback(() => {
    setIsMoving(false)
  }, [setIsMoving])

  return (
    <>
      <IsometricCamera />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} />

      <GridFloor map={ARENA_SMALL} />

      <group rotation={[0, ROTATION_Y, 0]}>
        {units.map((unit) => (
          <UnitCube
            key={unit.player.id}
            position={unit.position}
            playerClass={unit.player.playerClass}
            config={config}
            movementPath={movementPath}
            isMoving={isMoving}
            onMoveComplete={handleMoveComplete}
          />
        ))}
        <PathPreview path={previewPath} config={config} />
      </group>
    </>
  )
}

export default BattleScene
