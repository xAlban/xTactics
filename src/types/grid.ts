// ---- Grid coordinate in tile space (col, row) ----
export interface TileCoord {
  col: number
  row: number
}

// ---- World-space position for a tile ----
export interface TilePosition {
  x: number
  z: number
}

// ---- Tile type: ground is walkable, obstacle blocks movement ----
export type TileType = 'ground' | 'obstacle'

// ---- Configuration for generating the grid ----
export interface GridConfig {
  width: number
  height: number
  tileSize: number
  tileGap: number
}

// ---- Data for a single tile (coord + type + computed index) ----
export interface TileData {
  coord: TileCoord
  type: TileType
  index: number
}

// ---- Map definition using string layout for easy authoring ----
// ---- Layout chars: '.' = ground, 'X' = obstacle, ' ' = no tile ----
export interface CombatMapDefinition {
  name: string
  layout: string[]
  tileSize: number
  tileGap: number
}
