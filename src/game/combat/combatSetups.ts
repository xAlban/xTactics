import type { CombatSetup } from '@/types/combat'
import { HAJE_MAP } from '@/game/map/combatMaps'

// ---- Combat encounter triggered by the portal in normal mode ----
export const PORTAL_COMBAT_SETUP: CombatSetup = {
  map: HAJE_MAP,
  playerStartPositions: [{ col: 3, row: 6 }],
  enemies: [
    { id: 'enemy1', name: 'Dummy A', position: { col: 3, row: 1 } },
    { id: 'enemy2', name: 'Dummy B', position: { col: 5, row: 3 } },
  ],
}
