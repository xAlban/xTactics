import { OrthographicCamera } from '@react-three/drei'

function IsometricCamera() {
  // ---- Classic isometric angle: ~35.264 degrees elevation, 45 degrees azimuth ----
  const distance = 10
  const x = distance * Math.cos(Math.PI / 4)
  const y = distance * Math.sin(Math.atan(Math.SQRT2))
  const z = distance * Math.sin(Math.PI / 4)

  return (
    <OrthographicCamera
      makeDefault
      zoom={50}
      position={[x, y, z]}
      near={0.1}
      far={1000}
    />
  )
}

export default IsometricCamera
