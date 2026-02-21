import { useMemo } from 'react'
import { useGameModeStore } from '@/stores/gameModeStore'
import { useZoneStore } from '@/stores/zoneStore'
import { DECORATION_MODELS } from '@/game/world/decorationRegistry'

// ---- SVG padding in pixels ----
const PADDING = 8

// ---- Determine minimap color for a decoration based on its model ----
function getDecorationColor(modelId?: string): string {
  if (!modelId) return '#8b7355'
  if (modelId.includes('tree')) return '#1a8a2e'
  if (modelId.includes('bush')) return '#2d7a3e'
  if (modelId.includes('flower')) return '#d4a'
  if (modelId.includes('grass')) return '#3a9a3a'
  if (modelId.includes('fern') || modelId.includes('plant')) return '#2a7a2a'
  if (modelId.includes('rock') && !modelId.includes('path')) return '#6a6a6a'
  if (modelId.includes('path')) return '#b89a6a'
  if (modelId.includes('mushroom')) return '#c0823a'
  return '#8b7355'
}

// ---- Determine minimap size for a decoration ----
function getDecorationRadius(modelId?: string): number {
  if (!modelId) return 1
  if (modelId.includes('tree')) return 2.5
  if (modelId.includes('bush')) return 1.8
  if (modelId.includes('rock') && !modelId.includes('path')) return 1.5
  if (modelId.includes('path')) return 1.5
  return 0.8
}

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
            fill={currentZone.groundType === 'grass' ? '#2d5a1e' : '#4a4040'}
            stroke="#ffffff"
            strokeOpacity={0.3}
            strokeWidth={0.3}
          />

          {/* ---- Zone objects ---- */}
          {currentZone.objects.map((obj) => {
            switch (obj.type) {
              case 'decoration': {
                const color = getDecorationColor(obj.modelId)
                const hasCollision =
                  obj.modelId &&
                  DECORATION_MODELS[obj.modelId]?.hasCollision &&
                  !obj.noCollision
                const r = getDecorationRadius(obj.modelId)

                return (
                  <circle
                    key={obj.id}
                    cx={obj.position.x}
                    cy={obj.position.z}
                    r={r}
                    fill={color}
                    opacity={hasCollision ? 0.8 : 0.5}
                  />
                )
              }
              case 'combatPortal':
                return (
                  <circle
                    key={obj.id}
                    cx={obj.position.x}
                    cy={obj.position.z}
                    r={2}
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
                    r={2}
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
            r={2}
            fill="#2ecc71"
          />
        </svg>
      </div>
    </div>
  )
}
