import { describe, it, expect } from 'vitest'
import { getZoneTerrain } from '@/game/world/terrainUtils'
import type { HeightmapConfig } from '@/types/zone'

const TEST_CONFIG: HeightmapConfig = {
  seed: 'test-seed',
  amplitude: 6,
  frequency: 0.012,
  octaves: 3,
  slopeThreshold: 0.6,
}

describe('getZoneTerrain', () => {
  it('returns flat terrain when no config provided', () => {
    const terrain = getZoneTerrain('flat-zone')
    expect(terrain.getHeightAt(0, 0)).toBe(0)
    expect(terrain.getHeightAt(100, 50)).toBe(0)
    expect(terrain.getHeightAt(-30, -80)).toBe(0)
  })

  it('returns deterministic heights for the same seed', () => {
    const t1 = getZoneTerrain('det-zone-a', TEST_CONFIG)
    const t2 = getZoneTerrain('det-zone-b', TEST_CONFIG)

    // ---- Same config/seed should produce identical results ----
    expect(t1.getHeightAt(10, 20)).toBe(t2.getHeightAt(10, 20))
    expect(t1.getHeightAt(-50, 80)).toBe(t2.getHeightAt(-50, 80))
  })

  it('returns heights within [0, amplitude] range', () => {
    const terrain = getZoneTerrain('range-zone', TEST_CONFIG)

    // ---- Sample many points and verify range ----
    for (let x = -100; x <= 100; x += 10) {
      for (let z = -100; z <= 100; z += 10) {
        const h = terrain.getHeightAt(x, z)
        expect(h).toBeGreaterThanOrEqual(0)
        expect(h).toBeLessThanOrEqual(TEST_CONFIG.amplitude)
      }
    }
  })

  it('produces varying terrain (not all the same height)', () => {
    const terrain = getZoneTerrain('vary-zone', TEST_CONFIG)
    const heights = new Set<number>()
    for (let x = -50; x <= 50; x += 5) {
      heights.add(terrain.getHeightAt(x, 0))
    }
    // ---- Should produce multiple distinct heights ----
    expect(heights.size).toBeGreaterThan(5)
  })

  it('exposes slopeThreshold from config', () => {
    const terrain = getZoneTerrain('slope-zone', TEST_CONFIG)
    expect(terrain.slopeThreshold).toBe(0.6)
  })

  it('flat terrain has infinite slopeThreshold', () => {
    const terrain = getZoneTerrain('flat-slope-zone')
    expect(terrain.slopeThreshold).toBe(Infinity)
  })
})
