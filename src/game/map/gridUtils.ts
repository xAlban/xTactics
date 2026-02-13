import type {
  CombatMapDefinition,
  GridConfig,
  TileCoord,
  TileData,
  TilePosition,
} from '@/types/grid'

// ---- Default 8x8 all-ground map ----
export const DEFAULT_MAP: CombatMapDefinition = {
  name: 'Default',
  layout: [
    '........',
    '........',
    '........',
    '........',
    '........',
    '........',
    '........',
    '........',
  ],
  tileSize: 1.2,
  tileGap: 0.06,
}

// ---- Derive GridConfig from a map definition ----
export function mapToGridConfig(map: CombatMapDefinition): GridConfig {
  return {
    width: Math.max(...map.layout.map((row) => row.length)),
    height: map.layout.length,
    tileSize: map.tileSize,
    tileGap: map.tileGap,
  }
}

// ---- Parse layout strings into tile data, skipping spaces ----
export function generateGridTiles(map: CombatMapDefinition): TileData[] {
  const tiles: TileData[] = []
  let index = 0

  for (let row = 0; row < map.layout.length; row++) {
    const line = map.layout[row] ?? ''
    for (let col = 0; col < line.length; col++) {
      const char = line[col]!
      if (char === ' ') continue

      tiles.push({
        coord: { col, row },
        type: char === 'X' ? 'obstacle' : 'ground',
        index,
      })
      index++
    }
  }

  return tiles
}

// ---- Convert grid coord to world position (centered on origin) ----
export function gridToWorld(
  coord: TileCoord,
  config: GridConfig,
): TilePosition {
  const step = config.tileSize + config.tileGap
  const offsetX = ((config.width - 1) * step) / 2
  const offsetZ = ((config.height - 1) * step) / 2

  return {
    x: coord.col * step - offsetX,
    z: coord.row * step - offsetZ,
  }
}
