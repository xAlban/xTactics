import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import { MOUSE, type OrthographicCamera as ThreeOrthographicCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useGameModeStore } from '@/stores/gameModeStore'

// ---- Isometric elevation: ~35.264° (arctan(1/√2)) ----
const DISTANCE = 100
const INITIAL_X = DISTANCE * Math.cos(Math.PI / 4)
const INITIAL_Y = DISTANCE * Math.sin(Math.atan(Math.SQRT2))
const INITIAL_Z = DISTANCE * Math.sin(Math.PI / 4)

// ---- Smoothing factor for camera follow ----
const LERP_FACTOR = 0.1

function FollowCamera() {
  const cameraRef = useRef<ThreeOrthographicCamera>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const playerPosition = useGameModeStore((s) => s.playerPosition)

  useFrame(() => {
    if (!cameraRef.current) return

    // ---- Target position is player's position + isometric offset ----
    const targetX = playerPosition.x + INITIAL_X
    const targetY = INITIAL_Y // Height stays constant relative to player Y=0
    const targetZ = playerPosition.z + INITIAL_Z

    // ---- Smoothly interpolate camera position ----
    cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * LERP_FACTOR
    cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * LERP_FACTOR
    cameraRef.current.position.z += (targetZ - cameraRef.current.position.z) * LERP_FACTOR

    // ---- Update OrbitControls target to follow player smoothly ----
    if (controlsRef.current) {
      const currentTarget = controlsRef.current.target
      currentTarget.x += (playerPosition.x - currentTarget.x) * LERP_FACTOR
      currentTarget.z += (playerPosition.z - currentTarget.z) * LERP_FACTOR
      controlsRef.current.update()
    } else {
      // ---- Fallback if no controls ----
      cameraRef.current.lookAt(playerPosition.x, 0, playerPosition.z)
    }
  })

  return (
    <>
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        zoom={50}
        position={[INITIAL_X, INITIAL_Y, INITIAL_Z]}
        near={-1000}
        far={2000}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        // ---- Zoom bounds for orthographic camera ----
        minZoom={20}
        maxZoom={120}
        // ---- Only middle mouse button triggers rotation ----
        mouseButtons={{
          LEFT: -1 as MOUSE,
          MIDDLE: MOUSE.ROTATE,
          RIGHT: MOUSE.PAN,
        }}
        target={[playerPosition.x, 0, playerPosition.z]}
      />
    </>

  )
}

export default FollowCamera
