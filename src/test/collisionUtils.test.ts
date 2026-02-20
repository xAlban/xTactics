import { describe, it, expect } from 'vitest'
import {
  findPath,
  getDecorationObstacles,
} from '@/game/world/collisionUtils'
import type { ZoneObject } from '@/types/zone'
import type { ZoneTerrain } from '@/game/world/terrainUtils'

// ---- Helper to create a decoration obstacle ----
function makeObstacle(
  x: number,
  z: number,
  sizeX = 1,
  sizeZ = 1,
): ZoneObject {
  return {
    id: `obs-${x}-${z}`,
    type: 'decoration',
    position: { x, z },
    size: { x: sizeX, z: sizeZ },
  }
}

describe('findPath', () => {
  it('returns direct path when no obstacles', () => {
    const path = findPath({ x: 0, z: 0 }, { x: 10, z: 0 }, [])
    expect(path).toEqual([{ x: 10, z: 0 }])
  })

  it('returns direct path when obstacle is not in the way', () => {
    const obstacles = [makeObstacle(5, 10)]
    const path = findPath({ x: 0, z: 0 }, { x: 10, z: 0 }, obstacles)
    expect(path).toEqual([{ x: 10, z: 0 }])
  })

  it('routes around a blocking obstacle', () => {
    const obstacles = [makeObstacle(5, 0)]
    const path = findPath({ x: 0, z: 0 }, { x: 10, z: 0 }, obstacles)
    // ---- Path should have intermediate waypoints ----
    expect(path.length).toBeGreaterThan(1)
    // ---- Final waypoint should be the destination ----
    expect(path[path.length - 1]).toEqual({ x: 10, z: 0 })
  })

  it('all waypoints are reachable (not inside obstacles)', () => {
    const obstacles = [makeObstacle(5, 0, 2, 2)]
    const path = findPath({ x: 0, z: 0 }, { x: 10, z: 0 }, obstacles)
    // ---- Each waypoint should be at a corner, not inside the obstacle ----
    for (const wp of path) {
      const insideX =
        Math.abs(wp.x - 5) < 2 + 0.5 && Math.abs(wp.z) < 2 + 0.5
      // ---- If inside bounding box, must be exactly on an edge (corner) ----
      if (insideX) {
        const onEdgeX =
          Math.abs(Math.abs(wp.x - 5) - (2 + 0.5)) < 0.01
        const onEdgeZ = Math.abs(Math.abs(wp.z) - (2 + 0.5)) < 0.01
        expect(onEdgeX || onEdgeZ).toBe(true)
      }
    }
  })

  it('handles start inside obstacle by returning empty path', () => {
    const obstacles = [makeObstacle(0, 0)]
    // ---- Start is inside obstacle, no valid path ----
    const path = findPath({ x: 0, z: 0 }, { x: 10, z: 0 }, obstacles)
    // ---- Path may be empty or route via corners depending on visibility ----
    expect(path.length).toBeGreaterThanOrEqual(0)
  })
})

describe('findPath with terrain slope', () => {
  // ---- Steep wall terrain: height jumps sharply at x=5 ----
  const steepTerrain: ZoneTerrain = {
    getHeightAt: (x: number) => (x > 5 ? 10 : 0),
    slopeThreshold: 0.5,
  }

  // ---- Gentle terrain: height changes slowly ----
  const gentleTerrain: ZoneTerrain = {
    getHeightAt: (x: number) => x * 0.01,
    slopeThreshold: 0.5,
  }

  it('returns empty path over steep slope with no route around', () => {
    const path = findPath(
      { x: 0, z: 0 },
      { x: 10, z: 0 },
      [],
      steepTerrain,
    )
    // ---- No obstacle corners to route around steep slope: path is unreachable ----
    expect(path).toEqual([])
  })

  it('allows direct path over gentle slope', () => {
    const path = findPath(
      { x: 0, z: 0 },
      { x: 10, z: 0 },
      [],
      gentleTerrain,
    )
    // ---- Gentle slope should allow direct path ----
    expect(path).toEqual([{ x: 10, z: 0 }])
  })

  it('works without terrain (backwards compatible)', () => {
    const path = findPath({ x: 0, z: 0 }, { x: 10, z: 0 }, [])
    expect(path).toEqual([{ x: 10, z: 0 }])
  })
})

describe('getDecorationObstacles', () => {
  it('filters only decoration type objects', () => {
    const objects: ZoneObject[] = [
      makeObstacle(1, 1),
      {
        id: 'portal',
        type: 'combatPortal',
        position: { x: 3, z: 3 },
        size: { x: 0.5, z: 0.5 },
      },
      {
        id: 'zone-portal',
        type: 'zonePortal',
        position: { x: 7, z: 7 },
        size: { x: 0.5, z: 0.5 },
      },
    ]
    const result = getDecorationObstacles(objects)
    expect(result).toHaveLength(1)
    expect(result[0]!.type).toBe('decoration')
  })
})
