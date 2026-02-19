import { useEffect, useRef } from 'react'
import { useCharacterStore } from '@/stores/characterStore'
import { useZoneStore } from '@/stores/zoneStore'
import { useGameModeStore } from '@/stores/gameModeStore'

// ---- Debounce delay to batch rapid changes (ms) ----
const SAVE_DEBOUNCE = 500

export default function AutoSave() {
  const saveActiveCharacter = useCharacterStore((s) => s.saveActiveCharacter)
  const player = useGameModeStore((s) => s.player)
  const playerPosition = useGameModeStore((s) => s.playerPosition)
  const currentZoneId = useZoneStore((s) => s.currentZoneId)
  const isFirstRender = useRef(true)

  // ---- Save whenever player data, position, or zone changes ----
  useEffect(() => {
    // ---- Skip the initial render to avoid saving on mount ----
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timeout = setTimeout(saveActiveCharacter, SAVE_DEBOUNCE)
    return () => clearTimeout(timeout)
  }, [player, playerPosition, currentZoneId, saveActiveCharacter])

  return null
}
