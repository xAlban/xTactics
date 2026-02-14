import { useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { useGameModeStore } from '@/stores/gameModeStore'
import type { CombatSetup } from '@/types/combat'

const PORTAL_COLOR = '#e74c3c'
const PORTAL_HOVER_COLOR = '#ff6b6b'
const ROTATION_SPEED = 1.5

interface CombatPortalProps {
  position: [number, number, number]
  combatSetup: CombatSetup
}

function CombatPortal({ position, combatSetup }: CombatPortalProps) {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const enterCombat = useGameModeStore((s) => s.enterCombat)

  // ---- Slowly rotate the portal to make it noticeable ----
  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * ROTATION_SPEED
  })

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      enterCombat(combatSetup)
    },
    [enterCombat, combatSetup],
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
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <torusGeometry args={[0.6, 0.15, 16, 32]} />
      <meshStandardMaterial
        color={hovered ? PORTAL_HOVER_COLOR : PORTAL_COLOR}
        emissive={hovered ? PORTAL_HOVER_COLOR : PORTAL_COLOR}
        emissiveIntensity={hovered ? 0.8 : 0.4}
      />
    </mesh>
  )
}

export default CombatPortal
