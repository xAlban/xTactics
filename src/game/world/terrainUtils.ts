import { createNoise2D } from 'simplex-noise'
import alea from 'alea'
import type { HeightmapConfig } from '@/types/zone'

// ---- Interface for terrain height lookups ----
export interface ZoneTerrain {
  getHeightAt(x: number, z: number): number
  slopeThreshold: number
}

// ---- Flat terrain fallback (returns 0 everywhere) ----
const FLAT_TERRAIN: ZoneTerrain = {
  getHeightAt: () => 0,
  slopeThreshold: Infinity,
}

// ---- Cache terrain instances by zone ID ----
const terrainCache = new Map<string, ZoneTerrain>()

// ---- FBM noise: sum octaves with halving amplitude, doubling frequency ----
function createFbmTerrain(config: HeightmapConfig): ZoneTerrain {
  const prng = alea(config.seed)
  const noise2D = createNoise2D(prng)

  const getHeightAt = (x: number, z: number): number => {
    let value = 0
    let amp = 1
    let freq = config.frequency
    let maxAmp = 0

    for (let i = 0; i < config.octaves; i++) {
      value += noise2D(x * freq, z * freq) * amp
      maxAmp += amp
      amp *= 0.5
      freq *= 2
    }

    // ---- Normalize from [-1,1] to [0, amplitude] ----
    return ((value / maxAmp + 1) / 2) * config.amplitude
  }

  return { getHeightAt, slopeThreshold: config.slopeThreshold }
}

// ---- Factory: returns cached terrain for a zone ----
export function getZoneTerrain(
  zoneId: string,
  config?: HeightmapConfig,
): ZoneTerrain {
  if (!config) return FLAT_TERRAIN

  const cached = terrainCache.get(zoneId)
  if (cached) return cached

  const terrain = createFbmTerrain(config)
  terrainCache.set(zoneId, terrain)
  return terrain
}
