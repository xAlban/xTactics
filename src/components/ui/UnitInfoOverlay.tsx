import type { CombatUnit } from '@/types/combat'

// ---- Team badge colors ----
const TEAM_COLORS = {
  player: 'bg-blue-600',
  enemy: 'bg-red-600',
}

// ---- Extracted as a named component so it can be composed in TileOverlayStack ----
export function UnitInfoCard({ unit }: { unit: CombatUnit }) {
  const hpPercent = Math.round((unit.currentHp / unit.maxHp) * 100)

  const hpBarColor =
    hpPercent > 50
      ? 'bg-green-500'
      : hpPercent > 25
        ? 'bg-yellow-500'
        : 'bg-red-500'

  return (
    <div className="rounded border border-white/20 bg-black/80 px-3 py-2 backdrop-blur-sm">
      {/* ---- Name and team badge ---- */}
      <div className="flex items-center gap-2">
        <span
          className={`rounded px-1 py-0.5 text-[10px] font-bold uppercase text-white ${TEAM_COLORS[unit.team]}`}
        >
          {unit.team}
        </span>
        <span className="text-xs font-bold text-white">
          {unit.player.name}
        </span>
      </div>

      {/* ---- HP bar ---- */}
      <div className="mt-1 h-2 w-28 overflow-hidden rounded-full bg-gray-700">
        <div
          className={`h-full ${hpBarColor} transition-all`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>
      <div className="mt-0.5 text-[10px] text-gray-300">
        HP: {unit.currentHp}/{unit.maxHp}
      </div>

      {/* ---- AP / MP ---- */}
      <div className="mt-0.5 flex gap-2 text-[10px]">
        <span className="text-amber-400">AP: {unit.currentAp}</span>
        <span className="text-blue-400">MP: {unit.currentMp}</span>
      </div>
    </div>
  )
}
