import IsometricCamera from '@/game/camera/IsometricCamera'

function BattleScene() {
  return (
    <>
      <IsometricCamera />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />

      {/* ---- Placeholder ground plane ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
    </>
  )
}

export default BattleScene
