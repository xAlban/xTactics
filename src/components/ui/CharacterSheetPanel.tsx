import { useGameModeStore } from '@/stores/gameModeStore'
import type { StatKey } from '@/types/player'

// ---- Labels for display ----
const STAT_LABELS: Record<StatKey, string> = {
  health: 'Health',
  power: 'Power',
  intelligence: 'Intelligence',
  agility: 'Agility',
  luck: 'Luck',
}

export default function CharacterSheetPanel() {
  const player = useGameModeStore((s) => s.player)

  return (
    <div className="flex h-full w-full flex-col gap-2 p-3 pt-6">
      <span className="text-xs font-bold tracking-wider text-white/60 uppercase">
        Character Sheet
      </span>

      {/* ---- Identity ---- */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-white">
          {player.name}
        </span>
        <span className="text-xs capitalize text-white/60">
          {player.playerClass} · Lv.
          {player.levelProgress.level}
        </span>
        <span className="text-xs text-white/40">
          XP: {player.levelProgress.currentXp} /{' '}
          {player.levelProgress.xpToNextLevel}
        </span>
      </div>

      {/* ---- Base points ---- */}
      <div className="flex gap-3 text-xs text-white/50">
        <span>AP: {player.baseAp}</span>
        <span>MP: {player.baseMp}</span>
      </div>

      {/* ---- Bonus stats ---- */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold text-white/50">Stats</span>
        {(Object.keys(STAT_LABELS) as StatKey[]).map((key) => (
          <div
            key={key}
            className="flex justify-between text-xs text-white/60"
          >
            <span>{STAT_LABELS[key]}</span>
            <span>{player.bonusStats[key]}</span>
          </div>
        ))}
      </div>

      {/* ---- Equipment ---- */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold text-white/50">
          Equipment
        </span>
        {Object.entries(player.equipment).map(([slot, item]) => (
          <div
            key={slot}
            className="flex justify-between text-xs text-white/60"
          >
            <span className="capitalize">{slot}</span>
            <span className="text-white/40">
              {item ? item.name : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
