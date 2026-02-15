import { describe, it, expect } from 'vitest'
import {
  UNIT_MODELS,
  ENEMY_MODEL,
  PORTAL_MODEL,
  getUnitModelConfig,
  getAllModelPaths,
} from '@/game/models/modelRegistry'
import type { PlayerClass } from '@/types/player'

describe('modelRegistry', () => {
  const allClasses: PlayerClass[] = ['bomberman', 'archer', 'knight', 'mage']

  it('has a model config for every player class', () => {
    for (const cls of allClasses) {
      expect(UNIT_MODELS[cls]).toBeDefined()
      expect(UNIT_MODELS[cls].path).toMatch(/\.(glb|gltf|fbx)$/)
      expect(UNIT_MODELS[cls].fallbackColor).toMatch(/^#/)
    }
  })

  it('enemy model has valid config', () => {
    expect(ENEMY_MODEL.path).toMatch(/\.(glb|gltf|fbx)$/)
    expect(ENEMY_MODEL.fallbackColor).toMatch(/^#/)
  })

  it('portal model has valid config', () => {
    expect(PORTAL_MODEL.path).toMatch(/\.(glb|gltf|fbx)$/)
    expect(PORTAL_MODEL.fallbackColor).toMatch(/^#/)
  })

  describe('getUnitModelConfig', () => {
    it('returns class model for player team', () => {
      for (const cls of allClasses) {
        const config = getUnitModelConfig(cls, 'player')
        expect(config).toBe(UNIT_MODELS[cls])
      }
    })

    it('returns enemy model for enemy team', () => {
      for (const cls of allClasses) {
        const config = getUnitModelConfig(cls, 'enemy')
        expect(config).toBe(ENEMY_MODEL)
      }
    })
  })

  describe('getAllModelPaths', () => {
    it('returns unique paths', () => {
      const paths = getAllModelPaths()
      expect(paths.length).toBe(new Set(paths).size)
    })

    it('includes all unit, enemy, and portal paths', () => {
      const paths = getAllModelPaths()
      for (const cls of allClasses) {
        expect(paths).toContain(UNIT_MODELS[cls].path)
      }
      expect(paths).toContain(ENEMY_MODEL.path)
      expect(paths).toContain(PORTAL_MODEL.path)
    })
  })
})
