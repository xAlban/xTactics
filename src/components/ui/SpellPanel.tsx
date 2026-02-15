import { useCombatStore } from '@/stores/combatStore'
import { DEFAULT_SPELLS } from '@/game/combat/spellDefinitions'
import type { SpellDefinition } from '@/types/spell'
import type { DamageElement } from '@/types/spell'

// ---- Element color mapping for visual feedback ----
const ELEMENT_COLORS: Record<DamageElement, string> = {
  earth: 'text-amber-400',
  fire: 'text-red-400',
  air: 'text-cyan-400',
  water: 'text-blue-400',
}

export default function SpellPanel() {
  const activeUnit = useCombatStore((s) => s.units[s.activeUnitIndex])
  const selectedSpell = useCombatStore((s) => s.selectedSpell)
  const selectSpell = useCombatStore((s) => s.selectSpell)
  const cancelSpell = useCombatStore((s) => s.cancelSpell)
  const combatStatus = useCombatStore((s) => s.combatStatus)

  // ---- Only show spells for player units in active combat ----
  const isPlayerTurn = activeUnit?.team === 'player'
  const currentAp = activeUnit?.currentAp ?? 0

  const handleSpellClick = (spell: SpellDefinition) => {
    if (selectedSpell?.id === spell.id) {
      cancelSpell()
    } else {
      selectSpell(spell)
    }
  }

  return (
    <div className="flex h-full w-full flex-col gap-2 p-3 pt-6">
      <span className="text-xs font-bold tracking-wider text-white/60 uppercase">
        Spells
      </span>

      {combatStatus !== 'active' || !isPlayerTurn ? (
        <span className="text-xs text-white/40">Not your turn</span>
      ) : (
        <div className="flex flex-col gap-1">
          {DEFAULT_SPELLS.map((spell) => {
            const canAfford = currentAp >= spell.apCost
            const isSelected = selectedSpell?.id === spell.id

            return (
              <button
                key={spell.id}
                onClick={(e) => {
                  e.stopPropagation()
                  if (canAfford) handleSpellClick(spell)
                }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={!canAfford}
                className={`rounded border px-2 py-1.5 text-left text-xs ${
                  isSelected
                    ? 'border-blue-400 bg-blue-400/20 text-white'
                    : canAfford
                      ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                      : 'cursor-not-allowed border-white/5 bg-white/5 text-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{spell.name}</span>
                  <span className="text-white/40">{spell.apCost} AP</span>
                </div>
                <div className="mt-0.5 text-white/40">
                  Range: {spell.minRange}-{spell.maxRange} ·{' '}
                  {spell.damages.map((d, i) => (
                    <span key={i} className={ELEMENT_COLORS[d.element]}>
                      {d.minDamage}-{d.maxDamage} {d.element}
                      {i < spell.damages.length - 1 ? ' + ' : ''}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
