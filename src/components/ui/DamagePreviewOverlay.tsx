import { useCombatStore } from '@/stores/combatStore'
import { computeDamagePreview } from '@/game/combat/spellUtils'
import type { DamageElement } from '@/types/spell'

const ELEMENT_COLORS: Record<DamageElement, string> = {
  earth: 'text-amber-400',
  fire: 'text-red-400',
  air: 'text-cyan-400',
  water: 'text-blue-400',
}

export default function DamagePreviewOverlay() {
  const selectedSpell = useCombatStore((s) => s.selectedSpell)
  const spellHoveredTarget = useCombatStore((s) => s.spellHoveredTarget)
  const spellTargetScreenPos = useCombatStore((s) => s.spellTargetScreenPos)
  const units = useCombatStore((s) => s.units)
  const activeUnitIndex = useCombatStore((s) => s.activeUnitIndex)

  if (!selectedSpell || !spellHoveredTarget || !spellTargetScreenPos)
    return null

  const activeUnit = units[activeUnitIndex]
  if (!activeUnit) return null

  // ---- Check if there is a unit on the hovered tile ----
  const targetUnit = units.find(
    (u) =>
      !u.defeated &&
      u.position.col === spellHoveredTarget.col &&
      u.position.row === spellHoveredTarget.row,
  )

  if (!targetUnit) return null

  const preview = computeDamagePreview(
    selectedSpell,
    activeUnit.player.bonusStats,
  )

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: spellTargetScreenPos.x,
        top: spellTargetScreenPos.y - 60,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="rounded border border-white/20 bg-black/80 px-3 py-2 backdrop-blur-sm">
        <div className="text-xs font-bold text-white">
          {preview.spellName} on {targetUnit.player.name}
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
    </div>
  )
}
