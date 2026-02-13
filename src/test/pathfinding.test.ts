import { describe, it, expect } from 'vitest'
import {
  coordKey,
  buildWalkableSet,
  bfsReachable,
  getReachableCoords,
  reconstructPath,
} from '@/game/combat/pathfinding'
import { generateGridTiles } from '@/game/map/gridUtils'
import type { CombatMapDefinition } from '@/types/grid'

// ---- Simple 3x3 all-ground map for testing ----
const SIMPLE_3X3: CombatMapDefinition = {
  name: 'Test 3x3',
  layout: ['...', '...', '...'],
  tileSize: 1,
  tileGap: 0,
}

// ---- 3x3 map with center obstacle ----
const CENTER_OBSTACLE: CombatMapDefinition = {
  name: 'Test obstacle',
  layout: ['...', '.X.', '...'],
  tileSize: 1,
  tileGap: 0,
}

describe('coordKey', () => {
  it('creates a consistent string key', () => {
    expect(coordKey({ col: 3, row: 5 })).toBe('3,5')
    expect(coordKey({ col: 0, row: 0 })).toBe('0,0')
  })
})

describe('buildWalkableSet', () => {
  it('includes ground tiles and excludes obstacles', () => {
    const tiles = generateGridTiles(CENTER_OBSTACLE)
    const walkable = buildWalkableSet(tiles, [])

    expect(walkable.has('1,1')).toBe(false)
    expect(walkable.has('0,0')).toBe(true)
    expect(walkable.size).toBe(8)
  })

  it('excludes occupied positions', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const walkable = buildWalkableSet(tiles, [{ col: 1, row: 1 }])

    expect(walkable.has('1,1')).toBe(false)
    expect(walkable.size).toBe(8)
  })
})

describe('bfsReachable', () => {
  it('reaches adjacent tiles with 1 step', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const walkable = buildWalkableSet(tiles, [])
    walkable.add('1,1')

    const result = bfsReachable({ col: 1, row: 1 }, 1, walkable)

    // ---- Origin + 4 cardinal neighbors ----
    expect(result.size).toBe(5)
    expect(result.has('1,0')).toBe(true)
    expect(result.has('0,1')).toBe(true)
    expect(result.has('2,1')).toBe(true)
    expect(result.has('1,2')).toBe(true)
  })

  it('does not include diagonal tiles', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const walkable = buildWalkableSet(tiles, [])
    walkable.add('1,1')

    const result = bfsReachable({ col: 1, row: 1 }, 1, walkable)

    expect(result.has('0,0')).toBe(false)
    expect(result.has('2,2')).toBe(false)
  })

  it('stops at obstacles', () => {
    const tiles = generateGridTiles(CENTER_OBSTACLE)
    const walkable = buildWalkableSet(tiles, [])
    walkable.add('0,0')

    const result = bfsReachable({ col: 0, row: 0 }, 2, walkable)

    // ---- Center (1,1) is an obstacle, so tiles beyond require going around ----
    expect(result.has('1,1')).toBe(false)
  })

  it('reaches all tiles on open 3x3 with 4 steps from corner', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const walkable = buildWalkableSet(tiles, [])
    walkable.add('0,0')

    const result = bfsReachable({ col: 0, row: 0 }, 4, walkable)

    // ---- All 9 tiles reachable from corner within 4 steps ----
    expect(result.size).toBe(9)
  })

  it('returns only origin when maxSteps is 0', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const walkable = buildWalkableSet(tiles, [])
    walkable.add('1,1')

    const result = bfsReachable({ col: 1, row: 1 }, 0, walkable)

    expect(result.size).toBe(1)
    expect(result.has('1,1')).toBe(true)
  })
})

describe('getReachableCoords', () => {
  it('excludes the origin tile', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const walkable = buildWalkableSet(tiles, [])
    walkable.add('1,1')

    const reachableMap = bfsReachable({ col: 1, row: 1 }, 1, walkable)
    const coords = getReachableCoords(reachableMap, { col: 1, row: 1 })

    expect(coords).toHaveLength(4)
    expect(coords.some((c) => c.col === 1 && c.row === 1)).toBe(false)
  })
})

describe('reconstructPath', () => {
  it('returns path from origin to target', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const walkable = buildWalkableSet(tiles, [])
    walkable.add('0,0')

    const reachableMap = bfsReachable({ col: 0, row: 0 }, 3, walkable)
    const path = reconstructPath(reachableMap, { col: 2, row: 0 })

    // ---- Path should be: (0,0) -> (1,0) -> (2,0) ----
    expect(path).toHaveLength(3)
    expect(path[0]).toEqual({ col: 0, row: 0 })
    expect(path[2]).toEqual({ col: 2, row: 0 })
  })

  it('returns empty array for unreachable target', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const walkable = buildWalkableSet(tiles, [])
    walkable.add('0,0')

    const reachableMap = bfsReachable({ col: 0, row: 0 }, 1, walkable)
    // ---- (2,2) is 4 steps away, not reachable in 1 ----
    const path = reconstructPath(reachableMap, { col: 2, row: 2 })

    expect(path).toHaveLength(0)
  })

  it('returns path of length 2 for adjacent tile', () => {
    const tiles = generateGridTiles(SIMPLE_3X3)
    const walkable = buildWalkableSet(tiles, [])
    walkable.add('1,1')

    const reachableMap = bfsReachable({ col: 1, row: 1 }, 1, walkable)
    const path = reconstructPath(reachableMap, { col: 1, row: 0 })

    expect(path).toHaveLength(2)
    expect(path[0]).toEqual({ col: 1, row: 1 })
    expect(path[1]).toEqual({ col: 1, row: 0 })
  })

  it('navigates around obstacles', () => {
    const tiles = generateGridTiles(CENTER_OBSTACLE)
    const walkable = buildWalkableSet(tiles, [])
    walkable.add('0,0')

    const reachableMap = bfsReachable({ col: 0, row: 0 }, 4, walkable)
    const path = reconstructPath(reachableMap, { col: 2, row: 2 })

    // ---- Must go around center obstacle, path length > 4 (Manhattan) ----
    expect(path.length).toBeGreaterThanOrEqual(5)
    // ---- Path should not include the obstacle ----
    expect(path.some((c) => c.col === 1 && c.row === 1)).toBe(false)
  })
})
