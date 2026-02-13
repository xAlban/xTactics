import { OrthographicCamera, OrbitControls } from '@react-three/drei'
import { MOUSE } from 'three'

// ---- Isometric elevation: ~35.264° (arctan(1/√2)) ----
const ISOMETRIC_POLAR_ANGLE = Math.atan(Math.SQRT2)
const DISTANCE = 10

const INITIAL_X = DISTANCE * Math.cos(Math.PI / 4)
const INITIAL_Y = DISTANCE * Math.sin(Math.atan(Math.SQRT2))
const INITIAL_Z = DISTANCE * Math.sin(Math.PI / 4)

function IsometricCamera() {
  return (
    <>
      <OrthographicCamera
        makeDefault
        zoom={50}
        position={[INITIAL_X, INITIAL_Y, INITIAL_Z]}
        near={0.1}
        far={1000}
      />
      <OrbitControls
        makeDefault
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        // ---- Zoom bounds for orthographic camera ----
        minZoom={20}
        maxZoom={120}
        // ---- Only middle mouse button triggers rotation ----
        mouseButtons={{
          LEFT: -1 as MOUSE,
          MIDDLE: MOUSE.ROTATE,
          RIGHT: -1 as MOUSE,
        }}
        // ---- Lock polar angle to keep the isometric tilt ----
        minPolarAngle={ISOMETRIC_POLAR_ANGLE}
        maxPolarAngle={ISOMETRIC_POLAR_ANGLE}
        target={[0, 0, 0]}
      />
    </>
  )
}

export default IsometricCamera
