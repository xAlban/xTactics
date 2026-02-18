import { useCallback, useMemo } from 'react'
import { ShaderMaterial, Color } from 'three'
import type { Intersection } from 'three'
import type { GroundType } from '@/types/zone'
import { useGameModeStore } from '@/stores/gameModeStore'

// ---- Ground color palettes per ground type ----
const GROUND_COLORS: Record<
  GroundType,
  { base: string; line: string }
> = {
  grass: { base: '#2d5a1e', line: '#3a7a2a' },
  rock: { base: '#4a4040', line: '#5a5050' },
}

interface ZoneGroundProps {
  width: number
  height: number
  groundType: GroundType
}

function ZoneGround({ width, height, groundType }: ZoneGroundProps) {
  const setTargetPosition = useGameModeStore((s) => s.setTargetPosition)

  const halfW = width / 2
  const halfH = height / 2

  // ---- Click handler: clamp to zone bounds and move player ----
  const handleClick = useCallback(
    (e: { stopPropagation: () => void; intersections: Intersection[] }) => {
      e.stopPropagation()
      const hit = e.intersections[0]
      if (!hit) return

      // ---- Clamp click to zone bounds ----
      const x = Math.max(-halfW, Math.min(halfW, hit.point.x))
      const z = Math.max(-halfH, Math.min(halfH, hit.point.z))
      setTargetPosition({ x, z })
    },
    [setTargetPosition, halfW, halfH],
  )

  const colors = GROUND_COLORS[groundType]

  // ---- Shader material with subtle grid pattern ----
  const gridMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uBaseColor: { value: new Color(colors.base) },
          uLineColor: { value: new Color(colors.line) },
          uGridSize: { value: 1.2 },
          uLineWidth: { value: 0.03 },
        },
        vertexShader: `
          varying vec2 vWorldPos;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPosition.xz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uBaseColor;
          uniform vec3 uLineColor;
          uniform float uGridSize;
          uniform float uLineWidth;
          varying vec2 vWorldPos;
          void main() {
            vec2 grid = abs(fract(vWorldPos / uGridSize - 0.5) - 0.5);
            float line = step(min(grid.x, grid.y), uLineWidth / uGridSize);
            gl_FragColor = vec4(mix(uBaseColor, uLineColor, line), 1.0);
          }
        `,
      }),
    [colors],
  )

  return (
    <>
      {/* ---- Bounded zone ground with grid pattern ---- */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        material={gridMaterial}
        onClick={handleClick}
      >
        <planeGeometry args={[width, height]} />
      </mesh>

      {/* ---- Subtle edge border lines ---- */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={
              new Float32Array([
                -halfW, 0.01, -halfH,
                halfW, 0.01, -halfH,
                halfW, 0.01, -halfH,
                halfW, 0.01, halfH,
                halfW, 0.01, halfH,
                -halfW, 0.01, halfH,
                -halfW, 0.01, halfH,
                -halfW, 0.01, -halfH,
              ])
            }
            count={8}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" opacity={0.2} transparent />
      </lineSegments>
    </>
  )
}

export default ZoneGround
