import type { CombatSetup } from '@/types/combat'

// ---- Ground visual style for a zone ----
export type GroundType = 'grass' | 'rock'

// ---- An object placed in a zone (decoration, portal, etc.) ----
export interface ZoneObject {
  id: string
  type: 'decoration' | 'combatPortal' | 'zonePortal'
  position: { x: number; y?: number; z: number }
  // ---- Bounding box half-extents for collision ----
  size: { x: number; z: number }
  // ---- Zone portal destination ----
  targetZoneId?: string
  targetSpawnPosition?: { x: number; z: number }
  // ---- Combat portal encounter ----
  combatSetup?: CombatSetup
  // ---- Decoration model from decorationRegistry ----
  modelId?: string
  // ---- Override default scale from registry ----
  scale?: number
  // ---- Y-axis rotation in radians ----
  rotationY?: number
  // ---- When true, decoration has no collision (walkable) ----
  noCollision?: boolean
  // ---- When true, decoration is a walkable surface (player can walk on top) ----
  walkable?: boolean
}

// ---- Full definition of a world zone ----
export interface ZoneDefinition {
  id: string
  name: string
  groundType: GroundType
  width: number
  height: number
  defaultSpawn: { x: number; z: number }
  objects: ZoneObject[]
}

// ---- World map linking all zones together ----
export interface WorldMap {
  zones: ZoneDefinition[]
  startZoneId: string
}
