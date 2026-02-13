import { describe, it, expect } from 'vitest'
import {
  generateGridTiles,
  gridToWorld,
  mapToGridConfig,
  DEFAULT_MAP,
} from '@/game/map/gridUtils'
import type { CombatMapDefinition } from '@/types/grid'

describe('mapToGridConfig', () => {
  it('derives width from the longest row', () => {
    const map: CombatMapDefinition = {
      name: 'test',
      layout: ['...', '....', '..'],
      tileSize: 1,
      tileGap: 0,
    }
    const config = mapToGridConfig(map)
    expect(config.width).toBe(4)
    expect(config.height).toBe(3)
  })

  it('passes through tileSize and tileGap', () => {
    const config = mapToGridConfig(DEFAULT_MAP)
    expect(config.tileSize).toBe(1.2)
    expect(config.tileGap).toBe(0.06)
  })

  it('returns 8x8 for default map', () => {
    const config = mapToGridConfig(DEFAULT_MAP)
    expect(config.width).toBe(8)
    expect(config.height).toBe(8)
  })
})

describe('generateGridTiles', () => {
  it('generates 64 ground tiles for default 8x8 map', () => {
    const tiles = generateGridTiles(DEFAULT_MAP)
    expect(tiles).toHaveLength(64)
    expect(tiles.every((t) => t.type === 'ground')).toBe(true)
  })

  it('parses obstacles from X chars', () => {
    const map: CombatMapDefinition = {
      name: 'test',
      layout: ['X.', '.X'],
      tileSize: 1,
      tileGap: 0,
    }
    const tiles = generateGridTiles(map)
    expect(tiles).toHaveLength(4)
    expect(tiles[0]!.type).toBe('obstacle')
    expect(tiles[1]!.type).toBe('ground')
    expect(tiles[2]!.type).toBe('ground')
    expect(tiles[3]!.type).toBe('obstacle')
  })

  it('skips spaces (no tile)', () => {
    const map: CombatMapDefinition = {
      name: 'test',
      layout: ['. .', '...'],
      tileSize: 1,
      tileGap: 0,
    }
    const tiles = generateGridTiles(map)
    // ---- 5 tiles total: row 0 has 2 (space skipped), row 1 has 3 ----
    expect(tiles).toHaveLength(5)
  })

  it('assigns sequential indices skipping spaces', () => {
    const map: CombatMapDefinition = {
      name: 'test',
      layout: ['. .', '...'],
      tileSize: 1,
      tileGap: 0,
    }
    const tiles = generateGridTiles(map)
    const indices = tiles.map((t) => t.index)
    expect(indices).toEqual([0, 1, 2, 3, 4])
  })

  it('preserves correct coords when spaces are present', () => {
    const map: CombatMapDefinition = {
      name: 'test',
      layout: [' ..', '.. '],
      tileSize: 1,
      tileGap: 0,
    }
    const tiles = generateGridTiles(map)
    const coords = tiles.map((t) => [t.coord.col, t.coord.row])
    expect(coords).toEqual([
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ])
  })

  it('handles non-rectangular rows', () => {
    const map: CombatMapDefinition = {
      name: 'test',
      layout: ['..', '....', '.'],
      tileSize: 1,
      tileGap: 0,
    }
    const tiles = generateGridTiles(map)
    expect(tiles).toHaveLength(7)
  })
})

describe('gridToWorld', () => {
  it('centers the grid on origin for square config', () => {
    // ---- 2x2 grid with tileSize=1, gap=0, center offset = 0.5 ----
    const config = { width: 2, height: 2, tileSize: 1, tileGap: 0 }
    const topLeft = gridToWorld({ col: 0, row: 0 }, config)
    const bottomRight = gridToWorld({ col: 1, row: 1 }, config)

    expect(topLeft.x).toBeCloseTo(-0.5)
    expect(topLeft.z).toBeCloseTo(-0.5)
    expect(bottomRight.x).toBeCloseTo(0.5)
    expect(bottomRight.z).toBeCloseTo(0.5)
  })

  it('uses separate offsets for non-square grids', () => {
    // ---- 4 wide x 2 tall grid ----
    const config = { width: 4, height: 2, tileSize: 1, tileGap: 0 }
    const origin = gridToWorld({ col: 0, row: 0 }, config)

    // ---- X offset = (4-1)*1/2 = 1.5, Z offset = (2-1)*1/2 = 0.5 ----
    expect(origin.x).toBeCloseTo(-1.5)
    expect(origin.z).toBeCloseTo(-0.5)
  })

  it('accounts for gap in spacing', () => {
    const config = { width: 2, height: 2, tileSize: 1, tileGap: 0.1 }
    const a = gridToWorld({ col: 0, row: 0 }, config)
    const b = gridToWorld({ col: 1, row: 0 }, config)

    // ---- Distance between adjacent tiles = tileSize + tileGap ----
    expect(b.x - a.x).toBeCloseTo(1.1)
  })

  it('returns symmetric positions for default map grid', () => {
    const config = mapToGridConfig(DEFAULT_MAP)
    const first = gridToWorld({ col: 0, row: 0 }, config)
    const last = gridToWorld(
      { col: config.width - 1, row: config.height - 1 },
      config,
    )

    // ---- First and last tiles should be equidistant from origin ----
    expect(first.x).toBeCloseTo(-last.x)
    expect(first.z).toBeCloseTo(-last.z)
  })
})
