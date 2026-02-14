import { useGameModeStore } from '@/stores/gameModeStore'

export default function CharacterInfoPanel() {
  const player = useGameModeStore((s) => s.player)

  return (
    <div className="flex h-full w-full flex-col gap-1 p-2">
      <span className="text-xs font-bold tracking-wider text-white/60 uppercase">
        Character
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-white">{player.name}</span>
        <span className="text-xs capitalize text-white/60">
          {player.playerClass} · Lv.{player.levelProgress.level}
        </span>
        <div className="mt-1 flex gap-2 text-xs text-white/50">
          <span>AP: {player.baseAp}</span>
          <span>MP: {player.baseMp}</span>
        </div>
      </div>
    </div>
  )
}
