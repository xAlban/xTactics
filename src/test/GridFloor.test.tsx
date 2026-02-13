import { describe, it, expect } from 'vitest'
import {
  generateGridTiles,
  gridToWorld,
  DEFAULT_GRID_CONFIG,
} from '@/game/map/gridUtils'

describe('generateGridTiles', () => {
  it('generates size*size tiles for default config', () => {
    const tiles = generateGridTiles()
    expect(tiles).toHaveLength(
      DEFAULT_GRID_CONFIG.size * DEFAULT_GRID_CONFIG.size,
    )
  })

  it('generates correct count for custom size', () => {
    const tiles = generateGridTiles({ size: 4, tileSize: 1, tileGap: 0.1 })
    expect(tiles).toHaveLength(16)
  })

  it('assigns sequential indices', () => {
    const tiles = generateGridTiles({ size: 3, tileSize: 1, tileGap: 0 })
    const indices = tiles.map((t) => t.index)
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('covers all col/row combinations', () => {
    const tiles = generateGridTiles({ size: 2, tileSize: 1, tileGap: 0 })
    const coords = tiles.map((t) => [t.coord.col, t.coord.row])
    expect(coords).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
  })
})

describe('gridToWorld', () => {
  it('centers the grid on origin', () => {
    // ---- For a 2x2 grid with tileSize=1, gap=0, center tile offset = 0.5 ----
    const config = { size: 2, tileSize: 1, tileGap: 0 }
    const topLeft = gridToWorld({ col: 0, row: 0 }, config)
    const bottomRight = gridToWorld({ col: 1, row: 1 }, config)

    expect(topLeft.x).toBeCloseTo(-0.5)
    expect(topLeft.z).toBeCloseTo(-0.5)
    expect(bottomRight.x).toBeCloseTo(0.5)
    expect(bottomRight.z).toBeCloseTo(0.5)
  })

  it('accounts for gap in spacing', () => {
    const config = { size: 2, tileSize: 1, tileGap: 0.1 }
    const a = gridToWorld({ col: 0, row: 0 }, config)
    const b = gridToWorld({ col: 1, row: 0 }, config)

    // ---- Distance between adjacent tiles = tileSize + tileGap ----
    expect(b.x - a.x).toBeCloseTo(1.1)
  })

  it('returns symmetric positions for center of default grid', () => {
    const first = gridToWorld({ col: 0, row: 0 })
    const last = gridToWorld({
      col: DEFAULT_GRID_CONFIG.size - 1,
      row: DEFAULT_GRID_CONFIG.size - 1,
    })

    // ---- First and last tiles should be equidistant from origin ----
    expect(first.x).toBeCloseTo(-last.x)
    expect(first.z).toBeCloseTo(-last.z)
  })
})
