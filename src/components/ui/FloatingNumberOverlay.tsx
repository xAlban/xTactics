import { useFloatingNumberStore } from '@/stores/floatingNumberStore'
import type { FloatingNumberType } from '@/stores/floatingNumberStore'

// ---- Color and label per number type ----
const TYPE_STYLES: Record<
  FloatingNumberType,
  { color: string; prefix: string; suffix: string }
> = {
  damage: { color: 'text-red-400', prefix: '-', suffix: '' },
  ap: { color: 'text-amber-400', prefix: '-', suffix: ' AP' },
  mp: { color: 'text-blue-400', prefix: '-', suffix: ' MP' },
}

export default function FloatingNumberOverlay() {
  const projected = useFloatingNumberStore((s) => s.projected)

  if (projected.length === 0) return null

  return (
    <>
      {projected.map((n) => {
        const style = TYPE_STYLES[n.type]
        return (
          <div
            key={n.id}
            className={`pointer-events-none absolute z-50 font-bold ${style.color}`}
            style={{
              left: n.x,
              top: n.y,
              transform: 'translate(-50%, -50%)',
              opacity: n.opacity,
              fontSize: n.type === 'damage' ? '1.25rem' : '0.875rem',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            }}
          >
            {style.prefix}
            {n.value}
            {style.suffix}
          </div>
        )
      })}
    </>
  )
}
