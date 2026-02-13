import { OrthographicCamera, OrbitControls } from '@react-three/drei'
import { MOUSE } from 'three'

// ---- Isometric elevation: ~35.264° (arctan(1/√2)) ----
const ISOMETRIC_POLAR_ANGLE = Math.atan(Math.SQRT2)
const DISTANCE = 100

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
        near={-1000}
        far={2000}
      />
      <OrbitControls
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
        // ---- Lock polar angle to keep the isometric tilt ----
        minPolarAngle={ISOMETRIC_POLAR_ANGLE}
        maxPolarAngle={ISOMETRIC_POLAR_ANGLE}
        target={[0, 0, 0]}
      />
    </>
  )
}

export default IsometricCamera
