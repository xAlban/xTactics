import type { ZoneDefinition, WorldMap } from '@/types/zone'
import { PORTAL_COMBAT_SETUP } from '@/game/combat/combatSetups'

// ---- Grass zone: starting area with combat portal and zone transition ----
export const GRASS_ZONE: ZoneDefinition = {
  id: 'grass-zone',
  name: 'Green Meadow',
  groundType: 'grass',
  width: 30,
  height: 30,
  defaultSpawn: { x: 0, z: 0 },
  objects: [
    {
      id: 'grass-deco-1',
      type: 'decoration',
      position: { x: 5, z: -3 },
      size: { x: 1, z: 1 },
    },
    {
      id: 'grass-combat-portal',
      type: 'combatPortal',
      position: { x: 8, z: 8 },
      size: { x: 0.8, z: 0.8 },
      combatSetup: PORTAL_COMBAT_SETUP,
    },
    {
      id: 'grass-to-rock',
      type: 'zonePortal',
      position: { x: 13, z: 0 },
      size: { x: 0.8, z: 0.8 },
      targetZoneId: 'rock-zone',
      targetSpawnPosition: { x: -11, z: 0 },
    },
  ],
}

// ---- Rock zone: secondary area with zone transition back to grass ----
export const ROCK_ZONE: ZoneDefinition = {
  id: 'rock-zone',
  name: 'Rocky Plateau',
  groundType: 'rock',
  width: 30,
  height: 30,
  defaultSpawn: { x: 0, z: 0 },
  objects: [
    {
      id: 'rock-deco-1',
      type: 'decoration',
      position: { x: -4, z: 6 },
      size: { x: 1, z: 1 },
    },
    {
      id: 'rock-to-grass',
      type: 'zonePortal',
      position: { x: -13, z: 0 },
      size: { x: 0.8, z: 0.8 },
      targetZoneId: 'grass-zone',
      targetSpawnPosition: { x: 11, z: 0 },
    },
  ],
}

// ---- World map connecting all zones ----
export const WORLD_MAP: WorldMap = {
  zones: [GRASS_ZONE, ROCK_ZONE],
  startZoneId: 'grass-zone',
}
