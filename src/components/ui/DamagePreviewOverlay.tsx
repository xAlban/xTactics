import type { DamageElement, SpellDamagePreview } from '@/types/spell'

const ELEMENT_COLORS: Record<DamageElement, string> = {
  earth: 'text-amber-400',
  fire: 'text-red-400',
  air: 'text-cyan-400',
  water: 'text-blue-400',
}

// ---- Extracted as a named component so it can be composed in TileOverlayStack ----
export function DamagePreviewCard({
  preview,
  targetName,
}: {
  preview: SpellDamagePreview
  targetName: string
}) {
  return (
    <div className="rounded border border-white/20 bg-black/80 px-3 py-2 backdrop-blur-sm">
      <div className="text-xs font-bold text-white">
        {preview.spellName} on {targetName}
      </div>
      {preview.damages.map((d, i) => (
        <div key={i} className={`text-xs ${ELEMENT_COLORS[d.element]}`}>
          {d.minDamage}-{d.maxDamage} {d.element}
        </div>
      ))}
      <div className="mt-0.5 border-t border-white/10 pt-0.5 text-xs font-bold text-white">
        Total: {preview.totalMinDamage}-{preview.totalMaxDamage}
      </div>
    </div>
  )
}
