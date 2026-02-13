import type {
  GridConfig,
  TileCoord,
  TileData,
  TilePosition,
} from '@/types/grid'

export const DEFAULT_GRID_CONFIG: GridConfig = {
  size: 8,
  tileSize: 1.2,
  tileGap: 0.06,
}

// ---- Generate flat array of tile data for an NxN grid ----
export function generateGridTiles(
  config: GridConfig = DEFAULT_GRID_CONFIG,
): TileData[] {
  const tiles: TileData[] = []
  let index = 0

  for (let row = 0; row < config.size; row++) {
    for (let col = 0; col < config.size; col++) {
      tiles.push({ coord: { col, row }, index })
      index++
    }
  }

  return tiles
}

// ---- Convert grid coord to world position (centered on origin) ----
export function gridToWorld(
  coord: TileCoord,
  config: GridConfig = DEFAULT_GRID_CONFIG,
): TilePosition {
  const step = config.tileSize + config.tileGap
  const offset = ((config.size - 1) * step) / 2

  return {
    x: coord.col * step - offset,
    z: coord.row * step - offset,
  }
}
