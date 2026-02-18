import { useRef, useState, useCallback, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useGameModeStore } from '@/stores/gameModeStore'
import type { CombatSetup } from '@/types/combat'
import { PORTAL_MODEL } from '@/game/models/modelRegistry'
import ModelRenderer from '@/game/models/GLTFModel'
import ModelErrorBoundary from '@/game/models/ModelErrorBoundary'

const PORTAL_COLOR = '#e74c3c'
const PORTAL_HOVER_COLOR = '#ff6b6b'
const ROTATION_SPEED = 1.5

interface CombatPortalProps {
  position: [number, number, number]
  combatSetup: CombatSetup
}

// ---- Fallback torus shown when portal model is missing or loading ----
function TorusFallback({ hovered }: { hovered: boolean }) {
  return (
    <mesh>
      <torusGeometry args={[0.6, 0.15, 16, 32]} />
      <meshStandardMaterial
        color={hovered ? PORTAL_HOVER_COLOR : PORTAL_COLOR}
        emissive={hovered ? PORTAL_HOVER_COLOR : PORTAL_COLOR}
        emissiveIntensity={hovered ? 0.8 : 0.4}
      />
    </mesh>
  )
}

function CombatPortal({ position, combatSetup }: CombatPortalProps) {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const enterCombat = useGameModeStore((s) => s.enterCombat)
  const setTargetWithAction = useGameModeStore(
    (s) => s.setTargetWithAction,
  )

  // ---- Slowly rotate the portal to make it noticeable ----
  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * ROTATION_SPEED
  })

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      // ---- Walk to portal position, then enter combat on arrival ----
      setTargetWithAction({ x: position[0], z: position[2] }, () =>
        enterCombat(combatSetup),
      )
    },
    [setTargetWithAction, enterCombat, combatSetup, position],
  )

  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      setHovered(true)
      document.body.style.cursor = 'pointer'
    },
    [],
  )

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    document.body.style.cursor = 'default'
  }, [])

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* ---- Invisible collision mesh for raycasting ---- */}
      <mesh visible={false}>
        <sphereGeometry args={[0.8, 8, 8]} />
      </mesh>
      <ModelErrorBoundary fallback={<TorusFallback hovered={hovered} />}>
        <Suspense fallback={<TorusFallback hovered={hovered} />}>
          <ModelRenderer config={PORTAL_MODEL} />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  )
}

export default CombatPortal
