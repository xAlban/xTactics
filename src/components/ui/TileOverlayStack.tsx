import { useCombatStore } from '@/stores/combatStore'
import { computeDamagePreview } from '@/game/combat/spellUtils'
import { getEffectiveStats } from '@/game/units/playerFactory'
import { UnitInfoCard } from './UnitInfoOverlay'
import { DamagePreviewCard } from './DamagePreviewOverlay'

// ---- Stacks unit info and damage preview vertically above a hovered tile ----
export default function TileOverlayStack() {
  const hoveredUnit = useCombatStore((s) => s.hoveredUnit)
  const hoveredUnitScreenPos = useCombatStore((s) => s.hoveredUnitScreenPos)
  const selectedSpell = useCombatStore((s) => s.selectedSpell)
  const spellHoveredTarget = useCombatStore((s) => s.spellHoveredTarget)
  const units = useCombatStore((s) => s.units)
  const activeUnitIndex = useCombatStore((s) => s.activeUnitIndex)

  // ---- Use unit screen pos as the anchor point ----
  const screenPos = hoveredUnitScreenPos
  if (!screenPos || !hoveredUnit) return null

  // ---- Check if damage preview should also be shown ----
  const activeUnit = units[activeUnitIndex]
  let damagePreview = null

  if (selectedSpell && spellHoveredTarget && activeUnit) {
    const targetUnit = units.find(
      (u) =>
        !u.defeated &&
        u.position.col === spellHoveredTarget.col &&
        u.position.row === spellHoveredTarget.row,
    )

    if (targetUnit) {
      // ---- Use effective stats (base + equipment bonuses) for preview ----
      const preview = computeDamagePreview(
        selectedSpell,
        getEffectiveStats(activeUnit.player),
      )
      damagePreview = (
        <DamagePreviewCard
          preview={preview}
          targetName={targetUnit.player.name}
        />
      )
    }
  }

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: screenPos.x,
        top: screenPos.y - 60,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {/* ---- Stack panels bottom-up: unit info first, damage preview above ---- */}
      <div className="flex flex-col items-center gap-1">
        {damagePreview}
        <UnitInfoCard unit={hoveredUnit} />
      </div>
    </div>
  )
}
