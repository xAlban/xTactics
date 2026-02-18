import { useMemo } from 'react'
import { useGameModeStore } from '@/stores/gameModeStore'
import { useZoneStore } from '@/stores/zoneStore'

// ---- SVG padding in pixels ----
const PADDING = 8

export default function MapPanel() {
  const mode = useGameModeStore((s) => s.mode)
  const playerPosition = useGameModeStore((s) => s.playerPosition)
  const currentZone = useZoneStore((s) => s.getCurrentZone())

  // ---- Compute SVG scale to fit zone in panel ----
  const viewBox = useMemo(() => {
    const halfW = currentZone.width / 2
    const halfH = currentZone.height / 2
    return {
      minX: -halfW,
      minZ: -halfH,
      width: currentZone.width,
      height: currentZone.height,
    }
  }, [currentZone])

  if (mode === 'combat') {
    return (
      <div className="flex h-full w-full flex-col p-2">
        <span className="text-xs font-bold tracking-wider text-white/60 uppercase">
          Map
        </span>
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm text-white/40">Combat</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col p-2">
      <span className="text-xs font-bold tracking-wider text-white/60 uppercase">
        {currentZone.name}
      </span>
      <div className="flex flex-1 items-center justify-center">
        <svg
          viewBox={`${viewBox.minX - PADDING} ${viewBox.minZ - PADDING} ${viewBox.width + PADDING * 2} ${viewBox.height + PADDING * 2}`}
          className="h-full w-full"
          style={{ maxHeight: '100%', maxWidth: '100%' }}
        >
          {/* ---- Zone ground rectangle ---- */}
          <rect
            x={viewBox.minX}
            y={viewBox.minZ}
            width={viewBox.width}
            height={viewBox.height}
            fill={
              currentZone.groundType === 'grass'
                ? '#2d5a1e'
                : '#4a4040'
            }
            stroke="#ffffff"
            strokeOpacity={0.3}
            strokeWidth={0.3}
          />

          {/* ---- Zone objects ---- */}
          {currentZone.objects.map((obj) => {
            switch (obj.type) {
              case 'decoration':
                return (
                  <rect
                    key={obj.id}
                    x={obj.position.x - obj.size.x}
                    y={obj.position.z - obj.size.z}
                    width={obj.size.x * 2}
                    height={obj.size.z * 2}
                    fill="#8b7355"
                    opacity={0.8}
                  />
                )
              case 'combatPortal':
                return (
                  <circle
                    key={obj.id}
                    cx={obj.position.x}
                    cy={obj.position.z}
                    r={1}
                    fill="#e74c3c"
                    opacity={0.8}
                  />
                )
              case 'zonePortal':
                return (
                  <circle
                    key={obj.id}
                    cx={obj.position.x}
                    cy={obj.position.z}
                    r={1}
                    fill="#3498db"
                    opacity={0.8}
                  />
                )
              default:
                return null
            }
          })}

          {/* ---- Player dot ---- */}
          <circle
            cx={playerPosition.x}
            cy={playerPosition.z}
            r={0.8}
            fill="#2ecc71"
          />
        </svg>
      </div>
    </div>
  )
}
