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

// ---- Configuration for generating the grid ----
export interface GridConfig {
  size: number
  tileSize: number
  tileGap: number
}

// ---- Data for a single tile (coord + computed index) ----
export interface TileData {
  coord: TileCoord
  index: number
}
