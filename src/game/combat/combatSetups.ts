import type { CombatSetup } from '@/types/combat'
import { ARENA_SMALL } from '@/game/map/combatMaps'

// ---- Combat encounter triggered by the portal in normal mode ----
export const PORTAL_COMBAT_SETUP: CombatSetup = {
  map: ARENA_SMALL,
  playerStartPositions: [{ col: 3, row: 6 }],
  enemies: [
    { id: 'enemy1', name: 'Dummy A', position: { col: 3, row: 1 } },
    { id: 'enemy2', name: 'Dummy B', position: { col: 5, row: 3 } },
  ],
}
